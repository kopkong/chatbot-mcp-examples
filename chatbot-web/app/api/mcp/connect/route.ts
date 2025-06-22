import { NextRequest, NextResponse } from 'next/server';
import { MemoryDB } from '../../../lib/memoryDB';
import { createMCPClient } from '@/app/lib/mcp';

interface ConnectRequest {
  serverUrl: string;
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
    // 发现工具和能力
    const client = await createMCPClient(serverUrl);

    // 获取服务器能力
    const tools = await client.listTools();

    console.log(`📦 发现 ${tools.length} 个工具`);

    return NextResponse.json({
      success: true,
      connected: true,
      message: 'MCP服务器连接成功',
      tools: tools.tools,
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
    const memoryDB = MemoryDB.getInstance();

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
    const memoryDB = MemoryDB.getInstance();

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