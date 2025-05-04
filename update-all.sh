#!/bin/bash

# Master script to update the entire application

echo "=== Meal Planner API Update ==="
echo "This script will update your application to use the new Express API"
echo

# Ensure scripts are executable
chmod +x update-components.sh update-services.sh

# Step 1: Copy new service files
echo "Step 1: Copying API service files..."
mkdir -p src/services/api

cp -f src/services/api/config.js src/services/api/config.js.bak 2>/dev/null || true
cp -f src/services/api/apiService.js src/services/api/apiService.js.bak 2>/dev/null || true
cp -f src/services/api/recipeService.js src/services/api/recipeService.js.bak 2>/dev/null || true
cp -f src/services/api/pantryService.js src/services/api/pantryService.js.bak 2>/dev/null || true
cp -f src/services/api/spoonacularService.js src/services/api/spoonacularService.js.bak 2>/dev/null || true
cp -f src/services/api/index.js src/services/api/index.js.bak 2>/dev/null || true
echo "✅ API service files backed up"

# Step 2: Update component files
echo "Step 2: Updating component files..."
if [ -f src/components/RecipeIdeas.js.new ] && [ -f src/components/RecipeDetailPage.js.new ] && \
   [ -f src/components/MyRecipes.js.new ] && [ -f src/components/RecipeImport.js.new ]; then
  mv -f src/components/RecipeIdeas.js.new src/components/RecipeIdeas.js
  mv -f src/components/RecipeDetailPage.js.new src/components/RecipeDetailPage.js
  mv -f src/components/MyRecipes.js.new src/components/MyRecipes.js
  mv -f src/components/RecipeImport.js.new src/components/RecipeImport.js
  echo "✅ Component files updated successfully"
else
  echo "❌ New component files not found. Skipping component update."
fi

# Step 3: Start the Express server
echo
echo "Step 3: Set up and start the Express API server"
echo "Please open a new terminal window and run the following commands:"
echo "  cd /Users/emilyschwartzman/meal-planner/express-recipe-server"
echo "  npm install"
echo "  npm start"
echo

# Step 4: Start the React app
echo "Step 4: Once the Express server is running, start the React app"
echo "In another terminal window, run:"
echo "  cd /Users/emilyschwartzman/meal-planner"
echo "  npm start"
echo

echo "=== Update Complete ==="
echo "Read the API_UPDATE_README.md file for more information about the changes."
echo "Happy cooking! 🍳"
