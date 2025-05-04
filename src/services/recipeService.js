class RecipeService {
  constructor() {
    this.apiKey = process.env.REACT_APP_SPOONACULAR_API_KEY;
    this.baseUrl = 'https://api.spoonacular.com/recipes';
    
    // Predefined categories to help with future organization
    this.categories = {
      cuisineTypes: [
        'Italian', 'Mexican', 'Chinese', 'Indian', 'Mediterranean', 
        'American', 'Japanese', 'Thai', 'French', 'Greek'
      ],
      mealTypes: [
        'Breakfast', 'Lunch', 'Dinner', 'Appetizer', 
        'Dessert', 'Snack', 'Side Dish'
      ],
      dietTypes: [
        'Vegetarian', 'Vegan', 'Gluten Free', 
        'Dairy Free', 'Low Carb', 'Keto'
      ],
      flavors: [
        'Sweet', 'Savory', 'Spicy', 'Bitter', 
        'Sour', 'Umami'
      ]
    };
  }

  getSavedRecipes() {
    return JSON.parse(localStorage.getItem('savedRecipes') || '[]');
  }

  saveRecipe(recipe) {
    console.log('saveRecipe called with:', recipe);
    const savedRecipes = this.getSavedRecipes();
    console.log('Current saved recipes:', savedRecipes);
    
    const existingRecipeIndex = savedRecipes.findIndex(r => r.id === recipe.id);
    console.log('Existing recipe index:', existingRecipeIndex);
    
    const normalizedRecipe = this.normalizeRecipe(recipe);
    console.log('Normalized recipe:', normalizedRecipe);
    
    if (existingRecipeIndex === -1) {
      savedRecipes.push(normalizedRecipe);
    } else {
      savedRecipes[existingRecipeIndex] = normalizedRecipe;
    }

    console.log('Updated recipes list:', savedRecipes);
    localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));

    return savedRecipes;
  }

  removeRecipe(recipeId) {
    let savedRecipes = this.getSavedRecipes();
    savedRecipes = savedRecipes.filter(r => r.id !== recipeId);
    localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
    return savedRecipes;
  }

  async searchRecipes({ ingredients, diet, number = 10 }) {
    try {
      console.log('Search Parameters:', { ingredients, diet, number });
      console.log('API Key:', this.apiKey ? 'Present' : 'Missing');

      if (!this.apiKey) {
        throw new Error('Spoonacular API key is missing');
      }

      const params = new URLSearchParams({
        apiKey: this.apiKey,
        ingredients: ingredients,
        number: number,
        ranking: 2,  // maximize used ingredients
      });

      if (diet) {
        params.append('diet', diet);
      }

      const url = `${this.baseUrl}/findByIngredients?${params.toString()}`;
      console.log('Request URL:', url);

      const response = await fetch(url, { method: 'GET' });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      return data;
    } catch (error) {
      console.error('Search Recipes Error:', error);
      throw error;
    }
  }

  async getRecipeDetails(recipeId) {
    try {
      const params = new URLSearchParams({
        apiKey: this.apiKey,
        includeNutrition: true
      });

      const response = await fetch(
        `${this.baseUrl}/${recipeId}/information?${params.toString()}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Recipe Details Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      return this.normalizeRecipe(data);
    } catch (error) {
      console.error('Get Recipe Details Error:', error);
      throw error;
    }
  }

  normalizeRecipe(recipe) {
    const tags = [];
    
    // Standard dietary tags
    if (recipe.vegetarian) tags.push('vegetarian');
    if (recipe.vegan) tags.push('vegan');
    if (recipe.glutenFree) tags.push('gluten free');
    if (recipe.dairyFree) tags.push('dairy free');

    // Try to infer additional metadata
    const inferredCategories = this.inferRecipeCategories(recipe);
    tags.push(...inferredCategories);

    return {
      id: recipe.id,
      title: recipe.title,
      image: recipe.image || null,
      readyInMinutes: recipe.readyInMinutes || 'N/A',
      servings: recipe.servings || 'N/A',
      ingredients: recipe.extendedIngredients?.map(ing => ing.original) || [],
      instructions: recipe.instructions || 
        recipe.analyzedInstructions?.[0]?.steps?.map(step => step.step).join('\n') || 
        'No instructions available',
      sourceUrl: recipe.sourceUrl || '',
      tags: tags,
      metadata: {
        lastCooked: null,  // Placeholder for future tracking
        timesCooked: 0,    // Placeholder for future tracking
        personalRating: null, // Placeholder for user ratings
        categories: inferredCategories
      },
      dateAdded: new Date().toISOString()
    };
  }

  inferRecipeCategories(recipe) {
    const categories = [];

    // Try to infer cuisine type from recipe title or ingredients
    this.categories.cuisineTypes.forEach(cuisine => {
      if (recipe.title.toLowerCase().includes(cuisine.toLowerCase())) {
        categories.push(cuisine.toLowerCase());
      }
    });

    // Try to infer meal type
    this.categories.mealTypes.forEach(mealType => {
      if (recipe.title.toLowerCase().includes(mealType.toLowerCase())) {
        categories.push(mealType.toLowerCase());
      }
    });

    // Try to infer flavor profile
    const ingredients = recipe.extendedIngredients || [];
    const ingredientNames = ingredients.map(ing => 
      typeof ing === 'string' ? ing.toLowerCase() : (ing.name || '').toLowerCase()
    );

    if (ingredientNames.some(name => ['sugar', 'chocolate', 'honey', 'syrup', 'fruit'].some(sweet => name.includes(sweet)))) {
      categories.push('sweet');
    }

    if (ingredientNames.some(name => ['salt', 'pepper', 'garlic', 'onion', 'herb', 'spice'].some(savory => name.includes(savory)))) {
      categories.push('savory');
    }

    if (ingredientNames.some(name => ['chili', 'pepper', 'jalapeno', 'sriracha', 'cayenne'].some(spicy => name.includes(spicy)))) {
      categories.push('spicy');
    }

    return categories;
  }

  searchSavedRecipes(query, dietaryFilters = [], sortBy = 'dateAdded') {
    let savedRecipes = this.getSavedRecipes();

    // Filter by search term
    if (query) {
      const searchTerms = query.toLowerCase().split(/\\s+/);
      savedRecipes = savedRecipes.filter(recipe => {
        // Check title
        const titleMatch = searchTerms.some(term => 
          recipe.title.toLowerCase().includes(term)
        );
        
        // Check ingredients
        const ingredientMatch = recipe.ingredients && searchTerms.some(term => 
          recipe.ingredients.some(ing => 
            ing.toLowerCase().includes(term)
          )
        );
        
        // Check tags/categories
        const tagMatch = recipe.tags && searchTerms.some(term => 
          recipe.tags.some(tag => tag.toLowerCase().includes(term))
        );
        
        return titleMatch || ingredientMatch || tagMatch;
      });
    }

    // Filter by dietary preferences
    if (dietaryFilters.length > 0) {
      savedRecipes = savedRecipes.filter(recipe => 
        dietaryFilters.every(filter => 
          recipe.tags && recipe.tags.includes(filter.toLowerCase())
        )
      );
    }

    // Sort recipes
    switch (sortBy) {
      case 'title':
        savedRecipes.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'dateAdded':
        savedRecipes.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
        break;
      case 'cookTime':
        savedRecipes.sort((a, b) => {
          const aTime = typeof a.readyInMinutes === 'number' ? a.readyInMinutes : 9999;
          const bTime = typeof b.readyInMinutes === 'number' ? b.readyInMinutes : 9999;
          return aTime - bTime;
        });
        break;
      default:
        savedRecipes.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    }

    return savedRecipes;
  }

  /**
   * Import multiple recipes in batch
   * @param {number[]} recipeIds - Array of Spoonacular recipe IDs to import
   * @returns {Promise<Object>} - Results of the batch import
   */
  async batchImportRecipes(recipeIds) {
    const results = {
      total: recipeIds.length,
      successful: 0,
      failed: 0,
      imported: []
    };

    // Process IDs sequentially to avoid rate limits
    for (const id of recipeIds) {
      try {
        const recipe = await this.getRecipeDetails(id);
        this.saveRecipe(recipe);
        results.successful++;
        results.imported.push({
          id: recipe.id,
          title: recipe.title
        });
      } catch (error) {
        console.error(`Error importing recipe ID ${id}:`, error);
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Get random recipes from Spoonacular
   * @param {Object} options - Options for random recipes
   * @returns {Promise<Array>} - Array of recipe preview objects
   */
  async getRandomRecipes(options = {}) {
    try {
      const { tags = '', number = 5 } = options;
      
      const params = new URLSearchParams({
        apiKey: this.apiKey,
        number: number
      });
      
      if (tags) {
        params.append('tags', tags);
      }
      
      const response = await fetch(
        `${this.baseUrl}/random?${params.toString()}`,
        { method: 'GET' }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      return data.recipes.map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        readyInMinutes: recipe.readyInMinutes,
        servings: recipe.servings,
        sourceUrl: recipe.sourceUrl
      }));
    } catch (error) {
      console.error('Get Random Recipes Error:', error);
      throw error;
    }
  }
}

export default new RecipeService();