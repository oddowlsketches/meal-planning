#!/bin/bash

# Setup script for Express Recipe Server

echo "Setting up Express Recipe Server..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Check if .env file exists, create if not
if [ ! -f .env ]; then
  echo "Creating .env file..."
  echo "PORT=3001" > .env
  echo "SPOONACULAR_API_KEY=your_spoonacular_api_key" >> .env
  echo "ANTHROPIC_API_KEY=your_anthropic_api_key" >> .env
  
  echo "Please update the .env file with your actual API keys"
fi

# Create uploads directory
mkdir -p uploads

echo "Setup complete! Start the server with:"
echo "npm start"