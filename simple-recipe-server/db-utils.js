import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the database file
const dbPath = join(dirname(__dirname), 'db', 'recipes.db');

// Initialize database connection
let db;
try {
  db = new Database(dbPath, { verbose: console.error });
  console.error(`Connected to database at ${dbPath}`);
} catch (err) {
  console.error(`Database error: ${err.message}`);
  throw err;
}

// Parse ingredients and instructions from stored strings
const parseJsonField = (field) => {
  if (!field) return [];
  try {
    return JSON.parse(field);
  } catch (e) {
    console.error(`Error parsing JSON field: ${e.message}`);
    return [];
  }
};

// Database operations
export const dbOperations = {
  // Get all recipes (basic info)
  getAllRecipes() {
    const query = db.prepare(`
      SELECT id, title, description
      FROM recipes
      ORDER BY id
    `);
    return query.all();
  },
  
  // Get a single recipe with all details
  getRecipeById(id) {
    const query = db.prepare(`
      SELECT id, title, source, source_url, description, cook_time, 
             ingredients, instructions, image_url, cuisine_type, recipe_type
      FROM recipes
      WHERE id = ?
    `);
    
    const recipe = query.get(id);
    if (!recipe) return null;
    
    // Parse ingredients and instructions if they're stored as JSON strings
    recipe.ingredients = parseJsonField(recipe.ingredients);
    recipe.instructions = parseJsonField(recipe.instructions);
    
    return recipe;
  },
  
  // Search recipes by title or ingredients
  searchRecipes(searchTerm) {
    const query = db.prepare(`
      SELECT id, title, description
      FROM recipes
      WHERE title LIKE ? OR description LIKE ?
      ORDER BY id
    `);
    
    const searchPattern = `%${searchTerm}%`;
    return query.all(searchPattern, searchPattern);
  },
  
  // Add a new recipe
  addRecipe(recipe) {
    // Prepare the SQL statement with the actual columns in your database
    const insertRecipe = db.prepare(`
      INSERT INTO recipes (
        title, source, source_url, description, ingredients, 
        instructions, image_url, cuisine_type, recipe_type
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Convert arrays to JSON strings for storage
    let ingredientsJson = JSON.stringify(recipe.ingredients || []);
    let instructionsJson = JSON.stringify(recipe.instructions ? 
      [recipe.instructions] : []);
    
    try {
      const info = insertRecipe.run(
        recipe.title,
        recipe.source_name || null,
        recipe.source_url || null,
        recipe.description || null,
        ingredientsJson,
        instructionsJson,
        recipe.image_url || null,
        recipe.cuisine_type || 'Unknown',
        recipe.recipe_type || 'Unknown'
      );
      
      return info.lastInsertRowid;
    } catch (err) {
      console.error(`Error adding recipe: ${err.message}`);
      throw err;
    }
  }
};

export default db;
