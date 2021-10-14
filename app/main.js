const {
    app,
    BrowserWindow,
    ipcMain,
    screen,
    Menu,
    nativeTheme,
    dialog
} = require( 'electron' );

const {
    copyFile,
    readFile,
    writeFile
} = require( './io' );

const {
    decryptJSON,
    encryptJSON
} = require( './encryption' );

//----------------------------------------------------------------------------------------------------------------------------------------
// Since we're gonna be using JSON to store video information instead of a database,
// we'll use this set to store the names of the files that have changed and need to be saved. (videos, cast, tags)
const changedFiles = new Set();

//----------------------------------------------------------------------------------------------------------------------------------------
let splashWindow;
let mainWindow;
let password = '';
let encrypted = null;
let decrypted = null;
let changed = false;

//----------------------------------------------------------------------------------------------------------------------------------------
const menuTemplate = [
    {
        label: 'File',
        submenu:
            [
                {
                    id: 'save',
                    label: 'Save',
                    accelerator: 'CmdOrCtrl+S',
                    click: menus
                },
                {
                    id: 'settings',
                    label: 'Settings...',
                    accelerator: 'CmdOrCtrl+F2',
                    click: menus
                },
                {
                    type: 'separator'
                },
                {
                    id: 'dev-tools',
                    label: 'Dev Tools',
                    click: () => mainWindow.webContents.toggleDevTools()
                },
                {
                    id: 'reload',
                    label: 'Reload',
                    click: () => mainWindow.reload()
                },
                {
                    id: 'exit',
                    label: 'Exit',
                    accelerator: 'CmdOrCtrl+Q',
                    click: menus
                }
            ]
    },
    {
        label: 'Stars',
        submenu:
            [
                {
                    id: 'view-stars',
                    label: 'View stars',
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: menus
                },
                {
                    id: 'add-stars',
                    label: 'Add stars',
                    accelerator: 'CmdOrCtrl+Shift+A',
                    click: menus
                },
                {
                    id: 'search-stars',
                    label: 'Search stars',
                    accelerator: 'Alt+S',
                    click: menus
                },
                {
                    id: 'top-stars',
                    label: 'Top stars',
                    accelerator: 'Alt+T',
                    click: menus
                },
                {
                    type: 'separator'
                },
                {
                    id: 'substitutions',
                    label: 'Star substitutions...',
                    click: menus
                }
            ]
    },
    {
        label: 'Videos',
        submenu:
            [
                {
                    label: 'Add',
                    submenu:
                        [
                            {
                                id: 'add-video',
                                label: 'Video',
                                accelerator: 'CmdOrCtrl+Alt+V',
                                click: menus
                            },
                            {
                                id: 'add-videos',
                                label: 'From folder...',
                                accelerator: 'CmdOrCtrl+Shift+V',
                                click: menus
                            }
                        ]

                },
                {
                    type: 'separator'
                },
                {
                    id: 'top-videos',
                    label: 'Top videos',
                    accelerator: 'CmdOrCtrl+V',
                    click: menus
                },
                {
                    id: 'search-videos',
                    label: 'Search videos',
                    accelerator: 'Alt+V',
                    click: menus
                },
            ]
    },
    {
        label: 'Storage',
        submenu:
            [
                {
                    id: 'storage-info',
                    label: 'Storage info',
                    click: menus
                },
                {
                    id: 'update-container',
                    label: 'Update container',
                    click: menus
                }
            ]
    },
    {
        label: 'Utilities',
        submenu:
            [
                {
                    label: 'Encryptrion',
                    submenu:
                        [
                            {
                                id: 'save-json',
                                label: 'Save unencrypted data...',
                                click: menus
                            },
                            {
                                type: 'separator'
                            },
                            {
                                id: 'encrypt-images',
                                label: 'Encrypt images...',
                                click: menus
                            },
                            {
                                id: 'encrypt-folder',
                                label: 'Encrypt folder...',
                                click: menus
                            }
                        ]
                },
                {
                    type: 'separator'
                },
                {
                    id: 'thumbs',
                    label: 'Generate thumbs...',
                    click: menus // mThumbs
                },
                {
                    id: 'tags',
                    label: 'Tags',
                    accelerator: 'CmdOrCtrl+T',
                    click: menus
                },
                {
                    id: 'edit-tags',
                    label: 'Edit tags',
                    accelerator: 'CmdOrCtrl+Shift+T',
                    click: menus
                },
                {
                    id: 'icons',
                    label: 'Rebuild icons...',
                    click: menus // mRebuildTagIcons
                },
                {
                    id: 'extra',
                    label: 'Extra',
                    click: menus // mRebuildTagIcons
                }
            ]
    }
];

//----------------------------------------------------------------------------------------------------------------------------------------
app.on( 'ready', () =>
{
    splashWindow = splash();
    encrypted = {
        stars: readFile( './json/s', true ),
        videos: readFile( './json/v', true ),
        tags: readFile( './json/t', true ),
        settings: readFile( './json/settings', true )
    }
    //nativeTheme.themeSource = 'dark';
});

//----------------------------------------------------------------------------------------------------------------------------------------
ipcMain.on( 'password', ( event, args ) =>
{
    password = args;

    decrypted = {
        stars: encrypted.stars ? decryptJSON( encrypted.stars, password ) : null,
        videos: encrypted.videos ? decryptJSON( encrypted.videos, password ) : null,
        tags: encrypted.tags ? decryptJSON( encrypted.tags, password ) : null,
        settings: encrypted.settings ? decryptJSON( encrypted.settings, password ) : null
    }

    // Errors in data decryption return an empty string.
    if ( decrypted.stars === '' )
    {
        splashWindow.webContents.send( 'wrong-password' );
    }
    else
    {
        // Unset this huge variables.
        encrypted = null;
        mainWindow = main();
    }
} );

//----------------------------------------------------------------------------------------------------------------------------------------
ipcMain.on( 'dialog', ( event, {
    type,
    title,
    detail,
    buttons,
    buttonLabel = 'OK',
    message,
    properties = ['openFile'],
    filters = [{name: 'All Files', extensions: ['*']}]
} ) =>
{
    switch ( type )
    {
        case 'confirm':
            event.returnValue = dialog.showMessageBoxSync( null, {
                title,
                type: 'question',
                detail,
                buttons: ['OK', 'CANCEL'],
                message
            } );
            break

        case 'file':
            event.returnValue = dialog.showOpenDialogSync( null, {
                title,
                buttonLabel,
                properties,
                filters
            } );
            break

        case 'folder':
            event.returnValue = dialog.showOpenDialogSync( null, {
                title,
                buttonLabel,
                properties: ['openDirectory']
            } );
            break

        case 'inform':
            event.returnValue = dialog.showMessageBoxSync( null, {
                title,
                type: 'info',
                message,
                detail,
                buttons: ["OK"]
            } );
            break
    }
} );

//----------------------------------------------------------------------------------------------------------------------------------------
ipcMain.on( 'save-json', ( event, data ) =>
{
    const folders = dialog.showOpenDialogSync( null, {
        title: 'Select folder to save JSON files',
        buttonLabel: 'SELECT',
        properties: ['openDirectory']
    } );

    if ( folders )
    {
        const folder = folders[0];
        const videos = JSON.stringify( data.videos, null, '\t' );
        const stars = JSON.stringify( data.stars, null, '\t' );
        const tags = JSON.stringify( data.tags, null, '\t' );
        writeFile( `${folder}/videos.json`, videos );
        writeFile( `${folder}/stars.json`, stars );
        writeFile( `${folder}/tags.json`, tags );
    }
} );

//----------------------------------------------------------------------------------------------------------------------------------------
app.on( 'window-all-closed', function ()
{
    if ( process.platform !== 'darwin' ) app.quit();
} );

//----------------------------------------------------------------------------------------------------------------------------------------
ipcMain.on( 'changed', ( event, file ) =>
{
    changed = true;
    changedFiles.add( file );
    Menu.getApplicationMenu().getMenuItemById( 'save' ).enabled = true;
} );
 
//----------------------------------------------------------------------------------------------------------------------------------------
ipcMain.on( 'receive-data', ( event, {data, quit, password} ) =>
{
    save( {data, quit, password} );
} );

//----------------------------------------------------------------------------------------------------------------------------------------
ipcMain.on( 'show-context-menu', ( event, result ) =>
{
    let template;

    switch ( result.type )
    {
        case 'star':
            template = [
                {
                    label: 'Edit star',
                    click: () => {event.sender.send( 'context-menu-command', 'edit-star', result.id )}
                },
                {
                    label: 'Delete star',
                    click: () => {event.sender.send( 'context-menu-command', 'delete-star', result.id )}
                },
                {type: 'separator'},
                {
                    label: 'Star videos',
                    click: () => {event.sender.send( 'context-menu-command', 'star-screen', result.id )}
                },
                {type: 'separator'},
                {
                    label: 'Mark as hard to remember',
                    click: () => {event.sender.send( 'context-menu-command', 'hard-star', {id: result.id, hard: true} )}
                },
                {
                    label: 'Unmark as hard to remember',
                    click: () => {event.sender.send( 'context-menu-command', 'hard-star', {id: result.id, hard: false} )}
                }
            ];
            break;
        case 'video':
            break;
    }

    const menu = Menu.buildFromTemplate( template );

    menu.popup( BrowserWindow.fromWebContents( event.sender ) );
} );

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Creates splash window.
 * @returns {BrowserWindow} Splash window object.
 */
 function splash()
 {
     let win = new BrowserWindow( {
         width: 800,
         height: 519,
         frame: false,
         fullscreenable: false,
         show: false,
         alwaysOnTop: true,
         webPreferences: {
             nodeIntegration: true,
             contextIsolation: false
         }
     } );
 
     win.loadFile( 'app/splash.html' );
     win.on( 'closed', () => {win = null} );
     win.once( 'ready-to-show', () => {win.show()} );
 
     return win;
 }
 
 //----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Creates main window.
 * @returns {BrowserWindow} Main window object.
 */
function main()
{
    // Create main menu.
    const menu = Menu.buildFromTemplate( menuTemplate );
    Menu.setApplicationMenu( menu );

    // Create main window.
    const {width, height} = screen.getPrimaryDisplay().workAreaSize;

    let win = new BrowserWindow( {
        width: width,
        height: height,
        fullscreenable: true,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false
        }
    } );

    win.loadFile( 'app/index.html' );

    win.once( 'ready-to-show', () =>
    {
        win.webContents.send( 'data', {
            password,
            decrypted
        } );

        decrypted = null;

        win.webContents.send( 'birthdays' );
        win.webContents.openDevTools();
        Menu.getApplicationMenu().getMenuItemById( 'save' ).enabled = false;
        win.show();
    } );

    win.once( 'show', () =>
    {
        if ( splashWindow )
        {
            splashWindow.close();
            splashWindow = null;
        }
    } );

    win.once( 'close', ( event ) =>
    {
        if ( changed )
        {
            event.preventDefault();
            getData( true );
        }
    } );

    return win;
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Request updated data from renderer process.
 * @param {boolean} quit - Signals if app should quit. 
 */
 function getData( quit = false )
 {
     mainWindow.webContents.send( 'send-data', {changedFiles, quit} );
 }
 
//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Quits application after checking for unsaved changes.
 */
 function quit()
 {
     if ( changed )
     {
         getData( true );
     }
     else
     {
         app.quit();
     }
 }
 
//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Saves changed data.
 * @param {object} params - Object containing data to be saved.
 * @param {object} params.data - Data to be saved.
 * @param {boolean} params.quit - Flag indicating if app should quit.
 * @param {string} params.password - Password.
 */
 function save( {data, quit, password} )
 {
     for ( const [key, value] of Object.entries( data ) )
     {
         if ( copyFile( `./json/${key}`, `./json/${key}-backup` ) )
         {
             writeFile( `./json/${key}`, encryptJSON( value, password ) );
         }
         else
         {
             console.error( `Backup of file ${key} failed` );
         }
     }
 
     changedFiles.clear();
     changed = false;
     Menu.getApplicationMenu().getMenuItemById( 'save' ).enabled = false;
 
     if ( quit )
     {
         app.quit();
     }
 }
 
//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Handles menu selections.
 * @param {object} menuItem - Menu clicked
 * @param {BrowserWindow} browserWindow - Window.
 * @param {events[]} events - Events.
 */
 function menus( menuItem, browserWindow, events )
 {
     switch ( menuItem.id )
     {
         case 'save':
             getData();
             break;
 
         case 'exit':
             quit();
             break;
 
         default:
             browserWindow.webContents.send( menuItem.id );
             break;
     }
 }
 