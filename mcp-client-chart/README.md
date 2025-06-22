# MCP 图表客户端

这是一个 Model Context Protocol (MCP) 图表客户端，用于连接和与 MCP 图表服务器进行交互。

## 功能特性

- 🔗 连接到 MCP 服务器
- 🛠️ 列出服务器可用工具
- 📊 创建和管理图表
- 🐳 Docker 容器化支持
- 📋 命令行界面

## 快速开始

### 本地运行

1. 安装依赖：
```bash
npm install
```

2. 连接到服务器（默认 localhost:1122）：
```bash
npm start
```

3. 或指定服务器地址：
```bash
node client.js connect --server http://your-server:1122
```