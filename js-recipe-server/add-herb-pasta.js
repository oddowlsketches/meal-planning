import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RecipeServer {
  constructor() {
    // Initialize MCP server
    this.server = new McpServer({
      name: "herbed-pasta-adder",
      version: "1.0.0"
    });

    // Path to the SQLite database
    this.dbPath = path.join(__dirname, '..', 'db', 'recipes.db');
    this.db = null;

    this.setupTools();
  }

  async initDatabase() {
    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database
    });

    console.error("Database initialized successfully");
  }

  setupTools() {
    // Tool to add the herbed whole wheat pasta recipe directly
    this.server.tool(
      "add-herbed-pasta",
      {},
      async () => {
        try {
          // Ensure database is initialized
          if (!this.db) {
            await this.initDatabase();
          }

          // Add the recipe directly
          const result = await this.db.run(
            `INSERT INTO recipes 
            (title, source, source_url, description, cook_time, 
            ingredients, instructions, image_url, cuisine_type, recipe_type) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              'Herbed Whole Wheat Pasta',
              '101 Cookbooks',
              'https://www.101cookbooks.com/archives/herbed-whole-wheat-pasta-recipe.html',
              'A simple, flavorful pasta dish featuring fresh herbs, garlic, and Parmesan cheese.',
              'About 20 minutes',
              JSON.stringify([
                "1 pound whole wheat pasta",
                "3 tablespoons extra virgin olive oil",
                "3 tablespoons unsalted butter",
                "2 cloves garlic, minced",
                "3 big handfuls of chopped fresh herbs (basil, oregano, thyme, Italian parsley, etc.)",
                "2-3 big pinches of salt",
                "Big pinch of crushed red pepper flakes",
                "Plenty of grated Parmesan cheese"
              ]),
              JSON.stringify([
                "Bring a large pot of water to a boil.",
                "Salt the water generously and cook the pasta until al dente.",
                "In the meantime, heat the olive oil and butter in a large skillet over medium heat.",
                "Stir in the garlic and saute for about a minute, until fragrant but not browned.",
                "Stir in the herbs, salt, and red pepper flakes.",
                "Remove from heat.",
                "When the pasta is cooked, drain it and add to the herb mixture in the skillet.",
                "Toss well to combine, ensuring the pasta is well coated with the herbed oil.",
                "Serve topped with a generous amount of grated Parmesan cheese."
              ]),
              null,
              'Italian',
              'Main Dish'
            ]
          );

          return {
            content: [{
              type: "text",
              text: `Herbed Whole Wheat Pasta recipe added successfully with ID ${result.lastID}`
            }]
          };
        } catch (error) {
          console.error('Error adding herbed pasta recipe:', error);
          return {
            content: [{
              type: "text",
              text: `Error adding herbed pasta recipe: ${error.message}`
            }],
            isError: true
          };
        }
      }
    );
  }

  async start() {
    try {
      // Initialize database on startup
      await this.initDatabase();

      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error("Herbed Pasta Adder MCP Server started on stdio");
    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  }
}

// Run the server
const recipeServer = new RecipeServer();
recipeServer.start().catch(console.error);
