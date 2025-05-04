#!/bin/bash
# Make this script executable with: chmod +x setup.sh

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Setting up Fresh Recipe Server..."

# Create directories if they don't exist
mkdir -p screenshots

# Install npm dependencies
echo "Installing dependencies..."
npm install

# Check environment variables
if [ -z "$SPOONACULAR_API_KEY" ]; then
  echo "NOTE: SPOONACULAR_API_KEY environment variable is not set."
  echo "To use the Spoonacular API features, you need to:"
  echo "1. Sign up at https://spoonacular.com/food-api"
  echo "2. Get your API key"
  echo "3. Set it as an environment variable:"
  echo "   export SPOONACULAR_API_KEY=yourapikey123"
  echo ""
  echo "You can still use the server without this API key, but Spoonacular-related tools won't work."
fi

echo ""
echo "Setup completed successfully!"
echo ""
echo "To start the server, run:"
echo "node index.js"
echo ""
echo "Make sure to update your Claude Desktop configuration file to point to this server:"
echo ""
echo '  "recipes": {'
echo '    "command": "node",'
echo '    "args": ["'$SCRIPT_DIR'/index.js"]'
echo '  }'
echo ""
echo "After updating the configuration, restart Claude Desktop."
