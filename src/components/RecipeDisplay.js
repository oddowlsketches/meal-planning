import React from 'react';
import './RecipeDisplay.css';

function RecipeDisplay({ recipe }) {
  if (!recipe) return null;
  
  // Function to get icon for cooking time
  const getTimeIcon = () => {
    const time = recipe.cookTime || '';
    const minutes = parseInt(time);
    
    if (isNaN(minutes)) return '⏱️';
    if (minutes <= 15) return '🚀';
    if (minutes <= 30) return '⏱️';
    if (minutes <= 60) return '⏰';
    return '⌛';
  };
  
  // Function to get icon for difficulty
  const getDifficultyIcon = () => {
    const difficulty = recipe.difficulty?.toLowerCase() || '';
    
    if (difficulty.includes('easy')) return '😊';
    if (difficulty.includes('medium')) return '😐';
    if (difficulty.includes('hard')) return '😓';
    return '🍳';
  };
  
  // Function to get source badge class
  const getSourceBadgeClass = () => {
    if (!recipe.source) return '';
    if (recipe.source === 'TheMealDB') return 'source-verified';
    if (recipe.source === 'AI-Generated') return 'source-ai';
    return '';
  };
  
  // Function to clean up ingredient text
  const formatIngredient = (ingredient) => {
    return ingredient.trim();
  };
  
  return (
    <div className="recipe-card">
      <div className="recipe-header">
        <h2 className="recipe-title">{recipe.title}</h2>
        
        <div className="recipe-metadata">
          <div className="recipe-info-left">
            {recipe.recipeType && (
              <span className="recipe-type-tag">{recipe.recipeType}</span>
            )}
            
            {recipe.source && (
              <span className={`recipe-source-badge ${getSourceBadgeClass()}`}>
                {recipe.source === 'TheMealDB' ? '✓ Verified Recipe' : recipe.source}
              </span>
            )}
          </div>
          
          <div className="recipe-stats">
            {recipe.cookTime && (
              <span className="recipe-time">
                {getTimeIcon()} {recipe.cookTime}
              </span>
            )}
            {recipe.difficulty && (
              <span className="recipe-difficulty">
                {getDifficultyIcon()} {recipe.difficulty}
              </span>
            )}
          </div>
        </div>
        
        <p className="recipe-description">{recipe.description || recipe.explanation}</p>
        
        {recipe.image && (
          <div className="recipe-image-container">
            <img src={recipe.image} alt={recipe.title} className="recipe-image" />
          </div>
        )}
      </div>
      
      <div className="recipe-body">
        <div className="recipe-ingredients">
          <h3>
            <span className="section-icon">🧂</span> Ingredients
          </h3>
          <ul>
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index}>{formatIngredient(ingredient)}</li>
            ))}
          </ul>
        </div>
        
        <div className="recipe-instructions">
          <h3>
            <span className="section-icon">📝</span> Instructions
          </h3>
          <ol>
            {recipe.instructions.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
      
      {recipe.sourceUrl && (
        <div className="recipe-source-link">
          <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer">
            View Original Recipe
          </a>
        </div>
      )}
    </div>
  );
}

export default RecipeDisplay;