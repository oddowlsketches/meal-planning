// spoonacular.js - Security-enhanced version
// Using environment variables for sensitive data

// Detailed logging function
function log(...args) {
  console.error('[SPOONACULAR]', ...args);
}

class SpoonacularAPI {
  constructor(apiKey) {
    // Use provided API key or fall back to environment variable
    this.apiKey = apiKey || process.env.SPOONACULAR_API_KEY;
    this.baseUrl = 'https://api.spoonacular.com';
    
    // Log initialization without showing the full key
    if (this.apiKey) {
      const keyPrefix = this.apiKey.substring(0, 5);
      log(`Spoonacular API initialized with key ${keyPrefix}...`);
    } else {
      log('Spoonacular API initialized without API key');
    }
  }
  
  // Check if API is configured with a valid key
  isConfigured() {
    return Boolean(this.apiKey);
  }
  
  // Search recipes with improved error handling
  async searchRecipes(query, limit = 10) {
    try {
      if (!this.isConfigured()) {
        throw new Error('API key not configured');
      }
      
      log(`Searching Spoonacular for: "${query}" (limit: ${limit})`);
      
      // Use simple URL construction 
      const url = `${this.baseUrl}/recipes/complexSearch?apiKey=${this.apiKey}&query=${encodeURIComponent(query)}&number=${limit}`;
      log(`Making request to ${url.replace(this.apiKey, 'API_KEY_HIDDEN')}`);
      
      // Use native fetch 
      const response = await fetch(url);
      log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        log(`Error response: ${errorText}`);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      log(`Successfully retrieved data: ${JSON.stringify(data).substring(0, 100)}...`);
      
      // Process results
      const results = data.results || [];
      log(`Found ${results.length} recipes`);
      
      return results;
    } catch (error) {
      log(`Search error: ${error.message}`);
      throw error;
    }
  }
  
  // Get recipe details
  async getRecipe(id) {
    try {
      if (!this.isConfigured()) {
        throw new Error('API key not configured');
      }
      
      log(`Getting Spoonacular recipe with ID: ${id}`);
      
      // Simplified URL construction
      const url = `${this.baseUrl}/recipes/${id}/information?apiKey=${this.apiKey}&includeNutrition=false`;
      log(`Making request to ${url.replace(this.apiKey, 'API_KEY_HIDDEN')}`);
      
      // Native fetch
      const response = await fetch(url);
      log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        log(`Error response: ${errorText}`);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      log(`Successfully retrieved recipe data`);
      
      return data;
    } catch (error) {
      log(`Get recipe error: ${error.message}`);
      throw error;
    }
  }
  
  // Get random recipes
  async getRandomRecipes(count = 1, tags = "") {
    try {
      if (!this.isConfigured()) {
        throw new Error('API key not configured');
      }
      
      log(`Getting ${count} random recipes with tags: ${tags || "none"}`);
      
      // Simplified URL construction
      const url = `${this.baseUrl}/recipes/random?apiKey=${this.apiKey}&number=${count}${tags ? `&tags=${encodeURIComponent(tags)}` : ''}`;
      log(`Making request to ${url.replace(this.apiKey, 'API_KEY_HIDDEN')}`);
      
      // Native fetch
      const response = await fetch(url);
      log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        log(`Error response: ${errorText}`);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      log(`Successfully retrieved ${data.recipes ? data.recipes.length : 0} random recipes`);
      
      return data.recipes || [];
    } catch (error) {
      log(`Random recipes error: ${error.message}`);
      throw error;
    }
  }
  
  // Format Spoonacular recipe for our database
  formatRecipeForDb(spoonacularRecipe) {
    // Handle missing data safely
    if (!spoonacularRecipe) {
      log('Warning: Null recipe data provided to formatRecipeForDb');
      return {
        title: 'Unknown Recipe',
        source: 'Spoonacular',
        ingredients: [],
        instructions: []
      };
    }
    
    // Extract ingredients
    let ingredients = [];
    try {
      if (spoonacularRecipe.extendedIngredients && Array.isArray(spoonacularRecipe.extendedIngredients)) {
        ingredients = spoonacularRecipe.extendedIngredients.map(ing => 
          `${ing.amount || ''} ${ing.unit || ''} ${ing.name || ''}`.trim()
        );
      }
    } catch (err) {
      log(`Error formatting ingredients: ${err.message}`);
    }
    
    // Extract instructions
    let instructions = [];
    try {
      if (spoonacularRecipe.analyzedInstructions && 
          spoonacularRecipe.analyzedInstructions.length > 0 && 
          spoonacularRecipe.analyzedInstructions[0].steps) {
        instructions = spoonacularRecipe.analyzedInstructions[0].steps.map(step => step.step);
      } else if (spoonacularRecipe.instructions) {
        // Split on periods and newlines
        instructions = spoonacularRecipe.instructions
          .split(/\.\s+|\n+/)
          .filter(step => step.trim().length > 0)
          .map(step => step.trim() + (step.endsWith('.') ? '' : '.'));
      }
    } catch (err) {
      log(`Error formatting instructions: ${err.message}`);
    }
    
    return {
      title: spoonacularRecipe.title || 'Unknown Recipe',
      source: 'Spoonacular',
      source_url: spoonacularRecipe.sourceUrl || '',
      description: spoonacularRecipe.summary || '',
      cook_time: `${spoonacularRecipe.readyInMinutes || 0} minutes`,
      ingredients,
      instructions,
      image_url: spoonacularRecipe.image || '',
      dietary_info: (spoonacularRecipe.diets && Array.isArray(spoonacularRecipe.diets)) 
        ? spoonacularRecipe.diets.join(', ') 
        : null,
      cuisine_type: (spoonacularRecipe.cuisines && Array.isArray(spoonacularRecipe.cuisines)) 
        ? spoonacularRecipe.cuisines.join(', ') 
        : null,
      recipe_type: (spoonacularRecipe.dishTypes && Array.isArray(spoonacularRecipe.dishTypes)) 
        ? spoonacularRecipe.dishTypes.join(', ') 
        : null
    };
  }
}

export { SpoonacularAPI };
