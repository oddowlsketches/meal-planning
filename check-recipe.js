import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Open the database
const dbPath = path.join(__dirname, 'db', 'recipes.db');

// Wrap database operations in a promise
function queryRecipe(id) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(new Error('Error opening database: ' + err.message));
        return;
      }
      console.log('Database opened successfully');

      // Query the specific recipe
      db.get('SELECT * FROM recipes WHERE id = ?', [id], (err, row) => {
        // Close the database first
        db.close((closeErr) => {
          if (closeErr) {
            console.error('Error closing database:', closeErr);
          }
        });

        if (err) {
          reject(new Error('Error querying recipe: ' + err.message));
          return;
        }

        if (!row) {
          reject(new Error('No recipe found with the specified ID'));
          return;
        }

        resolve(row);
      });
    });
  });
}

// Main function to run the query
async function main() {
  try {
    const recipe = await queryRecipe(3);

    console.log('Full Recipe Record:');
    console.log(JSON.stringify(recipe, null, 2));

    console.log('\nRaw Ingredients:', recipe.ingredients);
    console.log('Raw Instructions:', recipe.instructions);
    
    // Additional parsing attempts
    try {
      const ingredients = recipe.ingredients ? JSON.parse(recipe.ingredients) : null;
      const instructions = recipe.instructions ? JSON.parse(recipe.instructions) : null;
      
      console.log('\nParsed Ingredients:', ingredients);
      console.log('Parsed Instructions:', instructions);
    } catch (parseError) {
      console.error('\nJSON Parsing Error:', parseError);
    }
  } catch (error) {
    console.error(error.message);
  }
}

// Run the main function
main();
