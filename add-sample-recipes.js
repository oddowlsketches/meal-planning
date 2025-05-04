import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sample recipes
const sampleRecipes = [
  {
    title: "Simple Pasta with Tomato Sauce",
    source: "101 Cookbooks",
    source_url: "https://www.101cookbooks.com/pasta-with-tomato-sauce/",
    description: "A simple, delicious pasta with fresh tomato sauce.",
    cook_time: "30 minutes",
    ingredients: JSON.stringify([
      "1 pound pasta",
      "2 tablespoons olive oil",
      "4 cloves garlic, minced",
      "28 oz can crushed tomatoes",
      "1 teaspoon salt",
      "1/2 teaspoon black pepper",
      "1/4 cup fresh basil, chopped",
      "Grated Parmesan cheese for serving"
    ]),
    instructions: JSON.stringify([
      "Bring a large pot of salted water to a boil. Add pasta and cook according to package directions.",
      "Meanwhile, heat olive oil in a large skillet over medium heat.",
      "Add garlic and cook until fragrant, about 30 seconds.",
      "Add crushed tomatoes, salt, and pepper. Simmer for 10-15 minutes.",
      "Drain pasta and add to the sauce. Toss to combine.",
      "Stir in fresh basil and serve with grated Parmesan cheese."
    ]),
    image_url: "https://images.101cookbooks.com/pasta-tomato-sauce.jpg",
    dietary_info: JSON.stringify({
      vegetarian: true,
      vegan: false,
      gluten_free: false
    }),
    cuisine_type: "Italian",
    recipe_type: "Main Dish"
  },
  {
    title: "Avocado Toast",
    source: "Smitten Kitchen",
    source_url: "https://smittenkitchen.com/avocado-toast/",
    description: "Simple yet delicious avocado toast with various toppings.",
    cook_time: "10 minutes",
    ingredients: JSON.stringify([
      "2 slices bread (sourdough recommended)",
      "1 ripe avocado",
      "1/2 lemon, juiced",
      "Salt and pepper to taste",
      "Red pepper flakes (optional)",
      "2 eggs (optional)"
    ]),
    instructions: JSON.stringify([
      "Toast the bread until golden and crisp.",
      "Cut the avocado in half, remove the pit, and scoop the flesh into a bowl.",
      "Add lemon juice, salt, and pepper. Mash with a fork to desired consistency.",
      "Spread the avocado mixture on the toast.",
      "If using, cook eggs to your preference and place on top of the avocado toast.",
      "Sprinkle with additional salt, pepper, and red pepper flakes if desired."
    ]),
    image_url: "https://smittenkitchendotcom.files.wordpress.com/avocado-toast.jpg",
    dietary_info: JSON.stringify({
      vegetarian: true,
      vegan: false,
      gluten_free: false
    }),
    cuisine_type: "American",
    recipe_type: "Breakfast"
  }
];

async function insertSampleRecipes() {
  // Open database
  const db = await open({
    filename: path.join(__dirname, 'db', 'recipes.db'),
    driver: sqlite3.Database
  });

  try {
    // Insert sample recipes
    const stmt = await db.prepare(`
      INSERT INTO recipes (
        title, source, source_url, description, cook_time, 
        ingredients, instructions, image_url, dietary_info, 
        cuisine_type, recipe_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const recipe of sampleRecipes) {
      try {
        const result = await stmt.run(
          recipe.title, recipe.source, recipe.source_url, recipe.description,
          recipe.cook_time, recipe.ingredients, recipe.instructions,
          recipe.image_url, recipe.dietary_info, recipe.cuisine_type, recipe.recipe_type
        );
        console.log(`Added recipe: ${recipe.title} with ID: ${result.lastID}`);
      } catch (err) {
        console.error(`Error adding recipe ${recipe.title}:`, err);
      }
    }

    await stmt.finalize();
  } catch (error) {
    console.error("Error inserting recipes:", error);
  } finally {
    // Close the database connection
    await db.close();
  }
}

// Run the insertion
insertSampleRecipes().catch(console.error);