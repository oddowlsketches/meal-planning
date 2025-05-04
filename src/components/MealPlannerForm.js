import React, { useState } from 'react';
import './MealPlannerForm.css';

function MealPlannerForm({ onSubmit }) {
  const [ingredients, setIngredients] = useState('');
  const [cuisine, setCuisine] = useState('Any');
  const [dietaryPreferences, setDietaryPreferences] = useState([]);

  const cuisineOptions = [
    'Any', 'Italian', 'Mexican', 'Chinese', 'Indian', 
    'Japanese', 'Thai', 'Mediterranean', 'American', 'French'
  ];

  const dietaryOptions = [
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'gluten-free', label: 'Gluten-Free' },
    { value: 'dairy-free', label: 'Dairy-Free' },
    { value: 'keto', label: 'Keto' },
    { value: 'low-carb', label: 'Low-Carb' }
  ];

  const handleDietaryChange = (e) => {
    const value = e.target.value;
    
    if (e.target.checked) {
      setDietaryPreferences([...dietaryPreferences, value]);
    } else {
      setDietaryPreferences(dietaryPreferences.filter(item => item !== value));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Split ingredients by commas and trim whitespace
    const ingredientsList = ingredients
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
    
    onSubmit({
      ingredients: ingredientsList,
      cuisine,
      dietaryPreferences
    });
  };

  return (
    <div className="form-container">
      <h2>What's in Your Kitchen?</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="ingredients">Ingredients (separate with commas):</label>
          <textarea
            id="ingredients"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="e.g., chicken, rice, broccoli, olive oil"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="cuisine">Cuisine Type:</label>
          <select
            id="cuisine"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
          >
            {cuisineOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Dietary Preferences:</label>
          <div className="checkbox-group">
            {dietaryOptions.map(option => (
              <div key={option.value} className="checkbox-item">
                <input
                  type="checkbox"
                  id={option.value}
                  value={option.value}
                  checked={dietaryPreferences.includes(option.value)}
                  onChange={handleDietaryChange}
                />
                <label htmlFor={option.value}>{option.label}</label>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="generate-button">Generate Recipe</button>
      </form>
    </div>
  );
}

export default MealPlannerForm;