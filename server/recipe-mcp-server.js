// server/recipe-mcp-server.js
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import Database from 'better-sqlite3';

// Use ResourceTemplate from the correct import path
const db = new Database('../db/recipes.db', { verbose: console.log });

// Create an MCP server
const server = new McpServer({
  name: "TrustedRecipes",
  version: "1.0.0"
});

// Resource to list all recipes
server.resource(
  "all-recipes",
  "recipes://all",
  async (uri) => {
    try {
      const recipes = db.prepare(`
        SELECT id, title, source, description 
        FROM recipes 
        ORDER BY date_added DESC
        LIMIT 20
      `).all();
      
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(recipes, null, 2),
          mimeType: "application/json"
        }]
      };
    } catch (error) {
      console.error("Error fetching all recipes:", error);
      throw error;
    }
  }
);

// Tool to search recipes by ingredients (we'll fix the ResourceTemplate issue later)
server.tool(
  "search-recipes",
  {
    ingredients: z.array(z.string()),
    sources: z.array(z.string()).optional(),
    dietary: z.array(z.string()).optional(),
    cuisineType: z.string().optional()
  },
  async ({ ingredients, sources, dietary, cuisineType }) => {
    try {
      // Base query - we'll build it up based on parameters
      let query = `
        SELECT id, title, source, description, cook_time, recipe_type 
        FROM recipes 
        WHERE 1=1
      `;
      let params = [];
      
      // Add ingredient search clauses
      if (ingredients && ingredients.length > 0) {
        // SQLite doesn't support array params, so we build the query dynamically
        const clauses = ingredients.map((_, index) => `ingredients LIKE ?`);
        query += ` AND (${clauses.join(" OR ")})`;
        ingredients.forEach(ing => params.push(`%${ing}%`));
      }
      
      // Add source filter
      if (sources && sources.length > 0) {
        const placeholders = sources.map(() => '?').join(',');
        query += ` AND source IN (${placeholders})`;
        params = [...params, ...sources];
      }
      
      // Add cuisine filter
      if (cuisineType && cuisineType !== "Any") {
        query += " AND cuisine_type = ?";
        params.push(cuisineType);
      }
      
      // Add limit
      query += " LIMIT 10";
      
      const stmt = db.prepare(query);
      const recipes = stmt.all(...params);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(recipes, null, 2)
        }]
      };
    } catch (error) {
      console.error("Error searching recipes:", error);
      return {
        content: [{
          type: "text",
          text: `Error searching recipes: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);
console.log("Recipe MCP server started");