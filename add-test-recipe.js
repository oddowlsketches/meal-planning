import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addTestRecipe() {
  try {
    // Open the database
    const db = await open({
      filename: path.join(__dirname, 'db', 'recipes.db'),
      driver: sqlite3.Database
    });

    // Define a clean test recipe
    const testRecipe = {
      title: "Classic Margherita Pizza",
      source: "Homemade Cooking",
      source_url: "https://example.com/margherita-pizza",
      description: "A classic Italian pizza with simple, fresh ingredients",
      cook_time: "15-20 minutes",
      ingredients: JSON.stringify([
        "1 pizza dough",
        "1/2 cup tomato sauce",
        "8 oz fresh mozzarella, sliced",
        "Fresh basil leaves",
        "Extra virgin olive oil",
        "Salt and pepper to taste"
      ]),
      instructions: JSON.stringify([
        "Preheat oven to 475°F (245°C)",
        "Roll out pizza dough on a baking sheet",
        "Spread tomato sauce evenly",
        "Add mozzarella slices",
        "Bake for 12-15 minutes until crust is golden",
        "Remove from oven, top with fresh basil leaves",
        "Drizzle with olive oil, add salt and pepper",
        "Slice and serve hot"
      ]),
      image_url: null,
      cuisine_type: "Italian",
      recipe_type: "Main Course"
    };

    // Remove existing 'Recent Recipes' and empty entries
    await db.run('DELETE FROM recipes WHERE title = "Recent Recipes" OR ingredients = "[]"');

    // Insert the test recipe
    const result = await db.run(
      `INSERT INTO recipes 
      (title, source, source_url, description, cook_time, 
      ingredients, instructions, image_url, cuisine_type, recipe_type) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        testRecipe.title,
        testRecipe.source,
        testRecipe.source_url,
        testRecipe.description,
        testRecipe.cook_time,
        testRecipe.ingredients,
        testRecipe.instructions,
        testRecipe.image_url,
        testRecipe.cuisine_type,
        testRecipe.recipe_type
      ]
    );

    console.log(`Test recipe added with ID: ${result.lastID}`);

    // Close the database
    await db.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

addTestRecipe();
