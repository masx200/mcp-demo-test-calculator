# Changelog

## [1.0.0] - 2025-07-26

### 新增功能

- 支持基本的四则运算：加法、减法、乘法、除法
- 支持多种传输协议：stdio、SSE、Streamable HTTP
- 添加桥接工具 bridge-streamable.js，实现stdio和Streamable HTTP之间的通信
- 完整的MCP协议实现

### 技术特性

- 使用Map数据结构提高性能
- 工厂函数模式封装服务器创建逻辑
- 统一的代码格式和文档规范

### 文件结构

- `index-stdio.js` - stdio传输模式服务器
- `index-sse.js` - SSE传输模式服务器
- `index-streamable-http.js` - Streamable HTTP传输模式服务器
- `bridge-streamable.js` - 桥接工具
- `README.md` - 项目文档
- `package.json` - 项目配置
