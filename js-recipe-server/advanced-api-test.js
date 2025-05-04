// advanced-api-test.js - Test the API directly with proper debugging

// Use native fetch which is available in modern Node.js
const API_KEY = '0cf38d15103942e2a6960f456809aece';
const BASE_URL = 'https://api.spoonacular.com';

async function testSpoonacularAPI() {
  // Start with a clean environment
  console.log('\n===== Spoonacular API Test =====');
  console.log(`Using API key: ${API_KEY}`);
  console.log('Timestamp:', new Date().toISOString());
  console.log('Node.js version:', process.version);
  
  // Test multiple endpoints
  const endpoints = [
    // Test 1: Simple search
    {
      name: 'Recipe Search',
      url: `${BASE_URL}/recipes/complexSearch?apiKey=${API_KEY}&query=pasta&number=1`
    },
    
    // Test 2: Random recipes
    {
      name: 'Random Recipes',
      url: `${BASE_URL}/recipes/random?apiKey=${API_KEY}&number=1`
    },
    
    // Test 3: Recipe information
    {
      name: 'Recipe Information',
      url: `${BASE_URL}/recipes/716429/information?apiKey=${API_KEY}&includeNutrition=false`
    }
  ];
  
  // Run each test separately
  for (const test of endpoints) {
    console.log(`\n----- Test: ${test.name} -----`);
    console.log(`URL: ${test.url.replace(API_KEY, 'API_KEY_HIDDEN')}`);
    
    try {
      // Make the request with all headers
      const response = await fetch(test.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Recipe App/1.0',
          'Accept': 'application/json'
        }
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log('Response headers:', response.headers);
      
      // Handle the response
      if (response.ok) {
        const data = await response.json();
        console.log('Success! Data preview:', JSON.stringify(data).substring(0, 300) + '...');
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error(`Request failed:`, error);
    }
  }
  
  console.log('\n===== Test Complete =====');
}

// Run the tests
testSpoonacularAPI().catch(err => {
  console.error('Unhandled error:', err);
});
