import React, { useState } from 'react';
import './SavedRecipesList.css';
import RecipeDisplay from './RecipeDisplay';

function SavedRecipesList({ recipes, onDelete }) {
  console.log('SavedRecipesList received recipes:', recipes);
  const [expandedRecipeId, setExpandedRecipeId] = useState(null);

  const toggleRecipe = (id) => {
    if (expandedRecipeId === id) {
      setExpandedRecipeId(null);
    } else {
      setExpandedRecipeId(id);
    }
  };

  return (
    <div className="saved-recipes-list">
      {(!recipes || recipes.length === 0) ? (
        <p>No saved recipes yet.</p>
      ) : (
        recipes.map((recipe) => (
          <div key={recipe.id || Date.now() + Math.random()} className="saved-recipe-item">
            <div className="saved-recipe-header">
              <h3 onClick={() => toggleRecipe(recipe.id)}>{recipe.title}</h3>
              <div className="saved-recipe-actions">
                <button 
                  onClick={() => toggleRecipe(recipe.id)}
                  className="view-button"
                >
                  {expandedRecipeId === recipe.id ? 'Hide' : 'View'}
                </button>
                <button 
                  onClick={() => onDelete(recipe.id)}
                  className="delete-button"
                >
                  Delete
                </button>
              </div>
            </div>
            
            {expandedRecipeId === recipe.id && (
              <div className="expanded-recipe">
                <RecipeDisplay recipe={recipe} />
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default SavedRecipesList;