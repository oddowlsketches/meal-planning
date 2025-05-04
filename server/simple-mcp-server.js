# Create a fixed version of the server file
cat > simple-mcp-server.js << 'EOF'
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create an MCP server
const server = new McpServer({
  name: "TrustedRecipes",
  version: "1.0.0"
});

// Add a simple echo tool for testing
server.tool(
  "echo",
  {
    message: z.string()
  },
  async ({ message }) => {
    return {
      content: [{
        type: "text",
        text: `You said: ${message}`
      }]
    };
  }
);

// Start the server
const main = async () => {
  try {
    const transport = new StdioServerTransport();
    console.log("Starting MCP server...");
    await server.connect(transport);
    console.log("Recipe MCP server started");
  } catch (error) {
    console.error("Error starting server:", error);
  }
};

main();
EOF