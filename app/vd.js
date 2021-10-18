const {ipcRenderer} = require( 'electron' );
const VideoLength = require( 'video-length' );
const FileType = require( 'file-type' );
const path = require( 'path' );

const {
    createFolder,
    exists,
    getFiles,
    writeFile,
    fileInfo
} = require( './io' );

//_______________________________________________________________________________________________________________________________________________________________________
/**
 * Calculates decimation factor based on video length in seconds.
 * @param {number} seconds - length of video.
 * @param {number} numberOfImages - Desired number of images.
 * @returns {number} Decimation factor.
 */
function calculateDecimation( seconds, numberOfImages )
{
    const totalFrames = Math.floor( seconds * 30 );

    if ( totalFrames <= numberOfImages )
    {
        // Magic number: create image every 2 frames.
        return 2;
    }
    else
    {
        return Math.floor( totalFrames / numberOfImages );
    }
}

//_______________________________________________________________________________________________________________________________________________________________________
/**
 * Generates VirtualDub jobs string.
 * @param {object[]} videosInfo - Array of objects with path and folder properties. path: video path, folder: thumbs folder.
 * @returns {string} VirtualDub jobs string.
 */
function createJobs( videosInfo, $ )
{
    let result = '// VirtualDub.jobs file generated by Valerie Video Cataloger.\n';

    result += '// signature 0 1\n';
    result += `// $numjobs ${videosInfo.length}\n`;

    videosInfo.forEach( ( video, index ) =>
    {
        console.log('Video folder: ', video.folder);
        result += '// -------------------------------------------------------------------\n';
        result += `// $job "Job ${index + 1}"\n`;
        result += `// $input "${video.path}"\n`;
        result += `// output "${video.folder}\\*.jpeg"\n`;
        result += '// $state 0\n';
        result += `// id ${index + 1}\n`;
        result += '// $start_time 00000000 00000000\n';
        result += '// $end_time 00000000 00000000\n';
        result += '// $script\n';
        result += `VirtualDub.Open( U"${video.path}", "", 0 );\n`;
        result += 'VirtualDub.video.SetInputFormat( 0 );\n';
        result += 'VirtualDub.video.SetOutputFormat( 7 );\n';
        result += 'VirtualDub.video.SetMode( 3 );\n';
        result += 'VirtualDub.video.SetSmartRendering( 0 );\n';
        result += 'VirtualDub.video.SetPreserveEmptyFrames( 0 );\n';
        result += `VirtualDub.video.SetFrameRate2( 0, 0, ${calculateDecimation( video.length, Number( $.user.thumbnails ) )});\n`;
        result += 'VirtualDub.video.SetIVTC( 0, 0, 0, 0 );\n';
        result += 'VirtualDub.video.SetCompression();\n';
        result += 'VirtualDub.video.filters.Clear();\n';
        result += 'VirtualDub.video.filters.Add( "resize" );\n';
        result += `VirtualDub.video.filters.instance[0].Config( ${$.user.thumbnailswidth}, ${$.user.thumbnailsheight}, 0, 4, 3, 0, 320, 240, 4, 3, 0, 4, 1, 0x000000 );\n`;
        result += 'VirtualDub.project.ClearTextInfo();\n';
        result += '//  -- $reloadstop --\n';
        result += `VirtualDub.SaveImageSequence( U"${video.folder}\\", ".jpeg", 4, 2, 70 );\n`;
        result += 'VirtualDub.Close();\n';
        result += '// $endjob\n';
    } );

    result += `// -------------------------------------------------------------------\n`;
    result += '// $done\n';
    return result;
}

//_______________________________________________________________________________________________________________________________________________________________________
/**
 * Creates thumbnails using VirtualDub.
 * @param {string} jobsString - VirtulDub jobs string, generated by createJobs.
 * @returns undefined on error.
 */
function createThumbs( jobsString, $ )
{
    try
    {
        writeFile( `${$.user.virtualdubfolder}/VirtualDub.jobs`, jobsString );
    }
    catch ( error )
    {
        ipcRenderer.sendSync( 'dialog', {
            type: 'inform',
            title: 'Error!',
            type: 'error',
            detail: error.message,
            message: "There was an error creating the jobs file."
        } );

        return;
    }

    let execFileSync = require( 'child_process' ).execFileSync;

    execFileSync( $.user.virtualdub, ['/r'] );
}

//_______________________________________________________________________________________________________________________________________________________________________
/**
 * Creates video thumbnails using VirtualDub.
 * @param {string} file - Path to video file
 * @param {string} thumbsFolder - Path to folder to save the thumbs.
 * @param {object} $ - References object.
 * @param {number} folderCounter - Folder id. 
 * @returns {Video|boolean} Video object or false on error.
 */
async function thumbsFromFile( file, thumbsFolder, $ )
{
    // This is the start of the final video object.
    let video;
    let info = fileInfo( file );

    if ( info.isFile )
    {
        //const type = await FileType.fromFile( file );
        //if ( type?.mime?.includes( 'video' ) || type?.mime?.includes( 'audio' ) )
        try
        {
            video = {
                path: file
            };
            // Get video id from name.
            // const id = file.match( /-([0-9]+)\./ )[1];
            video.folder = `${thumbsFolder}/temp`;

            if ( !exists( video.folder ) ) createFolder( video.folder );

            try
            {
                video.length = await VideoLength( file, {bin: './MediaInfo/MediaInfo.exe'} );
            }
            catch ( error )
            {
                console.log( `Could not get length of video ${file}: ${error.message}` );
                return false;
            }
            createThumbs( createJobs( [video], $ ), $ );
        }
        catch ( error )
        {
            console.log( error.message );
            return false;
        }
    }

    return video;
}

//_______________________________________________________________________________________________________________________________________________________________________
/**
 * Creates thumbnails from videos folder
 * @param {string} inputFolder - Path to videos folder.
 * @param {string} outputFolder - Path to images folder
 * @returns undefined if canceled
 */
async function thumbsFromFolder2( inputFolder, outputFolder )
{

    let errorLog = '';
    let err = false;

    if ( !inputFolder || !outputFolder )
    {
        try
        {
            [inputFolder, outputFolder] = await foldersDialog( inputFolder, outputFolder );
        }
        catch ( error )
        {
            if ( error != 'Operation canceled.' )
            {
                // TODO: HANDLE ERROR.
                errorLog += `Strange error in getting folder names: ${error}\n`;
                err = true;
            }
            else
            {
                // User canceled.
                return;
            }
        }
    }

    if ( !err && !exists( outputFolder ) )
    {
        try
        {
            createFolder( outputFolder );
        }
        catch ( error )
        {
            err = true;
            errorLog += `Error creating output folder: ${error}\n`;
        }
    }

    if ( !err )
    {
        const videos = getFiles( {folder: inputFolder} );
        videos.sort();
        const videosInfo = [];

        for ( const video of videos )
        {
            const thisVideoInfo = {path: video};
            let info = fileInfo( thisVideoInfo.path );

            if ( info.isFile )
            {
                // Get video id from name.
                const id = video.match( /-([0-9]+)\./ )[1];
                thisVideoInfo.folder = `${outputFolder}\\${id}`;

                if ( !exists( thisVideoInfo.folder ) )
                {
                    try
                    {
                        createFolder( thisVideoInfo.folder );
                    }
                    catch ( error )
                    {
                        err = true;
                        errorLog += `Error creating folder for ${thisVideoInfo.path}: ${error}\n`;
                        continue;
                    }
                }

                thisVideoInfo.length = await VideoLength( thisVideoInfo.path, {bin: './MediaInfo/MediaInfo.exe'} );

                videosInfo.push( thisVideoInfo );
            }
        }

        createThumbs( ( createJobs( videosInfo ) ) );
    }

    if ( err )
    {
        ipcRenderer.sendSync( 'dialog', {
            type: 'inform',
            title: 'Warning!',
            type: 'warning',
            detail: errorLog,
            buttons: ["OK"],
            message: "There were some errors creating thumbnails."
        } );
    }
}

//_______________________________________________________________________________________________________________________________________________________________________
module.exports = {
    createJobs,
    createThumbs,
    thumbsFromFile,
    thumbsFromFolder2
}