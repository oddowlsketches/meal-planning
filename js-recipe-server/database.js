// database.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using fileURLToPath
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detailed logging function
function log(...args) {
  console.error('[DATABASE]', ...args);
}

class RecipeDatabase {
  constructor() {
    this.dbPath = path.join(__dirname, '..', 'db', 'recipes.db');
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;
    
    try {
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });
      
      log("Database initialized successfully");
      return this.db;
    } catch (error) {
      log("Error initializing database:", error);
      throw error;
    }
  }
  
  // Safely parse JSON fields (handles both array and string formats)
  parseJsonField(field) {
    if (!field) return [];
    
    // If it's already an array, return it
    if (Array.isArray(field)) return field;
    
    try {
      // If it's an empty array string or null, return an empty array
      if (field === '[]' || field === null) {
        return [];
      }
      
      // Try parsing as JSON
      const parsed = JSON.parse(field);
      
      // If parsing succeeds and it's an array, return it
      return Array.isArray(parsed) ? parsed : [field];
    } catch (error) {
      // If it's not valid JSON, treat it as a string
      return typeof field === 'string' ? [field] : [];
    }
  }

  // List all recipes
  async listRecipes() {
    await this.init();
    return this.db.all(`
      SELECT id, title, source, recipe_type, cuisine_type 
      FROM recipes 
      ORDER BY title
    `);
  }

  // Get recipe by ID
  async getRecipeById(id) {
    await this.init();
    const recipe = await this.db.get('SELECT * FROM recipes WHERE id = ?', id);
    
    if (!recipe) {
      throw new Error(`No recipe found with ID ${id}`);
    }
    
    // Parse JSON fields
    recipe.ingredients = this.parseJsonField(recipe.ingredients);
    recipe.instructions = this.parseJsonField(recipe.instructions);
    
    return recipe;
  }

  // Search recipes
  async searchRecipes(query) {
    await this.init();
    return this.db.all(`
      SELECT id, title, source, recipe_type, cuisine_type 
      FROM recipes 
      WHERE title LIKE ? OR ingredients LIKE ? OR description LIKE ?
      ORDER BY title
    `, [`%${query}%`, `%${query}%`, `%${query}%`]);
  }

  // Add a recipe
  async addRecipe(recipe) {
    await this.init();
    
    try {
      // Begin transaction
      await this.db.run('BEGIN TRANSACTION');
      
      // Ensure ingredients and instructions are stored as JSON if they're arrays
      const ingredientsJson = Array.isArray(recipe.ingredients) 
        ? JSON.stringify(recipe.ingredients) 
        : recipe.ingredients;
        
      const instructionsJson = Array.isArray(recipe.instructions) 
        ? JSON.stringify(recipe.instructions) 
        : recipe.instructions;
      
      // Insert recipe
      const result = await this.db.run(`
        INSERT INTO recipes (
          title, source, source_url, description, cook_time, 
          ingredients, instructions, image_url, dietary_info, 
          cuisine_type, recipe_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        recipe.title,
        recipe.source || 'Manual Entry',
        recipe.source_url || null,
        recipe.description || null,
        recipe.cook_time || null,
        ingredientsJson,
        instructionsJson,
        recipe.image_url || null,
        recipe.dietary_info || null,
        recipe.cuisine_type || null,
        recipe.recipe_type || null
      ]);
      
      // Commit transaction
      await this.db.run('COMMIT');
      
      return { 
        id: result.lastID, 
        title: recipe.title 
      };
    } catch (error) {
      // Rollback on error
      await this.db.run('ROLLBACK');
      log("Error adding recipe:", error);
      throw error;
    }
  }
}

export { RecipeDatabase };
