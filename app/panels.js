const { ipcRenderer } = require('electron');
const path = require('path');
const fse = require('fs-extra');

const {
    decryptImage,
    encryptJSON,
    saveImage
} = require('./encryption');

const {
    cleanStarNames,
    clearForm,
    fillForm,
    findStars,
    newID,
    readForm,
    showCards,
    validate
} = require('./utils');

//----------------------------------------------------------------------------------------------------------------------------------------
const starsPanel = document.getElementById('stars-panel');
const starsPanelForm = starsPanel.querySelector('#star-info-content');
const starsPanelArrows = starsPanel.querySelector('#arrows');
const starsPanelLeftArrow = starsPanel.querySelector('#left-arrow');
const starsPanelRightArrow = starsPanel.querySelector('#right-arrow');
const starsPanelTitle = starsPanel.querySelector('#stars-panel-title');
const starsPanelActionButton = starsPanel.querySelector('#star-action-button');
const starsPanelPasteButton = starsPanel.querySelector('#paste-button');
const starsPanelCanvasContext = starsPanel.querySelector('#image').getContext("2d");
//----------------------------------------------------------------------------------------------
const searchStarsPanel = document.getElementById('searchstars-panel');
const searchStarsPanelButton = searchStarsPanel.querySelector('#star-search-button');
const searchStarsPanelform = searchStarsPanel.querySelector('#star-search-content');
const searchStarsPanelgrid = searchStarsPanel.querySelector('#search-stars-grid');
//----------------------------------------------------------------------------------------------
const totalButton = document.querySelector('#total-button');
const specialsButton = document.querySelector('#special-button');
const modifiedButton = document.querySelector('#modified-button');
const backedupButton = document.querySelector('#backedup-button');
const tobackupButton = document.querySelector('#tobackup-button');
const todeleteButton = document.querySelector('#todelete-button');
const highestButton = document.querySelector('#highest-button');
const backupButton = document.querySelector('#backup-button');
const deleteButton = document.querySelector('#delete-button');
const updateButton = document.querySelector('#update-button');
const cleanButton = document.querySelector('#clean-button');
//----------------------------------------------------------------------------------------------
const editTagsContent = document.getElementById('edit-tags-content');
//----------------------------------------------------------------------------------------------
const closeButtons = document.querySelectorAll('.close-panel-button');
for (const button of closeButtons) {
    button.addEventListener('click', event => {
        event.target.blur();
        event.target.closest('.main-panel').classList.add('hidden');
    })
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Adds a star.
 * @param {object} $ - References object.
 * @returns {boolean} False on invalid form.
 */
function addStar($) {

    if (!validate(starsPanelForm.querySelector('#firstName'))) return false;

    const starData = readForm(starsPanelForm);
    const [name] = cleanStarNames([starData.firstName.trim() + (starData.lastName ? ` ${starData.lastName.trim()}` : '')]);
    const existing = $.stars.find(star => star.fullName == name);

    let answer = 0;

    if (existing) {
        const detail = `There is a star with a similar name in the database. Name: ${existing.fullName}\nDo you want to add it anyway?`;

        answer = ipcRenderer.sendSync('dialog', {
            type: 'confirm',
            title: 'Add star',
            message: "Star exists!",
            detail
        });
    }
    if (answer === 0) {
        if (ipcRenderer.sendSync('dialog', {
            type: 'confirm',
            title: 'Add star',
            message: "Add this star?",
            detail: 'This star will be added to the database.'
        }) === 0) {
            const starData = readForm(starsPanelForm);
            starData.id = newID($.stars);
            starData.fullName = starData.firstName + (starData.lastName ? ` ${starData.lastName}` : '');
            const star = new Star(starData);
            $.stars.push(star);
            saveImage(String(starData.id), $);
            clearForm(starsPanelForm);
            // Inform app of changed file.
            ipcRenderer.send('changed', 's');

            if (global.activeVideo) {
                global.activeVideo.addStar(star);
            }

        }
    }
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Edits star.
 * @param {Star} star - Star object.
 * @param {object} $ - References object
 * @returns {boolean} False on invalid form.
 */
function editStar(star, $) {

    if (!validate(starsPanelForm.querySelector('#firstName'))) return false;

    let response = 0;

    if (!window.event.ctrlKey) {
        response = ipcRenderer.sendSync('dialog', {
            type: 'confirm',
            title: 'Edit star',
            message: "Edit this star?",
            detail: 'Changes will be saved to the database.'
        })
    }

    if (response === 0) {
        Object.assign(star, readForm(starsPanelForm));
        star.fullName = star.firstName + (star.lastName ? ` ${star.lastName}` : '');

        // Inform app of changed file.
        ipcRenderer.send('changed', 's');
        saveImage(String(star.id).trim(), $);

        // Replace card.
        let card = document.getElementById(star.id);
        if (card) {
            card.replaceWith(star.createCard({
                $,
                small: card.classList.contains('small') ? true : false
            }));
        }
    }
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Sets up search star panel.
 * @param {object} $ - References object.
 */
function initSearchStarsPanel($) {

    searchStarsPanelButton.addEventListener('click', (event) => {
        event.target.blur();

        const result = findStars($,
            readForm(searchStarsPanelform)
        );

        searchStarsPanelgrid.innerHTML = '';
        showCards($, {
            elements: result,
            small: true,
            container: searchStarsPanelgrid,
            callback: (event) => {
                const card = event.target.classList.contains('star-card') ? event.target : event.target.closest('.star-card');

                if (global.activeVideo) {
                    global.activeVideo.addStar(card.star);
                }
                else {
                    const searchVideoCard = document.getElementById('searchvideos-panel');
                    if (searchVideoCard) {
                        // Check if star already there.
                        const starsPanel = searchVideoCard.querySelector('#stars');
                        const names = [...starsPanel.querySelectorAll('.star-card h1')].map(title => title.innerText);
                        if (!names.includes(card.star.fullName)) {
                            const starCard = card.star.createCard({
                                small: true,
                                $,
                                click: () => {
                                    starCard.remove();
                                }
                            });
                            starsPanel.appendChild(starCard);
                        }
                        else {
                            ipcRenderer.sendSync('dialog', {
                                type: 'inform',
                                title: 'Include Star',
                                message: 'This star is already in the search!'
                            });
                        }
                    }
                }
            }
        });
    });
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Sets up settings panel.
 * @param {object} $ - References object.
 */
function initSettingsPanel($) {
    
    const okButton = $.panels.settings.querySelector('#settings-OK');
    const virtualDub = $.panels.settings.querySelector('#virtualdub');
    const width = $.panels.settings.querySelector('#width');
    const height = $.panels.settings.querySelector('#height');
    const thumbnails = $.panels.settings.querySelector('#thumbnails');
    const virtualDubFolder = $.panels.settings.querySelector('#virtualDubFolder');

    virtualDub.value = $.user.virtualdub;
    virtualDubFolder.innerText = $.user.virtualdubfolder;
    width.value = $.user.thumbnailswidth;
    height.value = $.user.thumbnailsheight;
    thumbnails.value = $.user.thumbnails;

    // Field change events.
    virtualDub.addEventListener('input', () => okButton.disabled = false);
    width.addEventListener('input', () => okButton.disabled = false);
    height.addEventListener('input', () => okButton.disabled = false);
    thumbnails.addEventListener('input', () => okButton.disabled = false);

    $.panels.settings.querySelector('#virtualdub-button').addEventListener('click', (event) => {
        event.target.blur();

        const vdub = ipcRenderer.sendSync('dialog', {
            type: 'file',
            title: 'Select VirtualDub location',
            buttonLabel: 'OK'
        });

        if (vdub) {
            virtualDub.value = vdub[0];
            virtualDubFolder.innerText = path.dirname(vdub[0]);
            okButton.disabled = false;
        }
    });

    okButton.addEventListener('click', (event) => {
        event.target.blur();
        $.user.virtualdub = virtualDub.value || $.user.virtualdub;
        $.user.virtualdubfolder = virtualDub.value ? path.dirname(virtualDub.value) : $.user.virtualdubfolder;
        $.user.thumbnailswidth = width.value || $.user.thumbnailswidth;
        $.user.thumbnailsheight = height.value || $.user.thumbnailsheight;
        $.user.thumbnails = thumbnails.value || $.user.thumbnails;
        // Inform app of changed file.
        ipcRenderer.send('changed', 'settings');

    });
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Sets up stars panel.
 * @param {object} $ - References object.
 */
function initStarPanel($) {

    starsPanelActionButton.addEventListener('click', (event) => {
        event.target.blur();
        const star = $.panels.stars.star;
        if (star) {
            editStar(star, $);
        }
        else {
            addStar($);
        }
    });

    starsPanelPasteButton.addEventListener('click', async (event) => {
        event.target.blur();
        const data = await paste();
        switch (data.type) {
            case 'text':
                break;
            case 'image':

                const img = document.createElement('img');
                img.onload = () => {
                    starsPanelCanvasContext.drawImage(img, 0, 0);
                }
                img.src = data.value;
                break;
        }
    });

    starsPanelLeftArrow.addEventListener('click', () => starNavigation('left', $));
    starsPanelRightArrow.addEventListener('click', () => starNavigation('right', $));
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Shows panel for adding or editing a star.
 * @param {object} $ - References object.
 * @param {Star} star - Star object.
 */
function showStarsPanel($, star) {

    clearForm(starsPanelForm);
    $.panels.stars.star = star;

    if (star) {
        starsPanelTitle.innerText = 'Edit Star';
        fillForm(
            starsPanelForm,
            star,
            decryptImage({
                input: `${$.photos}/${String(star.id)}`,
                password: $.password
            }));
        starsPanelArrows.classList.remove('invisible');
    }
    else {
        starsPanelArrows.classList.add('invisible');
        starsPanelTitle.innerText = 'Add Star';
    }
}

//----------------------------------------------------------------------------------------------------------------------------------------
module.exports = {
    initSearchStarsPanel,
    initSettingsPanel,
    initStarPanel,
    showStarsPanel
}