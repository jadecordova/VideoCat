const path = require( 'path' );
const CryptoJS = require( "crypto-js" );

const {
    deleteFile,
    getFiles,
    readFile,
    writeFile
} = require( './io' );

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Decrypts image.
 * @param {object} params - Parameters.
 * @param {string} params.input - Path to image file.
 * @param {string} params.output - Path to output file. If not provided, a base64 string will be returned.
 * @param {string} params.mime - MIME file type. Defaults to image/jpg.
 * @param {string} params.password - Password.
 * @returns {string} Decrypted image string if no output path is provided.
 */
function decryptImage( {input, output = null, mime = 'image/jpg', password} )
{
    const data = readFile( input );

    if ( data )
    {
        const decrypted = CryptoJS.AES.decrypt( data.toString( 'base64' ), password );

        if ( !output )
        {
            // Return data: URL
            return 'data:' + mime + ';base64,' + decrypted.toString( CryptoJS.enc.Utf8 );
        }
        else
        {
            const result = decrypted.toString( CryptoJS.enc.Utf8 );
            const buffer = Buffer.from( result, 'base64' );

            writeFile( output, buffer );
        }
    }
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Decrypts fiel to JSON format.
 * @param {string} json - Encoded string read by readJSON.
 * @param {string} password - Password.
 * @returns Object
 */
function decryptJSON( json, password )
{
    const bytes = CryptoJS.AES.decrypt( json, password );
    const decryptedData = bytes.toString( CryptoJS.enc.Utf8 );
    return JSON.parse( decryptedData );
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Encrypts data using AES encryption.
 * @param {string} data - Data to encrypt.
 * @param {string} outputFilePath - Path to destination file.
 * @param {string} password - Password.
 * @returns {boolean} - Success. 
 */
function encryptData( data, filePath, password )
{
    const encryptedFile = CryptoJS.AES.encrypt( data, password );
    const buffer = Buffer.from( encryptedFile.toString(), 'base64' );
    return writeFile( filePath, buffer );
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Encrypts folder of images recursively.
 * @param {string} folder - Path to folder.
 * @param {password} password - Password.
 */
function encryptFolder( {sourceFolder, destinationFolder, password} )
{
    const files = getFiles( {folder: sourceFolder} );
    let errorLog = '';
    for ( const file of files )
    {
        let output = destinationFolder ? `${destinationFolder}\\${path.basename( file ).replace( /\.[^/.]+$/, '' )}` : file.replace( /\.[^/.]+$/, '' );
        output = output.trim();

        if ( encryptImage( file, output, password ) )
        {
            try
            {
                deleteFile( file );
            }
            catch ( error )
            {
                errorLog += `Error deleting image ${file}: ${error.message} \n`;
            }
        }
        else
        {
            errorLog += `Error encrypting image ${file} \n`;
        }
    }

    if ( errorLog )
    {
        console.log( errorLog );
        return `There were errors encrypting files: ${errorLog} `;
    }
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Encrypts image file.
 * @param {string} inputFilePath - Path to image file.
 * @param {string} outputFilePath - Path to destination file.
 * @param {password} password - Password.
 */
function encryptImage( inputFilePath, outputFilePath, password )
{
    const dataFile = readFile( inputFilePath );
    const dataBase64 = dataFile.toString( 'base64' );
    return encryptData( dataBase64, outputFilePath, password );
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Encrypts object to file.
 * @param {object} obj - Object to encrypt to file
 * @param {string} password - Password.
 * @returns {string} Encrypted JSON string.
 */
function encryptJSON( obj, password )
{
    return CryptoJS.AES.encrypt( JSON.stringify( obj ), password ).toString();
}

//----------------------------------------------------------------------------------------------------------------------------------------
/**
 * Encrypts and saves image from the canvas element in the create star form.
 * @param {string} imageName - Name for the image file.
 * @param {object} settings - App constants.
 * @param {string} password - Password.
 */
function saveImage( name, $ )
{
    const canvas = document.getElementById( 'image' );
    const image = canvas.toDataURL( "image/jpeg", 0.7 ).replace( /^data:image\/jpeg;base64,/, "" );
    encryptData( image, `${$.photos}/${name}`, $.password );
}


//----------------------------------------------------------------------------------------------------------------------------------------
module.exports = {
    decryptImage,
    decryptJSON,
    encryptFolder,
    encryptImage,
    encryptJSON,
    saveImage
}