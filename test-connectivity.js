// test-connectivity.js - Simple connectivity test with built-in fetch
// Run with: node test-connectivity.js

const API_KEY = '0cf38d15103942e2a6960f456809aece';

async function testConnectivity() {
  console.log('\n===== Network Connectivity Test =====');
  console.log(`Testing at: ${new Date().toISOString()}`);
  console.log(`Node.js version: ${process.version}`);
  
  // Test with general endpoint first
  console.log('\n----- Testing General Internet Connectivity -----');
  try {
    const generalResponse = await fetch('https://example.com');
    console.log(`General connectivity status: ${generalResponse.status} ${generalResponse.statusText}`);
    console.log('✅ General connectivity test passed');
  } catch (error) {
    console.error('❌ General connectivity test failed:', error.message);
  }
  
  // Now test Spoonacular API
  console.log('\n----- Testing Spoonacular API Connectivity -----');
  try {
    const url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&query=pasta&number=1`;
    console.log(`Making request to Spoonacular API (key hidden)`);
    
    const response = await fetch(url);
    console.log(`Spoonacular API status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Spoonacular API test passed');
      console.log(`Data received: ${JSON.stringify(data).substring(0, 100)}...`);
    } else {
      const errorText = await response.text();
      console.error('❌ Spoonacular API test failed with error:', errorText);
    }
  } catch (error) {
    console.error('❌ Spoonacular API test failed with exception:', error.message);
  }
  
  console.log('\n===== Test Complete =====');
}

testConnectivity().catch(error => {
  console.error('Unhandled error:', error);
});
