import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { dbOperations } from './db-utils.js';
import { scrapeRecipe } from './scrapers/index.js';
import { searchSpoonacularRecipes, getSpoonacularRecipe, getRandomRecipes, checkSpoonacularApiKey } from './api/index.js';

// Create an MCP server
const server = new McpServer({
  name: "FreshRecipeServer",
  version: "1.0.0"
});

// Add a tool to list all recipes
server.tool(
  "list-recipes",
  {},
  async () => {
    try {
      const recipes = dbOperations.getAllRecipes();
      
      if (recipes.length === 0) {
        return {
          content: [{ type: "text", text: "No recipes found in the database." }]
        };
      }
      
      const recipeList = recipes.map(r => {
        let recipeInfo = `${r.id}: ${r.title}`;
        if (r.cuisine_type) recipeInfo += ` (${r.cuisine_type})`;
        if (r.recipe_type) recipeInfo += ` - ${r.recipe_type}`;
        return recipeInfo;
      }).join('\n');
      
      return {
        content: [{ 
          type: "text", 
          text: `Available recipes:\n${recipeList}`
        }]
      };
    } catch (err) {
      console.error(`Error listing recipes: ${err.message}`);
      return {
        content: [{ type: "text", text: `Error listing recipes: ${err.message}` }],
        isError: true
      };
    }
  }
);

// Add a tool to get recipe details
server.tool(
  "get-recipe",
  { 
    id: z.number().describe("The recipe ID to retrieve")
  },
  async ({ id }) => {
    try {
      const recipe = dbOperations.getRecipeById(id);
      
      if (!recipe) {
        return {
          content: [{ type: "text", text: `Recipe with ID ${id} not found.` }],
          isError: true
        };
      }
      
      // Format ingredient strings for display
      const ingredientsList = recipe.ingredients.map(ing => {
        if (ing.quantity && ing.unit) {
          return `- ${ing.quantity} ${ing.unit} ${ing.name}`;
        } else {
          return `- ${ing.name}`;
        }
      }).join('\n');
      
      // Build the recipe text
      const recipeText = `
Title: ${recipe.title}
${recipe.cuisine_type ? `Cuisine: ${recipe.cuisine_type}` : ''}
${recipe.recipe_type ? `Type: ${recipe.recipe_type}` : ''}
Description: ${recipe.description || 'No description available'}

Ingredients:
${ingredientsList}

Instructions:
${recipe.instructions}

${recipe.source_name ? `Source: ${recipe.source_name}` : ''}
${recipe.source_url ? `URL: ${recipe.source_url}` : ''}
      `;
      
      return {
        content: [{ type: "text", text: recipeText }]
      };
    } catch (err) {
      console.error(`Error retrieving recipe: ${err.message}`);
      return {
        content: [{ type: "text", text: `Error retrieving recipe: ${err.message}` }],
        isError: true
      };
    }
  }
);

// Add a tool to search recipes by title, ingredients, or cuisine
server.tool(
  "search-recipes",
  { 
    query: z.string().describe("The search term to find in recipe titles or ingredients")
  },
  async ({ query }) => {
    try {
      const matchingRecipes = dbOperations.searchRecipes(query);
      
      if (matchingRecipes.length === 0) {
        return {
          content: [{ 
            type: "text", 
            text: `No recipes found matching "${query}".` 
          }]
        };
      }
      
      const results = matchingRecipes.map(r => {
        let recipeInfo = `${r.id}: ${r.title}`;
        if (r.cuisine_type) recipeInfo += ` (${r.cuisine_type})`;
        if (r.recipe_type) recipeInfo += ` - ${r.recipe_type}`;
        return recipeInfo;
      }).join('\n');
      
      return {
        content: [{ 
          type: "text", 
          text: `Recipes matching "${query}":\n${results}` 
        }]
      };
    } catch (err) {
      console.error(`Error searching recipes: ${err.message}`);
      return {
        content: [{ type: "text", text: `Error searching recipes: ${err.message}` }],
        isError: true
      };
    }
  }
);

// Add a tool to add a new recipe
server.tool(
  "add-recipe",
  {
    title: z.string().describe("Recipe title"),
    description: z.string().optional().describe("Brief description of the recipe"),
    ingredients: z.array(z.string()).describe("List of ingredients"),
    instructions: z.string().describe("Cooking instructions"),
    recipe_type: z.string().optional().describe("Type of recipe (e.g., dessert, main course)"),
    cuisine_type: z.string().optional().describe("Type of cuisine"),
    source_url: z.string().optional().describe("URL where the recipe was found"),
    source_name: z.string().optional().describe("Name of the source (e.g., website name)")
  },
  async (recipeData) => {
    try {
      const recipeId = dbOperations.addRecipe(recipeData);
      
      return {
        content: [{ 
          type: "text", 
          text: `Recipe "${recipeData.title}" added successfully with ID ${recipeId}.` 
        }]
      };
    } catch (err) {
      console.error(`Error adding recipe: ${err.message}`);
      return {
        content: [{ type: "text", text: `Error adding recipe: ${err.message}` }],
        isError: true
      };
    }
  }
);

// Add a tool to scrape a recipe from a URL
server.tool(
  "scrape-recipe",
  {
    url: z.string().url().describe("URL of the recipe to scrape")
  },
  async ({ url }) => {
    try {
      console.error(`Starting recipe scraping for URL: ${url}`);
      
      // Scrape the recipe
      const scrapedRecipe = await scrapeRecipe(url);
      
      if (!scrapedRecipe) {
        return {
          content: [{ 
            type: "text", 
            text: `Failed to scrape recipe from ${url}. No recipe data could be extracted.` 
          }],
          isError: true
        };
      }
      
      // Format ingredients for display
      let ingredientsList = '';
      if (Array.isArray(scrapedRecipe.ingredients)) {
        ingredientsList = scrapedRecipe.ingredients.map(ing => `- ${ing}`).join('\n');
      }
      
      // Build the recipe preview text
      const recipePreview = `
Successfully scraped recipe:

Title: ${scrapedRecipe.title}
${scrapedRecipe.cuisine_type ? `Cuisine: ${scrapedRecipe.cuisine_type}` : ''}
${scrapedRecipe.recipe_type ? `Type: ${scrapedRecipe.recipe_type}` : ''}
Description: ${scrapedRecipe.description || 'No description available'}

Ingredients:
${ingredientsList}

Instructions:
${scrapedRecipe.instructions}

Source: ${scrapedRecipe.source_name}
URL: ${url}

Would you like to save this recipe to your database? If so, please use the add-recipe tool.
      `;
      
      return {
        content: [{ type: "text", text: recipePreview }]
      };
    } catch (err) {
      console.error(`Error scraping recipe: ${err.message}`);
      return {
        content: [{ 
          type: "text", 
          text: `Error scraping recipe from ${url}: ${err.message}. You may want to manually add the recipe instead.` 
        }],
        isError: true
      };
    }
  }
);

// Add a tool to scrape and save a recipe in one step
server.tool(
  "scrape-and-save-recipe",
  {
    url: z.string().url().describe("URL of the recipe to scrape"),
    recipe_type: z.string().optional().describe("Type of recipe (e.g., dessert, main course)"),
    cuisine_type: z.string().optional().describe("Type of cuisine")
  },
  async ({ url, recipe_type, cuisine_type }) => {
    try {
      console.error(`Starting recipe scraping and saving for URL: ${url}`);
      
      // Scrape the recipe
      const scrapedRecipe = await scrapeRecipe(url);
      
      if (!scrapedRecipe) {
        return {
          content: [{ 
            type: "text", 
            text: `Failed to scrape recipe from ${url}. No recipe data could be extracted.` 
          }],
          isError: true
        };
      }
      
      // Add additional metadata if provided
      if (recipe_type) scrapedRecipe.recipe_type = recipe_type;
      if (cuisine_type) scrapedRecipe.cuisine_type = cuisine_type;
      
      // Save the recipe to the database
      const recipeId = dbOperations.addRecipe(scrapedRecipe);
      
      return {
        content: [{ 
          type: "text", 
          text: `Recipe "${scrapedRecipe.title}" successfully scraped and saved with ID ${recipeId}.` 
        }]
      };
    } catch (err) {
      console.error(`Error scraping and saving recipe: ${err.message}`);
      return {
        content: [{ 
          type: "text", 
          text: `Error scraping and saving recipe from ${url}: ${err.message}. You may want to manually add the recipe instead.` 
        }],
        isError: true
      };
    }
  }
);

// Check if Spoonacular API key is available
checkSpoonacularApiKey();

// Add a tool to search Spoonacular recipes
server.tool(
  "search-spoonacular",
  {
    query: z.string().describe("Search term for recipes"),
    limit: z.number().min(1).max(10).optional().describe("Maximum number of results to return (1-10)")
  },
  async ({ query, limit = 5 }) => {
    try {
      const recipes = await searchSpoonacularRecipes(query, { limit });
      
      if (!recipes || recipes.length === 0) {
        return {
          content: [{ 
            type: "text", 
            text: `No recipes found for "${query}" on Spoonacular.` 
          }]
        };
      }
      
      const resultText = recipes.map(r => `${r.id}: ${r.title}`).join('\n');
      
      return {
        content: [{ 
          type: "text", 
          text: `Spoonacular recipes matching "${query}":\n${resultText}\n\nTo see details for a recipe, use the get-spoonacular-recipe tool with one of the IDs above.` 
        }]
      };
    } catch (err) {
      console.error(`Error searching Spoonacular: ${err.message}`);
      return {
        content: [{ 
          type: "text", 
          text: `Error searching Spoonacular API: ${err.message}\nMake sure you have set the SPOONACULAR_API_KEY environment variable.` 
        }],
        isError: true
      };
    }
  }
);

// Add a tool to get a recipe from Spoonacular by ID
server.tool(
  "get-spoonacular-recipe",
  {
    id: z.number().describe("Spoonacular recipe ID")
  },
  async ({ id }) => {
    try {
      const recipe = await getSpoonacularRecipe(id);
      
      if (!recipe) {
        return {
          content: [{ 
            type: "text", 
            text: `Recipe with ID ${id} not found on Spoonacular.` 
          }],
          isError: true
        };
      }
      
      // Format ingredients for display
      const ingredientsList = recipe.ingredients.map(ing => `- ${ing}`).join('\n');
      
      // Build the recipe text
      const recipeText = `
Title: ${recipe.title}
${recipe.cuisine_type ? `Cuisine: ${recipe.cuisine_type}` : ''}
${recipe.recipe_type ? `Type: ${recipe.recipe_type}` : ''}
Description: ${recipe.description || 'No description available'}

Ingredients:
${ingredientsList}

Instructions:
${recipe.instructions}

Source: ${recipe.source_name}
URL: ${recipe.source_url}
      `;
      
      return {
        content: [{ 
          type: "text", 
          text: recipeText 
        }]
      };
    } catch (err) {
      console.error(`Error getting Spoonacular recipe: ${err.message}`);
      return {
        content: [{ 
          type: "text", 
          text: `Error getting recipe from Spoonacular API: ${err.message}\nMake sure you have set the SPOONACULAR_API_KEY environment variable.` 
        }],
        isError: true
      };
    }
  }
);

// Add a tool to import a recipe from Spoonacular to the database
server.tool(
  "import-spoonacular-recipe",
  {
    id: z.number().describe("Spoonacular recipe ID")
  },
  async ({ id }) => {
    try {
      const recipe = await getSpoonacularRecipe(id);
      
      if (!recipe) {
        return {
          content: [{ 
            type: "text", 
            text: `Recipe with ID ${id} not found on Spoonacular.` 
          }],
          isError: true
        };
      }
      
      // Save the recipe to the database
      const recipeId = dbOperations.addRecipe(recipe);
      
      return {
        content: [{ 
          type: "text", 
          text: `Recipe "${recipe.title}" successfully imported from Spoonacular and saved with ID ${recipeId}.` 
        }]
      };
    } catch (err) {
      console.error(`Error importing Spoonacular recipe: ${err.message}`);
      return {
        content: [{ 
          type: "text", 
          text: `Error importing recipe from Spoonacular API: ${err.message}\nMake sure you have set the SPOONACULAR_API_KEY environment variable.` 
        }],
        isError: true
      };
    }
  }
);

// Add a tool to get random recipes from Spoonacular
server.tool(
  "get-random-recipes",
  {
    count: z.number().min(1).max(5).optional().describe("Number of random recipes to get (1-5)"),
    tags: z.string().optional().describe("Comma-separated list of tags to filter by (e.g., 'vegetarian,dessert')")
  },
  async ({ count = 3, tags = '' }) => {
    try {
      const recipes = await getRandomRecipes(count, tags);
      
      if (!recipes || recipes.length === 0) {
        return {
          content: [{ 
            type: "text", 
            text: `No random recipes found${tags ? ` matching tags: ${tags}` : ''}.` 
          }]
        };
      }
      
      const recipeList = recipes.map(r => `- ${r.title}${r.cuisine_type ? ` (${r.cuisine_type})` : ''}${r.recipe_type ? ` - ${r.recipe_type}` : ''}`).join('\n');
      
      return {
        content: [{ 
          type: "text", 
          text: `${recipes.length} Random recipes from Spoonacular:\n${recipeList}\n\nTo import these recipes, use the import-spoonacular-recipe tool with the specific recipe ID.` 
        }]
      };
    } catch (err) {
      console.error(`Error getting random recipes: ${err.message}`);
      return {
        content: [{ 
          type: "text", 
          text: `Error getting random recipes from Spoonacular API: ${err.message}\nMake sure you have set the SPOONACULAR_API_KEY environment variable.` 
        }],
        isError: true
      };
    }
  }
);

// Start the server with stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Fresh Recipe server started successfully with recipe scraping capability and API integration");
