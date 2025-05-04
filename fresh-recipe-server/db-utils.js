import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the database file - keeping it in our current directory for simplicity
const dbPath = join(__dirname, 'recipes.db');

// Initialize database connection
let db;
try {
  db = new Database(dbPath, { verbose: console.error });
  console.error(`Connected to database at ${dbPath}`);
  
  // Initialize tables with a clean schema
  db.exec(`
    -- Drop tables if they exist to ensure clean schema
    DROP TABLE IF EXISTS ingredients;
    DROP TABLE IF EXISTS recipes;
    
    -- Create recipes table
    CREATE TABLE recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      instructions TEXT NOT NULL,
      source_url TEXT,
      source_name TEXT,
      recipe_type TEXT,
      cuisine_type TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create ingredients table with foreign key to recipes
    CREATE TABLE ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      quantity TEXT,
      unit TEXT,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );
  `);
  
  console.error('Database schema created successfully');
} catch (err) {
  console.error(`Database error: ${err.message}`);
  throw err;
}

// Database operations
export const dbOperations = {
  // Get all recipes (basic info)
  getAllRecipes() {
    const query = db.prepare(`
      SELECT id, title, description, recipe_type, cuisine_type
      FROM recipes
      ORDER BY id
    `);
    return query.all();
  },
  
  // Get a single recipe with all details
  getRecipeById(id) {
    const recipeQuery = db.prepare(`
      SELECT id, title, description, instructions, source_url, source_name, recipe_type, cuisine_type
      FROM recipes
      WHERE id = ?
    `);
    
    const ingredientsQuery = db.prepare(`
      SELECT name, quantity, unit
      FROM ingredients
      WHERE recipe_id = ?
      ORDER BY id
    `);
    
    const recipe = recipeQuery.get(id);
    if (!recipe) return null;
    
    const ingredients = ingredientsQuery.all(id);
    return { ...recipe, ingredients };
  },
  
  // Search recipes by title, ingredients, type, or cuisine
  searchRecipes(searchTerm) {
    const query = db.prepare(`
      SELECT DISTINCT r.id, r.title, r.description, r.recipe_type, r.cuisine_type
      FROM recipes r
      LEFT JOIN ingredients i ON r.id = i.recipe_id
      WHERE 
        r.title LIKE ? OR
        r.description LIKE ? OR
        i.name LIKE ? OR
        r.recipe_type LIKE ? OR
        r.cuisine_type LIKE ?
      ORDER BY r.id
    `);
    
    const searchPattern = `%${searchTerm}%`;
    return query.all(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  },
  
  // Add a new recipe with ingredients
  addRecipe(recipe) {
    const insertRecipe = db.prepare(`
      INSERT INTO recipes (title, description, instructions, source_url, source_name, recipe_type, cuisine_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertIngredient = db.prepare(`
      INSERT INTO ingredients (recipe_id, name, quantity, unit)
      VALUES (?, ?, ?, ?)
    `);
    
    const transaction = db.transaction((recipe) => {
      const info = insertRecipe.run(
        recipe.title,
        recipe.description || '',
        recipe.instructions,
        recipe.source_url || '',
        recipe.source_name || '',
        recipe.recipe_type || '',
        recipe.cuisine_type || ''
      );
      
      const recipeId = info.lastInsertRowid;
      
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach(ingredient => {
          if (typeof ingredient === 'string') {
            // Handle simple string ingredients
            insertIngredient.run(recipeId, ingredient, null, null);
          } else {
            // Handle structured ingredients
            insertIngredient.run(
              recipeId,
              ingredient.name,
              ingredient.quantity || null,
              ingredient.unit || null
            );
          }
        });
      }
      
      return recipeId;
    });
    
    try {
      return transaction(recipe);
    } catch (err) {
      console.error(`Error adding recipe: ${err.message}`);
      throw err;
    }
  },
  
  // Insert sample data
  insertSampleData() {
    const sampleRecipes = [
      {
        title: 'Simple Pasta',
        description: 'A quick and easy pasta dish',
        instructions: 'Cook pasta according to package. Sauté garlic in oil. Mix with pasta and cheese.',
        recipe_type: 'main course',
        cuisine_type: 'Italian',
        ingredients: [
          '8 oz pasta',
          '2 tbsp olive oil',
          '2 cloves garlic',
          '1/4 cup parmesan'
        ]
      },
      {
        title: 'Avocado Toast',
        description: 'Classic breakfast toast with avocado',
        instructions: 'Toast bread. Mash avocado and spread on toast. Sprinkle with salt and pepper flakes.',
        recipe_type: 'breakfast',
        cuisine_type: 'American',
        ingredients: [
          '1 slice bread',
          '1/2 avocado',
          'Salt to taste',
          'Red pepper flakes (optional)'
        ]
      },
      {
        title: 'Herbed Whole Wheat Pasta',
        description: 'Nutritious pasta with fresh herbs',
        instructions: 'Cook pasta according to package directions. In a pan, heat olive oil and sauté garlic until fragrant. Add cooked pasta to the pan along with chopped herbs. Toss well to combine. Remove from heat and add parmesan cheese, salt, and pepper.',
        recipe_type: 'main course',
        cuisine_type: 'Mediterranean',
        ingredients: [
          '8 oz whole wheat pasta',
          '3 tbsp olive oil',
          '2 cloves garlic, minced',
          '1/4 cup fresh basil, chopped',
          '2 tbsp fresh parsley, chopped',
          '1 tbsp fresh rosemary, chopped',
          '1/4 cup grated parmesan cheese',
          'Salt and pepper to taste'
        ]
      }
    ];
    
    sampleRecipes.forEach(recipe => this.addRecipe(recipe));
    console.error('Sample data inserted successfully');
  }
};

// Auto-initialize sample data
try {
  dbOperations.insertSampleData();
} catch (err) {
  console.error(`Error during sample data initialization: ${err.message}`);
}

export default db;
