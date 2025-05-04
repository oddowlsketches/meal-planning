# Recipe MCP Server

A modular Model Context Protocol (MCP) server for recipe management, web scraping, and API integration.

## Features

- **Database Integration**: SQLite database for storing and retrieving recipes
- **Web Scraping**: Support for scraping recipes from popular sites like 101 Cookbooks and Smitten Kitchen
- **API Integration**: Spoonacular API support for reliable recipe data
- **MCP Tools**: A comprehensive set of tools for recipe management

## Project Structure

The codebase is organized into modular components:

- `index.js` - Main entry point that orchestrates all components
- `database.js` - Database operations and recipe storage
- `scraper.js` - Web scraping functionality for various recipe sites
- `spoonacular.js` - Spoonacular API client for recipe search and import
- `tools.js` - MCP tool definitions and handlers

## Available Tools

### Database Tools
- `list-recipes` - List all recipes in the database
- `get-recipe-details` - Get detailed information about a recipe by ID
- `search-recipes` - Search for recipes in the database
- `add-recipe` - Add a new recipe to the database

### Scraping Tools
- `scrape-recipe` - Preview a recipe scraped from a website without saving it
- `scrape-and-save-recipe` - Scrape a recipe from a website and save it to the database

### Spoonacular API Tools
- `search-spoonacular` - Search for recipes in the Spoonacular API
- `get-spoonacular-recipe` - Get detailed recipe information from Spoonacular
- `import-spoonacular-recipe` - Import a recipe from Spoonacular to the database
- `get-random-recipes` - Get random recipes from Spoonacular

## Setup

1. Ensure you have Node.js installed
2. Install dependencies: `npm install`
3. Create a `.env` file in the parent directory with your Spoonacular API key: `SPOONACULAR_API_KEY=your_key_here`
4. Run the server: `npm start`

## Debug Screenshots

When scraping websites, screenshots are automatically saved to the `screenshots` directory for debugging purposes.

## API Key

To use Spoonacular API features, you need to obtain an API key from [Spoonacular](https://spoonacular.com/food-api) and add it to your `.env` file.
