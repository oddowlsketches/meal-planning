import express from 'express';
import { dbOperations } from '../../db-utils.js';

const router = express.Router();

// Get all recipes
router.get('/', (req, res) => {
  try {
    const recipes = dbOperations.getAllRecipes();
    res.json({ recipes });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search recipes
router.get('/search', (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const recipes = dbOperations.searchRecipes(query);
    res.json({ recipes });
  } catch (error) {
    console.error('Error searching recipes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Recipe suggestions
router.post('/suggestions', (req, res) => {
  try {
    const { ingredients, preferences } = req.body;
    
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'Ingredients array is required' });
    }
    
    // For now, just use the database to find matching recipes
    const matchingRecipes = dbOperations.getRecipesByIngredients(ingredients);
    
    res.json({ 
      recipes: matchingRecipes,
      message: 'AI-enhanced suggestions will be implemented in a future update'
    });
  } catch (error) {
    console.error('Error getting recipe suggestions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a new recipe
router.post('/', (req, res) => {
  try {
    const recipe = req.body;
    
    // Validate required fields
    if (!recipe.title || !recipe.instructions || !recipe.ingredients) {
      return res.status(400).json({ 
        error: 'Recipe must include title, instructions, and ingredients' 
      });
    }
    
    const recipeId = dbOperations.addRecipe(recipe);
    res.status(201).json({ 
      id: recipeId, 
      message: 'Recipe added successfully' 
    });
  } catch (error) {
    console.error('Error adding recipe:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recipe by ID
router.get('/:id', (req, res) => {
  try {
    const recipeId = parseInt(req.params.id);
    const recipe = dbOperations.getRecipeById(recipeId);
    
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    res.json({ recipe });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;