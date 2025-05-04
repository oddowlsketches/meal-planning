import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the database file - keeping it in our current directory for simplicity
const dbPath = join(__dirname, 'recipes.db');

// Check if database exists first - if it does, we won't recreate the schema
const dbExists = fs.existsSync(dbPath);

// Initialize database connection
let db;
try {
  db = new Database(dbPath, { verbose: console.log });
  console.log(`Connected to database at ${dbPath}`);
  
  // Initialize tables with a clean schema only if the database doesn't exist
  if (!dbExists) {
    db.exec(`
      -- Drop tables if they exist to ensure clean schema
      DROP TABLE IF EXISTS ingredients;
      DROP TABLE IF EXISTS pantry_items;
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
      
      -- Create pantry_items table (new for receipt scanning feature)
      CREATE TABLE pantry_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT,
        quantity REAL,
        unit TEXT,
        purchase_date TEXT DEFAULT CURRENT_DATE,
        estimated_expiry TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Database schema created successfully');
  }
} catch (err) {
  console.log(`Database error: ${err.message}`);
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
      SELECT id, title, description, instructions, source_url, source_name, recipe_type, cuisine_type, created_at
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
  
  // New method: Find recipes by ingredients
  getRecipesByIngredients(ingredients) {
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return [];
    }
    
    // Create placeholders for the SQL IN clause
    const placeholders = ingredients.map(() => '?').join(',');
    
    const query = db.prepare(`
      SELECT r.id, r.title, r.description, r.recipe_type, r.cuisine_type,
        COUNT(DISTINCT i.id) as matching_ingredients,
        (SELECT COUNT(*) FROM ingredients WHERE recipe_id = r.id) as total_ingredients
      FROM recipes r
      JOIN ingredients i ON r.id = i.recipe_id
      WHERE LOWER(i.name) IN (${placeholders})
      GROUP BY r.id
      ORDER BY matching_ingredients DESC, r.title ASC
    `);
    
    const normalizedIngredients = ingredients.map(ing => ing.toLowerCase());
    return query.all(...normalizedIngredients);
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
      console.log(`Error adding recipe: ${err.message}`);
      throw err;
    }
  },
  
  // Pantry operations
  getPantryItems() {
    const query = db.prepare(`
      SELECT id, name, category, quantity, unit, purchase_date, estimated_expiry
      FROM pantry_items
      ORDER BY name
    `);
    return query.all();
  },
  
  addPantryItem(item) {
    const query = db.prepare(`
      INSERT INTO pantry_items (name, category, quantity, unit, purchase_date, estimated_expiry)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    try {
      const info = query.run(
        item.name,
        item.category || null,
        item.quantity || null,
        item.unit || null,
        item.purchase_date || null,
        item.estimated_expiry || null
      );
      return info.lastInsertRowid;
    } catch (err) {
      console.log(`Error adding pantry item: ${err.message}`);
      throw err;
    }
  },
  
  updatePantryItem(id, item) {
    const query = db.prepare(`
      UPDATE pantry_items
      SET name = ?, category = ?, quantity = ?, unit = ?, purchase_date = ?, estimated_expiry = ?
      WHERE id = ?
    `);
    
    try {
      const info = query.run(
        item.name,
        item.category || null,
        item.quantity || null,
        item.unit || null,
        item.purchase_date || null,
        item.estimated_expiry || null,
        id
      );
      return info.changes > 0;
    } catch (err) {
      console.log(`Error updating pantry item: ${err.message}`);
      throw err;
    }
  },
  
  deletePantryItem(id) {
    const query = db.prepare(`
      DELETE FROM pantry_items
      WHERE id = ?
    `);
    
    try {
      const info = query.run(id);
      return info.changes > 0;
    } catch (err) {
      console.log(`Error deleting pantry item: ${err.message}`);
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
    console.log('Sample data inserted successfully');
  }
};

// Check if we should initialize sample data
if (!dbExists) {
  try {
    dbOperations.insertSampleData();
  } catch (err) {
    console.log(`Error during sample data initialization: ${err.message}`);
  }
}

export default db;