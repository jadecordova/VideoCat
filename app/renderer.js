const { ipcRenderer } = require('electron');
const path = require('path');
const fse = require('fs-extra');

const { Video } = require('./Video');
const { Star } = require('./Star');

const {
    birthdays
} = require('./stars');

const {
    initLoadVideosPanel,
    initSearchStarsPanel,
    initSearchVideosPanel,
    initSettingsPanel,
    initStarPanel,
    initTopVideosPanel,
    showStarsPanel
} = require('./panels');

const {
    getVideosFolderData,
    searchVideos
} = require('./videos');

const {
    find,
    titleCard,
} = require('./utils');

const {
    deleteStar,
    loadStars,
    starsScreen,
    starScreen,
    topStars
} = require('./stars');

const { getFiles } = require('./io');

//----------------------------------------------------------------------------------------------------------------------------------------
// We'll use this constant object to store references to frequently used DOM elements, relative paths to data folders, HTML templates,
// the main data arrays (videos and stars) and user password.

const $ = {
    panels: {},
    password: null,
    stars: [],
    videos: [],
    user: {},
    //------------------------------------------------------------------------
    photos: './data/f',
    thumbs: path.resolve('./data/v'),
    icons: '../icons',
    //------------------------------------------------------------------------
    content: document.getElementById('content'),
    //------------------------------------------------------------------------
    grid: document.createElement('div'),
    //------------------------------------------------------------------------
    progress: document.getElementById('progress'),
    progressTitle: document.getElementById('progress-bar-title'),
    progressContainer: document.getElementById('progress-bar-container'),
    //------------------------------------------------------------------------
    templates: {
        card: document.getElementById('card-template').content.firstElementChild,
        star: document.getElementById('star-card-template').content.firstElementChild,
        video: document.getElementById('video-info-template').content.firstElementChild,
        starScreen: document.getElementById('star-screen-template').content.firstElementChild,
        posterCard: document.getElementById('poster-card-template').content.firstElementChild
    }
};

// Add required classes to main card grid element.
$.grid.classList.add('card-grid', 'big');

// Get all the panel elements and store them on the $ object.
const panelElements = Array.from(document.querySelectorAll('.main-panel'));
for (const panel of panelElements) $.panels[panel.id.split('-')[0]] = panel;

//----------------------------------------------------------------------------------------------------------------------------------------
ipcRenderer.on('birthdays', () => birthdays($));

//----------------------------------------------------------------------------------------------------------------------------------------
ipcRenderer.on('add-stars', () => {

    showStarsPanel($);
    $.panels.stars.classList.toggle('hidden');
});

//----------------------------------------------------------------------------------------------------------------------------------------
ipcRenderer.on('data', (event, args) => {

    $.password = args.password || $.password;
    $.stars = args.decrypted.stars ? Star.fromObjectsArray(args.decrypted.stars) : $.stars;
    $.videos = args.decrypted.videos ? Video.fromObjectsArray(args.decrypted.videos, $) : $.videos;
    $.user = args.decrypted.settings || $.user;

    $.stars.sort((a, b) => (a.firstName > b.firstName) ? 1 : -1);

    initStarPanel($);
    initSearchStarsPanel($);
    initSettingsPanel($);
    initLoadVideosPanel($, getVideosFolderData);
    initTopVideosPanel($, searchVideos);
    initSearchVideosPanel($, searchVideos);
});

//----------------------------------------------------------------------------------------------------------------------------------------
ipcRenderer.on('add-videos', () => $.panels.loadvideos.classList.toggle('hidden'));

//----------------------------------------------------------------------------------------------------------------------------------------
ipcRenderer.on('context-menu-command', (e, command, id) => {
    console.log(id);
    switch (command) {
        case 'edit-star':
            showStarsPanel($, find($.stars, { id }));
            $.panels.stars.classList.toggle('hidden');
            break;

        case 'delete-star':
            deleteStar(id, $);
            break;

        case 'star-screen':
            starScreen(find($.stars, { id }), $);
            break;
    }
});

//----------------------------------------------------------------------------------------------------------------------------------------
ipcRenderer.on('save-json', event => {
    const data = {
        videos: Video.prepareToSave($.videos),
        stars: $.stars,
        tags: $.tags
    }
    event.sender.send('save-json', data);
});

//----------------------------------------------------------------------------------------------------------------------------------------
ipcRenderer.on('search-stars', () => $.panels.searchstars.classList.toggle('hidden'));

//----------------------------------------------------------------------------------------------------------------------------------------
ipcRenderer.on('search-videos', (event, args) => {
    if (!$.panels.searchvideos.classList.contains('hidden')) {
        $.panels.searchvideos.classList.add('hidden');
        return;
    }

    let response = 0;
    // Flag to protect from changing screen when adding videos.
    if (global.critical) {
        response = ipcRenderer.sendSync('dialog', {
            type: 'confirm',
            title: 'Attention',
            message: "You're adding videos!",
            detail: 'If you leave this screen changes will be lost.\nAre you sure?'
        });
    }
    if (response === 0) {
        $.content.innerHTML = '';
        $.grid.innerHTML = '';
        $.content.appendChild($.grid);
        $.panels.searchvideos.classList.remove('hidden')
        global.critical = false;
    }
});

//----------------------------------------------------------------------------------------------------------------------------------------
ipcRenderer.on('send-data', (event, { changedFiles, quit }) => {
    const data = {};

    for (const file of changedFiles) {
        switch (file) {
            case 'settings':
                data.settings = $.user;
                break;
            case 's':
                data.s = $.stars;
                break;
            case 'v':
                data.v = Video.prepareToSave($.videos);
                break;
        }
    }
    event.sender.send('receive-data', { data, quit, password: $.password });
});

//----------------------------------------------------------------------------------------------------------------------------------------
ipcRenderer.on('settings', () => $.panels.settings.classList.toggle('hidden'));

//----------------------------------------------------------------------------------------------------------------------------------------
ipcRenderer.on('top-videos', () => {
    if (!$.panels.topvideos.classList.contains('hidden')) {
        $.panels.topvideos.classList.add('hidden');
        return;
    }

    let response = 0;
    // Flag to protect from changing screen when adding videos.
    if (global.critical) {
        response = ipcRenderer.sendSync('dialog', {
            type: 'confirm',
            title: 'Attention',
            message: "You're adding videos!",
            detail: 'If you leave this screen changes will be lost.\nAre you sure?'
        });
    }
    if (response === 0) {
        $.content.innerHTML = '';
        $.panels.topvideos.classList.remove('hidden');
        global.critical = false;
    }
});

//----------------------------------------------------------------------------------------------------------------------------------------
ipcRenderer.on('view-stars', () => {
    let response = 0;
    // Flag to protect from changing screen when adding videos.
    if (global.critical) {
        response = ipcRenderer.sendSync('dialog', {
            type: 'confirm',
            title: 'Attention',
            message: "You're adding videos!",
            detail: 'If you leave this screen changes will be lost.\nAre you sure?'
        });
    }
    if (response === 0) {
        $.content.innerHTML = '';
        $.content.appendChild(titleCard({
            $,
            icon: 'star.png',
            title: `Stars: ${Number($.stars.length).toLocaleString()}`
        }))
        $.content.appendChild(starsScreen($, loadStars));
        global.critical = false;
    }
});

//----------------------------------------------------------------------------------------------------------------------------------------
window.addEventListener('contextmenu', (e) => {

    e.preventDefault();
    // Get the element under de mouse.
    let elements = document.elementsFromPoint(e.x, e.y);

    let starCard = elements.find(x => x.classList.contains('star-card'));
    let videoCard = elements.find(x => x.classList.contains('video-card'));

    const result = {};
    if (starCard) {
        result.type = 'star';
        result.id = starCard.star.id;
    }
    else if (videoCard) {
        result.type = 'video';
        result.id = videoCard.video.id;
    }
    if (!(Object.keys(result).length === 0 && result.constructor === Object)) {
        ipcRenderer.send('show-context-menu', result);
    }
});
