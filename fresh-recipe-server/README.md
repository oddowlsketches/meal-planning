# Fresh Recipe Server

A Model Context Protocol (MCP) server for recipe management with database integration, web scraping, and API integration.

## Features

- **SQLite Database**: Store and manage recipes in a local database
- **Site-Specific Web Scrapers**: Targeted scrapers for specific recipe websites
- **Spoonacular API Integration**: Import recipes from the Spoonacular API
- **MCP Tools**: Tools for listing, searching, viewing, and adding recipes

## Setup

1. Clone this repository
2. Make the setup script executable:
   ```bash
   chmod +x setup.sh
   ```
3. Run the setup script:
   ```bash
   ./setup.sh
   ```
4. (Optional) Get a Spoonacular API key:
   - Sign up at [Spoonacular Food API](https://spoonacular.com/food-api)
   - Set the API key as an environment variable:
     ```bash
     export SPOONACULAR_API_KEY=yourapikey123
     ```

## Configuration with Claude Desktop

Update your Claude Desktop configuration file (`~/Library/Application Support/Claude/claude_desktop_config.json`) to include this server:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/yourusername/Desktop", "/Users/yourusername/Downloads"]
    },
    "recipes": {
      "command": "node",
      "args": ["/absolute/path/to/fresh-recipe-server/index.js"]
    }
  }
}
```

Replace `/absolute/path/to/` with the actual path to the server directory.

## Available Tools

### Database Tools

- `list-recipes`: List all recipes in the database
- `get-recipe`: Get detailed information for a specific recipe
- `search-recipes`: Search for recipes by title, ingredients, or other fields
- `add-recipe`: Add a new recipe to the database

### Web Scraping Tools

- `scrape-recipe`: Scrape a recipe from a supported website
- `scrape-and-save-recipe`: Scrape a recipe and save it to the database

### Spoonacular API Tools

- `search-spoonacular`: Search for recipes on Spoonacular
- `get-spoonacular-recipe`: Get details for a specific Spoonacular recipe
- `import-spoonacular-recipe`: Import a Spoonacular recipe to the local database
- `get-random-recipes`: Get random recipes from Spoonacular

## Supported Sites for Scraping

Currently, the server includes a targeted scraper for:

- 101cookbooks.com

Additional scrapers can be added by creating new files in the `scrapers` directory.

## Directory Structure

- `index.js`: Main server file
- `db-utils.js`: Database utilities
- `scrapers/`: Website-specific scraping code
- `api/`: API integration code
- `screenshots/`: Screenshots captured during scraping (for debugging)

## License

MIT
