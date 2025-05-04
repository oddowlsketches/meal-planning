import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from 'zod';

console.error("Starting Minimal MCP Test Server");

// Create server
const server = new McpServer({
  name: "minimal-test-server",
  version: "1.0.0"
});

// Detailed logging function
function verboseLog(...args) {
  console.error('[VERBOSE]', ...args);
}

// Log server object details
verboseLog("McpServer object:", server);
verboseLog("Registered tools before registration:", server._registeredTools);

// Try to register a simple tool
try {
  console.error("Attempting to register a simple test tool...");

  // Method 1: Using .tool()
  server.tool(
    "hello-world",
    { 
      name: z.string().optional() 
    },
    async (params) => {
      const name = params.name || "Guest";
      return {
        content: [{
          type: "text",
          text: `Hello, ${name}! This is a test tool.`
        }]
      };
    }
  );

  console.error("Tool registered using .tool() method");
  verboseLog("Registered tools after registration:", server._registeredTools);

  // Explicit logging of registered tools
  console.error("Registered tools list:", 
    Object.keys(server._registeredTools || {})
  );

  // Start the server
  async function startServer() {
    try {
      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.error("Minimal Test Server started successfully on stdio");
    } catch (transportError) {
      console.error("Error starting server transport:", transportError);
    }
  }

  startServer().catch(console.error);

} catch (registrationError) {
  console.error("Error registering tool:", registrationError);
}
