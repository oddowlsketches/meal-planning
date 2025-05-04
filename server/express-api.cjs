/**
 * Express API server for the meal planner app (CommonJS version)
 * Acts as a bridge between the React frontend and the MCP server
 */

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

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

/**
 * Executes the MCP scrape-and-save-recipe tool
 * Uses the MCP server through command line
 */
app.post('/api/recipes/scrape-and-save', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  try {
    // Path to the MCP server (adjust if needed)
    const mcpServerPath = path.join(__dirname, '..', 'fresh-recipe-server', 'index.js');
    
    // Check if server path exists
    if (!fs.existsSync(mcpServerPath)) {
      return res.status(500).json({ 
        error: 'MCP server not found',
        details: `Server path ${mcpServerPath} does not exist`
      });
    }
    
    // Create a command to call the MCP server's scrape-and-save-recipe tool
    const mcpProcess = spawn('node', [mcpServerPath, 'scrape-and-save', url]);
    
    let outputData = '';
    let errorData = '';
    
    // Collect standard output
    mcpProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });
    
    // Collect error output
    mcpProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });
    
    // When the process completes
    mcpProcess.on('close', (code) => {
      // Check if process exited successfully
      if (code !== 0) {
        console.error(`MCP process exited with code ${code}`);
        return res.status(500).json({ 
          error: 'Failed to scrape recipe',
          details: errorData || 'No error details available'
        });
      }
      
      try {
        // Try to parse JSON output
        const result = JSON.parse(outputData);
        return res.status(201).json(result);
      } catch (parseError) {
        // If output is not JSON, return it as text
        return res.status(201).json({ 
          message: 'Recipe scraped successfully',
          details: outputData 
        });
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * Executes the MCP scrape-recipe tool (preview only, no save)
 * Uses the MCP server through command line
 */
app.post('/api/recipes/scrape', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  try {
    // Path to the MCP server (adjust if needed)
    const mcpServerPath = path.join(__dirname, '..', 'fresh-recipe-server', 'index.js');
    
    // Check if server path exists
    if (!fs.existsSync(mcpServerPath)) {
      return res.status(500).json({ 
        error: 'MCP server not found',
        details: `Server path ${mcpServerPath} does not exist`
      });
    }
    
    // Create a command to call the MCP server's scrape-recipe tool
    const mcpProcess = spawn('node', [mcpServerPath, 'scrape', url]);
    
    let outputData = '';
    let errorData = '';
    
    // Collect standard output
    mcpProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });
    
    // Collect error output
    mcpProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });
    
    // When the process completes
    mcpProcess.on('close', (code) => {
      // Check if process exited successfully
      if (code !== 0) {
        console.error(`MCP process exited with code ${code}`);
        return res.status(500).json({ 
          error: 'Failed to scrape recipe',
          details: errorData || 'No error details available'
        });
      }
      
      try {
        // Try to parse JSON output
        const result = JSON.parse(outputData);
        return res.status(200).json(result);
      } catch (parseError) {
        // If output is not JSON, return it as text
        return res.status(200).json({ 
          message: 'Recipe scraped successfully',
          details: outputData 
        });
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

// Export the app for testing purposes
module.exports = app;
