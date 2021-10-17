const fs = require( 'fs' );

//----------------------------------------------------------------------------------------------------------------------------------------
function copyFile( source, destination )
{
    try
    {
        fs.copyFileSync( source, destination );
        return true;
    }
    catch ( error )
    {
        console.log( error.message );
        return false;
    }
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Creates folder.
 * @param {string} path - New folder path.
 */
function createFolder( path )
{
    try
    {
        fs.mkdirSync( path, {recursive: true} );
    }
    catch ( error )
    {
        return false;
    }
    return true;
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Deletes file.
 * @param {string} file - Path to file.
 */
function deleteFile( file )
{
    fs.unlinkSync( file );
}

//----------------------------------------------------------------------------------------------------------------------------------------
function deleteFolder( path )
{
    if ( fs.existsSync( path ) )
    {
        const files = fs.readdirSync( path )

        if ( files.length > 0 )
        {
            files.forEach( function ( filename )
            {
                if ( fs.statSync( path + "/" + filename ).isDirectory() )
                {
                    deleteFolder( path + "/" + filename )
                } else
                {
                    fs.unlinkSync( path + "/" + filename )
                }
            } )
            fs.rmdirSync( path )
        } else
        {
            fs.rmdirSync( path )
        }
    } else
    {
        console.log( "Directory path not found." )
    }
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Checks existence of file or folder.
 * @param {string} path - Path to file or folder.
 * @returns {boolean} True if exists, false if not.
 */
function exists( path )
{
    return fs.existsSync( path );
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Gets file size.
 * @param {string} file - Path to file.
 * @returns {object} Object with size, isFile properties.
 */
function fileInfo( file )
{
    const stats = fs.statSync( file );

    return {
        size: stats.size,
        isFile: stats.isFile()
    }
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Reads files recursively.
 * @param {string} dirPath - Path to folder
 * @param {string[]} arrayOfFiles - Result.
 * @returns {string[] | boolean} Array of files or false if folder doesn't exist.
 */
function getFiles( {folder, result = [], recursive = true} )
{
    if ( fs.existsSync( folder ) )
    {
        const files = fs.readdirSync( folder );

        files.forEach( function ( item )
        {
            if ( fs.statSync( `${folder}/${item}` ).isDirectory() )
            {
                if ( recursive ) result = getFiles( {folder: `${folder}/${item}`, result, recursive: true} );
            }
            else
            {
                result.push( `${folder}/${item}` );
            }
        } )

        return result;
    }
    else
    {
        return false;
    }
}

function getSubfolders( source )
{
    return fs.readdirSync( source, {withFileTypes: true} )
        .filter( dirent => dirent.isDirectory() )
        .map( dirent => dirent.name )
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Reads file synchronously.
 * @param {string} filePath - Path to file to read.
 * @param {boolean} [utf8] - Indicates if file should be read as utf8 string.
 * @returns File content on success, false on error.
 */
function readFile( filePath, utf8 = false )
{
    try
    {
        return fs.readFileSync( filePath, {encoding: utf8 ? 'utf8' : null} );
    }
    catch
    {
        return false;
    }
}

//----------------------------------------------------------------------------------------------------------------------------------------
function renameFile( oldPath, newPath )
{
    return new Promise( ( resolve, reject ) =>
    {
        fs.rename( oldPath, newPath, ( error ) =>
        {
            if ( error )
            {
                reject( error.message );
            }
            resolve( true );
        } )
    } );
}

//----------------------------------------------------------------------------------------------------------------------------------------
function renameImages( folder, $ )
{
    let log = '';

    fs.readdir( folder, ( readError, files ) =>
    {
        if ( !readError )
        {
            for ( const file of files )
            {
                if ( fileInfo( `${folder}/${file}` ).isFile )
                {
                    const star = $.stars.find( s => ( s.fullName == file ) || ( s.fullName + '.jpg' == file ) );

                    if ( star )
                    {
                        fs.rename( `${folder}/${file}`, `${$.photos}/${star.id}`, ( error ) =>
                        {
                            if ( error ) log += error.message + '\n';
                        } );
                    }
                }
            }
        }
        else
        {
            if ( error ) log += error.message + '\n';
        }
    } );

    return log;
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Writes file synchronously.
 * @param {string} filePath - Path to file to write.
 * @param {string|buffer} content - Content to write.
 */
function writeFile( filePath, content )
{
    try
    {
        fs.writeFileSync( filePath, content );
        return true;
    }
    catch ( error )
    {
        console.log( error.message );
        return false;
    }
}

//----------------------------------------------------------------------------------------------------------------------------------------
module.exports = {
    copyFile,
    createFolder,
    deleteFile,
    deleteFolder,
    exists,
    fileInfo,
    getFiles,
    getSubfolders,
    readFile,
    renameFile,
    renameImages,
    writeFile
}