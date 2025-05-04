import React, { useState, useEffect } from 'react';
import './RecipeIdeas.css';
import api from '../services/api/index.js';
import RecipeDetailPage from './RecipeDetailPage.js';

function parseIngredients(ingredientInput) {
  const ingredientRegex = /[,;]+|(?:\s{2,})/;
  return ingredientInput
    .split(ingredientRegex)
    .map(ing => ing.trim().toLowerCase())
    .filter(ing => ing.length > 0);
}

function RecipeIdeas() {
  const [ingredients, setIngredients] = useState(() => 
    JSON.parse(localStorage.getItem('recipeIngredients') || '[]')
  );
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [dietaryPreferences, setDietaryPreferences] = useState(() => 
    JSON.parse(localStorage.getItem('recipePreferences') || '[]')
  );
  const [recipes, setRecipes] = useState([]);
  const [activeRecipeId, setActiveRecipeId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchMode, setSearchMode] = useState('spoonacular'); // 'spoonacular' or 'local'

  useEffect(() => {
    localStorage.setItem('recipeIngredients', JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem('recipePreferences', JSON.stringify(dietaryPreferences));
  }, [dietaryPreferences]);

  useEffect(() => {
    if (ingredients.length > 0) {
      findRecipes();
    }
  }, [ingredients, searchMode]);

  const findRecipes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let results;
      
      if (searchMode === 'local') {
        // Search local database by matching ingredients
        results = await api.recipes.getRecipeSuggestions(ingredients, {
          dietaryPreferences
        });
      } else {
        // Search Spoonacular
        results = await api.spoonacular.searchByIngredients(ingredients, {
          limit: 10,
          ranking: 2, // maximize used ingredients
          ignorePantry: false
        });
      }
      
      if (!results || results.length === 0) {
        setError('No recipes found. Try different ingredients or remove some filters.');
        setRecipes([]);
        return;
      }
      
      // Sort recipes by matched ingredients count
      const scoredRecipes = results
        .map(recipe => ({
          ...recipe,
          matchedIngredientsCount: recipe.usedIngredientCount || 0
        }))
        .sort((a, b) => b.matchedIngredientsCount - a.matchedIngredientsCount);
      
      setRecipes(scoredRecipes);
    } catch (error) {
      console.error('Recipe search error:', error);
      setError('Failed to search recipes. Please try again.');
      setRecipes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllIngredients = () => {
    setIngredients([]);
    setRecipes([]);
  };

  const addIngredient = () => {
    const parsedIngredients = parseIngredients(currentIngredient);
    if (parsedIngredients.length === 0) return;
    
    const newIngredients = parsedIngredients.filter(
      ing => !ingredients.includes(ing)
    );
    
    setIngredients(prev => [...prev, ...newIngredients]);
    setCurrentIngredient('');
  };

  const removeIngredient = (ingredientToRemove) => {
    setIngredients(ingredients.filter(ing => ing !== ingredientToRemove));
  };

  const handleSaveRecipe = async (recipe) => {
    try {
      // If it's a Spoonacular recipe and we don't have full details yet
      if (searchMode === 'spoonacular' && !recipe.instructions) {
        // First import the recipe to our database
        const result = await api.spoonacular.importRecipe(recipe.id);
        
        // Let the user know the recipe was saved
        alert(`Recipe "${recipe.title}" saved successfully!`);
      } else {
        // For local recipes or already imported ones, just add to localStorage
        // First normalize the data
        const normalizedRecipe = api.recipes.normalizeRecipe(recipe);
        
        // Get current saved recipes
        const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
        const existingIndex = savedRecipes.findIndex(r => r.id === normalizedRecipe.id);
        
        if (existingIndex >= 0) {
          savedRecipes[existingIndex] = normalizedRecipe;
        } else {
          savedRecipes.push(normalizedRecipe);
        }
        
        // Save back to localStorage
        localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
        alert(`Recipe "${recipe.title}" saved successfully!`);
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Failed to save recipe');
    }
  };

  const toggleSearchMode = () => {
    setSearchMode(prev => prev === 'spoonacular' ? 'local' : 'spoonacular');
  };

  if (activeRecipeId) {
    return (
      <RecipeDetailPage 
        recipeId={activeRecipeId}
        source={searchMode} // Pass the source to know which API to use
        onClose={() => setActiveRecipeId(null)} 
      />
    );
  }

  return (
    <div className="recipe-ideas">
      <div className="ingredient-input-container">
        <div className="ingredient-input-section">
          <div className="search-mode-toggle">
            <label>
              <input
                type="checkbox"
                checked={searchMode === 'local'}
                onChange={toggleSearchMode}
              />
              Search local recipes only
            </label>
          </div>
          
          <div className="ingredient-input">
            <input 
              type="text" 
              value={currentIngredient} 
              onChange={(e) => setCurrentIngredient(e.target.value)}
              placeholder="Enter ingredients (comma or space separated)"
              onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
            />
            <button onClick={addIngredient}>Add</button>
          </div>

          <div className="ingredient-list">
            {ingredients.map(ingredient => (
              <div key={ingredient} className="ingredient-tag">
                {ingredient}
                <button onClick={() => removeIngredient(ingredient)}>×</button>
              </div>
            ))}
            {ingredients.length > 0 && (
              <button 
                className="clear-all-ingredients" 
                onClick={clearAllIngredients}
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        <div className="dietary-preferences">
          <h3>Dietary Preferences</h3>
          {['Vegetarian', 'Vegan', 'Gluten Free', 'Dairy Free'].map(diet => (
            <label key={diet}>
              <input
                type="checkbox"
                checked={dietaryPreferences.includes(diet.toLowerCase())}
                onChange={() => {
                  setDietaryPreferences(prev => 
                    prev.includes(diet.toLowerCase()) 
                      ? prev.filter(d => d !== diet.toLowerCase())
                      : [...prev, diet.toLowerCase()]
                  );
                }}
              />
              {diet}
            </label>
          ))}
        </div>
      </div>

      {isLoading && <div className="loading">Searching for recipes...</div>}
      {error && <div className="error">{error}</div>}

      {recipes.length > 0 && (
        <div className="recipe-results">
          <div className="top-recipe-suggestions">
            <h2>Top Matched Recipes</h2>
            <div className="recipe-grid">
              {recipes.slice(0, 3).map(recipe => (
                <div 
                  key={recipe.id} 
                  className="recipe-card top-recipe"
                  onClick={() => setActiveRecipeId(recipe.id)}
                >
                  <div className="recipe-image">
                    {recipe.image ? (
                      <img src={recipe.image} alt={recipe.title} />
                    ) : (
                      <div className="placeholder-image">
                        <i className="fas fa-utensils"></i>
                      </div>
                    )}
                  </div>
                  <div className="recipe-info">
                    <h3>{recipe.title}</h3>
                    <p>Matched Ingredients: {recipe.matchedIngredientsCount}</p>
                    <button 
                      className="save-button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveRecipe(recipe);
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {recipes.length > 3 && (
            <div className="all-recipe-suggestions">
              <h2>All Recipes ({recipes.length})</h2>
              <div className="recipe-grid">
                {recipes.slice(3).map(recipe => (
                  <div 
                    key={recipe.id} 
                    className="recipe-card"
                    onClick={() => setActiveRecipeId(recipe.id)}
                  >
                    <div className="recipe-image">
                      {recipe.image ? (
                        <img src={recipe.image} alt={recipe.title} />
                      ) : (
                        <div className="placeholder-image">
                          <i className="fas fa-utensils"></i>
                        </div>
                      )}
                    </div>
                    <div className="recipe-info">
                      <h3>{recipe.title}</h3>
                      <p>Matched Ingredients: {recipe.matchedIngredientsCount}</p>
                      <button 
                        className="save-button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveRecipe(recipe);
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RecipeIdeas;