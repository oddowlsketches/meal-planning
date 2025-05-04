import { scrape101Cookbooks } from './101cookbooks.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(dirname(__dirname), 'screenshots');
try {
  await fs.mkdir(screenshotsDir, { recursive: true });
  console.error(`Screenshots directory at: ${screenshotsDir}`);
} catch (err) {
  console.error(`Error with screenshots directory: ${err.message}`);
}

/**
 * Main recipe scraping function that routes to the appropriate scraper
 */
export async function scrapeRecipe(url) {
  try {
    // Normalize the URL
    const normalizedUrl = url.toLowerCase();
    
    // Route to the appropriate scraper based on URL
    if (normalizedUrl.includes('101cookbooks.com')) {
      console.error('Using 101cookbooks scraper');
      return await scrape101Cookbooks(url);
    }
    
    // Add more site-specific scrapers as needed
    // else if (normalizedUrl.includes('smittenkitchen.com')) {
    //   return await scrapeSmittenKitchen(url);
    // }
    
    // Fallback message for unsupported sites
    throw new Error(`No specific scraper available for: ${url}. Currently supporting: 101cookbooks.com`);
    
  } catch (err) {
    console.error(`Scraping error: ${err.message}`);
    throw err;
  }
}
