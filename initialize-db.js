import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
  console.log('Initializing database...');
  
  // Open database
  const db = await open({
    filename: path.join(__dirname, 'db', 'recipes.db'),
    driver: sqlite3.Database
  });

  // Create recipes table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      source TEXT,
      source_url TEXT,
      description TEXT,
      cook_time TEXT,
      ingredients TEXT,
      instructions TEXT,
      image_url TEXT,
      cuisine_type TEXT,
      recipe_type TEXT,
      date_added DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Database initialized successfully');
  
  // Close the database connection
  await db.close();
  console.log('Database connection closed');
}

// Run the initialization
initializeDatabase().catch(err => {
  console.error('Error initializing database:', err);
});
