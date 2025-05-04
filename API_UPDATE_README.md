# API Service Update for Meal Planner App

This document outlines the changes made to migrate from MCP server integration to a standard Express API.

## Changes Made

1. **Created Express API Server**
   - Standard RESTful API endpoints
   - Recipe management
   - Pantry management
   - Spoonacular API integration

2. **Created New API Services**
   - Central API service for all requests
   - Specialized services for recipes, pantry, and Spoonacular
   - Improved error handling and response normalization

3. **Updated Components**
   - RecipeIdeas
   - RecipeDetailPage
   - MyRecipes
   - RecipeImport

## Setup Instructions

### 1. Start the Express API Server

Navigate to the express-recipe-server directory and start the server:

```bash
cd /Users/emilyschwartzman/meal-planner/express-recipe-server
npm install
npm start
```

### 2. Update the Frontend Components

Run the update scripts to replace the old components with the new ones:

```bash
cd /Users/emilyschwartzman/meal-planner
chmod +x update-components.sh update-services.sh
./update-components.sh
```

### 3. Start the React App

Launch the React development server:

```bash
npm start
```

## API Endpoints

The Express API server exposes the following endpoints:

### Recipe Endpoints
- `GET /api/recipes` - Get all recipes
- `GET /api/recipes/:id` - Get a recipe by ID
- `GET /api/recipes/search` - Search recipes
- `POST /api/recipes` - Add a new recipe
- `POST /api/recipes/suggestions` - Get recipe suggestions based on ingredients

### Pantry Endpoints
- `GET /api/pantry/items` - Get all pantry items
- `POST /api/pantry/items` - Add a new pantry item
- `PUT /api/pantry/items/:id` - Update a pantry item
- `DELETE /api/pantry/items/:id` - Delete a pantry item
- `POST /api/pantry/receipt` - Process a receipt image (placeholder for future AI feature)

### Spoonacular Endpoints
- `GET /api/spoonacular/search` - Search Spoonacular recipes
- `POST /api/spoonacular/search-by-ingredients` - Search by ingredients
- `GET /api/spoonacular/:id` - Get Spoonacular recipe details
- `POST /api/spoonacular/import/:id` - Import a Spoonacular recipe
- `GET /api/spoonacular/random` - Get random recipes
- `POST /api/spoonacular/meal-plan` - Generate a meal plan

## Environment Variables

The Express server requires the following environment variables:

```
PORT=3001
SPOONACULAR_API_KEY=your_spoonacular_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key (for future AI features)
```

The React app requires:

```
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SPOONACULAR_API_KEY=your_spoonacular_api_key (legacy support)
```

## Future Enhancements

### Planned API Features
1. **Receipt Processing with AI** - Automatically extract grocery items from receipt images
2. **Smart Recipe Suggestions** - AI-enhanced recipe recommendations
3. **Meal Planning** - Generate customized meal plans based on preferences and pantry items

### Planned UI Enhancements
1. **Pantry Management UI** - Interface for managing pantry items
2. **Receipt Upload Component** - Upload and process receipt images
3. **Enhanced Recipe Filtering** - More advanced recipe search and filtering options

## Troubleshooting

If you encounter issues with the updated application:

1. **API Connection Issues**
   - Check that the Express server is running
   - Verify the port settings (default: 3001)
   - Check CORS configuration if needed

2. **Component Rendering Issues**
   - Clear your browser cache
   - Check the browser console for errors

3. **Data Not Loading**
   - Verify Spoonacular API key is set correctly
   - Check network requests in browser developer tools

For more help, contact the development team.
