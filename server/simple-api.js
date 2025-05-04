// ES module version of the Express API server

import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the current directory 
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure the Express server
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simple status endpoint to check if server is running
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'API server is running' });
});

// Scrape recipe endpoint
app.post('/api/recipes/scrape-and-save', (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  // Return a more detailed mock recipe
  return res.status(201).json({
    id: Date.now(), // Generate a unique ID based on timestamp
    title: url.includes('tomato') ? 'Roasted Tomato Pasta' : 
           url.includes('cake') ? 'Chocolate Layer Cake' : 
           'Imported Recipe from URL',
    image: url.includes('tomato') ? 'https://images.unsplash.com/photo-1598866594230-a7c12756260f?q=80&w=1978&auto=format&fit=crop' : 
           url.includes('cake') ? 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1789&auto=format&fit=crop' : 
           null,
    readyInMinutes: Math.floor(Math.random() * 60) + 10, // Random time between 10-70 minutes
    servings: Math.floor(Math.random() * 6) + 1, // Random servings between 1-6
    ingredients: [
      'Main ingredient 1',
      'Secondary ingredient 2',
      '1 tbsp spice mixture',
      '2 cups liquid',
      'Optional garnish'
    ],
    instructions: 'These are sample instructions for preparing this recipe. \n\nStep 1: Prepare all ingredients. \nStep 2: Cook the main component. \nStep 3: Combine everything and finish cooking.',
    source_url: url,
    source_name: 'Sample Recipe Source',
    message: 'Recipe successfully imported from URL'
  });
});

// Scrape recipe preview endpoint
app.post('/api/recipes/scrape', (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  // Return a detailed mock recipe preview
  return res.status(200).json({
    title: url.includes('tomato') ? 'Roasted Tomato Pasta' : 
           url.includes('cake') ? 'Chocolate Layer Cake' : 
           'Imported Recipe from URL',
    image: url.includes('tomato') ? 'https://images.unsplash.com/photo-1598866594230-a7c12756260f?q=80&w=1978&auto=format&fit=crop' : 
           url.includes('cake') ? 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1789&auto=format&fit=crop' : 
           null,
    readyInMinutes: Math.floor(Math.random() * 60) + 10,
    servings: Math.floor(Math.random() * 6) + 1,
    ingredients: [
      'Main ingredient 1',
      'Secondary ingredient 2',
      '1 tbsp spice mixture',
      '2 cups liquid',
      'Optional garnish'
    ],
    instructions: 'These are sample instructions for preparing this recipe. \n\nStep 1: Prepare all ingredients. \nStep 2: Cook the main component. \nStep 3: Combine everything and finish cooking.',
    source_url: url,
    source_name: 'Sample Recipe Source',
    message: 'Recipe scraped successfully'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Simple API server running on port ${PORT}`);
});
