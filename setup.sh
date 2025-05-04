#!/bin/bash

# This script sets up and runs both the frontend and backend of the meal planning app

# Ensure the script exits immediately if any command fails
set -e

echo "===== Setting up the Meal Planning Application ====="

# Make the script executable
chmod +x "$0"

# Navigate to the express-recipe-server directory and install dependencies
echo "Installing backend dependencies..."
cd express-recipe-server
npm install

# Start the backend server in the background
echo "Starting the Express API server..."
npm start &
BACKEND_PID=$!

# Give the backend a moment to start up
sleep 2

# Navigate back to the main directory
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Start the frontend application
echo "Starting the React frontend application..."
npm start

# When the user cancels (with Ctrl+C), kill the backend process
trap "kill $BACKEND_PID; echo 'Shutting down servers...'; exit" INT TERM EXIT
