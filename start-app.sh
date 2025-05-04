#!/bin/bash
# Start the application with the correct API server

echo "Starting Meal Planner with Express Recipe Server..."
echo "------------------------------------------------"

# Kill any existing Node processes to ensure clean start
echo "Stopping any running server processes..."
pkill -f "node.*express-recipe-server" || true
pkill -f "node.*react-scripts" || true
sleep 1

# Make sure the express-recipe-server has the correct dependencies
echo "Checking express-recipe-server dependencies..."
cd express-recipe-server
if ! npm list tesseract.js > /dev/null 2>&1; then
  echo "Installing tesseract.js..."
  npm install tesseract.js
fi

# Create uploads directory if it doesn't exist
if [ ! -d "uploads" ]; then
  echo "Creating uploads directory..."
  mkdir -p uploads
  chmod 755 uploads
fi

# Start the Express Recipe Server in the background
echo "Starting Express Recipe Server..."
npm start &
EXPRESS_PID=$!
cd ..

# Wait for the API to start
echo "Waiting for API server to start..."
sleep 2

# Start the React app
echo "Starting React application..."
npm start &
REACT_PID=$!

# Function to handle script exit
cleanup() {
  echo "Shutting down servers..."
  kill $EXPRESS_PID $REACT_PID 2>/dev/null
  exit 0
}

# Register the cleanup function for script termination
trap cleanup SIGINT SIGTERM

# Wait for user to press Ctrl+C
echo ""
echo "Both servers are now running."
echo "API server is running at http://localhost:3001"
echo "React app is running at http://localhost:3000"
echo ""
echo "Testing tips:"
echo " - To test recipe search: Enter ingredients like 'tomato, pasta' in Recipe Ideas"
echo " - To test recipe details: Click on any recipe card"
echo " - To test pantry: Go to My Pantry page and try Add Item"
echo " - To test receipt scanning: Upload a clear receipt image in JPG format"
echo ""
echo "Press Ctrl+C to stop both servers."
wait
