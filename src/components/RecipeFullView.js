import React from 'react';
import './RecipeFullView.css';

function RecipeFullView({ recipe, onSave }) {
  if (!recipe) return null;

  const parseInstructions = (instructions) => {
    if (typeof instructions === 'string') {
      return instructions.split(/\.\s*/).filter(step => step.trim());
    }
    return ['No instructions available'];
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const instructionSteps = parseInstructions(recipe.instructions);

  return (
    <div className="recipe-full-view">
      <div className="recipe-header">
        <img 
          src={recipe.image} 
          alt={recipe.title} 
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = 'https://via.placeholder.com/300x200?text=Recipe+Image'
          }}
        />
        <div className="recipe-info">
          <h2>{recipe.title}</h2>
          <div className="recipe-meta">
            <span>Prep Time: {recipe.readyInMinutes} mins</span>
            <span>Servings: {recipe.servings}</span>
          </div>
          <button onClick={onSave} className="save-recipe-btn">
            Save Recipe
          </button>
        </div>
      </div>

      <div className="recipe-details">
        <div className="ingredients">
          <h3>Ingredients</h3>
          <ul>
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </div>

        <div className="instructions">
          <h3>Instructions</h3>
          <ol>
            {instructionSteps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      </div>

      {isValidUrl(recipe.sourceUrl) && (
        <div className="recipe-source">
          <a 
            href={recipe.sourceUrl} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            View Original Recipe
          </a>
        </div>
      )}
    </div>
  );
}

export default RecipeFullView;