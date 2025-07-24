import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";

const app = express();
app.use(express.json());

// 1. 新建 MCP Server
const server = new McpServer({
  name: "calculator-service",
  version: "1.0.0",
});

// 2. 注册四个工具：add / sub / mul / div
const defineCalcTool = (op, symbol) =>
  server.registerTool(
    op,
    {
      title: `${op} tool`,
      description: `${op} two numbers`,
      inputSchema: {
        a: z.number(),
        b: z.number(),
      },
    },
    async ({ a, b }) => {
      let result;
      switch (symbol) {
        case "+":
          result = a + b;
          break;
        case "-":
          result = a - b;
          break;
        case "*":
          result = a * b;
          break;
        case "/":
          if (b === 0) {
            return {
              content: [{ type: "text", text: "Division by zero" }],
              isError: true,
            };
          }
          result = a / b;
          break;
      }
      return { content: [{ type: "text", text: String(result) }] };
    },
  );

defineCalcTool("add", "+");
defineCalcTool("sub", "-");
defineCalcTool("mul", "*");
defineCalcTool("div", "/");

// 3. 存储 SSE 会话
const transports = new Map();

// 4. 创建 SSE 端点
app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  transports.set(transport.sessionId, transport);

  res.on("close", () => transports.delete(transport.sessionId));

  await server.connect(transport);
});

// 5. 接收客户端 POST 消息
app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports.get(sessionId);
  if (!transport) return res.status(400).send("Unknown session");

  await transport.handlePostMessage(req, res, req.body);
});

// 6. 启动 HTTP 服务
const PORT = process.env.PORT || 3000;
app.on("error", (err) => console.error("Failed to start HTTP server:", err));
app.listen(PORT, (err) => {
  if (err) return console.error("Failed to start HTTP server:", err);

  console.log(`MCP calc server listening on http://localhost:${PORT}`);

  console.log(`MCP endpoint: http://localhost:${PORT}/sse`);
});
