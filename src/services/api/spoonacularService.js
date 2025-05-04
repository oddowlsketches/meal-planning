/**
 * Spoonacular Service
 * Handles interactions with the Spoonacular API endpoints
 */

import { ENDPOINTS } from './config.js';
import { get, post } from './apiService.js';
import { normalizeRecipe } from './recipeService.js';

/**
 * Search Spoonacular recipes by query
 * @param {string} query - Search term
 * @param {Object} options - Additional search options
 * @returns {Promise<Array>} - Array of recipe results
 */
export const searchRecipes = async (query, options = {}) => {
  const params = {
    query,
    ...options
  };
  
  const response = await get(ENDPOINTS.SPOONACULAR_SEARCH, params);
  return response.recipes || [];
};

/**
 * Search Spoonacular recipes by ingredients
 * @param {Array} ingredients - Array of ingredient names
 * @param {Object} options - Additional search options
 * @returns {Promise<Array>} - Array of recipe results
 */
export const searchByIngredients = async (ingredients, options = {}) => {
  const response = await post(ENDPOINTS.SPOONACULAR_SEARCH_BY_INGREDIENTS, {
    ingredients,
    ...options
  });
  
  return response.recipes || [];
};

/**
 * Get recipe details from Spoonacular
 * @param {number} id - Spoonacular recipe ID
 * @returns {Promise<Object>} - Recipe details
 */
export const getRecipeById = async (id) => {
  const response = await get(ENDPOINTS.SPOONACULAR_BY_ID(id));
  return normalizeRecipe(response.recipe);
};

/**
 * Import a Spoonacular recipe to local database
 * @param {number} id - Spoonacular recipe ID to import
 * @returns {Promise<Object>} - Import result
 */
export const importRecipe = async (id) => {
  const response = await post(ENDPOINTS.SPOONACULAR_IMPORT(id), {});
  return response;
};

/**
 * Get random recipes from Spoonacular
 * @param {number} count - Number of recipes to fetch
 * @param {string} tags - Comma-separated tags to filter by
 * @returns {Promise<Array>} - Array of random recipes
 */
export const getRandomRecipes = async (count = 5, tags = '') => {
  const response = await get(ENDPOINTS.SPOONACULAR_RANDOM, { count, tags });
  return response.recipes || [];
};

/**
 * Generate a meal plan
 * @param {Object} options - Meal plan options
 * @returns {Promise<Object>} - Generated meal plan
 */
export const generateMealPlan = async (options = {}) => {
  const response = await post(ENDPOINTS.SPOONACULAR_MEAL_PLAN, options);
  return response.mealPlan;
};

export default {
  searchRecipes,
  searchByIngredients,
  getRecipeById,
  importRecipe,
  getRandomRecipes,
  generateMealPlan
};