import React, { useState } from 'react';
import RecipeService from '../services/recipeService.js';

function MealPlanGenerator() {
  const [dietaryPreferences, setDietaryPreferences] = useState([]);
  const [numberOfMeals, setNumberOfMeals] = useState(5);
  const [generatedMealPlan, setGeneratedMealPlan] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const availableDiets = [
    'vegetarian', 
    'vegan', 
    'gluten-free', 
    'dairy-free', 
    'low-carb'
  ];

  const handleDietToggle = (diet) => {
    setDietaryPreferences(prev => 
      prev.includes(diet) 
        ? prev.filter(d => d !== diet)
        : [...prev, diet]
    );
  };

  const generateMealPlan = async () => {
    setIsLoading(true);
    try {
      const mealPlan = await RecipeService.generateMealPlan({
        dietaryPreferences,
        numberOfMeals
      });
      setGeneratedMealPlan(mealPlan);
    } catch (error) {
      console.error('Meal plan generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="meal-plan-generator">
      <h2>Meal Plan Generator</h2>
      
      <div className="diet-preferences">
        <h3>Dietary Preferences</h3>
        {availableDiets.map(diet => (
          <label key={diet}>
            <input
              type="checkbox"
              checked={dietaryPreferences.includes(diet)}
              onChange={() => handleDietToggle(diet)}
            />
            {diet}
          </label>
        ))}
      </div>

      <div className="meals-count">
        <label>
          Number of Meals:
          <input
            type="number"
            value={numberOfMeals}
            onChange={(e) => setNumberOfMeals(Number(e.target.value))}
            min="1"
            max="10"
          />
        </label>
      </div>

      <button 
        onClick={generateMealPlan} 
        disabled={isLoading}
      >
        {isLoading ? 'Generating...' : 'Generate Meal Plan'}
      </button>

      <div className="generated-meal-plan">
        <h3>Generated Meal Plan</h3>
        {generatedMealPlan.map((recipe, index) => (
          <div key={recipe.id} className="meal-plan-recipe">
            <h4>Meal {index + 1}: {recipe.title}</h4>
            <img src={recipe.imageType ? `https://spoonacular.com/recipeImages/${recipe.image}` : recipe.image} alt={recipe.title} style={{maxWidth: '200px'}} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default MealPlanGenerator;