// tools.js - Enhanced with better error handling and debugging
import { z } from 'zod';

// Detailed logging function
function log(...args) {
  console.error('[TOOLS]', ...args);
}

// Set up tools for the MCP server
function setupTools(server, db, scraper, api) {
  log("Setting up recipe server tools...");
  
  // API TEST TOOL - Simple tool to verify API connectivity
  server.tool(
    "test-api",
    "Test Spoonacular API connectivity",
    {},
    async () => {
      try {
        log("API test tool called");
        
        // Direct API call with native fetch
        const url = 'https://api.spoonacular.com/recipes/complexSearch?apiKey=0cf38d15103942e2a6960f456809aece&query=pasta&number=1';
        log(`Making direct API request to Spoonacular`);
        
        const response = await fetch(url);
        log(`Response status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          log(`Error response: ${errorText}`);
          return {
            content: [{
              type: "text",
              text: `API test failed with status ${response.status}: ${errorText}`
            }],
            isError: true
          };
        }
        
        const data = await response.json();
        log(`API test succeeded with data: ${JSON.stringify(data)}`);
        
        return {
          content: [{
            type: "text",
            text: `API test succeeded! Found ${data.results ? data.results.length : 0} results.
            
Results preview: ${JSON.stringify(data.results ? data.results[0] : {}, null, 2)}`
          }]
        };
      } catch (error) {
        log(`API test error: ${error.stack || error.message}`);
        return {
          content: [{
            type: "text",
            text: `API test failed with error: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
  
  // DATABASE TOOLS
  
  // List all recipes
  server.tool(
    "list-recipes",
    "List all recipes in the database",
    {},
    async () => {
      try {
        log("list-recipes tool called");
        const recipes = await db.listRecipes();
        log(`Found ${recipes.length} recipes`);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(recipes, null, 2)
            }
          ]
        };
      } catch (error) {
        log(`list-recipes error: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: `Error listing recipes: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );
  
  // Get recipe details
  server.tool(
    "get-recipe",
    "Get detailed information about a recipe by ID",
    {
      id: z.number().int().positive("Recipe ID must be a positive integer")
    },
    async ({ id }) => {
      try {
        log(`get-recipe tool called for ID: ${id}`);
        const recipe = await db.getRecipeById(id);
        log(`Found recipe: ${recipe.title}`);
        
        // Format recipe nicely for display
        const formattedDetails = `
# ${recipe.title}

**Source:** ${recipe.source || 'Unknown'}
${recipe.source_url ? `**Source URL:** ${recipe.source_url}` : ''}

**Description:** ${recipe.description || 'No description available'}

**Cook Time:** ${recipe.cook_time || 'Not specified'}

## Ingredients
${Array.isArray(recipe.ingredients)
  ? recipe.ingredients.map(i => `- ${i}`).join('\n')
  : recipe.ingredients || 'No ingredients available'
}

## Instructions
${Array.isArray(recipe.instructions) 
  ? recipe.instructions.map((step, index) => `${index + 1}. ${step}`).join('\n')
  : recipe.instructions || 'No instructions available'
}
        `;
        
        return {
          content: [{
            type: "text",
            text: formattedDetails
          }]
        };
      } catch (error) {
        log(`get-recipe error: ${error.message}`);
        return {
          content: [{
            type: "text",
            text: `Error retrieving recipe details: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
  
  // Search recipes
  server.tool(
    "search-recipes",
    "Search for recipes in the database",
    {
      query: z.string().min(2, "Search query must be at least 2 characters")
    },
    async ({ query }) => {
      try {
        log(`search-recipes tool called with query: ${query}`);
        const recipes = await db.searchRecipes(query);
        log(`Found ${recipes.length} matching recipes`);
        
        if (recipes.length === 0) {
          return {
            content: [{
              type: "text",
              text: `No recipes found matching "${query}"`
            }]
          };
        }
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(recipes, null, 2)
          }]
        };
      } catch (error) {
        log(`search-recipes error: ${error.message}`);
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
  
  // Add recipe manually
  server.tool(
    "add-recipe",
    "Add a new recipe to the database",
    {
      title: z.string().min(3, "Title must be at least 3 characters"),
      ingredients: z.array(z.string()).min(1, "At least one ingredient is required"),
      instructions: z.array(z.string()).min(1, "At least one instruction step is required"),
      description: z.string().optional(),
      source: z.string().optional(),
      source_url: z.string().url().optional(),
      cook_time: z.string().optional(),
      recipe_type: z.string().optional(),
      cuisine_type: z.string().optional()
    },
    async (recipe) => {
      try {
        log(`add-recipe tool called for: ${recipe.title}`);
        const result = await db.addRecipe(recipe);
        log(`Added recipe with ID: ${result.id}`);
        
        return {
          content: [{
            type: "text",
            text: `Recipe "${result.title}" added successfully with ID ${result.id}`
          }]
        };
      } catch (error) {
        log(`add-recipe error: ${error.message}`);
        return {
          content: [{
            type: "text",
            text: `Error adding recipe: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
  
  // SPOONACULAR API TOOLS
  
  // Search Spoonacular recipes with error tracing
  server.tool(
    "search-spoonacular",
    "Search for recipes in the Spoonacular API",
    {
      query: z.string().min(2, "Search query must be at least 2 characters"),
      limit: z.number().int().min(1).max(10).optional()
    },
    async ({ query, limit = 5 }) => {
      try {
        log(`search-spoonacular tool called with query: ${query}, limit: ${limit}`);
        
        if (!api.isConfigured()) {
          log("API not configured");
          return {
            content: [{
              type: "text",
              text: "Spoonacular API key not configured. Please set SPOONACULAR_API_KEY in your .env file."
            }],
            isError: true
          };
        }
        
        log("Calling api.searchRecipes...");
        const results = await api.searchRecipes(query, limit);
        log(`Search completed, found ${results.length} results`);
        
        if (!results || results.length === 0) {
          return {
            content: [{
              type: "text",
              text: `No Spoonacular recipes found matching "${query}"`
            }]
          };
        }
        
        // Format the results for better readability
        const formattedResults = results.map(r => ({
          id: r.id,
          title: r.title,
          readyInMinutes: r.readyInMinutes,
          servings: r.servings,
          imageUrl: r.image,
          sourceUrl: r.sourceUrl,
          sourceName: r.sourceName
        }));
        
        log(`Formatted results to return`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(formattedResults, null, 2)
          }]
        };
      } catch (error) {
        log(`search-spoonacular error: ${error.stack || error.message}`);
        return {
          content: [{
            type: "text",
            text: `Error searching Spoonacular: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
  
  // Get recipe details from Spoonacular
  server.tool(
    "get-spoonacular-recipe",
    "Get detailed recipe information from Spoonacular",
    {
      id: z.number().int().positive("Recipe ID must be a positive integer")
    },
    async ({ id }) => {
      try {
        log(`get-spoonacular-recipe tool called for ID: ${id}`);
        
        if (!api.isConfigured()) {
          log("API not configured");
          return {
            content: [{
              type: "text",
              text: "Spoonacular API key not configured. Please set SPOONACULAR_API_KEY in your .env file."
            }],
            isError: true
          };
        }
        
        log("Calling api.getRecipe...");
        const recipe = await api.getRecipe(id);
        log(`Got recipe details`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(recipe, null, 2)
          }]
        };
      } catch (error) {
        log(`get-spoonacular-recipe error: ${error.stack || error.message}`);
        return {
          content: [{
            type: "text",
            text: `Error retrieving Spoonacular recipe: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
  
  // Import Spoonacular recipe to database
  server.tool(
    "import-spoonacular-recipe",
    "Import a recipe from Spoonacular to the database",
    {
      id: z.number().int().positive("Recipe ID must be a positive integer")
    },
    async ({ id }) => {
      try {
        log(`import-spoonacular-recipe tool called for ID: ${id}`);
        
        if (!api.isConfigured()) {
          log("API not configured");
          return {
            content: [{
              type: "text",
              text: "Spoonacular API key not configured. Please set SPOONACULAR_API_KEY in your .env file."
            }],
            isError: true
          };
        }
        
        // Get recipe from Spoonacular
        log("Calling api.getRecipe...");
        const spoonacularRecipe = await api.getRecipe(id);
        log(`Got recipe details, formatting for database`);
        
        // Format recipe for our database
        const formattedRecipe = api.formatRecipeForDb(spoonacularRecipe);
        log(`Formatted recipe, saving to database`);
        
        // Save to database
        const result = await db.addRecipe(formattedRecipe);
        log(`Added recipe with ID: ${result.id}`);
        
        return {
          content: [{
            type: "text",
            text: `Recipe "${result.title}" imported successfully with ID ${result.id}`
          }]
        };
      } catch (error) {
        log(`import-spoonacular-recipe error: ${error.stack || error.message}`);
        return {
          content: [{
            type: "text",
            text: `Error importing recipe: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
  
  // Get random recipes
  server.tool(
    "get-random-recipes",
    "Get random recipes from Spoonacular",
    {
      count: z.number().int().min(1).max(5).optional(),
      tags: z.string().optional()
    },
    async ({ count = 1, tags = "" }) => {
      try {
        log(`get-random-recipes tool called with count: ${count}, tags: ${tags}`);
        
        if (!api.isConfigured()) {
          log("API not configured");
          return {
            content: [{
              type: "text",
              text: "Spoonacular API key not configured. Please set SPOONACULAR_API_KEY in your .env file."
            }],
            isError: true
          };
        }
        
        log("Calling api.getRandomRecipes...");
        const recipes = await api.getRandomRecipes(count, tags);
        log(`Got ${recipes.length} random recipes`);
        
        // Format the results for better readability
        const formattedResults = recipes.map(r => ({
          id: r.id,
          title: r.title,
          readyInMinutes: r.readyInMinutes,
          servings: r.servings,
          imageUrl: r.image,
          sourceUrl: r.sourceUrl,
          sourceName: r.sourceName
        }));
        
        log(`Formatted results to return`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(formattedResults, null, 2)
          }]
        };
      } catch (error) {
        log(`get-random-recipes error: ${error.stack || error.message}`);
        return {
          content: [{
            type: "text",
            text: `Error getting random recipes: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
  
  // SCRAPING TOOLS
  
  // Scrape recipe preview
  server.tool(
    "scrape-recipe",
    "Preview a recipe scraped from a website without saving it",
    {
      url: z.string().url("Valid URL is required")
    },
    async ({ url }) => {
      try {
        log(`scrape-recipe tool called for URL: ${url}`);
        const recipe = await scraper.scrapeRecipe(url);
        log(`Successfully scraped recipe: ${recipe.title}`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(recipe, null, 2)
          }]
        };
      } catch (error) {
        log(`scrape-recipe error: ${error.message}`);
        return {
          content: [{
            type: "text",
            text: `Error scraping recipe: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
  
  // Scrape and save recipe
  server.tool(
    "scrape-and-save-recipe",
    "Scrape a recipe from a website and save it to the database",
    {
      url: z.string().url("Valid URL is required"),
      recipe_type: z.string().optional(),
      cuisine_type: z.string().optional()
    },
    async ({ url, recipe_type, cuisine_type }) => {
      try {
        log(`scrape-and-save-recipe tool called for URL: ${url}`);
        
        // Scrape recipe
        const recipe = await scraper.scrapeRecipe(url);
        log(`Successfully scraped recipe: ${recipe.title}`);
        
        // Add recipe type and cuisine if provided
        if (recipe_type) recipe.recipe_type = recipe_type;
        if (cuisine_type) recipe.cuisine_type = cuisine_type;
        
        // Save to database
        const result = await db.addRecipe(recipe);
        log(`Added recipe with ID: ${result.id}`);
        
        return {
          content: [{
            type: "text",
            text: `Recipe "${result.title}" scraped and saved successfully with ID ${result.id}`
          }]
        };
      } catch (error) {
        log(`scrape-and-save-recipe error: ${error.message}`);
        return {
          content: [{
            type: "text",
            text: `Error scraping and saving recipe: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  log("All tools registered successfully");
}

export { setupTools };
