const {Video} = require( './Video' );
const {Star} = require( './Star' );

const {
    ipcRenderer
} = require( 'electron' );

//----------------------------------------------------------------------------------------------------------------------------------------
// We'll use this constant object to store references to frequently used DOM elements, relative paths to data folders, HTML templates,
// the main data arrays (videos and stars) and user password.

const $ = {
    panels: {},
    password: null,
    stars: [],
    videos: [],
    tags: {},
    user: {},
    //------------------------------------------------------------------------
    photos: './data/f',
    thumbs: './data/v',
    icons: '../icons',
    //------------------------------------------------------------------------
    content: document.getElementById( 'content' ),
    //------------------------------------------------------------------------
    grid: document.createElement( 'div' ),
    //------------------------------------------------------------------------
    progress: document.getElementById( 'progress' ),
    progressTitle: document.getElementById( 'progress-bar-title' ),
    progressContainer: document.getElementById( 'progress-bar-container' ),
    //------------------------------------------------------------------------
    templates: {
        card: document.getElementById( 'card-template' ).content.firstElementChild,
        star: document.getElementById( 'star-card-template' ).content.firstElementChild,
        video: document.getElementById( 'video-info-template' ).content.firstElementChild,
        strip: document.getElementById( 'video-strip-template' ).content.firstElementChild,
        tag: document.getElementById( 'tag-item-template' ).content.firstElementChild,
        starScreen: document.getElementById( 'star-screen-template' ).content.firstElementChild,
        posterCard: document.getElementById( 'poster-card-template' ).content.firstElementChild
    }
};

// Add required classes to main card grid element.
$.grid.classList.add( 'card-grid', 'big' );

// Get all the panel elements and store them on the $ object.
const panelElements = Array.from( document.querySelectorAll( '.main-panel' ) );
for ( const panel of panelElements ) $.panels[panel.id.split( '-' )[0]] = panel;
