#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 1. 创建 MCP 服务器
const server = new McpServer({
  name: "calculator-service",
  version: "1.0.0",
});

// 2. 注册 4 个独立的 tool
server.registerTool(
  "add",
  {
    title: "Addition",
    description: "Add two numbers",
    inputSchema: { a: z.number(), b: z.number() },
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }],
  }),
);

server.registerTool(
  "sub",
  {
    title: "Subtraction",
    description: "Subtract b from a",
    inputSchema: { a: z.number(), b: z.number() },
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a - b) }],
  }),
);

server.registerTool(
  "mul",
  {
    title: "Multiplication",
    description: "Multiply two numbers",
    inputSchema: { a: z.number(), b: z.number() },
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a * b) }],
  }),
);

server.registerTool(
  "div",
  {
    title: "Division",
    description: "Divide a by b",
    inputSchema: { a: z.number(), b: z.number() },
  },
  async ({ a, b }) => {
    if (b === 0) {
      return {
        content: [{ type: "text", text: "Division by zero" }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: String(a / b) }],
    };
  },
);

// 3. 使用 stdio 传输启动
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Calc MCP stdio server started"); // 日志打到 stderr，避免污染 JSON-RPC
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
