import { NextRequest, NextResponse } from 'next/server';
import { memoryDB } from '../../../lib/memoryDB';
import { v4 as uuidv4 } from 'uuid';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { MCPTool } from '@/app/types';

interface ConnectRequest {
  serverUrl: string;
}

// 模拟MCP工具发现
async function discoverMCPServerTools(serverUrl: string): Promise<MCPTool[]> {
  // 创建 HTTP 传输
  const transport = new StreamableHTTPClientTransport(new URL(serverUrl));
      
  // 创建 MCP 客户端
  const client = new Client(
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
  await client.connect(transport);
  console.log('成功连接到 MCP 服务器');

  // 获取服务器能力
  const serverCapabilities = await client.listTools();
  // console.log('📋 服务器可用工具:', serverCapabilities);

  return serverCapabilities.tools.map(tool => {
    const mcpTool = {
        name: tool.name,
        description: tool.description || '',
        inputSchema: tool.inputSchema as any
    }

    return mcpTool;
  });
}

// 模拟MCP服务器能力发现
async function discoverMCPServerCapabilities(serverUrl: string): Promise<string[]> {
  try {
    // 这里应该实现真正的MCP协议能力发现
    const mockCapabilities = [
      'file_operations',
      'web_search',
      'weather_data',
      'mathematical_calculations',
      'text_processing'
    ];

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return mockCapabilities;
  } catch (error) {
    console.error('能力发现失败:', error);
    return [];
  }
}

// 测试MCP服务器连接
async function testMCPServerConnection(serverUrl: string): Promise<boolean> {
  try {
    // 这里应该实现真正的MCP协议连接测试
    // 目前模拟连接测试
    const response = await fetch(`${serverUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000) // 5秒超时
    });

    return response.ok;
  } catch (error) {
    console.error('MCP服务器连接测试失败:', error);
    // 如果连接测试失败，我们仍然允许连接（用于开发环境）
    return true;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ConnectRequest = await request.json();
    const { serverUrl } = body;

    if (!serverUrl || !serverUrl.trim()) {
      return NextResponse.json({
        success: false,
        error: '服务器URL不能为空'
      });
    }

    console.log(`🔌 正在连接到 MCP 服务器: ${serverUrl}`);

    // 检查是否已经存在该URL的服务器
    const existingServer = memoryDB.getMCPServerByUrl(serverUrl);
    if (existingServer && existingServer.connected) {
      return NextResponse.json({
        success: true,
        connected: true,
        message: 'MCP服务器已经连接',
        serverId: existingServer.id,
        tools: existingServer.tools,
      });
    }

    // 发现工具和能力
    const tools = await discoverMCPServerTools(serverUrl);

    // 生成服务器ID
    const serverId = existingServer?.id || uuidv4();
    const serverName = `MCP Server ${serverId.slice(0, 8)}`;

    // 创建或更新服务器记录
    const server = {
      id: serverId,
      url: serverUrl,
      name: serverName,
      connected: true,
      connectedAt: new Date(),
      lastPing: new Date(),
      tools: tools,
      status: 'connected' as const
    };

    memoryDB.addMCPServer(server);

    // 创建连接记录
    const connection = {
      serverId: serverId,
      serverUrl: serverUrl,
      isActive: true,
      createdAt: new Date(),
      lastActivity: new Date()
    };

    memoryDB.addConnection(connection);

    console.log(`✅ MCP服务器连接成功: ${serverName}`);
    console.log(`📦 发现 ${tools.length} 个工具`);

    return NextResponse.json({
      success: true,
      connected: true,
      message: 'MCP服务器连接成功',
      serverId: serverId,
      serverName: serverName,
      tools: tools,
      stats: memoryDB.getStats()
    });

  } catch (error) {
    console.error('❌ MCP连接失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '连接失败'
    });
  }
}

export async function GET() {
  try {
    const connectedServers = memoryDB.getConnectedMCPServers();
    const activeConnections = memoryDB.getAllActiveConnections();
    const stats = memoryDB.getStats();

    return NextResponse.json({
      success: true,
      connected: connectedServers.length > 0,
      servers: connectedServers,
      activeConnections: activeConnections,
      stats: stats
    });
  } catch (error) {
    console.error('获取MCP状态失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取状态失败'
    });
  }
}

export async function DELETE() {
  try {
    // 断开所有连接
    const activeConnections = memoryDB.getAllActiveConnections();
    activeConnections.forEach(connection => {
      memoryDB.removeConnection(connection.serverId);
      memoryDB.updateMCPServer(connection.serverId, {
        connected: false,
        status: 'disconnected'
      });
    });

    console.log(`🔌 已断开 ${activeConnections.length} 个MCP连接`);

    return NextResponse.json({
      success: true,
      message: '所有MCP连接已断开',
      disconnectedCount: activeConnections.length
    });
  } catch (error) {
    console.error('断开MCP连接失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '断开连接失败'
    });
  }
} 