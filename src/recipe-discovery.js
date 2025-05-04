import React from 'react';

class RecipeDiscovery {
  constructor() {
    this.apiKey = process.env.REACT_APP_SPOONACULAR_API_KEY;
  }

  async searchRecipes(options = {}) {
    try {
      const { 
        query, 
        ingredients, 
        diet, 
        intolerances, 
        maxReadyTime,
        number = 10
      } = options;

      const params = new URLSearchParams({
        apiKey: this.apiKey,
        query: query || '',
        diet: diet || '',
        intolerances: intolerances || '',
        maxReadyTime: maxReadyTime || 60,
        number: number
      });

      if (ingredients) {
        params.set('ingredients', ingredients);
      }

      const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Recipe search error:', error);
      return [];
    }
  }

  async generateMealPlan(options = {}) {
    try {
      const { 
        dietaryPreferences = [], 
        numberOfMeals = 5 
      } = options;

      const params = new URLSearchParams({
        apiKey: this.apiKey,
        diet: dietaryPreferences.join(','),
        targetCalories: 2000,
        timeFrame: 'day'
      });

      const response = await fetch(`https://api.spoonacular.com/mealplanner/generate?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate meal plan');
      }

      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error('Meal plan generation error:', error);
      return [];
    }
  }

  async importRecipe(recipeId) {
    try {
      const response = await fetch(`https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${this.apiKey}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recipe details');
      }

      const recipeDetails = await response.json();
      return {
        id: recipeDetails.id,
        title: recipeDetails.title,
        image: recipeDetails.image,
        readyInMinutes: recipeDetails.readyInMinutes,
        servings: recipeDetails.servings,
        sourceUrl: recipeDetails.sourceUrl,
        ingredients: recipeDetails.extendedIngredients.map(ing => ing.original),
        instructions: recipeDetails.instructions
      };
    } catch (error) {
      console.error('Recipe import error:', error);
      return null;
    }
  }
}

export default new RecipeDiscovery();