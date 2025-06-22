import { NextRequest, NextResponse } from 'next/server';
import { MemoryDB } from '../../../lib/memoryDB';

export async function GET() {
  try {
    const memoryDB = MemoryDB.getInstance();
    const stats = memoryDB.getStats();
    const allServers = memoryDB.getAllMCPServers();
    const connectedServers = memoryDB.getConnectedMCPServers();
    const activeConnections = memoryDB.getAllActiveConnections();
    const allTools = memoryDB.getAllTools();

    return NextResponse.json({
      success: true,
      stats: stats,
      servers: {
        all: allServers,
        connected: connectedServers
      },
      connections: {
        active: activeConnections,
        history: memoryDB.getConnectionHistory()
      },
      tools: allTools
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
    memoryDB.reset();
    
    return NextResponse.json({
      success: true,
      message: 'MCP内存数据库已重置'
    });
  } catch (error) {
    console.error('重置MCP数据库失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '重置失败'
    });
  }
} 