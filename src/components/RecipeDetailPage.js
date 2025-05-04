import React, { useState, useEffect } from 'react';
import api from '../services/api/index.js';
import './RecipeDetailPage.css';

function cleanInstructions(text) {
  if (!text) return '';
  return text
    .replace(/<\/?ol>|<\/?li>|<\/?p>|<\/?div>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function RecipeDetailPage({ recipeId, source = 'spoonacular', onClose }) {
  const [recipe, setRecipe] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRecipeDetails() {
      try {
        setIsLoading(true);
        
        let recipeData;
        
        if (source === 'local') {
          // Fetch from local database
          recipeData = await api.recipes.getRecipeById(recipeId);
        } else {
          // Fetch from Spoonacular
          recipeData = await api.spoonacular.getRecipeById(recipeId);
        }
        
        if (!recipeData) {
          throw new Error('Recipe not found');
        }
        
        // Normalize the recipe data
        const normalizedRecipe = api.recipes.normalizeRecipe(recipeData);
        setRecipe(normalizedRecipe);
        
        // Check if recipe is already saved
        const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
        setIsSaved(savedRecipes.some(r => r.id === recipeId));
      } catch (err) {
        console.error('Error fetching recipe details:', err);
        setError('Failed to load recipe details');
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecipeDetails();
  }, [recipeId, source]);

  const handleSave = async () => {
    if (recipe) {
      try {
        if (source === 'spoonacular') {
          // Import the recipe to our database first
          await api.spoonacular.importRecipe(recipe.id);
        }
        
        // Save to localStorage for frontend use
        const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
        const existingIndex = savedRecipes.findIndex(r => r.id === recipe.id);
        
        if (existingIndex >= 0) {
          savedRecipes[existingIndex] = recipe;
        } else {
          savedRecipes.push(recipe);
        }
        
        localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
        setIsSaved(true);
        
        // Create a subtle save notification
        const savedBanner = document.createElement('div');
        savedBanner.textContent = `Recipe "${recipe.title}" saved!`;
        savedBanner.style.position = 'fixed';
        savedBanner.style.bottom = '20px';
        savedBanner.style.right = '20px';
        savedBanner.style.backgroundColor = '#4CAF50';
        savedBanner.style.color = 'white';
        savedBanner.style.padding = '10px';
        savedBanner.style.borderRadius = '5px';
        savedBanner.style.zIndex = '1000';
        savedBanner.style.transition = 'opacity 0.3s';
        document.body.appendChild(savedBanner);
        
        setTimeout(() => {
          savedBanner.style.opacity = '0';
          setTimeout(() => {
            document.body.removeChild(savedBanner);
          }, 300);
        }, 3000);
      } catch (error) {
        console.error('Error saving recipe:', error);
        alert('Failed to save recipe');
      }
    }
  };

  const handleCopyRecipe = () => {
    if (recipe) {
      const recipeText = `
${recipe.title}

Ingredients:
${recipe.ingredients.map(ing => typeof ing === 'string' ? `- ${ing}` : `- ${ing.name}`).join('\n')}

Instructions:
${recipe.instructions.split('\n').map((step, index) => `${index + 1}. ${cleanInstructions(step)}`).join('\n')}

Source: ${recipe.sourceUrl || 'Unknown'}
      `;

      navigator.clipboard.writeText(recipeText).then(() => {
        alert('Recipe copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy recipe:', err);
      });
    }
  };

  if (isLoading) return <div className="loading">Loading recipe details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!recipe) return <div className="error">No recipe found</div>;

  return (
    <div className="recipe-detail-page">
      <div className="recipe-detail-header">
        <button className="close-button" onClick={onClose}>
          ← Back to Results
        </button>
        <div className="recipe-actions">
          <button 
            className={`save-button ${isSaved ? 'saved' : ''}`} 
            onClick={handleSave}
          >
            {isSaved ? 'Saved' : 'Save Recipe'}
          </button>
          <button 
            className="copy-button" 
            onClick={handleCopyRecipe}
          >
            Copy Recipe
          </button>
        </div>
      </div>

      <div className="recipe-detail-content">
        <div className="recipe-detail-image">
          {recipe.image ? (
            <img src={recipe.image} alt={recipe.title} />
          ) : (
            <div className="placeholder-image">
              <i className="fas fa-utensils"></i>
            </div>
          )}
        </div>

        <div className="recipe-detail-info">
          <h1>{recipe.title}</h1>
          
          <div className="recipe-metadata">
            {recipe.readyInMinutes && recipe.readyInMinutes !== 'N/A' && (
              <span>🕒 Prep Time: {recipe.readyInMinutes} mins</span>
            )}
            {recipe.servings && recipe.servings !== 'N/A' && (
              <span>👥 Servings: {recipe.servings}</span>
            )}
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="recipe-tags">
                {recipe.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            )}
          </div>

          <div className="recipe-ingredients">
            <h2>Ingredients</h2>
            <ul>
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index}>
                  {typeof ingredient === 'string' 
                    ? ingredient 
                    : `${ingredient.quantity || ''} ${ingredient.unit || ''} ${ingredient.name}`.trim()}
                </li>
              ))}
            </ul>
          </div>

          <div className="recipe-instructions">
            <h2>Instructions</h2>
            <ol>
              {recipe.instructions.split('\n').filter(step => step.trim()).map((step, index) => (
                <li key={index}>{cleanInstructions(step.trim())}</li>
              ))}
            </ol>
          </div>

          {recipe.sourceUrl && (
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
      </div>
    </div>
  );
}

export default RecipeDetailPage;