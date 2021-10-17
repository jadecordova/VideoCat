const { ipcRenderer } = require('electron');
const path = require('path');

const {
    Video
} = require('./Video');

const {
    hideProgress,
    newID,
    readForm,
    readSubstitutions,
    showCards,
    showProgress,
    validate
} = require('./utils');

const {
    createFolder,
    deleteFolder,
    fileInfo,
    getFiles,
    renameFile
} = require('./io');

const {
    thumbsFromFile
} = require('./vd');

const {
    encryptFolder
} = require('./encryption');

const { Card } = require('./Card');

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Adds video to global videos array.
 * @param {object} video - Video object to add. 
 * @param {object} $ - References object.
 */
async function addVideo(video, $) {
    console.log(video);
    try {
        video.isNew = false;
        encryptFolder({
            sourceFolder: video.thumbsFolder,
            destinationFolder: video._getThumbsFolder(),
            password: $.password
        });
        deleteFolder(video.thumbsFolder);
        video.card.remove();
        video.card = null;
        delete video.thumbsFolder;
        delete video.path;
        delete video.basename;
        delete video.extension;
        $.videos.push(video);
    }
    catch (error) {
        console.log(error);
    }
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Adds array of videos to global videos array.
 * @param {object[]} newVideos - Array of video objects to add.
 * @param {object} $ - References object.
 */
async function addVideos(newVideos, $) {
    showProgress({ $, value: newVideos.length, title: 'Adding Videos' });

    for (const video of newVideos) {
        await addVideo(video, $);
        $.progress.value++;
    }

    hideProgress($);
    ipcRenderer.send('changed', 'v');
    global.critical = false;
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Validates form info and initiates video load process.
 * @param {object} $ - Constants.
 */
function getVideosFolderData($) {

    global.critical = true;
    const panel = $.panels.loadvideos;

    if (validate(
        panel.querySelector('#videosFolder'),
        panel.querySelector('#disk')
    )) {
        processVideos(readForm(panel), $);
    }
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Prepares video files to be added to database.
 * @param {object} data - Contains disk and videos folder info.
 * @param {object} $ - References object.
 */
async function processVideos(data, $) {

    $.content.innerHTML = '';
    $.grid.innerHTML = '';
    $.content.appendChild($.grid);
    const newVideos = [];
    const files = getFiles({ folder: data.videosFolder, recursive: false });
    let initialID = newID($.videos);

    showProgress({ $, value: files.length, title: 'Processing videos' });

    for (const file of files) {
        // folder, path, length.
        const result = await thumbsFromFile(file, `${$.thumbs}/${data.disk}/${initialID}`, $);

        if (result) {
            const video = new Video(
                {
                    isNew: true,
                    id: initialID++,
                    filename: path.basename(file),
                    disk: data.disk,
                    size: fileInfo(file).size,
                    length: result.length,
                    path: file,
                    thumbsFolder: result.folder,
                    $
                }
            );
            console.log('Process videos thumbs folder: ', video.thumbsFolder);
            // video load card.
            $.grid.appendChild(video.createCard());

            newVideos.push(video);
        }
        $.progress.value++;
    }

    hideProgress($);

    // Add videos button
    const button = document.createElement('button');
    button.id = 'add-videos-button';
    button.classList.add('large');
    button.innerText = `Add ${newVideos.length} Videos`;
    button.addEventListener('click', (event) => {
        event.target.blur();
        // Check for stars and tags.
        for (const video of newVideos) {
            video.readCard();
            const result = video.validate();
            if (result !== true) {
                ipcRenderer.sendSync('dialog', {
                    type: 'inform',
                    title: `Missing ${result}`,
                    message: `Please, select video ${result} before continuing.`
                });
                return;
            }
        }
        addVideos(newVideos, $, data.videosFolder);
    });

    $.content.appendChild(button);
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Searches global videos array for specific parameters.
 * @param {object} $ - References object.
 * @param {object} parameters - Parameters object. 
 * @param {number} parameters.id - Video id.
 * @param {number} parameters.disk - Video disk.
 * @param {number} parameters.score - Video score.
 * @param {boolean} parameters.exactScore - Should the score be exact?
 * @param {boolean} parameters.lessScore - Should the score be less than this?
 * @param {boolean} parameters.moreScore - Should the score be more than this?
 * @param {number} parameters.size - Video size.
 * @param {boolean} parameters.lessSize - Should the size be less this?
 * @param {boolean} parameters.moreSize - Should the size be more this?
 * @param {boolean} parameters.modified - Modified videos.
 * @param {object[]} parameters.stars - Stars performing in the videos.
 * @param {object[]} parameters.tags - Tags the video must have.
 * @returns {object[]} - Array of found videos.
 */
function searchVideos($, {
    id,
    disk,
    score,
    exactScore,
    lessScore,
    moreScore,
    size,
    moreSize,
    lessSize,
    modified,
    stars,
    tags
}) {
    return $.videos.filter(video => {
        const result = [];
        if (id) result.push(video.id === id ? true : false);
        if (disk) result.push(video.disk === disk ? true : false);
        if (score) {
            if (exactScore) result.push(Number(video.score) === Number(score) ? true : false);
            if (lessScore) result.push(Number(video.score) < Number(score) ? true : false);
            if (moreScore) result.push(Number(video.score) > Number(score) ? true : false);
        }
        if (size) {
            if (lessSize) result.push(Number(video.size) < Number(size) ? true : false);
            if (moreSize) result.push(Number(video.size) > Number(size) ? true : false);
        }
        if (stars) {
            for (const star of stars) {
                result.push(video.stars.includes(star.fullName) ? true : false);
            }
        }
        if (tags) {
            for (const tag of tags) {
                result.push(video.tags.includes(tag) ? true : false);
            }
        }

        return !result.includes(false);
    });
}

//----------------------------------------------------------------------------------------------------------------------------------------
module.exports = {
    getVideosFolderData,
    searchVideos
}