# Setting Up Your Recipe Scraper with Claude for Desktop

## Step 1: Initialize the Database
First, run the database initialization script:

```bash
cd ~/meal-planner
node initialize-db.js
```

This will create the database with the proper schema.

## Step 2: Update Claude for Desktop Configuration
Open your Claude for Desktop configuration file:

```bash
# For macOS
open -e ~/Library/Application\ Support/Claude/claude_desktop_config.json

# For Windows
notepad %APPDATA%\Claude\claude_desktop_config.json
```

Update the configuration with this content (adjust paths as needed):

```json
{
  "mcpServers": {
    "recipe-scraper": {
      "command": "node",
      "args": [
        "/Users/emilyschwartzman/meal-planner/js-recipe-server/index.js"
      ]
    }
  }
}
```

## Step 3: Restart Claude for Desktop
Close and reopen Claude for Desktop to load the new configuration.

## Step 4: Testing the Scraper
You should now be able to use these commands in Claude:

- To scrape a recipe: "Scrape recipe from https://www.101cookbooks.com/instant-pot-rice-and-beans-recipe"
- To list all recipes: "What recipes are in my database?"
- To get recipe details: "Show me recipe #1" (replace with the actual ID)

## Troubleshooting
If you encounter issues:
1. Check the logs: `~/Library/Logs/Claude/mcp*.log`
2. Make sure the server process is running
3. Verify the database file exists and has the correct schema
