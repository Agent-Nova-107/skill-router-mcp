#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createServer } from "./server.js";

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Skill Router MCP running on stdio");
}

main().catch((error: unknown) => {
  console.error("Skill Router MCP failed:", error);
  process.exit(1);
});
