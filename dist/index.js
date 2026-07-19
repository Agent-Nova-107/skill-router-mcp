#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
async function main() {
    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Skill Router MCP running on stdio");
}
main().catch((error) => {
    console.error("Skill Router MCP failed:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map