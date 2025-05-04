/**
 * Spoonacular API integration
 * 
 * Note: To use this, you'll need a Spoonacular API key:
 * 1. Sign up at https://spoonacular.com/food-api
 * 2. Get your API key
 * 3. Set it as an environment variable SPOONACULAR_API_KEY
 */

// Mock API key - replace with a real API key or environment variable
const API_KEY = process.env.SPOONACULAR_API_KEY || '';

/**
 * Search for recipes using Spoonacular API
 */
export async function searchSpoonacularRecipes(query, options = {}) {
  const params = new URLSearchParams({
    apiKey: API_KEY,
    query: query,
    number: options.limit || 5,
    ...options
  });
  
  try {
    const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?${params}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.results;
  } catch (err) {
    console.error(`Spoonacular search error: ${err.message}`);
    throw err;
  }
}

/**
 * Get recipe information from Spoonacular API
 */
export async function getSpoonacularRecipe(id) {
  const params = new URLSearchParams({
    apiKey: API_KEY,
    includeNutrition: false
  });
  
  try {
    const response = await fetch(`https://api.spoonacular.com/recipes/${id}/information?${params}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Convert to our recipe format
    return {
      title: data.title,
      description: data.summary.replace(/<[^>]*>/g, ''), // Strip HTML tags
      ingredients: data.extendedIngredients.map(ing => ing.original),
      instructions: data.instructions?.replace(/<[^>]*>/g, '') || 'No instructions available',
      source_url: data.sourceUrl,
      source_name: data.sourceName || 'Spoonacular',
      recipe_type: data.dishTypes?.length > 0 ? data.dishTypes[0] : '',
      cuisine_type: data.cuisines?.length > 0 ? data.cuisines[0] : '',
      image_url: data.image
    };
  } catch (err) {
    console.error(`Spoonacular recipe error: ${err.message}`);
    throw err;
  }
}

/**
 * Import random recipes from Spoonacular
 */
export async function getRandomRecipes(count = 3, tags = '') {
  const params = new URLSearchParams({
    apiKey: API_KEY,
    number: count,
    tags: tags
  });
  
  try {
    const response = await fetch(`https://api.spoonacular.com/recipes/random?${params}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return data.recipes.map(recipe => ({
      title: recipe.title,
      description: recipe.summary.replace(/<[^>]*>/g, ''), // Strip HTML tags
      ingredients: recipe.extendedIngredients.map(ing => ing.original),
      instructions: recipe.instructions?.replace(/<[^>]*>/g, '') || 'No instructions available',
      source_url: recipe.sourceUrl,
      source_name: recipe.sourceName || 'Spoonacular',
      recipe_type: recipe.dishTypes?.length > 0 ? recipe.dishTypes[0] : '',
      cuisine_type: recipe.cuisines?.length > 0 ? recipe.cuisines[0] : '',
      image_url: recipe.image
    }));
  } catch (err) {
    console.error(`Spoonacular random recipes error: ${err.message}`);
    throw err;
  }
}
