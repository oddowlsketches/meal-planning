# Recipe API Server

This is the RESTful API backend for the meal planning application. It provides endpoints for recipe management, pantry tracking, and AI-powered features.

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   - Create a `.env` file in the root directory
   - Add the following variables:
     ```
     PORT=3001
     SPOONACULAR_API_KEY=your_spoonacular_api_key
     ANTHROPIC_API_KEY=your_anthropic_api_key
     ```

4. Start the server:
   ```
   npm start
   ```

## API Endpoints

### Status

- `GET /api/status` - Check API server status

### Recipes

- `GET /api/recipes` - Get all recipes
- `GET /api/recipes/:id` - Get a specific recipe by ID
- `GET /api/recipes/search?query=keyword` - Search recipes by keyword
- `POST /api/recipes` - Add a new recipe

### Pantry

- `GET /api/pantry/items` - Get all pantry items
- `POST /api/pantry/items` - Add a new pantry item
- `PUT /api/pantry/items/:id` - Update a pantry item
- `DELETE /api/pantry/items/:id` - Delete a pantry item
- `POST /api/pantry/receipt` - Process a receipt image to extract grocery items

## Database

The application uses SQLite for storing recipe and pantry data. The database file is created automatically on first run.

## AI Features

*Coming soon:*
- Smart recipe suggestions based on pantry contents
- Receipt image processing to automatically add grocery items to pantry
- Ingredient substitution recommendations