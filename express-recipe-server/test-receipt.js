// Script to test the receipt processing functionality

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import processReceiptImage from './services/ocr/receiptProcessor.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to an example receipt image
// You can replace this with your own test image
const testImagePath = process.argv[2] || join(__dirname, 'test-data', 'sample-receipt.jpg');

// Function to test receipt processing
async function testReceiptProcessing() {
  try {
    console.log(`Testing receipt processing for image: ${testImagePath}`);
    
    // Check if the file exists
    try {
      await fs.access(testImagePath);
      console.log('Test file exists, proceeding...');
    } catch (error) {
      console.error(`Test file does not exist at path: ${testImagePath}`);
      console.error('Please provide a valid path to a receipt image.');
      return;
    }
    
    // Process the image
    console.log('Processing receipt image...');
    const items = await processReceiptImage(testImagePath);
    
    // Log results
    console.log('\nExtracted items:');
    console.log(JSON.stringify(items, null, 2));
    console.log(`\nTotal items extracted: ${items.length}`);
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
testReceiptProcessing();
