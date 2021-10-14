class Card {

    /**
     * Creates a star or video card.
     * @param {Object} params - Parameters
     * @param {String} params.title - Title of the card.
     * @param {String} params.id - Card element id.
     * @param {String[]} params.classes - Classes to be added to the card.
     * @param {Function} params.click - Click callback.
     * @param {Boolean} params.capture - Should use the capture phase?
     * @param {Object} params.star - Star object associated with this card.
     * @param {Object} params.video - Video object associated with this card.
     * @returns Card HTMLElement.
     */
    constructor({
        title = '',
        id = '',
        classes = [],
        content = null,
        small = false,
        click = null,
        capture = false,
        star = null,
        video = null,
        $
    }) {
        this.title = title;
        this.id = id;
        this.classes = classes;
        this.content = content;
        this.small = small;
        this.click = click;
        this.capture = capture;
        this.star = star;
        this.video = video;
        this.card = null;
        this.$ = $;
    }

    create() {

        // Create card element from template.
        this.card = this.$.templates.card.cloneNode(true);

        // Get card placeholders.
        const title = this.card.querySelector('.card-title');
        const content = this.card.querySelector('.card-content');

        // Add classes.
        this.card.classList.add(this.small ? 'small' : 'big');
        if (this.classes.length) this.card.classList.add(...this.classes);

        // Add components.
        if (this.id) this.card.id = this.id;
        if (this.title) {
            if (typeof this.title === 'string') {
                title.innerHTML = this.title;
            }
            else {
                title.replaceWith(this.title);
            }
        }
        else {
            title.remove();
        }

        if (typeof this.content === "string") {
            content.innerHTML = this.content;
        }
        else if (typeof this.content === "object") {
            content.appendChild(this.content);
        }

        // Add callback.
        if (this.click) {
            this.card.addEventListener('click', this.click, this.capture);
            this.card.classList.add('pointer');
        }

        return this.card;
    }

}

//_______________________________________________________________________________________________________________________________________________________________________
module.exports = {
    Card
}