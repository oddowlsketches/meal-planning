#!/bin/bash

# Script to update components with new API service versions

echo "Updating frontend components to use new API services..."

# Move new component files to replace old ones
echo "Moving RecipeIdeas.js..."
mv -f src/components/RecipeIdeas.js.new src/components/RecipeIdeas.js

echo "Moving RecipeDetailPage.js..."
mv -f src/components/RecipeDetailPage.js.new src/components/RecipeDetailPage.js

echo "Moving MyRecipes.js..."
mv -f src/components/MyRecipes.js.new src/components/MyRecipes.js

echo "Moving RecipeImport.js..."
mv -f src/components/RecipeImport.js.new src/components/RecipeImport.js

echo "Component files updated successfully!"

echo "Update complete. You can now start the React app to test the changes."
echo "Run: npm start"
