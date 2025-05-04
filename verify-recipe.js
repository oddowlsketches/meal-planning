import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyRecipe(id) {
  try {
    // Open the database
    const db = await open({
      filename: path.join(__dirname, 'db', 'recipes.db'),
      driver: sqlite3.Database
    });

    // Query the recipe
    const recipe = await db.get('SELECT * FROM recipes WHERE id = ?', id);

    if (!recipe) {
      console.log(`No recipe found with ID ${id}`);
      return;
    }

    console.log('Full Recipe Record:');
    console.log('ID:', recipe.id);
    console.log('Title:', recipe.title);
    console.log('Source:', recipe.source);
    console.log('Source URL:', recipe.source_url);

    // Detailed field inspection
    console.log('\nDetailed Field Inspection:');
    console.log('Ingredients (raw):', recipe.ingredients);
    console.log('Instructions (raw):', recipe.instructions);

    // Try parsing JSON fields
    try {
      const ingredients = recipe.ingredients ? JSON.parse(recipe.ingredients) : null;
      const instructions = recipe.instructions ? JSON.parse(recipe.instructions) : null;
      
      console.log('\nParsed Ingredients:', ingredients);
      console.log('Parsed Instructions:', instructions);
    } catch (parseError) {
      console.error('\nJSON Parsing Error:', parseError);
    }

    // Close the database
    await db.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

// Check recipe with ID 1
verifyRecipe(1);
