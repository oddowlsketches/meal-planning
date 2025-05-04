// scraper.js
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// Get the directory name using fileURLToPath
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detailed logging function
function log(...args) {
  console.error('[SCRAPER]', ...args);
}

// Ensure screenshots directory exists
async function ensureScreenshotDir() {
  const screenshotDir = path.join(__dirname, 'screenshots');
  try {
    await fs.mkdir(screenshotDir, { recursive: true });
    return screenshotDir;
  } catch (error) {
    log("Error creating screenshots directory:", error);
    return __dirname;
  }
}

class RecipeScraper {
  constructor() {
    this.browser = null;
  }
  
  async initBrowser() {
    if (this.browser) return this.browser;
    
    this.browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    return this.browser;
  }
  
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
  
  // Main scrape function
  async scrapeRecipe(url) {
    const screenshotDir = await ensureScreenshotDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const urlHostname = new URL(url).hostname.replace(/[^a-z0-9]/gi, '-');
    const screenshotPath = path.join(screenshotDir, `${urlHostname}-${timestamp}.png`);
    
    try {
      log(`Scraping recipe from: ${url}`);
      await this.initBrowser();
      
      const page = await this.browser.newPage();
      await page.setViewport({ width: 1280, height: 1200 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Navigate to URL
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Take screenshot for debugging
      await page.screenshot({ path: screenshotPath, fullPage: true });
      log(`Screenshot saved to: ${screenshotPath}`);
      
      // Determine which scraper to use based on hostname
      const hostname = new URL(url).hostname;
      
      let recipe;
      if (hostname.includes('101cookbooks.com')) {
        recipe = await this.scrape101Cookbooks(page, url);
      } else if (hostname.includes('smittenkitchen.com')) {
        recipe = await this.scrapeSmittenKitchen(page, url);
      } else {
        // Generic scraper for other sites
        recipe = await this.scrapeGeneric(page, url);
      }
      
      return recipe;
    } catch (error) {
      log('Error scraping recipe:', error);
      throw new Error(`Failed to scrape recipe: ${error.message}`);
    } finally {
      await this.closeBrowser();
    }
  }
  
  // Site-specific scraper for 101 Cookbooks
  async scrape101Cookbooks(page, url) {
    try {
      // Extract title
      const title = await page.$eval('h1.entry-title', el => el.textContent.trim())
        .catch(() => 'Unknown Title');
        
      // Extract description
      const description = await page.$eval('.entry-content p:first-of-type', el => el.textContent.trim())
        .catch(() => '');
        
      // Extract ingredients
      const ingredients = await page.$$eval('.wprm-recipe-ingredient', 
        elements => elements.map(el => el.textContent.trim())
      ).catch(() => []);
      
      // Extract instructions
      const instructionsArray = await page.$$eval('.wprm-recipe-instruction-text', 
        elements => elements.map(el => el.textContent.trim())
      ).catch(() => []);
      
      // Try to get cook time
      const cookTime = await page.$eval('.wprm-recipe-total-time-container', el => el.textContent.trim())
        .catch(() => null);
      
      return {
        title,
        description,
        ingredients,
        instructions: instructionsArray,
        cook_time: cookTime,
        source: '101 Cookbooks',
        source_url: url,
        recipe_type: null,
        cuisine_type: null
      };
    } catch (error) {
      log('Error in 101 Cookbooks scraper:', error);
      throw error;
    }
  }
  
  // Site-specific scraper for Smitten Kitchen
  async scrapeSmittenKitchen(page, url) {
    try {
      // Extract title
      const title = await page.$eval('h1.entry-title', el => el.textContent.trim())
        .catch(() => 'Unknown Title');
        
      // Extract description
      const description = await page.$eval('.entry-content > p:first-of-type', el => el.textContent.trim())
        .catch(() => '');
        
      // Extract ingredients
      const ingredients = await page.$$eval('.jetpack-recipe-ingredient', 
        elements => elements.map(el => el.textContent.trim())
      ).catch(() => []);
      
      // Extract instructions as an array of steps
      const instructionsText = await page.$eval('.jetpack-recipe-directions', el => el.textContent.trim())
        .catch(() => '');
        
      // Split instructions into an array using periods and newlines
      const instructionsArray = instructionsText
        .split(/\.\s+|\n+/)
        .filter(step => step.trim().length > 0)
        .map(step => step.trim() + (step.endsWith('.') ? '' : '.'));
      
      return {
        title,
        description,
        ingredients,
        instructions: instructionsArray,
        source: 'Smitten Kitchen',
        source_url: url,
        recipe_type: null, 
        cuisine_type: null
      };
    } catch (error) {
      log('Error in Smitten Kitchen scraper:', error);
      throw error;
    }
  }
  
  // Generic scraper for other sites
  async scrapeGeneric(page, url) {
    try {
      // Extract title - try multiple selectors
      const titleSelectors = [
        'h1.recipe-title', 
        'h1.entry-title', 
        'h1[itemprop="name"]',
        'h1'
      ];
      
      let title = 'Unknown Title';
      for (const selector of titleSelectors) {
        try {
          title = await page.$eval(selector, el => el.textContent.trim());
          if (title) break;
        } catch (e) {
          // Continue to next selector
        }
      }
      
      // Extract description - try multiple selectors
      const descSelectors = [
        '.recipe-description', 
        '.summary', 
        '[itemprop="description"]',
        '.entry-content p:first-of-type'
      ];
      
      let description = '';
      for (const selector of descSelectors) {
        try {
          description = await page.$eval(selector, el => el.textContent.trim());
          if (description) break;
        } catch (e) {
          // Continue to next selector
        }
      }
      
      // Extract ingredients - try multiple selectors
      const ingredientSelectors = [
        '.ingredients li', 
        '.recipe-ingredients li', 
        '[itemprop="recipeIngredient"]',
        '.ingredient'
      ];
      
      let ingredients = [];
      for (const selector of ingredientSelectors) {
        try {
          ingredients = await page.$$eval(selector, elements => 
            elements.map(el => el.textContent.trim())
          );
          if (ingredients.length > 0) break;
        } catch (e) {
          // Continue to next selector
        }
      }
      
      // Extract instructions - try multiple selectors
      const instructionSelectors = [
        '.instructions', 
        '.recipe-instructions', 
        '[itemprop="recipeInstructions"]',
        '.directions'
      ];
      
      let instructionsText = '';
      for (const selector of instructionSelectors) {
        try {
          instructionsText = await page.$eval(selector, el => el.textContent.trim());
          if (instructionsText) break;
        } catch (e) {
          // Continue to next selector
        }
      }
      
      // Split instructions into an array
      const instructionsArray = instructionsText
        .split(/\.\s+|\n+/)
        .filter(step => step.trim().length > 0)
        .map(step => step.trim() + (step.endsWith('.') ? '' : '.'));
      
      const hostName = new URL(url).hostname.replace('www.', '');
      
      return {
        title,
        description,
        ingredients,
        instructions: instructionsArray,
        source: hostName,
        source_url: url,
        recipe_type: null,
        cuisine_type: null
      };
    } catch (error) {
      log('Error in generic scraper:', error);
      throw error;
    }
  }
}

export { RecipeScraper };
