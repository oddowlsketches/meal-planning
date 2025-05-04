/**
 * Service to integrate with the MCP recipe server
 * This allows the React app to access the same database and functionality 
 * that Claude uses through the MCP protocol
 */

// Configure the base URL of your MCP server's API endpoint
// By default, we'll use an Express server running on port 3001
const API_BASE_URL = process.env.REACT_APP_MCP_API_URL || 'http://localhost:3001/api';

/**
 * Scrape and import a recipe from a URL
 * @param {string} url - URL of the recipe to scrape
 * @returns {Promise<Object>} - The imported recipe data
 */
export const scrapeAndImportRecipe = async (url) => {
  try {
    const response = await fetch(`${API_BASE_URL}/recipes/scrape-and-save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to import recipe (Status: ${response.status})`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error scraping recipe:', error);
    throw error;
  }
};

/**
 * Scrape a recipe URL for preview (without saving)
 * @param {string} url - URL of the recipe to scrape
 * @returns {Promise<Object>} - The scraped recipe data
 */
export const scrapeRecipePreview = async (url) => {
  try {
    const response = await fetch(`${API_BASE_URL}/recipes/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to scrape recipe (Status: ${response.status})`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error scraping recipe preview:', error);
    throw error;
  }
};

/**
 * Check if the MCP server is available
 * @returns {Promise<boolean>} - True if the server is available
 */
export const checkMcpServerStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/status`, { 
      method: 'GET',
      timeout: 3000 // 3 second timeout
    });
    return response.ok;
  } catch (error) {
    console.error('Error checking MCP server status:', error);
    return false;
  }
};
