// verify-env-api.js - Verify that the API still works with environment variables
import { SpoonacularAPI } from './js-recipe-server/spoonacular.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Print environment status without revealing full keys
console.log('Environment check:');
if (process.env.SPOONACULAR_API_KEY) {
  const keyStart = process.env.SPOONACULAR_API_KEY.substring(0, 5);
  console.log(`- SPOONACULAR_API_KEY: ${keyStart}... (${process.env.SPOONACULAR_API_KEY.length} chars)`);
} else {
  console.log("- SPOONACULAR_API_KEY: Not set");
}

// Create API client using environment variable
const api = new SpoonacularAPI();

// Test API endpoints
async function verifyApi() {
  console.log('\n===== VERIFICATION TEST =====');
  
  try {
    // Test 1: Check if API is configured
    console.log('\n----- Test: API Configuration -----');
    const isConfigured = api.isConfigured();
    console.log(`API configured: ${isConfigured}`);
    
    if (!isConfigured) {
      throw new Error('API not configured. Aborting test.');
    }
    
    // Test 2: Search functionality
    console.log('\n----- Test: Search Functionality -----');
    const searchResults = await api.searchRecipes('chocolate cake', 1);
    console.log(`✅ Search test passed, found ${searchResults.length} results`);
    if (searchResults.length > 0) {
      console.log(`First result: ${searchResults[0].title}`);
    }
    
    // Test 3: Recipe details functionality
    console.log('\n----- Test: Recipe Details Functionality -----');
    const recipeId = 716429; // ID from previous test
    const recipeDetails = await api.getRecipe(recipeId);
    console.log(`✅ Recipe details test passed`);
    console.log(`Recipe title: ${recipeDetails.title}`);
    
    // Test 4: Random recipes functionality
    console.log('\n----- Test: Random Recipes Functionality -----');
    const randomRecipes = await api.getRandomRecipes(1, 'dessert');
    console.log(`✅ Random recipes test passed, found ${randomRecipes.length} results`);
    if (randomRecipes.length > 0) {
      console.log(`Random recipe: ${randomRecipes[0].title}`);
    }
    
    console.log('\n===== ALL TESTS PASSED =====');
    console.log('The API is working correctly with environment variables!');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the verification
verifyApi().catch(error => {
  console.error('Unhandled error:', error);
});
