#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
function factory() {
  // Create MCP server
  const server = new McpServer({
    name: "calculator-service",
    version: "1.0.0",
  });

  // Register calculator tools
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
  return server;
}

const app = express();
app.use(express.json());
app.use(authenticateToken);
// Token验证中间件
const authenticateToken = (req, res, next) => {
  const token = process.env.HTTP_API_TOKEN;
  if (!token) {
    return next(); // 未设置token，允许匿名访问
  }

  const authHeader = req.headers["authorization"];
  const bearerToken = authHeader && authHeader.split(" ")[1];

  if (
    !authHeader.startsWith("Bearer ") ||
    !bearerToken ||
    bearerToken !== token
  ) {
    return res.status(401).json({
      jsonrpc: "2.0",
      error: {
        code: -32001,
        message: "Unauthorized: Invalid or missing token",
      },
      id: null,
    });
  }

  next();
};

// Map to store transports by session ID
const transports = new Map();

// Handle POST requests for client-to-server communication
app.post("/mcp", authenticateToken, async (req, res) => {
  // Check for existing session ID
  const sessionId = req.headers["mcp-session-id"];
  let transport;

  if (sessionId && transports.has(sessionId)) {
    // Reuse existing transport
    transport = transports.get(sessionId);
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // New initialization request
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        // Store the transport by session ID
        transports.set(transport.sessionId, transport);
        console.log(`New session initialized: ${sessionId}`);
      },
      // DNS rebinding protection is disabled by default for backwards compatibility
      // If you are running this server locally, you can enable it:
      // enableDnsRebindingProtection: true,
      // allowedHosts: ['127.0.0.1', 'localhost'],
    });

    // Clean up transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        console.log(`Session closed: ${transport.sessionId}`);
        transports.delete(transport.sessionId);
      }
    };
    const server = factory();
    // Connect to the MCP server
    await server.connect(transport);
  } else {
    // Invalid request
    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Bad Request: No valid session ID provided",
      },
      id: null,
    });
    return;
  }

  // Handle the request
  await transport.handleRequest(req, res, req.body);
});

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (req, res) => {
  const sessionId = req.headers["mcp-session-id"];
  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }

  const transport = transports.get(sessionId);
  await transport.handleRequest(req, res);
};

// Handle GET requests for server-to-client notifications via SSE
app.get("/mcp", authenticateToken, handleSessionRequest);

// Handle DELETE requests for session termination
app.delete("/mcp", authenticateToken, handleSessionRequest);

// Start the server
const PORT = process.env.HTTP_API_PORT || 3000;
app.on("error", (err) => console.error("Failed to start HTTP server:", err));
app.listen(PORT, (err) => {
  if (err) return console.error("Failed to start HTTP server:", err);

  console.log(
    `MCP calculator streamable HTTP server listening on http://localhost:${PORT}`,
  );
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);

  const token = process.env.HTTP_API_TOKEN;
  if (token) {
    console.log("HTTP API token authentication enabled,token:", token);
  } else {
    console.log(
      "HTTP API token authentication disabled (anonymous access allowed)",
    );
  }
});
