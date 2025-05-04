import { searchSpoonacularRecipes, getSpoonacularRecipe, getRandomRecipes } from './spoonacular.js';

export {
  searchSpoonacularRecipes,
  getSpoonacularRecipe,
  getRandomRecipes
};

// Add a check for the API key
export function checkSpoonacularApiKey() {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  
  if (!apiKey) {
    console.error('WARNING: No Spoonacular API key found. API functions will not work properly.');
    console.error('To use Spoonacular API, you need to:');
    console.error('1. Sign up at https://spoonacular.com/food-api');
    console.error('2. Get your API key');
    console.error('3. Set it as an environment variable SPOONACULAR_API_KEY');
    console.error('Example: export SPOONACULAR_API_KEY=yourapikey123');
    return false;
  }
  
  return true;
}
