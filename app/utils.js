//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Clears form.
 * @param {HTMLFormElement} container - Form element.
 */
function clearForm(container) {

    const inputs = Array.from(container.querySelectorAll('input, textarea'));
    for (const input of inputs) {
        input.value = '';
    }
    const canvases = document.getElementsByTagName('canvas');
    if (canvases) {
        const context = canvases[0].getContext('2d');
        context.clearRect(0, 0, canvases[0].width, canvases[0].height)
    }
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Capitalizes star names.
 * @param {string[]} stars - Array containing star's first and last names.
 * @returns {string[]} - Capitalized names.
 */
function cleanStarNames(stars) {

    return stars
        .map(star => star.trim())
        .map(star => star.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()));
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Creates a tag element with the specified text.
 * @param {String} tag - Tag text. 
 * @returns Tag element
 */
function createTagIcon(tag) {
    const tagElement = document.createElement('div');
    tagElement.classList.add('tag-icon');
    tagElement.tag = tag;
    tagElement.classList.add('pointer');

    const tagText = document.createElement('div');
    textagTextt.classList.add('tag-icon-text');
    tagText.innerText = tag;
    tagElement.appendChild(tagText);

    return tagElement;
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * 
 * @param {HTMLFormElement} container - Form element
 * @param {Star} star - Star object.
 * @param {object} image - Star image
 */
function fillForm(container, star, image) {

    const entries = Object.entries(star);
    const fields = Array.from(container.querySelectorAll('input, textarea'));

    for (const [key, value] of entries) {
        for (const field of fields) {
            if (field.id == key) field.value = value;
        }
    }

    if (star.id) {
        const canvas = document.getElementById('image');
        if (canvas) {
            const context = canvas.getContext('2d');
            let img = new Image();

            img.onload = function () {
                context.drawImage(img, 0, 0);
            }

            img.src = image;
        }
    }

}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Finds object in array according to parameters.
 * @param {object[]} elements - Array of objects to search.
 * @param {object} options - Search parameters object.
 * @returns {object} - Search result.
 */
function find(elements, options) {

    const value = elements.find((element) => {
        let result = true;
        const parameters = Object.keys(options);
        for (parameter of parameters) {
            result = result && element[parameter] == options[parameter];
        }
        return result;
    });
    return value;
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * 
 * @param {object} $ - References object.
 * @param {object} params - Search parameters. 
 * @param {string} params.fullName - Full name. 
 * @param {string} params.firstName - First name. 
 * @param {string} params.lastName - Last name. 
 * @param {number} params.day - Day of birth. 
 * @param {number} params.month - Month of birth. 
 * @param {number} params.year - Year of birth. 
 * @returns 
 */
 function findStars( $, {
    fullName,
    firstName,
    lastName,
    day,
    month,
    year,
    birthPlace
} )
{
    const result = $.stars.filter( ( star ) =>
    {
        let results = [];

        if ( fullName ) results.push( star.fullName.toUpperCase() == fullName.toUpperCase() || star.aliases.toUpperCase().includes( fullName.toUpperCase() ) );
        if ( firstName ) results.push( star.firstName.toUpperCase().includes( firstName.toUpperCase() ) || star.aliases.toUpperCase().includes( firstName.toUpperCase() ) );
        if ( lastName ) results.push( star.lastName.toUpperCase().includes( lastName.toUpperCase() ) || star.aliases.toUpperCase().includes( lastName.toUpperCase() ) );
        if ( birthPlace ) results.push( star.birthPlace.toUpperCase().includes( birthPlace.toUpperCase() ) );
        if ( day ) results.push( Number( star.day ) == Number( day ) );
        if ( month ) results.push( Number( star.month ) == Number( month ) );
        if ( year ) results.push( Number( star.year ) == Number( year ) );

        return !results.includes( false );
    } );

    return result;
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Formats bytes into human readable string.
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Decimal places to round value to.
 * @returns {string} Human readable size string.
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes == 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * 
 * @param {Object} params - Parameters 
 * @param {Number} params.year - Year. 
 * @param {Number} params.month - Month (1-12). 
 * @param {Number} params.day - Day. 
 * @returns Formatted date.
 */
function formatDate({ year, month, day }) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[month - 1]} ${day}, ${year}`;
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Gets next ID number.
 * @param {objects[]} objects - Array of Stars or Videos.
 * @returns {number} The next available ID number.
 */
function newID(objects) {
    return Math.max(...objects.map(item => item.id), 0) + 1;
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Reads a form.
 * @param {HTMLFormElement} container - Form element to be read.
 * @returns {object} Object with properties for each form input element.
 */
function readForm(container) {
    result = {};
    const inputs = Array.from(container.querySelectorAll('input, textarea, checkbox, radio'));
    for (const input of inputs) {
        let value;
        switch (input.type) {
            case 'number':
                value = isNaN(Number(input.value)) ? 0 : Number(input.value);
                break;

            case 'checkbox':
            case 'radio':
                value = input.checked;
                break;

            default:
                value = input.value.trim();
                break;
        }

        result[input.className.split(' ')[0]] = value;
    }
    return result;
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Asynchronously displays element cards.
 * @param {object} $ - References object
 * @param {object} params - Parameters object 
 * @param {Array} params.elements - Elements to be shown 
 * @param {HTMLElement} params.container - Destination of the cards. 
 * @param {Function} params.callback - Click callback for each card. 
 * @param {Boolean} params.small - Should the cards be small? 
 * @param {Boolean} params.strips - Should the cards have a strip? 
 */
function showCards($, { elements, container, callback, small, strips }) {
    clearTimeout($.loop);

    let series = 5;
    let calls = 0;

    function loop(startIndex) {
        if (startIndex >= elements.length) return;

        let begin = startIndex;
        let end = begin + series;

        for (let i = begin; i < end; i++) {
            if (!elements[i]) return;
            if (elements[i] instanceof Star) {
                container.appendChild(elements[i].createCard({
                    click: callback,
                    small,
                    $
                }));
            }
            if (elements[i] instanceof Video) {
                container.appendChild(strips ? elements[i].createStrip($) : elements[i].createPosterCard(callback, $));
            }
        }
        calls++;
        $.loop = setTimeout(loop.bind(null, calls * series), 10);
    }
    loop(0);
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Splits filename (not path) into name, extension.
 * @param {string} name - Filename
 * @returns {object} Object containing name, extension properties.
 */
function splitFileName(name) {
    const tokens = name.split('.');
    return {
        extension: tokens.pop(),
        basename: tokens.join('.')
    };
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * 
 * @param {object} params - Parameters 
 * @param {string} params.icon - Icon file name. 
 * @param {string} params.title - Card title. 
 * @param {object} params.$ - References object. 
 * @returns {HTMLDivElement} Title card element.
 */
function titleCard({ icon, title, $ }) {
    const container = document.createElement('div');
    container.classList.add('title-container');
    const image = document.createElement('img');
    image.classList.add('icon');
    image.src = `${$.icons}\\${icon}`;
    const text = document.createElement('span');
    text.innerText = title;
    container.appendChild(image);
    container.appendChild(text);

    return container;
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Validates form fields.
 * @param  {...any} fields  - Input elements to validate
 * @returns {boolean} Success.
 */
function validate(...fields) {

    for (const f of fields) {
        if (!f.value) {
            f.classList.add('error');
            f.focus();
            return false;
        }
        else {
            f.classList.remove('error');
        }
    }
    return true;
}

//----------------------------------------------------------------------------------------------------------------------------------------
module.exports = {
    clearForm,
    cleanStarNames,
    createTagIcon,
    fillForm,
    find,
    findStars,
    formatDate,
    newID,
    readForm,
    showCards,
    splitFileName,
    titleCard,
    validate
}