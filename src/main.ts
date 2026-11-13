#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { SERVER_NAME, SERVER_VERSION } from "./constant";
import { registerTools } from "./tools";

const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });
registerTools(server);

const shutdown = () => {
  process.exit(0);
};

async function runServer() {
  const transport = new StdioServerTransport();
  server.server.onclose = shutdown;
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
  await server.connect(transport);
  // stdout is reserved for the MCP protocol, so log to stderr.
  console.error(`${SERVER_NAME} running on stdio`);
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
