import React from 'react';

function Sidebar({ activeSection, setActiveSection }) {
  const sections = [
    { id: 'recipe-ideas', label: 'Recipe Ideas' },
    { id: 'discover', label: 'Discover Recipes' },
    { id: 'my-recipes', label: 'My Recipes' },
    { id: 'my-pantry', label: 'My Pantry' },
    { id: 'meal-plan', label: 'Meal Plan' }
  ];

  return (
    <div className="sidebar">
      <nav>
        {sections.map(section => (
          <button
            key={section.id}
            className={activeSection === section.id ? 'active' : ''}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;
