import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the database file
const dbPath = path.join(__dirname, 'db', 'recipes.db');

// Check if the file exists
if (fs.existsSync(dbPath)) {
  console.log(`Removing database file: ${dbPath}`);
  fs.unlinkSync(dbPath);
  console.log('Database file removed successfully.');
} else {
  console.log('Database file does not exist.');
}

console.log('You can now run your script again to create a fresh database with the correct schema.');
