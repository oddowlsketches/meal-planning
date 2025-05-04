// test-spoonacular.js
import fetch from 'node-fetch';

// Your API key
const API_KEY = '0cf38d15103942e2a6960f456809aece';

async function testSpoonacularKey() {
  console.log('Testing Spoonacular API key...');
  console.log(`Using API key: ${API_KEY}`);
  
  // Test endpoints
  const endpoints = [
    // Simple search - lightest endpoint
    `/recipes/complexSearch?apiKey=${API_KEY}&query=pasta&number=1`,
    
    // Random recipes - another endpoint to try
    `/recipes/random?apiKey=${API_KEY}&number=1`
  ];
  
  for (const endpoint of endpoints) {
    try {
      const url = `https://api.spoonacular.com${endpoint}`;
      console.log(`Testing endpoint: ${url}`);
      
      const response = await fetch(url);
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Success! API response:', JSON.stringify(data, null, 2).slice(0, 500) + '...');
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
      
      console.log('---');
    } catch (error) {
      console.error(`Request failed:`, error.message);
    }
  }
}

testSpoonacularKey().catch(console.error);
