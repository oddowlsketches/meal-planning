import React, { useState } from 'react';
import Sidebar from './components/Sidebar.js';
import RecipeIdeas from './components/RecipeIdeas.js';
import MyRecipes from './components/MyRecipes.js';
import RecipeDiscovery from './components/RecipeDiscovery.js';
import Pantry from './components/Pantry/Pantry.js';
import './App.css';

function App() {
  const [activeSection, setActiveSection] = useState('recipe-ideas');

  return (
    <div className="App">
      <Sidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
      />
      <div className="content-area">
        {activeSection === 'recipe-ideas' && <RecipeIdeas />}
        {activeSection === 'my-recipes' && <MyRecipes />}
        {activeSection === 'discover' && <RecipeDiscovery />}
        {activeSection === 'my-pantry' && <Pantry />}
        {activeSection === 'meal-plan' && <div>Meal Plan Coming Soon</div>}
      </div>
    </div>
  );
}

export default App;
