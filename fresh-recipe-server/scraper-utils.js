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
const screenshotsDir = path.join(__dirname, 'screenshots');
try {
  await fs.mkdir(screenshotsDir, { recursive: true });
  console.error(`Screenshots directory created at: ${screenshotsDir}`);
} catch (err) {
  console.error(`Error creating screenshots directory: ${err.message}`);
}

/**
 * Main function to scrape recipe from a URL
 */
export async function scrapeRecipe(url) {
  console.error(`Starting to scrape: ${url}`);
  
  // Determine which scraper to use based on the URL
  if (url.includes('101cookbooks.com')) {
    return await scrape101Cookbooks(url);
  } else if (url.includes('cooking.nytimes.com')) {
    return await scrapeNYTimesCooking(url);
  } else if (url.includes('smittenkitchen.com')) {
    return await scrapeSmittenKitchen(url);
  } else {
    // Generic scraper for other sites
    return await scrapeGeneric(url);
  }
}

/**
 * Generic recipe scraper with fallback mechanisms
 */
async function scrapeGeneric(url) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Set a timeout for navigation
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Take a screenshot for debugging
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(screenshotsDir, `generic-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.error(`Screenshot saved to: ${screenshotPath}`);
    
    // Get the HTML content
    const content = await page.content();
    const $ = cheerio.load(content);
    
    // Try to find recipe data using schema.org metadata
    const jsonLdScript = $('script[type="application/ld+json"]').html();
    if (jsonLdScript) {
      try {
        const jsonLd = JSON.parse(jsonLdScript);
        
        // Handle array of scripts
        const recipeData = Array.isArray(jsonLd) 
          ? jsonLd.find(item => item['@type'] === 'Recipe') 
          : (jsonLd['@type'] === 'Recipe' ? jsonLd : null);
        
        if (recipeData) {
          console.error('Found recipe data in JSON-LD');
          return extractRecipeFromJsonLd(recipeData, url);
        }
      } catch (err) {
        console.error(`Error parsing JSON-LD: ${err.message}`);
      }
    }
    
    // If JSON-LD doesn't work, try to find recipe data using common HTML structures
    console.error('Trying to extract recipe from HTML structure');
    
    // Look for recipe title
    const title = $('h1').first().text().trim() || 
                 $('title').text().split('|')[0].trim() || 
                 'Unknown Recipe';
    
    // Look for ingredients
    let ingredients = [];
    $('ul li').each((i, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 3 && text.length < 100) {
        ingredients.push(text);
      }
    });
    
    // Look for instructions
    let instructions = '';
    $('ol li').each((i, el) => {
      instructions += (i + 1) + '. ' + $(el).text().trim() + '\\n';
    });
    
    if (!instructions) {
      $('.instructions, .recipe-instructions, .directions, .method')
        .find('p, div')
        .each((i, el) => {
          const text = $(el).text().trim();
          if (text) {
            instructions += text + '\\n';
          }
        });
    }
    
    // Extract host as source name
    const hostname = new URL(url).hostname.replace('www.', '');
    const sourceName = hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1);
    
    return {
      title,
      description: $('meta[name="description"]').attr('content') || '',
      ingredients,
      instructions: instructions || 'Instructions could not be extracted automatically.',
      source_url: url,
      source_name: sourceName,
      recipe_type: '',
      cuisine_type: ''
    };
    
  } catch (err) {
    console.error(`Error scraping generic recipe: ${err.message}`);
    throw new Error(`Failed to scrape recipe: ${err.message}`);
  } finally {
    await browser.close();
  }
}

/**
 * 101 Cookbooks scraper
 */
async function scrape101Cookbooks(url) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Set a timeout for navigation
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Take a screenshot for debugging
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(screenshotsDir, `101cookbooks-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.error(`Screenshot saved to: ${screenshotPath}`);
    
    // Get the HTML content
    const content = await page.content();
    const $ = cheerio.load(content);
    
    // Extract recipe data
    const title = $('.entry-title').text().trim();
    
    // Extract recipe description
    let description = $('.recipe-description').text().trim();
    if (!description) {
      description = $('.entry-content p').first().text().trim();
    }
    
    // Extract ingredients
    const ingredients = [];
    $('.ingredient').each((i, el) => {
      ingredients.push($(el).text().trim());
    });
    
    // If no ingredients found with the class, try looking for ul li
    if (ingredients.length === 0) {
      $('.ingredients-list li').each((i, el) => {
        ingredients.push($(el).text().trim());
      });
    }
    
    // Extract instructions
    let instructions = '';
    $('.instructions li, .recipe-instructions li').each((i, el) => {
      instructions += (i + 1) + '. ' + $(el).text().trim() + '\\n';
    });
    
    // If no instructions found with the class, try looking for p tags
    if (!instructions) {
      $('.instructions, .recipe-instructions').find('p').each((i, el) => {
        const text = $(el).text().trim();
        if (text) {
          instructions += text + '\\n';
        }
      });
    }
    
    return {
      title: title || 'Unknown Recipe',
      description,
      ingredients: ingredients.length > 0 ? ingredients : ['Ingredients could not be extracted automatically.'],
      instructions: instructions || 'Instructions could not be extracted automatically.',
      source_url: url,
      source_name: '101 Cookbooks',
      recipe_type: '',
      cuisine_type: ''
    };
    
  } catch (err) {
    console.error(`Error scraping 101 Cookbooks recipe: ${err.message}`);
    throw new Error(`Failed to scrape 101 Cookbooks recipe: ${err.message}`);
  } finally {
    await browser.close();
  }
}

/**
 * NYTimes Cooking scraper
 */
async function scrapeNYTimesCooking(url) {
  // NYTimes has a paywall, we'll implement a basic version
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Set a timeout for navigation
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Take a screenshot for debugging
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(screenshotsDir, `nytimes-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.error(`Screenshot saved to: ${screenshotPath}`);
    
    // Get the HTML content
    const content = await page.content();
    const $ = cheerio.load(content);
    
    // Extract recipe data - this will be limited due to paywall
    const title = $('h1').first().text().trim();
    const description = $('.recipe-topnote p').text().trim();
    
    // Extract ingredients - may not work due to paywall
    const ingredients = [];
    $('.recipe-ingredients li').each((i, el) => {
      ingredients.push($(el).text().trim());
    });
    
    // Extract instructions - may not work due to paywall
    let instructions = '';
    $('.recipe-steps li').each((i, el) => {
      instructions += (i + 1) + '. ' + $(el).text().trim() + '\\n';
    });
    
    return {
      title: title || 'NYTimes Cooking Recipe',
      description,
      ingredients: ingredients.length > 0 ? ingredients : ['NYTimes Cooking requires a subscription to view full ingredients.'],
      instructions: instructions || 'NYTimes Cooking requires a subscription to view full instructions.',
      source_url: url,
      source_name: 'NYTimes Cooking',
      recipe_type: '',
      cuisine_type: ''
    };
    
  } catch (err) {
    console.error(`Error scraping NYTimes Cooking recipe: ${err.message}`);
    throw new Error(`Failed to scrape NYTimes Cooking recipe: ${err.message}`);
  } finally {
    await browser.close();
  }
}

/**
 * Smitten Kitchen scraper
 */
async function scrapeSmittenKitchen(url) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Set a timeout for navigation
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Take a screenshot for debugging
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(screenshotsDir, `smittenkitchen-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.error(`Screenshot saved to: ${screenshotPath}`);
    
    // Get the HTML content
    const content = await page.content();
    const $ = cheerio.load(content);
    
    // Extract recipe data
    const title = $('.entry-title').text().trim();
    
    // Extract description
    const description = $('.entry-content p').first().text().trim();
    
    // Extract ingredients
    const ingredients = [];
    $('.entry-content ul li').each((i, el) => {
      const text = $(el).text().trim();
      // Filter out non-ingredient list items
      if (text && !text.includes('http') && text.length < 200) {
        ingredients.push(text);
      }
    });
    
    // Extract instructions
    let instructions = '';
    $('.instructions, .directions, .method, .entry-content').find('p').each((i, el) => {
      const text = $(el).text().trim();
      // Skip short paragraphs that are likely not instructions
      if (text && text.length > 40 && !text.includes('Print')) {
        instructions += text + '\\n\\n';
      }
    });
    
    return {
      title: title || 'Smitten Kitchen Recipe',
      description,
      ingredients: ingredients.length > 0 ? ingredients : ['Ingredients could not be extracted automatically.'],
      instructions: instructions || 'Instructions could not be extracted automatically.',
      source_url: url,
      source_name: 'Smitten Kitchen',
      recipe_type: '',
      cuisine_type: ''
    };
    
  } catch (err) {
    console.error(`Error scraping Smitten Kitchen recipe: ${err.message}`);
    throw new Error(`Failed to scrape Smitten Kitchen recipe: ${err.message}`);
  } finally {
    await browser.close();
  }
}

/**
 * Helper function to extract recipe data from JSON-LD
 */
function extractRecipeFromJsonLd(data, url) {
  let ingredients = [];
  
  if (data.recipeIngredient && Array.isArray(data.recipeIngredient)) {
    ingredients = data.recipeIngredient;
  }
  
  let instructions = '';
  if (data.recipeInstructions) {
    if (Array.isArray(data.recipeInstructions)) {
      // Different sites have different schemas for instructions
      data.recipeInstructions.forEach((instruction, index) => {
        if (typeof instruction === 'string') {
          instructions += (index + 1) + '. ' + instruction + '\\n';
        } else if (instruction.text) {
          instructions += (index + 1) + '. ' + instruction.text + '\\n';
        } else if (instruction.itemListElement) {
          instruction.itemListElement.forEach((step, stepIndex) => {
            instructions += (stepIndex + 1) + '. ' + step.text + '\\n';
          });
        }
      });
    } else if (typeof data.recipeInstructions === 'string') {
      instructions = data.recipeInstructions;
    }
  }
  
  // Extract host as source name if not provided
  let sourceName = data.author ? (typeof data.author === 'string' ? data.author : data.author.name) : '';
  if (!sourceName) {
    const hostname = new URL(url).hostname.replace('www.', '');
    sourceName = hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1);
  }
  
  return {
    title: data.name || 'Unknown Recipe',
    description: data.description || '',
    ingredients,
    instructions: instructions || 'Instructions could not be extracted automatically.',
    source_url: url,
    source_name: sourceName,
    recipe_type: data.recipeCategory || '',
    cuisine_type: data.recipeCuisine || ''
  };
}
