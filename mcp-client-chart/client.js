#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { program } from 'commander';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MCPChartClient {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.client = null;
    this.transport = null;
  }

  async connect() {
    try {
      console.log(`正在连接到 MCP 服务器: ${this.serverUrl}`);
      
      // 创建 HTTP 传输
      this.transport = new StreamableHTTPClientTransport(new URL(this.serverUrl));
      
      // 创建 MCP 客户端
      this.client = new Client(
        {
          name: "mcp-chart-client",
          version: "1.0.0"
        },
        {
          capabilities: {
            tools: {}
          }
        }
      );

      // 连接到服务器
      await this.client.connect(this.transport);
      console.log('✅ 成功连接到 MCP 服务器');

      // 获取服务器能力
      const serverCapabilities = await this.client.listTools();
      console.log('📋 服务器可用工具:', serverCapabilities);

      return true;
    } catch (error) {
      console.error('❌ 连接失败:', error.message);
      return false;
    }
  }

  async listTools() {
    try {
      if (!this.client) {
        throw new Error('客户端未连接');
      }

      const tools = await this.client.listTools();
      console.log('\n🛠️  可用工具:');
      tools.tools.forEach((tool, index) => {
        console.log(`${index + 1}. ${tool.name}: ${tool.description}`);
      });
      
      return tools;
    } catch (error) {
      console.error('❌ 获取工具列表失败:', error.message);
      throw error;
    }
  }

  async callTool(toolName, parameters = {}) {
    try {
      if (!this.client) {
        throw new Error('客户端未连接');
      }

      console.log(`\n🔧 调用工具: ${toolName}`);
      console.log('📝 参数:', JSON.stringify(parameters, null, 2));

      const result = await this.client.callTool({
        name: toolName,
        arguments: parameters
      });

      console.log('✅ 工具调用成功');
      console.log('📊 结果:', JSON.stringify(result, null, 2));
      
      return result;
    } catch (error) {
      console.error('❌ 工具调用失败:', error.message);
      throw error;
    }
  }

  async createChart(chartConfig) {
    try {      
      // 选择第一个工具
      const tools = await this.client.listTools();
      const tool = tools.tools[0];

      // 打印inputschema
      console.log('📝 inputschema:', tool.inputSchema);

      const result = await this.callTool(tool.name, chartConfig);

      return result;
    } catch (error) {
      console.error('❌ 创建图表失败:', error.message);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
        console.log('🔌 已断开与服务器的连接');
      }
    } catch (error) {
      console.error('❌ 断开连接时出错:', error.message);
    }
  }
}

// 示例使用函数
async function demonstrateClient(serverUrl) {
  const client = new MCPChartClient(serverUrl);

  try {
    // 连接到服务器
    const connected = await client.connect();
    if (!connected) {
      return;
    }

    // 列出可用工具
    await client.listTools();

    // 示例：创建一个简单的图表
    const chartConfig = {
      "data": [
        {
          "time": "2018",
          "value": 99.9,
          "group": "Group A"
        },
        {
          "time": "2019",
          "value": 105.2,
          "group": "Group A"
        },
        {
          "time": "2018",
          "value": 80.5,
          "group": "Group B"
        },
        {
          "time": "2019",
          "value": 95.3,
          "group": "Group B"
        }
      ],
      "stack": true,
      "theme": "academy",
      "width": 800,
      "height": 500,
      "title": "Example Area Chart",
      "axisXTitle": "Year",
      "axisYTitle": "Value"
    };

    console.log('\n📈 尝试创建图表...');
    await client.createChart(chartConfig);

  } catch (error) {
    console.error('❌ 演示过程中出错:', error.message);
  } finally {
    await client.disconnect();
  }
}

// 命令行接口
program
  .name('mcp-chart-client')
  .description('MCP 图表客户端')
  .version('1.0.0');

program
  .command('connect')
  .description('连接到 MCP 服务器')
  .option('-s, --server <url>', '服务器地址', 'http://localhost:1122/mcp')
  .action(async (options) => {
    await demonstrateClient(options.server);
  });

program
  .command('test')
  .description('测试客户端功能')
  .option('-s, --server <url>', '服务器地址', 'http://localhost:1122')
  .action(async (options) => {
    console.log('🧪 开始测试 MCP 客户端...');
    await demonstrateClient(options.server);
  });

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}

export { MCPChartClient }; 