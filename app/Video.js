const { ipcRenderer } = require('electron');
const path = require('path');

const {
    createTagIcon,
    find,
    formatBytes,
    readForm,
    splitFileName
} = require('./utils');

const {
    deleteFile,
    getFiles
} = require('./io');

const {
    Card
} = require('./Card');

const {
    decryptImage
} = require('./encryption');
const { assert } = require('console');


//----------------------------------------------------------------------------------------------------------------------------------------
class Video {

    /**
     * Creates a Video object.
     * @param {Object} params - Parameters 
     * @param {Object} params.$ - References object. 
     * @param {Boolean} params.isNew - Is this video being added to the database? 
     * @param {Number} params.id - Video id. 
     * @param {String} params.filename - Video file name. 
     * @param {String} params.path - Video file path. 
     * @param {String} params.name - Video name. 
     * @param {String} params.disk - Disk identifier where the video is stored. 
     * @param {Number} params.length - Video length. 
     * @param {Number} params.score - Video score. 
     * @param {Number} params.size - Video file size (bytes). 
     * @param {String[]} params.stars - Array of video star names. 
     * @param {String[]} params.tags - Array of video tags. 
     * @param {String} params.poster - Thumbnail file name to be used as video poster. 
     * @param {String} params.thumbsFolder - Path to temporal non encrypted thumbs folder. 
     */
    constructor(
        {
            $ = null,
            isNew = false,
            id = null,
            filename = '',
            path = '',
            disk = null,
            length = 0,
            score = 0,
            size = 0,
            stars = [],
            tags = [],
            poster = '0001',
            thumbsFolder = null
        }) {
        this.$ = $;
        this.isNew = isNew;
        this.id = id;
        this.filename = filename;
        this.disk = disk;
        this.length = length;
        this.score = score;
        this.size = size;
        this.stars = stars;
        this.tags = tags;
        this.poster = poster;
        this.card = null;

        const { basename, extension } = splitFileName(this.filename);
        this.basename = basename;
        this.extension = extension;

        if (this.isNew) {
            this.path = path;
            this.thumbsFolder = thumbsFolder;
        }
    }

    //----------------------------------------------------------------------------------------------------------------------------------------
    /**
     * Adds a star to this video cast.
     * @param {Star} star - Star object. 
     */
    addStar(star) {

        if (this.stars.includes(star.fullName)) {
            ipcRenderer.sendSync('dialog', {
                type: 'inform',
                title: 'Add Star',
                message: 'This star is already in this video!'
            });
        }
        else {
            this.stars.push(star.fullName);
            this.stars.sort();
            const starCard = star.createCard({
                capture: true,
                small: true,
                click: () => this._removeStar(starCard),
                $: this.$
            });

            this.card.querySelector('.video-stars').appendChild(starCard);
        }
    }

    //----------------------------------------------------------------------------------------------------------------------------------------
    /**
     * Creates video card.
     * @returns {Card} Video card
     */
    createCard() {

        const card = new Card({
            id: `video-card-${this.id}`,
            title: this.filename,
            classes: ['video-card'],
            click: () => this._activate(card),
            capture: true,
            content: this.$.templates.video.cloneNode(true),
            $: this.$
        }).create();

        // Stars.
        const stars = card.querySelector('.video-stars');
        for (const star of this.stars) {
            const s = find(this.$.stars, { fullName: star });
            if (s) {
                const starCard = s.createCard({
                    click: () => this._removeStar(starCard),
                    capture: true,
                    small: true,
                    $: this.$
                })
                stars.appendChild(starCard);
            }
        }

        //Tags
        const tags = card.querySelector('.video-tags');
        for (const tag of this.tags) {
            const icon = createTagIcon(tag, $);
            icon.classList.add('pointer');
            icon.addEventListener('click', () => this._removeTag(icon), true);
            tags.appendChild(icon);
        }

        card.querySelector('.id span').innerText = this.id || '-';
        card.querySelector('.length span').innerText = this._formatLength(this.length) || '-';
        card.querySelector('.size span').innerText = formatBytes(this.size) || '-';
        card.querySelector('.score').value = this.score || '';
        card.querySelector('.disk').value = this.disk || '';

        // Thumbs.
        const thumbnailsContainer = card.querySelector('.video-thumbs');
        this._createThumbs(thumbnailsContainer, card);
        this.card = card;

        return this.card;
    }

    //----------------------------------------------------------------------------------------------------------------------------------------
    /**
     * Creates video poster card.
     * @param {function} backButtonCallback - Callback for the back button 
     * @param {object} $ - References object.
     * @returns {Card} Poster card object.
     */
    createPosterCard(backButtonCallback, $) {

        const container = $.templates.posterCard.cloneNode(true);
        const title = container.querySelector('.poster-card-title');
        const image = container.querySelector('.poster-card-image');
        const footer = container.querySelector('.poster-card-footer');

        title.querySelector('.poster-card-id').innerText = this.id;
        title.querySelector('.poster-card-score').innerText = this.score;

        const source = decryptImage({
            input: `${this._getThumbsFolder()}/${this.poster}`,
            password: this.$.password
        });
        if (source) {
            const img = document.createElement('img');
            img.width = $.user.thumbnailswidth;
            img.height = $.user.thumbnailsheight;
            img.src = source;
            image.appendChild(img);
        }
        else {
            image.style.minWidth = `${$.user.thumbnailswidth}px`;
            image.style.minHeight = `${$.user.thumbnailsheight}px`;
            image.style.backgroundColor = '#990000';
        }

        const card = new Card({
            id: this.id,
            classes: ['video-poster-card'],
            content: container,
            click: () => this.edit(backButtonCallback),
            $
        }).create();

        return card;
    }

    //----------------------------------------------------------------------------------------------------------------------------------------
    /**
     * Edits video info.
     * @param {function} backButtonCallback - Callback for the back button
     */
    edit(backButtonCallback) {

        this.$.content.innerHTML = '';

        const card = this.createCard();
        global.activeVideo = this;
        global.activeCard = card;
        this.$.content.appendChild(card);

        const buttons = document.createElement('div');
        buttons.id = 'edit-video-buttons';

        const editButton = document.createElement('button');
        editButton.innerText = 'EDIT';
        editButton.classList.add('large');
        editButton.addEventListener('click', (event) => {
            event.target.blur();
            this.readCard();
            ipcRenderer.send('changed', 'v');
            backButtonCallback();
        });
        buttons.appendChild(editButton);

        const backButton = document.createElement('button');
        backButton.innerText = 'BACK';
        backButton.classList.add('large', 'edit-back');
        backButton.addEventListener('click', backButtonCallback);
        buttons.appendChild(backButton);
        this.$.content.appendChild(buttons);
    }

    //----------------------------------------------------------------------------------------------------------------------------------------
    /**
     * Creates an array of Video objects from an array of generic objects read from JSON file.
     * @param {object[]} array - Array of JSON objects.
     * @param {object} $ - References object
     * @returns {Video[]} Array of video objects.
     */
    static fromObjectsArray(array, $) {

        const result = [];
        for (const element of array) {
            element.$ = $;
            result.push(new Video(element));
        }
        return result;
    }

    //----------------------------------------------------------------------------------------------------------------------------------------
    /**
     * Removes HTML elements and prepares videos to be saved in JSON format.
     * @param {Videos[]} videos - Array of video objects.
     * @returns {object[]} Array of JSON-safe objects.
     */
    static prepareToSave(videos) {

        const result = [];
        for (const video of videos) {
            const v = { ...video }
            v.card = null;
            v.$ = null;
            result.push(v);
        }
        return result;
    }

    //----------------------------------------------------------------------------------------------------------------------------------------
    /**
     * Reads video info from form.
     */
    readCard() {

        if (this.card) {
            const formData = readForm(this.card.querySelector('.video-card-panes'));
            Object.assign(this, formData);
        }
    }

    //----------------------------------------------------------------------------------------------------------------------------------------
    /**
     * Checks if video has stars and tags.
     * @returns {string|boolean} True if valid, a string indicating the missing element otherwise.
     */
    validate() {

        if (!this.stars.length) {
            this.card.scrollIntoView();
            this.card.click();
            return 'star';
        }

        return true;
    }

    //----------------------------------------------------------------------------------------------------------------------------------------
    /**
     * Makes this card the current active card for edit operations.
     */
    _activate() {

        if (global.activeCard) global.activeCard.classList.remove('active-card');
        this.card.classList.add('active-card');
        global.activeCard = this.card;
        global.activeVideo = this;
    }

    //----------------------------------------------------------------------------------------------------------------------------------------
    /**
     * Displays video thumbnails.
     * @param {HTMLElement} container - Thumbnail images container.
     * @param {Card} card 
     */
    _createThumbs(container, card) {
        const thumbs = this.isNew ? getFiles({folder: this.thumbsFolder}) : getFiles({ folder: this._getThumbsFolder() });

        if (thumbs instanceof Array) {

            for (const thumb of thumbs) {

                let img = document.createElement('img');
                img.src = this.isNew ? thumb : decryptImage({ input: thumb, password: this.$.password });
                img.classList.add('pointer');
                const name = path.basename(thumb).split('.')[0];
                if (this.poster == name) img.classList.add('poster');

                img.addEventListener('click', (event) => {
                    //const name = path.basename( thumb ).split( '.' )[0];
                    if (event.getModifierState("Control")) {
                        if (this.poster == name) {
                            ipcRenderer.sendSync('dialog', {
                                type: 'inform',
                                title: 'Remove Thumbnail',
                                message: 'This image is the poster of this video!\nPlease, select a new poster image before deleting this one.'
                            });
                        }
                        else {
                            img.remove();
                            deleteFile(thumb);
                        }
                    }
                    else {
                        card.querySelector('.poster').classList.remove('poster');
                        this.poster = name;
                        img.classList.add('poster');
                    }
                });
                container.appendChild(img);
            }
        }
    }

    //----------------------------------------------------------------------------------------------------------------------------------------
    /**
     * Creates human readable length.
     * @param {number} seconds - Video length in seconds
     * @returns {string} Formated length.
     */
    _formatLength(seconds) {
        return new Date(seconds * 1000).toISOString().substr(11, 8);
    }

    //----------------------------------------------------------------------------------------------------------------------------------------
    /**
     * Gets video thumbnails path.
     * @returns {string} Video thumbnails path.
     */
    _getThumbsFolder() {
        return `${this.$.thumbs}/${this.disk}/${this.id}`;
    }

    //----------------------------------------------------------------------------------------------------------------------------------------
    /**
     * Removes star from video cast.
     * @param {HTMLElement} starCard - Star card.
     */
    _removeStar(starCard) {
        // Find star in video.
        const index = this.stars.findIndex((star) => star == starCard.star.fullName);
        // Remove star from video's stars array.
        this.stars.splice(index, 1);
        // Remove star card from video card.
        starCard.remove();
    }

    //----------------------------------------------------------------------------------------------------------------------------------------
    /**
     * Removes tag from video.
     * @param {HTMLElement} icon - Tag icon element.
     */
    _removeTag(icon) {

        // Get tag from image.
        const tag = icon.tag;
        // Find star in video.
        const index = this.tags.findIndex((t) => t == tag);

        if (index > -1) {
            // Remove star from video's stars array.
            this.tags.splice(index, 1);
        }

        // Remove star card from video card.
        icon.remove();
    }

}

//----------------------------------------------------------------------------------------------------------------------------------------
module.exports = {
    Video
}