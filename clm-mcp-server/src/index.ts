#!/usr/bin/env node

// CLM MCP Server — publishes markdown content to CLM → WordPress via stdio transport

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ClmApiClient } from "./clm-api-client.js";
import { registerPostTools } from "./tools/post-tools.js";
import { registerListTools } from "./tools/list-tools.js";

const server = new McpServer({
  name: "clm-mcp-server",
  version: "1.0.0",
});

// Initialize CLM API client (validates env vars on construction)
const client = new ClmApiClient();

// Register all MCP tools
registerPostTools(server, client);
registerListTools(server, client);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CLM MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
