// src/services/mealDbService.js

// Function to search for recipes by a single ingredient
export const searchRecipesByIngredient = async (ingredient) => {
  try {
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`
    );
    
    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.meals || []; // Return empty array if no meals found
  } catch (error) {
    console.error('Error searching recipes:', error);
    return [];
  }
};

// Function to get detailed recipe information by ID
export const getRecipeDetails = async (mealId) => {
  try {
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`
    );
    
    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.meals ? data.meals[0] : null;
  } catch (error) {
    console.error('Error getting recipe details:', error);
    return null;
  }
};

// Function to convert TheMealDB recipe format to our app's format
export const convertMealDbFormat = (mealDbRecipe) => {
  // Extract ingredients and measures (TheMealDB has ingredients1-20 and measures1-20)
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = mealDbRecipe[`strIngredient${i}`];
    const measure = mealDbRecipe[`strMeasure${i}`];
    
    if (ingredient && ingredient.trim() !== '') {
      ingredients.push(`${measure ? measure.trim() + ' ' : ''}${ingredient.trim()}`);
    }
  }
  
  // Extract instructions and split into steps
  const rawInstructions = mealDbRecipe.strInstructions || '';
  const instructions = rawInstructions
    .split(/\r\n|\r|\n/)
    .filter(step => step.trim() !== '')
    .map(step => step.trim());
  
  // Estimate difficulty based on ingredients count and instruction length
  let difficulty = 'Easy';
  if (ingredients.length > 10 || instructions.length > 7) {
    difficulty = 'Medium';
  }
  if (ingredients.length > 15 || instructions.length > 12) {
    difficulty = 'Hard';
  }
  
  // Estimate cooking time based on instructions length
  let cookTime = '20 minutes';
  if (instructions.length > 7) {
    cookTime = '30 minutes';
  }
  if (instructions.length > 12) {
    cookTime = '45 minutes';
  }
  
  return {
    id: mealDbRecipe.idMeal,
    title: mealDbRecipe.strMeal,
    recipeType: mealDbRecipe.strCategory || 'Main Dish',
    description: `A ${mealDbRecipe.strArea || ''} recipe from TheMealDB.`,
    cookTime,
    difficulty,
    ingredients,
    instructions,
    source: 'TheMealDB',
    sourceUrl: mealDbRecipe.strSource || null,
    image: mealDbRecipe.strMealThumb || null,
    // Add raw ingredients for dietary filtering
    rawIngredients: Array.from({ length: 20 }, (_, i) => mealDbRecipe[`strIngredient${i + 1}`] || '').filter(ing => ing.trim() !== '')
  };
};

// Helper function to check if a recipe meets dietary preferences
const meetsPreferences = (recipe, dietaryPreferences) => {
  if (!dietaryPreferences || dietaryPreferences.length === 0) {
    return true; // No preferences specified
  }
  
  const allIngredients = recipe.ingredients.join(' ').toLowerCase();
  const rawIngredients = recipe.rawIngredients ? recipe.rawIngredients.map(ing => ing.toLowerCase()) : [];
  
  for (const pref of dietaryPreferences) {
    switch (pref.toLowerCase()) {
      case 'vegetarian':
        // Check for meat products
        const meatKeywords = ['beef', 'chicken', 'pork', 'lamb', 'meat', 'bacon', 'ham', 'sausage', 'turkey', 'duck', 'veal'];
        if (meatKeywords.some(meat => allIngredients.includes(meat) || rawIngredients.some(ing => ing.includes(meat)))) {
          return false;
        }
        break;
        
      case 'vegan':
        // Check for animal products
        const animalKeywords = ['meat', 'beef', 'chicken', 'pork', 'lamb', 'fish', 'seafood', 'egg', 'milk', 'cream', 'cheese', 'butter', 'yogurt', 'honey'];
        if (animalKeywords.some(item => allIngredients.includes(item) || rawIngredients.some(ing => ing.includes(item)))) {
          return false;
        }
        break;
        
      case 'gluten-free':
        // Check for gluten
        const glutenKeywords = ['wheat', 'flour', 'bread', 'pasta', 'rye', 'barley', 'couscous', 'noodle'];
        if (glutenKeywords.some(item => allIngredients.includes(item) || rawIngredients.some(ing => ing.includes(item)))) {
          return false;
        }
        break;
        
      case 'dairy-free':
        // Check for dairy
        const dairyKeywords = ['milk', 'cream', 'cheese', 'butter', 'yogurt'];
        if (dairyKeywords.some(item => allIngredients.includes(item) || rawIngredients.some(ing => ing.includes(item)))) {
          return false;
        }
        break;
        
      case 'keto':
        // Check for high-carb items
        const highCarbKeywords = ['sugar', 'flour', 'bread', 'pasta', 'rice', 'potato', 'corn'];
        if (highCarbKeywords.some(item => allIngredients.includes(item) || rawIngredients.some(ing => ing.includes(item)))) {
          return false;
        }
        break;
        
      case 'low-carb':
        // Similar to keto but less strict
        const carbKeywords = ['sugar', 'flour', 'bread', 'pasta', 'rice', 'potato'];
        if (carbKeywords.some(item => allIngredients.includes(item) || rawIngredients.some(ing => ing.includes(item)))) {
          return false;
        }
        break;
        
      default:
        break;
    }
  }
  
  return true; // Recipe passed all preference checks
};

// Main function to search for recipes with multiple ingredients and dietary preferences
export const searchRecipesWithIngredients = async (ingredients, dietaryPreferences = []) => {
  try {
    // TheMealDB only supports searching by one ingredient at a time
    if (!ingredients || ingredients.length === 0) {
      return [];
    }
    
    // Get recipes for the first ingredient
    const primaryIngredient = ingredients[0].trim();
    const recipes = await searchRecipesByIngredient(primaryIngredient);
    
    if (recipes.length === 0) {
      return [];
    }
    
    // Get detailed information for each recipe
    const recipeDetailsPromises = recipes.map(recipe => getRecipeDetails(recipe.idMeal));
    const recipeDetails = await Promise.all(recipeDetailsPromises);
    
    // Convert to our app's format and filter to ensure more ingredient matches and dietary preferences
    const formattedRecipes = recipeDetails
      .filter(recipe => recipe !== null)
      .map(recipe => {
        const formattedRecipe = convertMealDbFormat(recipe);
        // Count how many of our ingredients are in this recipe
        const matchCount = ingredients.filter(ing => 
          formattedRecipe.ingredients.some(recipeIng => 
            recipeIng.toLowerCase().includes(ing.toLowerCase())
          )
        ).length;
        
        return {
          ...formattedRecipe,
          matchCount
        };
      })
      // Filter for dietary preferences
      .filter(recipe => meetsPreferences(recipe, dietaryPreferences))
      // Sort by most ingredient matches
      .sort((a, b) => b.matchCount - a.matchCount)
      // Take top 3 recipes
      .slice(0, 3);
      
    return formattedRecipes;
  } catch (error) {
    console.error('Error searching recipes with ingredients:', error);
    return [];
  }
};