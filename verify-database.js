import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyDatabase() {
  try {
    // Open the database
    const db = await open({
      filename: path.join(__dirname, 'db', 'recipes.db'),
      driver: sqlite3.Database
    });

    // Count total recipes
    const totalRecipesResult = await db.get('SELECT COUNT(*) as count FROM recipes');
    console.log('Total number of recipes:', totalRecipesResult.count);

    // Check for 'Recent Recipes'
    const recentRecipesResult = await db.all('SELECT * FROM recipes WHERE title = "Recent Recipes"');
    console.log('Number of "Recent Recipes" entries:', recentRecipesResult.length);

    // Check for empty ingredient/instruction entries
    const emptyEntriesResult = await db.all('SELECT id, title FROM recipes WHERE ingredients = "[]" OR instructions = "[]"');
    console.log('Number of entries with empty ingredients/instructions:', emptyEntriesResult.length);
    if (emptyEntriesResult.length > 0) {
      console.log('Entries with empty data:');
      emptyEntriesResult.forEach(entry => {
        console.log(`- ID: ${entry.id}, Title: ${entry.title}`);
      });
    }

    // Get details of the last added recipe
    const lastRecipe = await db.get('SELECT * FROM recipes ORDER BY id DESC LIMIT 1');
    console.log('\nLast Added Recipe:');
    console.log('ID:', lastRecipe.id);
    console.log('Title:', lastRecipe.title);
    console.log('Source:', lastRecipe.source);
    console.log('Ingredients:', lastRecipe.ingredients);
    console.log('Instructions:', lastRecipe.instructions);

    // Close the database
    await db.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyDatabase();
