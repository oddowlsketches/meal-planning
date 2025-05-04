/**
 * API Services
 * Central export point for all API services
 */

import apiService from './apiService.js';
import recipeService from './recipeService.js';
import pantryService from './pantryService.js';
import spoonacularService from './spoonacularService.js';
import { API_BASE_URL, ENDPOINTS } from './config.js';

// Export individual services
export { 
  apiService,
  recipeService,
  pantryService,
  spoonacularService,
  API_BASE_URL,
  ENDPOINTS
};

// Export a combined API object
const api = {
  // Core request functions
  request: apiService.apiRequest,
  get: apiService.get,
  post: apiService.post,
  put: apiService.put,
  delete: apiService.del,
  checkStatus: apiService.checkStatus,
  
  // Recipe operations
  recipes: recipeService,
  
  // Pantry operations
  pantry: pantryService,
  
  // Spoonacular operations
  spoonacular: spoonacularService
};

export default api;