/**
 * API Configuration
 * Central place to manage API settings
 */

// Base URL for API requests
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// API endpoints
export const ENDPOINTS = {
  // Status
  STATUS: '/status',
  
  // Recipes
  RECIPES: '/recipes',
  RECIPE_BY_ID: (id) => `/recipes/${id}`,
  RECIPE_SEARCH: '/recipes/search',
  RECIPE_SUGGESTIONS: '/recipes/suggestions',
  
  // Pantry
  PANTRY_ITEMS: '/pantry/items',
  PANTRY_ITEM_BY_ID: (id) => `/pantry/items/${id}`,
  PANTRY_RECEIPT: '/pantry/receipt',
  
  // Spoonacular
  SPOONACULAR_SEARCH: '/spoonacular/search',
  SPOONACULAR_SEARCH_BY_INGREDIENTS: '/spoonacular/search-by-ingredients',
  SPOONACULAR_BY_ID: (id) => `/spoonacular/${id}`,
  SPOONACULAR_IMPORT: (id) => `/spoonacular/import/${id}`,
  SPOONACULAR_RANDOM: '/spoonacular/random',
  SPOONACULAR_MEAL_PLAN: '/spoonacular/meal-plan'
};

// Default request options
export const DEFAULT_OPTIONS = {
  headers: {
    'Content-Type': 'application/json'
  }
};

// Helper for handling API errors
export const handleApiError = async (response) => {
  if (!response.ok) {
    let errorMessage;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || `API error: ${response.status}`;
    } catch (e) {
      errorMessage = `API error: ${response.status}`;
    }
    throw new Error(errorMessage);
  }
  return response;
};
