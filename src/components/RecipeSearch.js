import React, { useState } from 'react';
import RecipeService from '../services/recipeService.js';

function RecipeSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [diet, setDiet] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const results = await RecipeService.searchRecipes({
        query: searchQuery,
        diet: diet,
        maxReadyTime: 45
      });
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportRecipe = async (recipeId) => {
    const importedRecipe = await RecipeService.importRecipe(recipeId);
    if (importedRecipe) {
      alert(`Imported recipe: ${importedRecipe.title}`);
    }
  };

  return (
    <div className="recipe-search">
      <h2>Recipe Discovery</h2>
      <form onSubmit={handleSearch}>
        <input 
          type="text" 
          placeholder="Search recipes..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select 
          value={diet} 
          onChange={(e) => setDiet(e.target.value)}
        >
          <option value="">All Diets</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="vegan">Vegan</option>
          <option value="gluten-free">Gluten Free</option>
        </select>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div className="search-results">
        {searchResults.map(recipe => (
          <div key={recipe.id} className="recipe-card">
            <img src={recipe.image} alt={recipe.title} style={{maxWidth: '200px'}} />
            <h3>{recipe.title}</h3>
            <button onClick={() => handleImportRecipe(recipe.id)}>
              Import Recipe
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecipeSearch;