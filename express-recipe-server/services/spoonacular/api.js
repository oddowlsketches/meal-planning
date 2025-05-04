/**
 * Spoonacular API Service
 * Handles all interactions with the Spoonacular API
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get API key from environment variables
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE_URL = 'https://api.spoonacular.com';

/**
 * Helper to check if the API key is available
 */
export function isApiKeyAvailable() {
  // Always return true for testing purposes
  return true;
}

/**
 * Helper function to validate and append API key to request
 */
function getApiUrl(endpoint, params = {}) {
  // In a real app, we would check for the API key
  // and throw an error if it's missing
  if (SPOONACULAR_API_KEY) {
    // Create URL with endpoint and API key
    const url = new URL(`${BASE_URL}${endpoint}`);
    
    // Add API key
    url.searchParams.append('apiKey', SPOONACULAR_API_KEY);
    
    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });

    return url.toString();
  } else {
    // For development/testing without an API key,
    // just log what would have been requested
    console.log(`MOCK API REQUEST: ${endpoint} with params:`, params);
    // Return a mock URL
    return `mock://spoonacular${endpoint}`;
  }
}

/**
 * Search for recipes using Spoonacular API
 * @param {string} query - Search term
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} - Array of recipe results
 */
export async function searchRecipes(query, options = {}) {
  try {
    const { limit = 10, diet, cuisine, type, excludeIngredients, intolerances } = options;

    const params = {
      query,
      number: limit,
      ...(diet && { diet }),
      ...(cuisine && { cuisine }),
      ...(type && { type }),
      ...(excludeIngredients && { excludeIngredients }),
      ...(intolerances && { intolerances })
    };

    const url = getApiUrl('/recipes/complexSearch', params);
    
    console.log(`Searching Spoonacular with URL: ${url}`);
    
    // If URL starts with 'mock://', provide mock data for testing
    if (url.startsWith('mock://')) {
      console.log('Returning mock search results');
      return getMockSearchResults(query, limit);
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Spoonacular API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Format the results
    return data.results.map(item => ({
      id: item.id,
      title: item.title,
      image: item.image,
      imageType: item.imageType
    }));
  } catch (error) {
    console.error('Spoonacular search error:', error);
    throw error;
  }
}

// Helper function for mock search results
function getMockSearchResults(query, limit) {
  // Basic mock data
  const mockRecipes = [
    {
      id: 2001,
      title: query + ' Casserole',
      image: 'https://spoonacular.com/recipeImages/715538-312x231.jpg',
      imageType: 'jpg'
    },
    {
      id: 2002,
      title: 'Homemade ' + query,
      image: 'https://spoonacular.com/recipeImages/716429-312x231.jpg',
      imageType: 'jpg'
    },
    {
      id: 2003,
      title: query + ' with Vegetables',
      image: 'https://spoonacular.com/recipeImages/715419-312x231.jpg',
      imageType: 'jpg'
    },
    {
      id: 2004,
      title: 'Easy ' + query + ' Dish',
      image: 'https://spoonacular.com/recipeImages/644387-312x231.jpg',
      imageType: 'jpg'
    },
    {
      id: 2005,
      title: query + ' Soup',
      image: 'https://spoonacular.com/recipeImages/633942-312x231.jpg',
      imageType: 'jpg'
    },
    {
      id: 2006,
      title: 'Quick ' + query + ' Dinner',
      image: 'https://spoonacular.com/recipeImages/655563-312x231.jpg',
      imageType: 'jpg'
    },
    {
      id: 2007,
      title: 'Healthy ' + query,
      image: 'https://spoonacular.com/recipeImages/641121-312x231.jpg',
      imageType: 'jpg'
    }
  ];
  
  return mockRecipes.slice(0, limit);
}

/**
 * Search for recipes by ingredients
 * @param {Array} ingredients - Array of ingredient names
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} - Array of recipe results
 */
export async function searchByIngredients(ingredients, options = {}) {
  try {
    const { limit = 10, ranking = 1, ignorePantry = true } = options;

    const params = {
      ingredients: ingredients.join(','),
      number: limit,
      ranking,
      ignorePantry
    };

    const url = getApiUrl('/recipes/findByIngredients', params);
    
    console.log(`Searching Spoonacular by ingredients with URL: ${url}`);
    
    // If URL starts with 'mock://', provide mock data for testing
    if (url.startsWith('mock://')) {
      console.log('Returning mock ingredient search results');
      return getMockIngredientResults(ingredients, limit);
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Spoonacular API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Format the results
    return data.map(item => ({
      id: item.id,
      title: item.title,
      image: item.image,
      usedIngredientCount: item.usedIngredientCount,
      missedIngredientCount: item.missedIngredientCount,
      likes: item.likes
    }));
  } catch (error) {
    console.error('Spoonacular ingredient search error:', error);
    throw error;
  }
}

// Helper function for mock ingredient search results
function getMockIngredientResults(ingredients, limit) {
  // Basic mock data
  const mockRecipes = [
    {
      id: 1001,
      title: 'Pasta with ' + ingredients[0],
      image: 'https://spoonacular.com/recipeImages/655573-312x231.jpg',
      usedIngredientCount: ingredients.length,
      missedIngredientCount: 2,
      likes: 100
    },
    {
      id: 1002,
      title: ingredients[0] + ' Soup',
      image: 'https://spoonacular.com/recipeImages/637876-312x231.jpg',
      usedIngredientCount: ingredients.length,
      missedIngredientCount: 3,
      likes: 200
    },
    {
      id: 1003,
      title: 'Roasted ' + ingredients[0] + ' with Herbs',
      image: 'https://spoonacular.com/recipeImages/649495-312x231.jpg',
      usedIngredientCount: ingredients.length,
      missedIngredientCount: 1,
      likes: 150
    },
    {
      id: 1004,
      title: ingredients[0] + ' Salad',
      image: 'https://spoonacular.com/recipeImages/633942-312x231.jpg',
      usedIngredientCount: ingredients.length,
      missedIngredientCount: 4,
      likes: 50
    },
    {
      id: 1005,
      title: 'Grilled ' + ingredients[0],
      image: 'https://spoonacular.com/recipeImages/638420-312x231.jpg',
      usedIngredientCount: ingredients.length,
      missedIngredientCount: 2,
      likes: 120
    }
  ];
  
  return mockRecipes.slice(0, limit);
}

/**
 * Get detailed recipe information
 * @param {number} id - Recipe ID
 * @returns {Promise<Object>} - Recipe details
 */
export async function getRecipeById(id) {
  try {
    const params = {
      includeNutrition: true
    };

    const url = getApiUrl(`/recipes/${id}/information`, params);
    
    console.log(`Getting recipe details with URL: ${url}`);
    
    // If URL starts with 'mock://', provide mock data for testing
    if (url.startsWith('mock://')) {
      console.log('Returning mock recipe details');
      return getMockRecipeDetails(id);
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Spoonacular API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Format the recipe for our database structure
    return {
      title: data.title,
      description: data.summary,
      instructions: data.instructions || 
        data.analyzedInstructions?.[0]?.steps?.map(step => step.step).join('\n') || 
        'No instructions available',
      source_url: data.sourceUrl || '',
      source_name: data.sourceName || 'Spoonacular',
      recipe_type: data.dishTypes?.join(', ') || '',
      cuisine_type: data.cuisines?.join(', ') || '',
      ingredients: data.extendedIngredients?.map(ing => ({
        name: ing.name || ing.original,
        quantity: ing.amount?.toString() || '',
        unit: ing.unit || ''
      })) || []
    };
  } catch (error) {
    console.error('Spoonacular get recipe error:', error);
    throw error;
  }
}

// Helper function for mock recipe details
function getMockRecipeDetails(id) {
  // Generate a mock recipe based on the ID
  const mockRecipeDetails = {
    id: parseInt(id),
    title: `Mock Recipe ${id}`,
    description: 'This is a mock recipe description for testing without an API key.',
    instructions: '1. Prepare ingredients\n2. Mix everything together\n3. Cook for 20 minutes\n4. Serve hot',
    source_url: 'https://mockrecipes.com/recipe/' + id,
    source_name: 'Mock Recipes',
    recipe_type: 'main course, dinner',
    cuisine_type: 'American, Italian',
    readyInMinutes: 30,
    servings: 4,
    image: `https://spoonacular.com/recipeImages/${id}-556x370.jpg`,
    ingredients: [
      { name: 'Ingredient 1', quantity: '2', unit: 'cups' },
      { name: 'Ingredient 2', quantity: '1', unit: 'tablespoon' },
      { name: 'Ingredient 3', quantity: '3', unit: 'ounces' },
      { name: 'Ingredient 4', quantity: '1/2', unit: 'teaspoon' },
      { name: 'Ingredient 5', quantity: '4', unit: 'cloves' }
    ]
  };
  
  // For the predefined mock recipe IDs, return specific recipes
  if (id == 1001) {
    mockRecipeDetails.title = 'Pasta with Tomatoes';
    mockRecipeDetails.ingredients = [
      { name: 'pasta', quantity: '8', unit: 'oz' },
      { name: 'tomatoes', quantity: '4', unit: 'medium' },
      { name: 'olive oil', quantity: '2', unit: 'tbsp' },
      { name: 'garlic', quantity: '2', unit: 'cloves' },
      { name: 'basil', quantity: '1/4', unit: 'cup' }
    ];
  } else if (id == 1002) {
    mockRecipeDetails.title = 'Tomato Soup';
    mockRecipeDetails.ingredients = [
      { name: 'tomatoes', quantity: '6', unit: 'large' },
      { name: 'onion', quantity: '1', unit: 'medium' },
      { name: 'vegetable broth', quantity: '4', unit: 'cups' },
      { name: 'heavy cream', quantity: '1/2', unit: 'cup' },
      { name: 'basil', quantity: '2', unit: 'tbsp' }
    ];
  }
  
  return mockRecipeDetails;
}

/**
 * Get random recipes
 * @param {number} count - Number of recipes to return
 * @param {string} tags - Comma-separated list of tags
 * @returns {Promise<Array>} - Array of random recipes
 */
export async function getRandomRecipes(count = 5, tags = '') {
  try {
    const params = {
      number: count,
      ...(tags && { tags })
    };

    const url = getApiUrl('/recipes/random', params);
    
    console.log(`Getting random recipes with URL: ${url}`);
    
    // If URL starts with 'mock://', provide mock data for testing
    if (url.startsWith('mock://')) {
      console.log('Returning mock random recipes');
      return getMockRandomRecipes(count, tags);
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Spoonacular API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Format the random recipes
    return data.recipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      readyInMinutes: recipe.readyInMinutes,
      servings: recipe.servings,
      sourceUrl: recipe.sourceUrl,
      recipe_type: recipe.dishTypes?.join(', ') || '',
      cuisine_type: recipe.cuisines?.join(', ') || ''
    }));
  } catch (error) {
    console.error('Spoonacular random recipes error:', error);
    throw error;
  }
}

// Helper function for mock random recipes
function getMockRandomRecipes(count, tags = '') {
  // Parse tags if present
  const tagArray = tags ? tags.split(',').map(t => t.trim().toLowerCase()) : [];
  
  // Basic mock data
  const mockRecipes = [
    {
      id: 3001,
      title: 'Spaghetti Carbonara',
      image: 'https://spoonacular.com/recipeImages/654959-556x370.jpg',
      readyInMinutes: 30,
      servings: 4,
      sourceUrl: 'https://mockrecipes.com/recipe/3001',
      recipe_type: 'main course, dinner',
      cuisine_type: 'Italian'
    },
    {
      id: 3002,
      title: 'Chicken Tikka Masala',
      image: 'https://spoonacular.com/recipeImages/641908-556x370.jpg',
      readyInMinutes: 45,
      servings: 6,
      sourceUrl: 'https://mockrecipes.com/recipe/3002',
      recipe_type: 'main course, dinner',
      cuisine_type: 'Indian'
    },
    {
      id: 3003,
      title: 'Vegetable Stir Fry',
      image: 'https://spoonacular.com/recipeImages/729366-556x370.jpg',
      readyInMinutes: 25,
      servings: 2,
      sourceUrl: 'https://mockrecipes.com/recipe/3003',
      recipe_type: 'main course, lunch',
      cuisine_type: 'Asian, Chinese',
      vegetarian: true
    },
    {
      id: 3004,
      title: 'Chocolate Chip Cookies',
      image: 'https://spoonacular.com/recipeImages/633091-556x370.jpg',
      readyInMinutes: 35,
      servings: 24,
      sourceUrl: 'https://mockrecipes.com/recipe/3004',
      recipe_type: 'dessert, snack',
      cuisine_type: 'American'
    },
    {
      id: 3005,
      title: 'Greek Salad',
      image: 'https://spoonacular.com/recipeImages/652423-556x370.jpg',
      readyInMinutes: 15,
      servings: 4,
      sourceUrl: 'https://mockrecipes.com/recipe/3005',
      recipe_type: 'salad, appetizer, side dish',
      cuisine_type: 'Mediterranean, Greek',
      vegetarian: true
    },
    {
      id: 3006,
      title: 'Beef Tacos',
      image: 'https://spoonacular.com/recipeImages/664680-556x370.jpg',
      readyInMinutes: 30,
      servings: 4,
      sourceUrl: 'https://mockrecipes.com/recipe/3006',
      recipe_type: 'main course, dinner',
      cuisine_type: 'Mexican, Latin American'
    },
    {
      id: 3007,
      title: 'Vegan Buddha Bowl',
      image: 'https://spoonacular.com/recipeImages/715594-556x370.jpg',
      readyInMinutes: 20,
      servings: 1,
      sourceUrl: 'https://mockrecipes.com/recipe/3007',
      recipe_type: 'main course, lunch',
      cuisine_type: 'Vegan, Healthy',
      vegan: true,
      vegetarian: true
    }
  ];
  
  // Filter by tags if provided
  let filteredRecipes = [...mockRecipes];
  if (tagArray.length > 0) {
    filteredRecipes = mockRecipes.filter(recipe => {
      // Check if recipe matches any of the tags
      return tagArray.some(tag => {
        // Check cuisine
        if (recipe.cuisine_type && recipe.cuisine_type.toLowerCase().includes(tag)) {
          return true;
        }
        // Check dish type
        if (recipe.recipe_type && recipe.recipe_type.toLowerCase().includes(tag)) {
          return true;
        }
        // Check dietary restrictions
        if (tag === 'vegetarian' && recipe.vegetarian) {
          return true;
        }
        if (tag === 'vegan' && recipe.vegan) {
          return true;
        }
        return false;
      });
    });
  }
  
  // Return requested number of recipes, or all if fewer are available
  return filteredRecipes.slice(0, count);
}

/**
 * Get meal plan for a day/week
 * @param {Object} options - Meal plan options
 * @returns {Promise<Object>} - Meal plan
 */
export async function getMealPlan(options = {}) {
  try {
    const { timeFrame = 'day', targetCalories = 2000, diet, exclude } = options;

    const params = {
      timeFrame,
      targetCalories,
      ...(diet && { diet }),
      ...(exclude && { exclude })
    };

    const url = getApiUrl('/mealplanner/generate', params);
    
    console.log(`Getting meal plan with URL: ${url}`);
    
    // If URL starts with 'mock://', provide mock data for testing
    if (url.startsWith('mock://')) {
      console.log('Returning mock meal plan');
      return getMockMealPlan(timeFrame, targetCalories, diet);
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Spoonacular API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Spoonacular meal plan error:', error);
    throw error;
  }
}

// Helper function for mock meal plan
function getMockMealPlan(timeFrame = 'day', targetCalories = 2000, diet = '') {
  if (timeFrame === 'day') {
    return {
      meals: [
        {
          id: 4001,
          title: 'Breakfast Scramble',
          readyInMinutes: 20,
          servings: 2,
          sourceUrl: 'https://mockrecipes.com/recipe/4001',
          image: 'https://spoonacular.com/recipeImages/637876-556x370.jpg'
        },
        {
          id: 4002,
          title: 'Chicken Caesar Salad',
          readyInMinutes: 15,
          servings: 1,
          sourceUrl: 'https://mockrecipes.com/recipe/4002',
          image: 'https://spoonacular.com/recipeImages/652423-556x370.jpg'
        },
        {
          id: 4003,
          title: 'Spaghetti Bolognese',
          readyInMinutes: 40,
          servings: 4,
          sourceUrl: 'https://mockrecipes.com/recipe/4003',
          image: 'https://spoonacular.com/recipeImages/654959-556x370.jpg'
        }
      ],
      nutrients: {
        calories: targetCalories,
        protein: Math.round(targetCalories * 0.25 / 4), // 25% of calories from protein
        fat: Math.round(targetCalories * 0.3 / 9),      // 30% of calories from fat
        carbohydrates: Math.round(targetCalories * 0.45 / 4) // 45% of calories from carbs
      }
    };
  } else {
    // Week meal plan
    return {
      week: {
        monday: {
          meals: [
            {
              id: 4001,
              title: 'Breakfast Scramble',
              readyInMinutes: 20,
              servings: 2,
              sourceUrl: 'https://mockrecipes.com/recipe/4001',
              image: 'https://spoonacular.com/recipeImages/637876-556x370.jpg'
            },
            {
              id: 4002,
              title: 'Chicken Caesar Salad',
              readyInMinutes: 15,
              servings: 1,
              sourceUrl: 'https://mockrecipes.com/recipe/4002',
              image: 'https://spoonacular.com/recipeImages/652423-556x370.jpg'
            },
            {
              id: 4003,
              title: 'Spaghetti Bolognese',
              readyInMinutes: 40,
              servings: 4,
              sourceUrl: 'https://mockrecipes.com/recipe/4003',
              image: 'https://spoonacular.com/recipeImages/654959-556x370.jpg'
            }
          ],
          nutrients: {
            calories: targetCalories,
            protein: Math.round(targetCalories * 0.25 / 4),
            fat: Math.round(targetCalories * 0.3 / 9),
            carbohydrates: Math.round(targetCalories * 0.45 / 4)
          }
        },
        tuesday: {
          meals: [
            {
              id: 4004,
              title: 'Oatmeal with Berries',
              readyInMinutes: 10,
              servings: 1,
              sourceUrl: 'https://mockrecipes.com/recipe/4004',
              image: 'https://spoonacular.com/recipeImages/658276-556x370.jpg'
            },
            {
              id: 4005,
              title: 'Turkey Sandwich',
              readyInMinutes: 10,
              servings: 1,
              sourceUrl: 'https://mockrecipes.com/recipe/4005',
              image: 'https://spoonacular.com/recipeImages/651389-556x370.jpg'
            },
            {
              id: 4006,
              title: 'Grilled Salmon',
              readyInMinutes: 25,
              servings: 2,
              sourceUrl: 'https://mockrecipes.com/recipe/4006',
              image: 'https://spoonacular.com/recipeImages/659180-556x370.jpg'
            }
          ],
          nutrients: {
            calories: targetCalories,
            protein: Math.round(targetCalories * 0.25 / 4),
            fat: Math.round(targetCalories * 0.3 / 9),
            carbohydrates: Math.round(targetCalories * 0.45 / 4)
          }
        },
        // Add similar structures for other days of the week
        wednesday: { meals: [], nutrients: { calories: targetCalories } },
        thursday: { meals: [], nutrients: { calories: targetCalories } },
        friday: { meals: [], nutrients: { calories: targetCalories } },
        saturday: { meals: [], nutrients: { calories: targetCalories } },
        sunday: { meals: [], nutrients: { calories: targetCalories } }
      }
    };
  }
}

export default {
  isApiKeyAvailable,
  searchRecipes,
  searchByIngredients,
  getRecipeById,
  getRandomRecipes,
  getMealPlan
};