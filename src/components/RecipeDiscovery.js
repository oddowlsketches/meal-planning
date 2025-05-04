import React, { useState, useEffect } from 'react';
import RecipeService from '../services/recipeService.js';
import RecipeDetailPage from './RecipeDetailPage.js';
import './RecipeDiscovery.css';

function RecipeDiscovery() {
  const [randomRecipes, setRandomRecipes] = useState([]);
  const [tagFilter, setTagFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeRecipeId, setActiveRecipeId] = useState(null);
  const [savedNotification, setSavedNotification] = useState('');

  const popularFilters = [
    'vegetarian', 'dinner', 'dessert', 'breakfast',
    'quick', 'italian', 'mexican', 'asian',
    'healthy', 'soup', 'salad', 'pasta'
  ];

  useEffect(() => {
    fetchRandomRecipes();
  }, []);

  const fetchRandomRecipes = async (tags = '') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const recipes = await RecipeService.getRandomRecipes({
        tags: tags,
        number: 8
      });
      
      setRandomRecipes(recipes);
    } catch (error) {
      console.error('Error fetching random recipes:', error);
      setError('Failed to load recipe suggestions. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagChange = (tag) => {
    setTagFilter(tag);
    fetchRandomRecipes(tag);
  };

  const handleSaveRecipe = async (recipe) => {
    try {
      await RecipeService.getRecipeDetails(recipe.id)
        .then(fullRecipe => {
          RecipeService.saveRecipe(fullRecipe);
          setSavedNotification(`"${recipe.title}" saved to My Recipes!`);
          
          // Clear notification after 3 seconds
          setTimeout(() => {
            setSavedNotification('');
          }, 3000);
        });
    } catch (error) {
      console.error('Error saving recipe:', error);
      setError('Failed to save recipe. Please try again.');
    }
  };

  const handleBulkImport = async () => {
    if (window.confirm(`Import all ${randomRecipes.length} recipes to your collection?`)) {
      setIsLoading(true);
      try {
        const results = await RecipeService.batchImportRecipes(
          randomRecipes.map(recipe => recipe.id)
        );
        
        alert(`Successfully imported ${results.successful} out of ${results.total} recipes!`);
        
        // Get fresh recipes after bulk import
        fetchRandomRecipes(tagFilter);
      } catch (error) {
        console.error('Error during bulk import:', error);
        setError('Failed to import recipes. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (activeRecipeId) {
    return (
      <RecipeDetailPage 
        recipeId={activeRecipeId} 
        onClose={() => setActiveRecipeId(null)} 
      />
    );
  }

  return (
    <div className="recipe-discovery">
      <div className="discovery-header">
        <h1>Discover New Recipes</h1>
        <div className="filter-tags">
          <span className="filter-label">Popular filters:</span>
          {popularFilters.map(tag => (
            <button 
              key={tag}
              className={`filter-tag ${tagFilter === tag ? 'active' : ''}`}
              onClick={() => handleTagChange(tag)}
            >
              {tag}
            </button>
          ))}
          {tagFilter && (
            <button 
              className="filter-tag clear"
              onClick={() => handleTagChange('')}
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {isLoading && <div className="loading">Loading recipe suggestions...</div>}
      {error && <div className="error">{error}</div>}
      
      {savedNotification && (
        <div className="save-notification">
          {savedNotification}
        </div>
      )}

      {randomRecipes.length > 0 && (
        <div className="discovery-content">
          <div className="discovery-actions">
            <button onClick={() => fetchRandomRecipes(tagFilter)}>
              <span className="icon">🔄</span> Refresh Suggestions
            </button>
            <button onClick={handleBulkImport}>
              <span className="icon">📥</span> Import All Recipes
            </button>
          </div>

          <div className="recipe-grid">
            {randomRecipes.map(recipe => (
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
                      <span className="icon">🍽️</span>
                    </div>
                  )}
                </div>
                <div className="recipe-info">
                  <h3>{recipe.title}</h3>
                  <div className="recipe-meta">
                    {recipe.readyInMinutes && (
                      <span className="time">{recipe.readyInMinutes} mins</span>
                    )}
                    {recipe.servings && (
                      <span className="servings">{recipe.servings} servings</span>
                    )}
                  </div>
                  <button 
                    className="save-button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveRecipe(recipe);
                    }}
                  >
                    <span className="icon">💾</span> Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {randomRecipes.length === 0 && !isLoading && (
        <div className="no-recipes">
          <p>No recipes found. Try a different filter or refresh.</p>
          <button onClick={() => fetchRandomRecipes('')}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

export default RecipeDiscovery;