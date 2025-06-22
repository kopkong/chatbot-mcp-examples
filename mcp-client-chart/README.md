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

### Docker 运行

1. 构建镜像：
```bash
chmod +x build.sh
./build.sh
```

2. 运行测试：
```bash
docker run --rm mcp-client-chart:latest npm run test
```

3. 连接到指定服务器：
```bash
docker run --rm mcp-client-chart:latest node client.js connect --server http://your-server:1122
```

## 命令行接口

### 基本命令

- `connect` - 连接到 MCP 服务器
- `test` - 测试客户端功能

### 选项

- `-s, --server <url>` - 指定服务器地址（默认：http://localhost:1122）

### 示例

```bash
# 连接到默认服务器
node client.js connect

# 连接到指定服务器
node client.js connect --server http://192.168.1.100:1122

# 运行测试
node client.js test
```

## API 使用

```javascript
import { MCPChartClient } from './client.js';

async function example() {
  const client = new MCPChartClient('http://localhost:1122');
  
  // 连接到服务器
  await client.connect();
  
  // 列出可用工具
  await client.listTools();
  
  // 创建图表
  const chartConfig = {
    type: 'bar',
    data: {
      labels: ['一月', '二月', '三月'],
      datasets: [{
        label: '数据',
        data: [10, 20, 30]
      }]
    }
  };
  
  await client.createChart(chartConfig);
  
  // 断开连接
  await client.disconnect();
}
```

## 配置

客户端支持以下配置：

- **服务器地址**: 默认 `http://localhost:1122`
- **传输协议**: SSE (Server-Sent Events)
- **客户端名称**: `mcp-chart-client`

## 依赖项

- `@modelcontextprotocol/sdk` - MCP SDK
- `eventsource` - SSE 支持
- `commander` - 命令行界面
- `axios` - HTTP 请求

## 开发

```bash
# 开发模式（热重载）
npm run dev

# 构建 Docker 镜像
npm run build
```

## 故障排除

### 连接失败

1. 确保 MCP 服务器正在运行
2. 检查服务器地址和端口
3. 验证网络连接

### 工具调用失败

1. 确认服务器支持相应工具
2. 检查参数格式是否正确
3. 查看服务器日志

## 许可证

MIT License 