# Meal Planning App

A comprehensive meal planning application with recipe search, pantry management, and receipt scanning capabilities.

## Features

- **Recipe Management**: Save, organize, and search your favorite recipes
- **Recipe Discovery**: Find recipes from various sources including Spoonacular API
- **Pantry Management**: Keep track of all ingredients you have on hand
- **Receipt Scanner**: Scan grocery receipts to automatically add items to your pantry
- **Smart Recipe Suggestions**: Get recipe ideas based on what's in your pantry

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm (v6 or newer)

### Installation

1. Clone or download this repository
2. Run the setup script:

```bash
chmod +x setup.sh
./setup.sh
```

This will:
- Install dependencies for both backend and frontend
- Start the Express API server
- Start the React frontend application

## Manual Setup

If you prefer to run the servers manually:

### Backend (Express API Server)

```bash
cd express-recipe-server
npm install
npm start
```

The API server will run on http://localhost:3001

### Frontend (React App)

```bash
# In a new terminal window
npm install
npm start
```

The React app will run on http://localhost:3000

## Using the Pantry Receipt Scanner

1. Navigate to "My Pantry" in the application
2. Click the "Scan Receipt" tab
3. Upload a photo of your grocery receipt
4. Click "Process Receipt"
5. Review and edit extracted items as needed
6. Click "Add Items to Pantry"

## API Keys

The application uses the Spoonacular API for recipe search. To enable this feature:

1. Get an API key from [Spoonacular](https://spoonacular.com/food-api)
2. Add your key to `/express-recipe-server/.env`:

```
SPOONACULAR_API_KEY=your_api_key_here
```

## Technologies Used

- **Frontend**: React, CSS
- **Backend**: Node.js, Express
- **Database**: SQLite
- **OCR**: Tesseract.js
- **API Integration**: Spoonacular Food API