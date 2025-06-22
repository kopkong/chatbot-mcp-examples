import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

class MCPClientManager {
  private static instance: MCPClientManager;
  private client: Client | null = null;
  private isConnected: boolean = false;
  private serverUrl: string | null = null;

  private constructor() {}

  public static getInstance(): MCPClientManager {
    if (!MCPClientManager.instance) {
      MCPClientManager.instance = new MCPClientManager();
    }
    return MCPClientManager.instance;
  }

  public async connect(serverUrl: string): Promise<Client> {
    // 如果已经连接到同一个服务器，直接返回现有客户端
    if (this.isConnected && this.serverUrl === serverUrl && this.client) {
      return this.client;
    }

    // 如果已连接但服务器不同，先断开连接
    if (this.isConnected && this.serverUrl !== serverUrl) {
      await this.disconnect();
    }

    try {
      // 创建 HTTP 传输
      const transport = new StreamableHTTPClientTransport(new URL(serverUrl));
      
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
      await this.client.connect(transport);
      this.isConnected = true;
      this.serverUrl = serverUrl;
      console.log('成功连接到 MCP 服务器:', serverUrl);

      return this.client;
    } catch (error) {
      this.client = null;
      this.isConnected = false;
      this.serverUrl = null;
      console.error('连接 MCP 服务器失败:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.close();
        console.log('已断开 MCP 服务器连接');
      } catch (error) {
        console.error('断开连接时出错:', error);
      } finally {
        this.client = null;
        this.isConnected = false;
        this.serverUrl = null;
      }
    }
  }

  public getClient(): Client | null {
    return this.client;
  }

  public isClientConnected(): boolean {
    return this.isConnected && this.client !== null;
  }

  public getServerUrl(): string | null {
    return this.serverUrl;
  }
}

// 导出单例实例
export const mcpClientManager = MCPClientManager.getInstance();

// 兼容性导出，保持原有API
export async function createMCPClient(serverUrl: string): Promise<Client> {
  return await mcpClientManager.connect(serverUrl);
}