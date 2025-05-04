import React, { useState, useEffect } from 'react';
import RecipeDetailPage from './RecipeDetailPage.js';
import RecipeImport from './RecipeImport.js';
import './MyRecipes.css';
import api from '../services/api/index.js';

function MyRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dietaryFilters, setDietaryFilters] = useState([]);
  const [activeRecipeId, setActiveRecipeId] = useState(null);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    console.log('Loading saved recipes in MyRecipes component');
    
    // Load from localStorage first (for backward compatibility)
    const localStorageRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
    
    // Fetch from API as well (this would be our database recipes)
    api.recipes.getAllRecipes()
      .then(dbRecipes => {
        // Combine and deduplicate recipes
        const allRecipes = [...localStorageRecipes];
        
        // Add database recipes that aren't already in localStorage
        dbRecipes.forEach(dbRecipe => {
          if (!allRecipes.some(r => r.id === dbRecipe.id)) {
            allRecipes.push(api.recipes.normalizeRecipe(dbRecipe));
          }
        });
        
        setRecipes(allRecipes);
        setFilteredRecipes(allRecipes);
      })
      .catch(error => {
        console.error('Error fetching recipes from API:', error);
        // Just use localStorage recipes if API fails
        setRecipes(localStorageRecipes);
        setFilteredRecipes(localStorageRecipes);
      });
  }, []);

  useEffect(() => {
    // Apply filtering based on search term and dietary filters
    let filtered = [...recipes];
    
    if (searchTerm) {
      const terms = searchTerm.toLowerCase().split(/\s+/);
      filtered = filtered.filter(recipe => {
        // Check title
        const titleMatch = terms.some(term => 
          recipe.title.toLowerCase().includes(term)
        );
        
        // Check ingredients
        const ingredientMatch = recipe.ingredients && terms.some(term => 
          recipe.ingredients.some(ing => {
            const ingText = typeof ing === 'string' ? ing.toLowerCase() : ing.name.toLowerCase();
            return ingText.includes(term);
          })
        );
        
        // Check tags/categories
        const tagMatch = recipe.tags && terms.some(term => 
          recipe.tags.some(tag => tag.toLowerCase().includes(term))
        );
        
        return titleMatch || ingredientMatch || tagMatch;
      });
    }

    // Apply dietary filters
    if (dietaryFilters.length > 0) {
      filtered = filtered.filter(recipe => 
        dietaryFilters.every(filter => 
          recipe.tags && recipe.tags.includes(filter.toLowerCase())
        )
      );
    }
    
    setFilteredRecipes(filtered);
  }, [recipes, searchTerm, dietaryFilters]);

  const handleDeleteRecipe = (recipeId) => {
    console.log('Deleting recipe:', recipeId);
    
    // Remove from localStorage
    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
    const updatedSavedRecipes = savedRecipes.filter(r => r.id !== recipeId);
    localStorage.setItem('savedRecipes', JSON.stringify(updatedSavedRecipes));
    
    // Update state
    setRecipes(prev => prev.filter(r => r.id !== recipeId));
  };

  const toggleDietaryFilter = (filter) => {
    setDietaryFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const handleImportSuccess = (importedRecipe) => {
    // Refresh recipes list
    setRecipes(prev => {
      const newRecipes = [...prev];
      const existingIndex = newRecipes.findIndex(r => r.id === importedRecipe.id);
      
      if (existingIndex >= 0) {
        newRecipes[existingIndex] = importedRecipe;
      } else {
        newRecipes.push(importedRecipe);
      }
      
      return newRecipes;
    });
    
    // Show a success message
    alert(`Recipe "${importedRecipe.title}" imported successfully!`);
  };
  
  const refreshRecipes = () => {
    console.log('Manually refreshing recipes');
    
    // Refresh from localStorage
    const localStorageRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
    
    // Refresh from API
    api.recipes.getAllRecipes()
      .then(dbRecipes => {
        // Combine and deduplicate recipes
        const allRecipes = [...localStorageRecipes];
        
        // Add database recipes that aren't already in localStorage
        dbRecipes.forEach(dbRecipe => {
          if (!allRecipes.some(r => r.id === dbRecipe.id)) {
            allRecipes.push(api.recipes.normalizeRecipe(dbRecipe));
          }
        });
        
        setRecipes(allRecipes);
      })
      .catch(error => {
        console.error('Error refreshing recipes from API:', error);
        // Just use localStorage recipes if API fails
        setRecipes(localStorageRecipes);
      });
  };

  if (activeRecipeId) {
    // Determine if recipe is from local database or saved recipes
    const recipe = recipes.find(r => r.id === activeRecipeId);
    return (
      <RecipeDetailPage 
        recipeId={activeRecipeId}
        source="local" // Assume all recipes in MyRecipes are local
        onClose={() => setActiveRecipeId(null)} 
      />
    );
  }

  const renderRecipe = (recipe) => {
    const renderImage = () => {
      if (recipe.image) {
        return <img src={recipe.image} alt={recipe.title} />;
      }
      return (
        <div className="placeholder-image">
          <i className="fas fa-utensils"></i>
        </div>
      );
    };

    return (
      <div 
        key={recipe.id} 
        className="recipe-card"
        onClick={() => setActiveRecipeId(recipe.id)}
      >
        <div className="recipe-image">
          {renderImage()}
          <button 
            className="delete-button"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteRecipe(recipe.id);
            }}
          >
            Delete
          </button>
        </div>
        <div className="recipe-details">
          <h3>{recipe.title}</h3>
          {(recipe.readyInMinutes !== 'N/A' || recipe.servings !== 'N/A') && (
            <div className="recipe-metadata">
              {recipe.readyInMinutes && recipe.readyInMinutes !== 'N/A' && (
                <span>🕒 {recipe.readyInMinutes} mins</span>
              )}
              {recipe.servings && recipe.servings !== 'N/A' && (
                <span>👥 {recipe.servings} servings</span>
              )}
            </div>
          )}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="recipe-tags">
              {recipe.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="my-recipes">
      <div className="my-recipes-header">
        <h1>My Recipes</h1>
        <div className="header-actions">
          <button 
            className="refresh-button"
            onClick={refreshRecipes}
          >
            Refresh
          </button>
          <button 
            className="import-toggle-button"
            onClick={() => setShowImport(!showImport)}
          >
            {showImport ? 'Hide Import' : 'Import Recipe'}
          </button>
        </div>
      </div>

      {showImport && (
        <RecipeImport onImportSuccess={handleImportSuccess} />
      )}
      
      <div className="recipes-filters">
        <div className="search-bar">
          <input 
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="dietary-filters">
          {['Vegetarian', 'Vegan', 'Gluten Free', 'Dairy Free'].map(filter => (
            <label key={filter}>
              <input
                type="checkbox"
                checked={dietaryFilters.includes(filter.toLowerCase())}
                onChange={() => toggleDietaryFilter(filter.toLowerCase())}
              />
              {filter}
            </label>
          ))}
        </div>
      </div>

      <div className="recipes-container">
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map(renderRecipe)
        ) : (
          <p className="no-recipes">
            No recipes found. Try adding recipes from the Recipe Ideas section or use the Import Recipe button above.
          </p>
        )}
      </div>
    </div>
  );
}

export default MyRecipes;