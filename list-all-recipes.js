import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function listAllRecipes() {
  try {
    // Open the database
    const db = await open({
      filename: path.join(__dirname, 'db', 'recipes.db'),
      driver: sqlite3.Database
    });

    // Query all recipes
    const recipes = await db.all('SELECT id, title, source, source_url, ingredients, instructions FROM recipes');

    console.log('All Recipes:');
    recipes.forEach(recipe => {
      console.log('\n---');
      console.log(`ID: ${recipe.id}`);
      console.log(`Title: ${recipe.title}`);
      console.log(`Source: ${recipe.source}`);
      console.log(`Source URL: ${recipe.source_url}`);
      console.log('Ingredients:', recipe.ingredients);
      console.log('Instructions:', recipe.instructions);
    });

    // Close the database
    await db.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

listAllRecipes();
