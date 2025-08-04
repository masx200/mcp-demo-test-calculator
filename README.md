# mcp-demo-test

#### 介绍

这是一个基于 MCP（Model Context
Protocol）协议的计算器服务示例项目，提供了加法、减法、乘法和除法四种基本数学运算功能。项目支持两种运行模式：SSE（Server-Sent
Events）模式和 stdio 模式，可作为 MCP 服务器与 AI 助手集成使用。

#### 软件架构

- **技术栈**：Node.js + Express + Zod + MCP SDK
- **架构模式**：MCP 服务器架构
- **传输协议**：
  - SSE 模式：基于 HTTP 的 Server-Sent Events
  - stdio 模式：标准输入输出流
- **功能模块**：
  - 计算器核心服务（add/sub/mul/div 四个工具）
  - SSE 传输层处理
  - stdio 传输层处理

#### 安装教程

1. **克隆项目**

   ```bash
   git clone [项目地址]
   cd mcp-demo-test
   ```

2. **安装依赖**

   ```bash
   npm install
   ```

3. **验证安装**
   ```bash
   npm list
   ```

#### 使用说明

##### 1. SSE 模式运行

SSE 模式通过 HTTP 协议提供服务，适用于需要网络访问的场景。

**启动服务：**

```bash
node index-sse.js
```

**或指定端口：**

```bash
HTTP_API_PORT=3001 node index-sse.js
```

**或同时指定端口和访问令牌：**

```bash
HTTP_API_PORT=3001 HTTP_API_TOKEN=your-secret-token node index-sse.js
```

**服务启动后：**

- 服务地址：http://localhost:3000
- SSE 端点：http://localhost:3000/sse
- 消息端点：http://localhost:3000/messages

**测试连接：**

```bash
curl http://localhost:3000/sse
```

##### 2. Streamable HTTP 模式运行（新版）

Streamable HTTP 模式基于 MCP 官方 Streamable HTTP 协议，使用真正的
StreamableHTTPServerTransport 实现，支持完整的会话管理和状态持久化。

**启动服务：**

```bash
npm run start:streamable
```

**或直接使用：**

```bash
node index-streamable-http.js
```

**或指定端口：**

```bash
HTTP_API_PORT=3001 node index-streamable-http.js
```

**或同时指定端口和访问令牌：**

```bash
HTTP_API_PORT=3001 HTTP_API_TOKEN=your-secret-token node index-streamable-http.js
```

**服务启动后：**

- 服务地址：http://localhost:3000
- MCP 端点：http://localhost:3000/mcp

**特性：**

- 会话管理（sessionId）
- 状态持久化
- 服务器到客户端通知
- 会话终止
- 健康检查

**测试连接：**

```bash
node test-streamable-mcp.js
```

然后访问：http://localhost:3001/test

##### 2. stdio 模式运行

stdio 模式通过标准输入输出进行通信，适用于本地集成场景。

**启动服务：**

```bash
node index-stdio.js
```

**或作为全局命令：**

```bash
npm install -g .
mcp-calc
```

##### 3. MCP 配置集成

将计算器服务集成到 MCP 客户端的配置示例：

**SSE 模式配置：**

```json
{
  "mcpServers": {
    "calculator-sse": {
      "isActive": true,
      "name": "calculator-service",
      "type": "sse",
      "description": "A simple calculator service supporting addition, subtraction, multiplication and division",
      "baseUrl": "http://localhost:3000/sse",
      "url": "http://localhost:3000/sse"
    }
  }
}
```

**Streamable HTTP 模式配置（新版）：**

```json
{
  "mcpServers": {
    "calculator-streamable-http": {
      "isActive": true,
      "name": "calculator-service",
      "type": "streamable",
      "description": "A simple calculator service supporting addition, subtraction, multiplication and division",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

**stdio 模式配置：**

```json
{
  "mcpServers": {
    "calculator-stdio": {
      "isActive": true,
      "name": "calculator-service",
      "description": "A simple calculator service supporting addition, subtraction, multiplication and division",
      "command": "node",
      "args": ["path/to/index-stdio.js"],
      "env": {}
    }
  }
}
```

##### 4. 功能使用

**可用工具：**

- `add` - 加法运算
- `sub` - 减法运算
- `mul` - 乘法运算
- `div` - 除法运算

**使用示例：**

**加法：**

```json
{
  "tool": "add",
  "arguments": {
    "a": 10,
    "b": 5
  }
}
```

结果：15

**除法（注意除零错误）：**

```json
{
  "tool": "div",
  "arguments": {
    "a": 10,
    "b": 0
  }
}
```

结果：错误信息"Division by zero"

#### 开发说明

**项目结构：**

```
mcp-demo-test/
├── index-sse.js              # SSE模式服务器（旧版）
├── index-stdio.js           # stdio模式服务器
├── index-streamable-http.js # Streamable HTTP模式服务器（新版）
├── test-streamable-mcp.js   # Streamable HTTP测试脚本
├── package.json             # 项目配置
├── LICENSE                  # 许可证
└── README.md                # 项目文档
```

**依赖说明：**

- `@modelcontextprotocol/sdk`: MCP 协议 SDK
- `express`: Web 服务器框架
- `zod`: 数据验证库

#### 注意事项

1. **端口冲突**：如果 3000 端口被占用，请设置`PORT`环境变量
2. **跨域问题**：SSE 模式已处理跨域请求
3. **错误处理**：所有运算都有适当的错误处理机制
4. **性能优化**：服务为单实例运行，适合个人或小团队使用

#### 环境变量配置

项目支持以下环境变量进行配置：

- **HTTP_API_PORT**: 服务端口配置（默认：3000）

  - SSE 模式：`HTTP_API_PORT=3001 node index-sse.js`
  - Streamable HTTP 模式：`HTTP_API_PORT=3001 node index-streamable-http.js`

- **HTTP_API_TOKEN**: HTTP Bearer Token 访问验证（可选）
  - 设置后，所有 HTTP 请求需要在 Authorization 头中包含：
    ```
    Authorization: Bearer your-secret-token
    ```
  - 示例：
    ```bash
    HTTP_API_TOKEN=my-secret-key node index-sse.js
    ```
  - 未设置时，服务允许匿名访问
