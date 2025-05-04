const tesseract = require('node-tesseract-ocr');
const fs = require('fs');

// Configure Tesseract options
const config = {
  lang: 'eng',
  oem: 1,
  psm: 3,
  dpi: 300,
  'tessdata-dir': '/opt/homebrew/share/tessdata',
  // Add character whitelist for better number recognition
  tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,$ '
};

/**
 * Process an image file with OCR to extract text
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<string>} - Extracted text from the image
 */
async function processImage(imagePath) {
  try {
    console.log('Starting OCR processing on image:', imagePath);
    
    // Verify tessdata directory exists
    const tessdataDir = config['tessdata-dir'];
    if (!fs.existsSync(tessdataDir)) {
      console.error(`Tessdata directory not found at: ${tessdataDir}`);
      throw new Error('Tessdata directory not found');
    }

    // Verify eng.traineddata exists
    const engTrainedData = `${tessdataDir}/eng.traineddata`;
    if (!fs.existsSync(engTrainedData)) {
      console.error(`English language data not found at: ${engTrainedData}`);
      throw new Error('English language data not found');
    }

    const text = await tesseract.recognize(imagePath, config);
    console.log('OCR processing completed. Text length:', text.length);
    console.log('First 500 characters of extracted text:', text.substring(0, 500));
    return text;
  } catch (error) {
    console.error('Error in OCR processing:', error);
    throw error;
  }
}

module.exports = {
  processImage
};
