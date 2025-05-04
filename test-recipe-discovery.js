import recipeDiscovery from './src/recipe-discovery.js';

async function testRecipeDiscovery() {
  try {
    console.log('Testing recipe search...');
    const searchResults = await recipeDiscovery.searchRecipes({
      query: 'pasta',
      diet: 'vegetarian',
      maxReadyTime: 30
    });
    console.log('Search Results:', searchResults);

    console.log('\nGenerating meal plan...');
    const mealPlan = await recipeDiscovery.generateMealPlan({
      dietaryPreferences: ['vegetarian'],
      numberOfMeals: 3
    });
    console.log('Meal Plan Recipes:', mealPlan);

    // Optional: Import a specific recipe
    if (searchResults.length > 0) {
      console.log('\nImporting a recipe...');
      const importedRecipe = await recipeDiscovery.importRecipe(searchResults[0].id);
      console.log('Imported Recipe:', importedRecipe);
    }
  } catch (error) {
    console.error('Error in recipe discovery test:', error);
  } finally {
    recipeDiscovery.close();
  }
}

testRecipeDiscovery();