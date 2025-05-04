import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
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
} catch (err) {
  console.error(`Error with screenshots directory: ${err.message}`);
}

/**
 * Scraper specifically designed for 101cookbooks.com
 */
export async function scrape101Cookbooks(url) {
  if (!url.includes('101cookbooks.com')) {
    throw new Error('This scraper only works with 101cookbooks.com URLs');
  }
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({ width: 1280, height: 1200 });
    
    // Navigate to the URL
    console.error(`Navigating to ${url}`);
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Take a screenshot for debugging
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(screenshotsDir, `101cookbooks-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.error(`Screenshot saved to: ${screenshotPath}`);
    
    // Wait for recipe content to load
    await page.waitForSelector('.entry-content', { timeout: 10000 });
    
    // Get the page content
    const content = await page.content();
    
    // Load content into cheerio
    const $ = cheerio.load(content);
    
    // Extract title
    const title = $('.entry-title').text().trim();
    console.error(`Title found: ${title}`);
    
    // Extract ingredients
    const ingredients = [];
    
    // Try to find ingredients using various selectors that might be present
    ['.ingredient', '.ingredients li', '.entry-content ul li'].forEach(selector => {
      if (ingredients.length === 0) {
        $(selector).each((i, el) => {
          const text = $(el).text().trim();
          // Only include reasonably sized text that looks like an ingredient
          if (text && text.length > 3 && text.length < 200 && !text.includes('http')) {
            ingredients.push(text);
          }
        });
      }
    });
    
    console.error(`Ingredients found: ${ingredients.length}`);
    
    // If no structured ingredients found, try to extract from paragraphs
    if (ingredients.length === 0) {
      $('.entry-content p').each((i, el) => {
        const text = $(el).text().trim();
        if (text.toLowerCase().includes('ingredient') && text.length < 500) {
          // Split paragraph by line breaks and common separators
          const lines = text.split(/[\n\r,;]+/);
          lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed && trimmed.length > 3 && trimmed.length < 100) {
              ingredients.push(trimmed);
            }
          });
        }
      });
    }
    
    // Extract instructions
    let instructions = '';
    
    // Try to find instructions in ordered lists
    $('.entry-content ol li').each((i, el) => {
      instructions += `${i+1}. ${$(el).text().trim()}\n`;
    });
    
    // If no structured instructions found, extract from paragraphs
    if (!instructions) {
      $('.entry-content p').each((i, el) => {
        const text = $(el).text().trim();
        // Skip very short paragraphs and those that look like metadata
        if (text && text.length > 40 && 
            !text.toLowerCase().includes('print') && 
            !text.includes('©') && 
            !text.includes('subscribe')) {
          instructions += text + '\n\n';
        }
      });
    }
    
    console.error(`Instructions found: ${instructions.length > 0}`);
    
    // Try to extract description
    let description = '';
    $('.entry-content p').slice(0, 2).each((i, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 30 && text.length < 500) {
        description = text;
        return false; // Break after finding first good paragraph
      }
    });
    
    // If no good description, use the meta description
    if (!description) {
      description = $('meta[name="description"]').attr('content') || '';
    }
    
    // Determine recipe type and cuisine
    let recipeType = '';
    let cuisineType = '';
    
    // Look for cuisine keywords in the title and content
    const cuisines = ['italian', 'mexican', 'asian', 'chinese', 'japanese', 'indian', 'thai', 
                     'mediterranean', 'french', 'greek', 'spanish', 'middle eastern'];
    
    cuisines.forEach(cuisine => {
      if (title.toLowerCase().includes(cuisine) || 
          description.toLowerCase().includes(cuisine)) {
        cuisineType = cuisine.charAt(0).toUpperCase() + cuisine.slice(1);
      }
    });
    
    // Look for recipe type keywords
    const types = {
      'soup': 'soup',
      'salad': 'salad',
      'pasta': 'main course',
      'dessert': 'dessert',
      'cake': 'dessert',
      'cookie': 'dessert',
      'breakfast': 'breakfast',
      'dinner': 'main course',
      'side': 'side dish'
    };
    
    Object.entries(types).forEach(([keyword, type]) => {
      if (title.toLowerCase().includes(keyword)) {
        recipeType = type;
      }
    });
    
    return {
      title: title || "101 Cookbooks Recipe",
      description: description,
      ingredients: ingredients.length > 0 ? ingredients : ["Ingredients could not be extracted automatically."],
      instructions: instructions || "Instructions could not be extracted automatically.",
      source_url: url,
      source_name: "101 Cookbooks",
      recipe_type: recipeType,
      cuisine_type: cuisineType
    };
    
  } catch (err) {
    console.error(`Error scraping 101 Cookbooks recipe: ${err.message}`);
    throw new Error(`Failed to scrape 101 Cookbooks recipe: ${err.message}`);
  } finally {
    await browser.close();
  }
}
