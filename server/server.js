// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5050; // Changed to 5050 to avoid conflicts

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Check if API key is available
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("ERROR: OPENAI_API_KEY environment variable is missing!");
  console.error("Please make sure you have created a .env file with your API key.");
  process.exit(1);
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: apiKey
});

app.post('/api/generate-recipe', async (req, res) => {
  try {
    const { ingredients, cuisine, dietaryPreferences } = req.body;
    
    // Update this section in server.js

// Creating a prompt for OpenAI based on user input
let prompt = `Create a recipe using these ingredients: ${ingredients.join(', ')}.\n`;

if (cuisine && cuisine !== 'Any') {
  prompt += `The recipe should be ${cuisine} cuisine.\n`;
}

if (dietaryPreferences && dietaryPreferences.length > 0) {
  prompt += `The recipe must follow these dietary restrictions: ${dietaryPreferences.join(', ')}.\n`;
}

prompt += `
First, carefully analyze what type of dish would work with these ingredients.

IMPORTANT RECIPE REQUIREMENTS:
- Recipe ingredients should be complete, including all essentials needed for the dish
- For baked goods, include any required flour, sweetener, binding agents, and leavening
- For cookies specifically, include flour, sweetener, fat, and leavening as needed
- For savory dishes, include appropriate aromatics, seasonings, and liquids
- Use standard culinary ratios appropriate for the dish type
- Never justify or annotate ingredients as being added - present all ingredients as if they were part of the original plan

Make sure the recipe is realistic, follows proper cooking principles, and would work if prepared.
Format the response as a JSON object with the following structure:
{
  "title": "Recipe Title",
  "recipeType": "Type of dish (cookie, soup, etc.)",
  "description": "Brief description (1-2 sentences)",
  "cookTime": "Total time needed (e.g., '25 minutes')",
  "difficulty": "Easy/Medium/Hard",
  "ingredients": ["Ingredient 1 with amount", "Ingredient 2 with amount", ...],
  "instructions": ["Step 1", "Step 2", ...]
}
`;

    // Making the API call to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4", // Using GPT-4 for better culinary knowledge and reasoning
      temperature: 0.5, // Lower temperature for more consistent, factual responses
      messages: [
        { 
          role: "system", 
          content: "You are a professional chef with expertise in global cuisines and food science. Your recipes must follow established culinary principles, standard cooking ratios, and proven recipes. For each recipe: 1) First identify what TYPE of dish is being created (cookie, cake, soup, etc.) 2) Ensure the recipe contains ALL NECESSARY CORE INGREDIENTS for that dish type 3) Follow standard culinary ratios 4) Only name dishes according to their traditional definition 5) If ingredients are missing essential components, either add them or suggest a different dish type 6) Include reference to similar established recipes 7) For baking recipes especially, ensure proper ratios and complete ingredients lists - no fake recipes!"
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
    });

    // Extract the generated recipe from the response
    const recipeText = response.choices[0].message.content;
    console.log("Raw AI response:", recipeText.substring(0, 200) + "..."); // Log beginning of response
    
    // Parse the JSON response from OpenAI
    let recipeData;
    try {
      // Find the JSON object in the response
      const jsonMatch = recipeText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recipeData = JSON.parse(jsonMatch[0]);
        
        // Ensure we have a valid recipeOptions array with 3 recipes
        if (!recipeData.recipeOptions || !Array.isArray(recipeData.recipeOptions) || recipeData.recipeOptions.length < 3) {
          console.warn("Received invalid format or fewer than 3 recipes, creating fallback options");
          
          // If we got at least one recipe but not in the right format
          if (recipeData.title && recipeData.ingredients && recipeData.instructions) {
            // Convert single recipe to array format
            recipeData = {
              recipeOptions: [
                {
                  title: recipeData.title,
                  recipeType: recipeData.recipeType || "Basic Dish",
                  description: recipeData.explanation || "A recipe using your ingredients.",
                  cookTime: "30 minutes",
                  difficulty: "Medium",
                  ingredients: recipeData.ingredients,
                  instructions: recipeData.instructions
                },
                // Add two more variations
                {
                  title: `Alternative ${recipeData.title}`,
                  recipeType: "Variation",
                  description: "A different approach to the recipe.",
                  cookTime: "35 minutes",
                  difficulty: "Medium",
                  ingredients: recipeData.ingredients,
                  instructions: recipeData.instructions.map(step => `${step} (with variations)`)
                },
                {
                  title: `Quick ${recipeData.title}`,
                  recipeType: "Quick Version",
                  description: "A faster version of the recipe.",
                  cookTime: "20 minutes",
                  difficulty: "Easy",
                  ingredients: recipeData.ingredients,
                  instructions: recipeData.instructions.map(step => step.replace(/thoroughly|carefully|slowly/g, "quickly"))
                }
              ]
            };
          } else {
            // Create completely new options if no valid recipe at all
            throw new Error("No valid recipe format found");
          }
        }
      } else {
        throw new Error("Could not find valid JSON in the response");
      }
    } catch (parseError) {
      console.error("Error parsing recipe JSON:", parseError);
      console.error("Raw recipe text:", recipeText);
      
      // Fallback: Try to extract recipe parts manually
      recipeData = {
        recipeOptions: [
          {
            title: "Simple Recipe with Your Ingredients",
            recipeType: "Basic Dish",
            description: "A simple recipe using your provided ingredients.",
            cookTime: "30 minutes",
            difficulty: "Easy",
            ingredients: ingredients.map(ing => `${ing} - as needed`),
            instructions: ["Combine all ingredients and prepare according to your preference."]
          },
          {
            title: "Alternative Preparation",
            recipeType: "One-Pot Meal",
            description: "A different way to prepare your ingredients.",
            cookTime: "25 minutes",
            difficulty: "Easy",
            ingredients: ingredients.map(ing => `${ing} - as needed`),
            instructions: ["Heat a pan and cook all ingredients together until done."]
          },
          {
            title: "Quick Meal Option",
            recipeType: "Simple Combination",
            description: "The fastest way to prepare your ingredients.",
            cookTime: "15 minutes",
            difficulty: "Easy", 
            ingredients: ingredients.map(ing => `${ing} - as needed`),
            instructions: ["Mix all ingredients together and serve."]
          }
        ]
      };
    }

    console.log("Final recipeData being sent:", JSON.stringify(recipeData).substring(0, 200) + "...");
    
    // Ensure we send back correctly structured data
    if (!recipeData.recipeOptions) {
      if (recipeData.title) {
        // We have a single recipe, convert to options format
        recipeData = {
          recipeOptions: [
            {
              title: recipeData.title,
              recipeType: recipeData.recipeType || "Basic Recipe",
              description: recipeData.explanation || recipeData.description || "A recipe using your ingredients.",
              cookTime: "30 minutes",
              difficulty: "Medium",
              ingredients: recipeData.ingredients || [],
              instructions: recipeData.instructions || []
            },
            {
              title: `Alternative ${recipeData.title}`,
              recipeType: "Variation",
              description: "A different approach to the recipe.",
              cookTime: "35 minutes",
              difficulty: "Medium",
              ingredients: recipeData.ingredients || [],
              instructions: recipeData.instructions.map(step => `${step} (with variations)`) || []
            },
            {
              title: `Quick ${recipeData.title}`,
              recipeType: "Quick Version",
              description: "A faster version of the recipe.",
              cookTime: "20 minutes",
              difficulty: "Easy",
              ingredients: recipeData.ingredients || [],
              instructions: recipeData.instructions.map(step => step.replace(/thoroughly|carefully|slowly/g, "quickly")) || []
            }
          ]
        };
      }
    }
    
    // Final check - make sure we have recipeOptions and it's an array
    if (!recipeData.recipeOptions || !Array.isArray(recipeData.recipeOptions)) {
      console.log("Creating fallback recipe options");
      recipeData.recipeOptions = [
        {
          title: "Simple Recipe with Your Ingredients",
          recipeType: "Basic Dish",
          description: "A simple recipe using your provided ingredients.",
          cookTime: "30 minutes",
          difficulty: "Easy",
          ingredients: ingredients.map(ing => `${ing} - as needed`),
          instructions: ["Combine all ingredients and prepare according to your preference."]
        },
        {
          title: "Alternative Preparation",
          recipeType: "One-Pot Meal",
          description: "A different way to prepare your ingredients.",
          cookTime: "25 minutes",
          difficulty: "Easy",
          ingredients: ingredients.map(ing => `${ing} - as needed`),
          instructions: ["Heat a pan and cook all ingredients together until done."]
        },
        {
          title: "Quick Meal Option",
          recipeType: "Simple Combination",
          description: "The fastest way to prepare your ingredients.",
          cookTime: "15 minutes",
          difficulty: "Easy", 
          ingredients: ingredients.map(ing => `${ing} - as needed`),
          instructions: ["Mix all ingredients together and serve."]
        }
      ];
    }
    
    res.json(recipeData);
  } catch (error) {
    console.error('Error generating recipe:', error);
    res.status(500).json({ 
      error: 'Failed to generate recipe', 
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});