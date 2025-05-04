import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';

// Create db directory if it doesn't exist
const dbDir = './db';
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

async function setup() {
  // Open database
  const db = await open({
    filename: './db/recipes.db',
    driver: sqlite3.Database
  });

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      source TEXT NOT NULL,
      source_url TEXT,
      description TEXT,
      cook_time TEXT,
      ingredients TEXT,
      instructions TEXT,
      image_url TEXT,
      dietary_info TEXT,
      cuisine_type TEXT,
      recipe_type TEXT,
      date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS recipe_tags (
      recipe_id INTEGER,
      tag_id INTEGER,
      PRIMARY KEY (recipe_id, tag_id),
      FOREIGN KEY (recipe_id) REFERENCES recipes(id),
      FOREIGN KEY (tag_id) REFERENCES tags(id)
    )
  `);

  console.log("Database initialized successfully");
  
  // Close the database connection
  await db.close();
}

setup().catch(err => {
  console.error("Error setting up database:", err);
});
