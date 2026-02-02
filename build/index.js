#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { configureHaloscanServer } from "./haloscan-core.js";
dotenv.config();
const server = new McpServer({
    name: "haloscan-mcp",
    version: "1.0.1"
});
configureHaloscanServer(server);
const transport = new StdioServerTransport();
await server.connect(transport);
// stderr is allowed
console.error("Haloscan MCP (Claude Code) ready");
