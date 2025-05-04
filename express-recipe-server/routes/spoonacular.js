import express from 'express';
import { 
  isApiKeyAvailable, 
  searchRecipes, 
  searchByIngredients, 
  getRecipeById, 
  getRandomRecipes, 
  getMealPlan
} from '../services/spoonacular/api.js';
import { dbOperations } from '../db-utils.js';

const router = express.Router();

// Helper function to validate API key
function checkApiKey(req, res, next) {
  if (!isApiKeyAvailable()) {
    return res.status(503).json({ 
      error: 'Spoonacular API key is not configured. Please set SPOONACULAR_API_KEY in .env file.' 
    });
  }
  next();
}

// Search recipes
router.get('/search', checkApiKey, async (req, res) => {
  try {
    const { query, limit, diet, cuisine, type, excludeIngredients, intolerances } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const options = {
      limit: limit ? parseInt(limit) : 10,
      diet,
      cuisine,
      type,
      excludeIngredients,
      intolerances
    };
    
    const recipes = await searchRecipes(query, options);
    res.json({ recipes });
  } catch (error) {
    console.error('Spoonacular search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search by ingredients
router.post('/search-by-ingredients', checkApiKey, async (req, res) => {
  try {
    const { ingredients, limit, ranking, ignorePantry } = req.body;
    
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'Ingredients array is required' });
    }
    
    const options = {
      limit: limit ? parseInt(limit) : 10,
      ranking: ranking ? parseInt(ranking) : 1,
      ignorePantry: ignorePantry !== false
    };
    
    const recipes = await searchByIngredients(ingredients, options);
    res.json({ recipes });
  } catch (error) {
    console.error('Spoonacular ingredient search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recipe details
router.get('/:id', checkApiKey, async (req, res) => {
  try {
    const recipeId = parseInt(req.params.id);
    
    if (isNaN(recipeId)) {
      return res.status(400).json({ error: 'Recipe ID must be a number' });
    }
    
    const recipe = await getRecipeById(recipeId);
    res.json({ recipe });
  } catch (error) {
    console.error('Spoonacular get recipe error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Import recipe to database
router.post('/import/:id', checkApiKey, async (req, res) => {
  try {
    const recipeId = parseInt(req.params.id);
    
    if (isNaN(recipeId)) {
      return res.status(400).json({ error: 'Recipe ID must be a number' });
    }
    
    // Get recipe details from Spoonacular
    const spoonacularRecipe = await getRecipeById(recipeId);
    
    // Add the recipe to our database
    const dbRecipeId = dbOperations.addRecipe(spoonacularRecipe);
    
    res.status(201).json({ 
      id: dbRecipeId, 
      title: spoonacularRecipe.title,
      message: 'Recipe imported successfully' 
    });
  } catch (error) {
    console.error('Spoonacular import recipe error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get random recipes
router.get('/random', checkApiKey, async (req, res) => {
  try {
    const { count, tags } = req.query;
    
    const recipes = await getRandomRecipes(
      count ? parseInt(count) : 5,
      tags || ''
    );
    
    res.json({ recipes });
  } catch (error) {
    console.error('Spoonacular random recipes error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate meal plan
router.post('/meal-plan', checkApiKey, async (req, res) => {
  try {
    const { timeFrame, targetCalories, diet, exclude } = req.body;
    
    const mealPlan = await getMealPlan({
      timeFrame,
      targetCalories,
      diet,
      exclude
    });
    
    res.json({ mealPlan });
  } catch (error) {
    console.error('Spoonacular meal plan error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;