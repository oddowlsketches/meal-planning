#!/bin/bash

# Script to install and update API services

echo "Installing and updating API services..."

# Ensure api directory exists
echo "Setting up API services directory..."
mkdir -p src/services/api

# Copy new service files
echo "Copying API service files..."
cp -f src/services/api/config.js src/services/api/config.js.bak 2>/dev/null || true
cp -f src/services/api/apiService.js src/services/api/apiService.js.bak 2>/dev/null || true
cp -f src/services/api/recipeService.js src/services/api/recipeService.js.bak 2>/dev/null || true
cp -f src/services/api/pantryService.js src/services/api/pantryService.js.bak 2>/dev/null || true
cp -f src/services/api/spoonacularService.js src/services/api/spoonacularService.js.bak 2>/dev/null || true
cp -f src/services/api/index.js src/services/api/index.js.bak 2>/dev/null || true

echo "API service files backed up."
echo "Remember to run 'npm start' to test your application."