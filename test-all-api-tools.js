// test-all-api-tools.js - Test all the API tools directly
// This will simulate what the MCP tools would do, but in a standalone environment
// Run with: node test-all-api-tools.js

// Import the SpoonacularAPI class
import { SpoonacularAPI } from './js-recipe-server/spoonacular.js';

// Create an instance with our hardcoded API key
const api = new SpoonacularAPI('0cf38d15103942e2a6960f456809aece');

// Helper function for formatted output
const formatOutput = (title, data) => {
  console.log(`\n===== ${title} =====`);
  console.log(JSON.stringify(data, null, 2).substring(0, 1000) + '...');
  console.log('');
};

// Simulate each API tool
async function runTests() {
  try {
    console.log('\n========== API TOOLS TEST SUITE ==========');
    console.log(`Running at: ${new Date().toISOString()}`);
    console.log(`Node.js version: ${process.version}`);
    
    // 1. Test API connectivity (test-api tool)
    console.log('\n----- Test: API Connectivity -----');
    try {
      const searchResult = await api.searchRecipes('pasta', 1);
      console.log('✅ API connectivity test passed');
      console.log(`Found ${searchResult.length} results`);
    } catch (error) {
      console.error('❌ API connectivity test failed:', error.message);
    }
    
    // 2. Test search (search-spoonacular tool)
    console.log('\n----- Test: Search Spoonacular -----');
    try {
      const searchResults = await api.searchRecipes('chocolate cake', 3);
      formatOutput('Search Results', searchResults);
      console.log('✅ Search test passed');
    } catch (error) {
      console.error('❌ Search test failed:', error.message);
    }
    
    // 3. Test get recipe by ID (get-spoonacular-recipe tool)
    console.log('\n----- Test: Get Recipe Details -----');
    try {
      const recipeDetails = await api.getRecipe(716429);
      formatOutput('Recipe Details', recipeDetails);
      console.log('✅ Get recipe details test passed');
    } catch (error) {
      console.error('❌ Get recipe details test failed:', error.message);
    }
    
    // 4. Test random recipes (get-random-recipes tool)
    console.log('\n----- Test: Random Recipes -----');
    try {
      const randomRecipes = await api.getRandomRecipes(2, 'dessert');
      formatOutput('Random Dessert Recipes', randomRecipes);
      console.log('✅ Random recipes test passed');
    } catch (error) {
      console.error('❌ Random recipes test failed:', error.message);
    }
    
    // 5. Test recipe formatting (used by import-spoonacular-recipe tool)
    console.log('\n----- Test: Format Recipe for DB -----');
    try {
      const recipe = await api.getRecipe(716429);
      const formatted = api.formatRecipeForDb(recipe);
      formatOutput('Formatted Recipe', formatted);
      console.log('✅ Format recipe test passed');
    } catch (error) {
      console.error('❌ Format recipe test failed:', error.message);
    }
    
    console.log('\n========== TEST SUITE COMPLETE ==========');
  } catch (error) {
    console.error('Test suite failed with error:', error);
  }
}

// Run all tests
runTests().catch(console.error);
