// direct-api-test.js - Simple API test without any MCP dependencies
// Run with: node direct-api-test.js

// Your API key
const API_KEY = '0cf38d15103942e2a6960f456809aece';

async function testAPI() {
  console.log('Testing Spoonacular API with direct fetch...');
  
  try {
    const url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&query=pasta&number=1`;
    console.log(`Making request to ${url.replace(API_KEY, 'API_KEY_HIDDEN')}`);
    
    // Using built-in fetch which is available in Node.js since v18
    const response = await fetch(url);
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! API response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.error('Error response:', errorText);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

testAPI().catch(console.error);
