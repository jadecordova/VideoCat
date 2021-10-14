const {
    Card
} = require('./Card');

const {
    decryptImage
} = require('./encryption');

const {
    createTagIcon,
    formatDate
} = require('./utils');


//----------------------------------------------------------------------------------------------------------------------------------------
class Star {

    /**
     * Creates a Star object.
     * @param {Object} params - Parameters. 
     * @param {String|Number} params.id - Star id. 
     * @param {String} params.firstName - Star first name. 
     * @param {String} params.lastName - Star  last name. 
     * @param {String} params.fullName - Star full name. 
     * @param {String|Number} params.day - Star day of birth. 
     * @param {String|Number} params.month - Star month of birth. 
     * @param {String|Number} params.year - Star year of birth. 
     * @param {String} params.birthPlace - Star place of birth. 
     */
    constructor(
        {
            id = null,
            firstName = '',
            lastName = '',
            fullName = '',
            day = 0,
            month = 0,
            year = 0,
            birthPlace = ''
        }) {
        this.id = Number(id);
        this.firstName = firstName;
        this.lastName = lastName;
        this.fullName = fullName;
        this.day = Number(day);
        this.month = Number(month);
        this.year = Number(year);
        this.birthPlace = birthPlace;
        this.birthday = null;
        this.age = null;
        this._age();
    }

    //----------------------------------------------------------------------------------------------------------------------------------------
    /**
     * Takes as input an array of generic objects read from JSON file and converts them into Star objects.
     * @param {Object[]} array - Array of objects. 
     * @returns Array of star objects.
     */
    static fromObjectsArray(array) {
        const result = [];
        for (const element of array) {
            result.push(new Star(element));
        }
        return result;
    }

    //----------------------------------------------------------------------------------------------------------------------------------------
    /**
     * Calculates star age and checks for birthday.
     */
    _age() {
        if (this.day && this.month && this.year) {
            const birthdate = new Date();
            birthdate.setUTCFullYear(this.year);
            birthdate.setMonth(this.month);
            birthdate.setDate(this.day);
            let diff = Date.now() - birthdate;
            let ageDate = new Date(diff);
            this.age = Math.abs(ageDate.getUTCFullYear() - 1970);
        }

        if (this.month && this.day) {
            let today = new Date();
            if (this.month == today.getMonth() + 1 && this.day == today.getDate()) {
                this.birthday = true;
            }
        }
    }

    //----------------------------------------------------------------------------------------------------------------------------------------
    /**
     * Creates star card.
     * @param {Object} params - Parameters 
     * @param {Function} params.click - Click callback. 
     * @param {Boolean} params.capture - Should use capturing phase? 
     * @param {Boolean} params.small - Is this a small card? 
     * @param {Object} params.$ - References object. 
     * @returns {Card} Card object.
     */
    createCard({ click, capture = false, small = false, $ }) {

        // Add classes.
        const classes = ['star-card'];
        if (click) classes.push('pointer');

        const card = new Card({
            title: this.fullName,
            id: this.id,
            click,
            capture,
            small,
            classes,
            content: $.templates.star.cloneNode(true),
            $
        }).create();

        if (small) {
            card.classList.add('small');
            card.querySelector('.star-card-info').remove();
        }
        else {
            card.classList.add('big');
            card.querySelector('.star-card-info .star-card-id span').innerText = this.id;
            card.querySelector('.star-card-info .star-card-age').innerHTML = this.age ? this.age + ' years old' : '&nbsp;';
        }


        // Create image.
        const image = document.createElement('img');
        image.src = decryptImage({
            input: `${$.photos}/${this.id}`,
            password: $.password
        });
        image.width = small ? 125 : 250;
        image.id = `star-${this.id}`;
        card.star = this;
        card.querySelector('.star-card-image').appendChild(image);

        return card;
    }

    //----------------------------------------------------------------------------------------------------------------------------------------
    /**
     * Creates star screen.
     * @param {Object} $ - References object
     * @returns {Card} Card object.
     */
    createScreen($) {

        // Get videos where this star appears.
        const starVideos = $.videos.filter(video => video.stars.includes(this.fullName));
        starVideos.sort((a, b) => (a.score > b.score) ? -1 : 1);

        const card = new Card({
            $,
            id: `star-screen-${this.id}`,
            star: this,
            classes: ['card-800'],
            content: $.templates.starScreen.cloneNode(true)
        }).create();

        const name = card.querySelector('#fullName');
        const date = card.querySelector('#birthDate');
        const place = card.querySelector('#birthPlace');
        const image = card.querySelector('#portrait');
        const left = card.querySelector('#left-arrow');
        const right = card.querySelector('#right-arrow');

        name.innerText = this.fullName;
        place.innerText = this.birthPlace || '';
        aliases.innerText = this.aliases || '';
        date.innerText = formatDate({
            year: this.year,
            month: this.month,
            day: this.day
        });

        image.src = decryptImage({
            input: `${$.photos}/${this.id}`,
            password: $.password
        });
        image.id = `star-${this.id}`;

        if (starVideos.length) {
            highest.innerText = 'Highest score: ' + starVideos[0].score || '';
            const starTags = {};
            for (const video of starVideos) {
                for (const tag of video.tags) {
                    if (tag in starTags) {
                        starTags[tag]++;
                    }
                    else {
                        starTags[tag] = 1;
                    }
                }
            }

            for (const tag in starTags) {
                const tagDiv = document.createElement('div');
                const icon = createTagIcon(tag);
                const countSpan = document.createElement('span');

                countSpan.classList.add('count-span');
                countSpan.innerText = starTags[tag];

                tagDiv.appendChild(icon);
                tagDiv.appendChild(countSpan);
                tags.appendChild(tagDiv);
            }
        }

        let index = $.stars.findIndex((star) => star.id == this.id);

        left.addEventListener('click', (event) => {
            event.target.blur();
            if (index > 0) {
                starScreen($.stars[--index], $);
            }
        });

        right.addEventListener('click', (event) => {
            event.target.blur();
            if (index < $.stars.length) {
                starScreen($.stars[++index], $);
            }
        });

        return card;
    }
}

//----------------------------------------------------------------------------------------------------------------------------------------
module.exports = {
    Star
}