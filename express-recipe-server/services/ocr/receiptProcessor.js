/**
 * Receipt Processing Service
 * Uses OCR to extract items from receipt images
 */

import { createWorker } from 'tesseract.js';
import fs from 'fs';
import path from 'path';

/**
 * Process a receipt image to extract food items
 * @param {string} imagePath - Path to the receipt image file
 * @returns {Promise<Array>} - Array of extracted pantry items
 */
export const processReceiptImage = async (imagePath) => {
  try {
    console.log(`Starting OCR processing for image: ${imagePath}`);
    console.log(`File exists check: ${fs.existsSync(imagePath)}`);
    
    // Initialize Tesseract worker
    console.log('Initializing OCR worker...');
    let worker;
    try {
      worker = await createWorker('eng');
      console.log('OCR worker initialized successfully');
    } catch (workerError) {
      console.error('Failed to initialize OCR worker:', workerError);
      console.error('OCR worker error stack:', workerError.stack);
      throw new Error(`Tesseract initialization failed: ${workerError.message}`);
    }
    
    // Recognize text in the image
    console.log('Beginning text recognition...');
    const { data: { text } } = await worker.recognize(imagePath);
    console.log('Text extraction complete, extracted text length:', text.length);
    console.log('First 100 chars of extracted text:', text.substring(0, 100));
    
    // Terminate the worker
    await worker.terminate();
    console.log('OCR worker terminated');
    
    // Process the extracted text to identify food items
    return extractFoodItems(text);
  } catch (error) {
    console.error('Receipt processing detailed error:', error);
    console.error('Error stack:', error.stack);
    throw new Error(`Failed to process receipt: ${error.message}`);
  }
};

/**
 * Extract food items from receipt text
 * @param {string} text - OCR extracted text
 * @returns {Array} - Array of identified food items with quantities and units
 */
export const extractFoodItems = (text) => {
  // Split text into lines
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  // Regular expressions for identifying food items and quantities
  const itemRegex = /([\w\s]+)\s+([0-9.]+)\s*([a-zA-Z]{1,4})?/; 
  const priceRegex = /\$\s*([0-9.]+)/;
  
  const items = [];
  
  for (const line of lines) {
    const lineText = line.trim();
    
    // Skip likely non-item lines
    if (lineText.toLowerCase().includes('receipt') || 
        lineText.toLowerCase().includes('total') ||
        lineText.toLowerCase().includes('subtotal') ||
        lineText.toLowerCase().includes('tax') ||
        lineText.toLowerCase().includes('change') ||
        lineText.toLowerCase().includes('balance') ||
        lineText.toLowerCase().includes('payment') ||
        lineText.toLowerCase().includes('credit card') ||
        lineText.toLowerCase().includes('cash') ||
        lineText.match(/^\d+\/\d+\/\d+/) // Date format
       ) {
      continue;
    }
    
    // Perform naive pattern matching for an item
    const itemMatch = lineText.match(itemRegex);
    const priceMatch = lineText.match(priceRegex);
    
    if (itemMatch && priceMatch) {
      let [_, itemName, quantity, unit] = itemMatch;
      
      // Clean up item name
      itemName = itemName.trim()
        .replace(/\b[A-Z]{2,}\b/g, '') // Remove all caps words (likely store codes)
        .replace(/^\d+\s*/, '') // Remove leading numbers
        .trim();
      
      // Skip if item name doesn't seem like a food item
      if (itemName.length < 2) continue;
      
      const parsedQuantity = parseFloat(quantity);
      
      // If we have a reasonable item, add it
      if (itemName && !isNaN(parsedQuantity)) {
        const pantryItem = {
          name: itemName,
          quantity: parsedQuantity,
          unit: unit || 'ea', // Default unit if none specified
          category: categorizeItem(itemName)
        };
        
        items.push(pantryItem);
      }
    }
  }
  
  // If basic extraction fails, use AI-based extraction for each line
  if (items.length === 0) {
    // For demonstration purposes, extract some likely food items
    return intelligentExtraction(text);
  }
  
  return items;
};

/**
 * Intelligently extract food items when pattern matching fails
 * (This would ideally use an AI model or more sophisticated parser)
 */
const intelligentExtraction = (text) => {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const items = [];
  
  // Simple heuristic: look for lines with common food words and extract those
  const foodKeywords = ['apple', 'banana', 'milk', 'bread', 'eggs', 'cheese', 'chicken', 
                         'beef', 'rice', 'pasta', 'tomato', 'onion', 'potato', 'cereal',
                         'yogurt', 'butter'];
  
  for (const line of lines) {
    // Skip short lines
    if (line.length < 4) continue;
    
    // Check if any food keyword appears in the line
    const matchedKeyword = foodKeywords.find(keyword => 
      line.toLowerCase().includes(keyword)
    );
    
    if (matchedKeyword) {
      // Extract the portion of the line that likely contains the item name
      let itemName = line.trim();
      
      // Remove price if present
      itemName = itemName.replace(/\$\s*[0-9.]+/, '').trim();
      
      // Add the item with estimated values
      items.push({
        name: itemName,
        quantity: 1, // Default quantity
        unit: 'ea',  // Default unit
        category: categorizeItem(itemName)
      });
    }
  }
  
  return items;
};

/**
 * Categorize food items
 * @param {string} itemName - Name of the food item
 * @returns {string} - Category name
 */
const categorizeItem = (itemName) => {
  const lowerName = itemName.toLowerCase();
  
  // Define categories with associated keywords
  const categories = {
    'Produce': ['apple', 'banana', 'lettuce', 'tomato', 'onion', 'potato', 'carrot', 'broccoli', 'spinach', 'fruit', 'vegetable'],
    'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg'],
    'Meat': ['chicken', 'beef', 'pork', 'turkey', 'ham', 'steak', 'meat'],
    'Seafood': ['fish', 'shrimp', 'salmon', 'tuna', 'crab', 'lobster'],
    'Grains': ['bread', 'rice', 'pasta', 'cereal', 'oat', 'flour', 'grain'],
    'Canned Goods': ['can', 'soup', 'beans', 'tomato sauce'],
    'Frozen': ['frozen', 'ice cream'],
    'Snacks': ['chip', 'cookie', 'snack', 'cracker', 'pretzel'],
    'Beverages': ['juice', 'soda', 'water', 'coffee', 'tea', 'drink'],
    'Condiments': ['sauce', 'ketchup', 'mustard', 'dressing', 'mayonnaise', 'oil', 'vinegar'],
    'Spices': ['spice', 'herb', 'salt', 'pepper', 'seasoning']
  };
  
  // Find matching category
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return category;
    }
  }
  
  // Default category
  return 'Other';
};

export default { processReceiptImage, extractFoodItems, categorizeItem };