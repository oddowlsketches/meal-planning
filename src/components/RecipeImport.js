import React, { useState, useEffect } from 'react';
import './RecipeImport.css';
import api from '../services/api/index.js';

const RecipeImport = ({ onImportSuccess }) => {
  const [activeTab, setActiveTab] = useState('search');  // 'url' or 'search'
  const [url, setUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [serverStatus, setServerStatus] = useState({ status: 'unknown' });
  
  // Check if API server is available on component mount
  useEffect(() => {
    const checkServer = async () => {
      try {
        const status = await api.checkStatus();
        setServerStatus(status);
      } catch (err) {
        console.error('Error checking server status:', err);
        setServerStatus({ status: 'error', message: 'Server unavailable' });
      }
    };
    
    checkServer();
  }, []);

  // Handle URL import
  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // This endpoint doesn't exist yet, this is a placeholder for future functionality
      const response = await api.post('/api/recipes/import-from-url', { url });
      
      // Save to localStorage
      const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
      const normalizedRecipe = api.recipes.normalizeRecipe(response.recipe);
      
      savedRecipes.push(normalizedRecipe);
      localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
      
      setSuccess(`Recipe "${normalizedRecipe.title}" imported successfully!`);
      setUrl('');
      
      // Notify parent component
      if (onImportSuccess) {
        onImportSuccess(normalizedRecipe);
      }
    } catch (err) {
      console.error('Import error:', err);
      setError(`URL import is not available. This feature will be implemented in a future update.`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Spoonacular search
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      setError('Please enter a search term');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Use our new API service
      const results = await api.spoonacular.searchRecipes(searchTerm, { limit: 10 });
      setSearchResults(results);
      
      if (results.length === 0) {
        setError('No recipes found matching your search');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(`Failed to search recipes: ${err.message}`);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle recipe import
  const handleImport = async (id) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Get recipe details from Spoonacular
      const recipe = await api.spoonacular.getRecipeById(id);
      
      // Import to our database
      const importResult = await api.spoonacular.importRecipe(id);
      
      // Save to localStorage as well
      const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
      savedRecipes.push(recipe);
      localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
      
      setSuccess(`Recipe "${recipe.title}" imported successfully!`);
      
      // Remove from search results to indicate it's been imported
      setSearchResults(searchResults.filter(r => r.id !== id));
      
      // Notify parent component
      if (onImportSuccess) {
        onImportSuccess(recipe);
      }
    } catch (err) {
      console.error('Import error:', err);
      setError(`Failed to import recipe: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recipe-import-container">
      <h2>Import Recipes</h2>
      
      <div className="import-tabs">
        <button 
          className={activeTab === 'url' ? 'active' : ''}
          onClick={() => setActiveTab('url')}
        >
          Import from URL
        </button>
        <button 
          className={activeTab === 'search' ? 'active' : ''}
          onClick={() => setActiveTab('search')}
        >
          Search Recipes
        </button>
      </div>
      
      <div className="import-content">
        {activeTab === 'url' ? (
          <div className="url-import">
            <p className="import-description">
              Enter a recipe URL to import directly into your collection.
            </p>
            <form onSubmit={handleUrlSubmit}>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/recipe"
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Importing...' : 'Import Recipe'}
              </button>
            </form>
            <p className="url-note">
              <small>⚠️ URL import is currently under development and may not work for all websites.</small>
            </p>
          </div>
        ) : (
          <div className="search-import">
            <p className="import-description">
              Search for recipes in our database and from Spoonacular's extensive collection.
            </p>
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for recipes..."
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>
            
            {searchResults.length > 0 && (
              <div className="search-results">
                <h3>Search Results</h3>
                <div className="results-grid">
                  {searchResults.map(recipe => (
                    <div key={recipe.id} className="result-card">
                      {recipe.image && (
                        <div className="result-image">
                          <img src={recipe.image} alt={recipe.title} />
                        </div>
                      )}
                      <div className="result-content">
                        <h4>{recipe.title}</h4>
                        <button onClick={() => handleImport(recipe.id)}>
                          Import
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
      </div>
    </div>
  );
};

export default RecipeImport;