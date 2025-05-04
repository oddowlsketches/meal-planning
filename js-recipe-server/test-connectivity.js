// test-connectivity.js
import fetch from 'node-fetch';

// URLs to test basic connectivity
const testUrls = [
  'https://www.google.com',
  'https://api.spoonacular.com/food/ingredients/search?apiKey=0cf38d15103942e2a6960f456809aece&query=apple&number=1'
];

async function testConnectivity() {
  console.log('Testing internet connectivity...');
  
  for (const url of testUrls) {
    try {
      console.log(`Testing connection to: ${url}`);
      const response = await fetch(url);
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.text();
        console.log(`Successfully received ${data.length} bytes of data`);
        
        // For the API test, try to parse the JSON
        if (url.includes('spoonacular')) {
          try {
            const json = JSON.parse(data);
            console.log('API response:', JSON.stringify(json, null, 2));
          } catch (parseError) {
            console.error('Error parsing JSON:', parseError.message);
          }
        }
      }
    } catch (error) {
      console.error(`Connection failed to ${url}:`, error.message);
    }
  }
}

testConnectivity().catch(console.error);
