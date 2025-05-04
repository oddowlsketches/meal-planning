import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import route handlers
import recipeRoutes from './routes/recipes/index.js';
import pantryRoutes from './routes/pantry/index.js';
import spoonacularRoutes from './routes/spoonacular.js';

// Load environment variables
dotenv.config();

// Setup Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Register routes
app.use('/api/recipes', recipeRoutes);
app.use('/api/pantry', pantryRoutes);
app.use('/api/spoonacular', spoonacularRoutes);

// Basic status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Recipe API is running',
    version: '1.0.0'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Recipe API server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /api/status');
  console.log('  GET  /api/recipes');
  console.log('  GET  /api/recipes/:id');
  console.log('  GET  /api/recipes/search');
  console.log('  POST /api/recipes');
  console.log('  POST /api/recipes/suggestions');
  console.log('  GET  /api/pantry/items');
  console.log('  POST /api/pantry/items');
  console.log('  PUT  /api/pantry/items/:id');
  console.log('  DEL  /api/pantry/items/:id');
  console.log('  POST /api/pantry/receipt');
  console.log('  GET  /api/spoonacular/search');
  console.log('  POST /api/spoonacular/search-by-ingredients');
  console.log('  GET  /api/spoonacular/:id');
  console.log('  POST /api/spoonacular/import/:id');
  console.log('  GET  /api/spoonacular/random');
  console.log('  POST /api/spoonacular/meal-plan');
});