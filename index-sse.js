import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { z } from "zod";

const app = express();
app.use(express.json());

app.use(authenticateToken);
// Token验证中间件
async function authenticateToken(req, res, next) {
  const token = process.env.HTTP_API_TOKEN;
  if (!token) {
    return next(); // 未设置token，允许匿名访问
  }

  const authHeader = req.headers["authorization"];
  const bearerToken = authHeader && authHeader.split(" ")[1];

  if (
    !authHeader?.startsWith("Bearer ") ||
    !bearerToken ||
    bearerToken !== token
  ) {
    return res
      .status(401)
      .json({ error: "Unauthorized: Invalid or missing token" });
  }

  next();
}
function factory() {
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
  return server;
}
// 3. 存储 SSE 会话
const transports = new Map();

// 4. 创建 SSE 端点
app.get("/sse", authenticateToken, async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  transports.set(transport.sessionId, transport);
  const sessionId = transport.sessionId;
  console.log(`New session initialized: ${sessionId}`);
  res.on("close", () => transports.delete(transport.sessionId));
  const server = factory();
  transport.onmessage = async (message, extra) => {
    console.error("message:", JSON.stringify(message, null, 4));
    console.error("extra:", JSON.stringify(extra, null, 4));
  };
  await server.connect(transport);
});

// 5. 接收客户端 POST 消息
app.post("/messages", authenticateToken, async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports.get(sessionId);
  if (!transport) return res.status(400).send("Unknown session");

  await transport.handlePostMessage(req, res, req.body);
});

// 6. 启动 HTTP 服务
const PORT = process.env.HTTP_API_PORT || 3000;
app.on("error", (err) => console.error("Failed to start HTTP server:", err));
app.listen(PORT, (err) => {
  if (err) return console.error("Failed to start HTTP server:", err);

  console.log(`MCP calc server listening on http://localhost:${PORT}`);
  console.log(`MCP endpoint: http://localhost:${PORT}/sse`);

  const token = process.env.HTTP_API_TOKEN;
  if (token) {
    console.log("HTTP API token authentication enabled,token:", token);
  } else {
    console.log(
      "HTTP API token authentication disabled (anonymous access allowed)",
    );
  }
});
