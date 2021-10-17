const {ipcRenderer} = require( 'electron' );

const {
    findVideos,
    titleCard,
    showCards
} = require('./utils');

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Finds and displays stars whose birthday conicides with the current day.
 * If there are no birthdays, it displays welcome screen.
 * @param {object} $ - References object.
 */
function birthdays($) 
{
    const birthdays = $.stars.filter(star => star.birthday);

    if(birthdays.length)
    {
        $.content.innerHTML = '';
        $.content.appendChild(titleCard({
            icon: 'cake.png',
            title: 'Birthdays!',
            $
        }));
        const container = $.content.appendChild($.grid);
        showCards($, {
            elements: birthdays,
            container
        });
    }
    else
    {
        // Show welcome screen.
        document.getElementById('welcome').classList.remove('hidden');
    }
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Deletes star from database.
 * @param {number} id - Star id.
 * @param {object} $ - References object.
 */
function deleteStar( id, $ )
{
    if ( ipcRenderer.sendSync( 'dialog', {
        type: 'confirm',
        title: 'Delete star',
        message: 'Delete this star?',
        detail: 'She will permanently deleted from the database.'
    } ) == 0 )
    {
        const index = $.stars.findIndex( star => star.id == Number( id ) );
        $.stars.splice( index, 1 );

        // Inform app of changed file.
        ipcRenderer.send( 'changed', 's' );
        document.getElementById( id ).remove();
    }
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Loads stars in the stars screen.
 * @param {object} params - Paramenters
 * @param {string} params.initial - Star's name initial letter.
 * @param {string} params.letters - Alphabet letters.
 * @param {HTMLElement} params.container - Card container element.
 * @param {object} params.$ - References object.
 */
function loadStars( {initial, letters, container, $} )
{
    container.innerHTML = '';
    // Get the actresses corresponding to selected letter.
    const selectedStars = $.stars.filter( element => element.firstName.startsWith( initial ) );

    showCards( $, {
        elements: selectedStars,
        container
    } );

    for ( const element of letters )
    {
        if ( element == initial )
        {
            document.getElementById( element ).classList.add( 'initials-button-active' );
        }
        else
        {
            document.getElementById( element ).classList.remove( 'initials-button-active' );
        }
    }
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Creates star screen.
 * @param {Star} star - Star object.
 * @param {object} $ - References object.
 */
function starScreen( star, $ )
{
    const starCard = star.createScreen( $ );
    const videosGrid = $.grid;
    $.grid.innerHTML = '';
    const wrapper = document.createElement( 'div' );
    const videos = findVideos( star, $.videos );
    videos.sort( ( a, b ) => ( a.score > b.score ) ? -1 : 1 );

    $.content.innerHTML = '';
    wrapper.appendChild( starCard );
    wrapper.appendChild( videosGrid );

    showCards( $, {
        elements: videos,
        container: videosGrid,
        callback: () =>
        {
            $.content.innerHTML = '';
            global.activeVideo = null;
            global.activeCard = null;
            $.content.appendChild( wrapper );
        }
    } )

    $.content.appendChild( wrapper );
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Creates stars screen
 * @param {object} $ - References object.
 * @param {function} callback - Callback for click event.
 * @returns {HTMLElement} Stars screen element.
 */
function starsScreen( $, callback )
{
    const clone = document.getElementById( "stars-screen-template" ).content.firstElementChild.cloneNode( true );
    const buttons = Array.from( clone.querySelectorAll( '.initials-button' ) );

    buttons.forEach( button =>
    {
        button.addEventListener( 'click', () => callback( {
            $,
            initial: button.innerText,
            letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
            container: clone.querySelector( '.card-grid' )
        } ) );
    } );
    return clone;
}

//----------------------------------------------------------------------------------------------------------------------------------------
module.exports = {
    birthdays,
    deleteStar,
    loadStars,
    starScreen,
    starsScreen
}
