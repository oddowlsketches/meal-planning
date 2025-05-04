import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { dbOperations } from './db-utils.js';

// Create an MCP server
const server = new McpServer({
  name: "RecipeServer",
  version: "1.0.0"
});

// Add a tool to list all recipes
server.tool(
  "list-recipes",
  {},
  async () => {
    try {
      const recipes = dbOperations.getAllRecipes();
      const recipeList = recipes.map(r => `${r.id}: ${r.title}`).join('\n');
      
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
      
      // Format ingredients for display
      const ingredientsList = Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0
        ? recipe.ingredients.map(ing => `- ${ing}`).join('\n')
        : 'No ingredients available';
      
      // Format instructions
      let instructionsText = '';
      if (Array.isArray(recipe.instructions) && recipe.instructions.length > 0) {
        instructionsText = recipe.instructions.join('\n\n');
      } else if (typeof recipe.instructions === 'string') {
        instructionsText = recipe.instructions;
      } else {
        instructionsText = 'No instructions available';
      }
      
      // Build the recipe text
      const recipeText = `
Title: ${recipe.title}
${recipe.description ? `Description: ${recipe.description}` : ''}
${recipe.cook_time ? `Cook Time: ${recipe.cook_time}` : ''}
${recipe.cuisine_type && recipe.cuisine_type !== 'Unknown' ? `Cuisine: ${recipe.cuisine_type}` : ''}
${recipe.recipe_type && recipe.recipe_type !== 'Unknown' ? `Type: ${recipe.recipe_type}` : ''}

Ingredients:
${ingredientsList}

Instructions:
${instructionsText}

${recipe.source ? `Source: ${recipe.source}` : ''}
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

// Add a tool to search recipes by title or ingredients
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
      
      const results = matchingRecipes.map(r => `${r.id}: ${r.title}`).join('\n');
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
    source_name: z.string().optional().describe("Name of the source (e.g., website name)"),
    source_url: z.string().optional().describe("URL where the recipe was found"),
    description: z.string().optional().describe("Brief description of the recipe"),
    ingredients: z.array(z.string()).describe("List of ingredients"),
    instructions: z.string().describe("Cooking instructions"),
    cuisine_type: z.string().optional().describe("Type of cuisine"),
    recipe_type: z.string().optional().describe("Type of recipe (e.g., dessert, main course)")
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

// Start the server with stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Recipe server started successfully with database integration");
