// index.js - Main entry point for recipe MCP server
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Import our modules
import { RecipeDatabase } from './database.js';
import { RecipeScraper } from './scraper.js';
import { SpoonacularAPI } from './spoonacular.js';
import { setupTools } from './tools.js';

// Get the directory name using fileURLToPath
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detailed logging function
function log(...args) {
  console.error('[RECIPE-SERVER]', ...args);
}

// Provide a banner on startup to show configuration
function printStartupBanner() {
  log("=".repeat(50));
  log(" Recipe MCP Server Starting");
  log(" Node.js version:", process.version);
  log(" Current directory:", process.cwd());
  log(" Server directory:", __dirname);
  log(" Time:", new Date().toISOString());
  log("=".repeat(50));
}

/**
 * Recipe Server Class
 * 
 * This class manages the MCP server instance and connects all the components together.
 */
class RecipeServer {
  constructor() {
    printStartupBanner();
    log("Initializing Recipe MCP Server...");
    
    // Try to load .env from multiple locations to handle different paths
    this.loadEnvFile();
    
    // Directly log environment variables to debug (without showing full key values)
    this.logEnvironmentStatus();

    // Initialize the API client with env var
    this.api = new SpoonacularAPI(process.env.SPOONACULAR_API_KEY);

    // Create server instance with basic information
    this.server = new McpServer({
      name: "recipe-server",
      version: "1.0.0"
    });
    
    // Initialize components
    this.db = new RecipeDatabase();
    this.scraper = new RecipeScraper();
    
    // Set up all tools for the server
    log("Setting up tools...");
    setupTools(this.server, this.db, this.scraper, this.api);
    
    log("Server initialization complete");
  }

  /**
   * Log the status of key environment variables (safely without revealing full values)
   */
  logEnvironmentStatus() {
    log("Environment variable check:");
    if (process.env.SPOONACULAR_API_KEY) {
      const keyStart = process.env.SPOONACULAR_API_KEY.substring(0, 5);
      log(`- SPOONACULAR_API_KEY: ${keyStart}... (${process.env.SPOONACULAR_API_KEY.length} chars)`);
    } else {
      log("- SPOONACULAR_API_KEY: Not set");
    }
  }

  /**
   * Try loading the .env file from multiple possible locations
   */
  loadEnvFile() {
    const possiblePaths = [
      // In the current directory
      path.resolve(__dirname, '.env'),
      
      // In the parent directory
      path.resolve(__dirname, '..', '.env'),
      
      // In the meal-planner root
      path.resolve(__dirname, '..', '..', '.env')
    ];
    
    let envLoaded = false;
    
    for (const envPath of possiblePaths) {
      try {
        // Check if file exists before trying to load it
        if (fs.existsSync(envPath)) {
          log(`Found .env file at: ${envPath}`);
          const result = dotenv.config({ path: envPath });
          
          if (result.parsed) {
            log(`Loaded ${Object.keys(result.parsed).length} environment variables`);
            envLoaded = true;
            break;
          }
        }
      } catch (error) {
        log(`Error checking/loading .env at ${envPath}:`, error.message);
      }
    }
    
    if (!envLoaded) {
      log("Warning: Failed to load any .env file");
      log("Checking for direct environment variables...");
      
      // Check if variables exist directly in the environment
      if (process.env.SPOONACULAR_API_KEY) {
        log("Found API key directly in environment variables");
        envLoaded = true;
      }
    }
    
    if (!envLoaded) {
      log("⚠️ No API key found in any location. API features may not work.");
    }
  }
  
  /**
   * Start the server with the specified transport
   */
  async start() {
    try {
      // Initialize database on startup
      log("Initializing database...");
      await this.db.init();
      
      // Connect to stdio transport
      log("Connecting to stdio transport...");
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      log("Recipe MCP Server started successfully");
    } catch (error) {
      log("Failed to start server:", error);
      process.exit(1);
    }
  }
}

// Create and start server when this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new RecipeServer();
  server.start().catch(error => {
    log("Error starting server:", error);
    process.exit(1);
  });
}

// Export the server class for potential reuse
export { RecipeServer };
