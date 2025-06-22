import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

// 全局MCP客户端缓存
let mcpClient: Client | null = null;
let mcpTools: any[] = [];
let lastServerUrl: string = '';

export async function POST(request: NextRequest) {
  try {
    const { serverUrl } = await request.json();

    if (!serverUrl) {
      return NextResponse.json(
        { success: false, error: '缺少MCP服务器地址' },
        { status: 400 }
      );
    }

    // 如果服务器地址相同且已连接，直接返回缓存的结果
    if (mcpClient && lastServerUrl === serverUrl) {
      return NextResponse.json({
        success: true,
        connected: true,
        tools: mcpTools,
        message: '使用已有连接'
      });
    }

    // 关闭之前的连接
    if (mcpClient) {
      try {
        await mcpClient.close();
      } catch (error) {
        console.log('关闭旧连接时出错:', error);
      }
      mcpClient = null;
      mcpTools = [];
    }

    // 创建新的MCP连接
    console.log('🔌 正在连接到MCP服务器:', serverUrl);
    
    const transport = new StreamableHTTPClientTransport(new URL(serverUrl));
    
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

    // 设置连接超时
    const connectPromise = client.connect(transport);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('连接超时')), 10000)
    );

    await Promise.race([connectPromise, timeoutPromise]);
    
    console.log('✅ 成功连接到 MCP 服务器');

    // 获取服务器可用工具
    const serverCapabilities = await client.listTools();
    console.log('📋 服务器可用工具:', serverCapabilities);

    if (serverCapabilities.tools && serverCapabilities.tools.length > 0) {
      mcpClient = client;
      mcpTools = serverCapabilities.tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description || '无描述',
        inputSchema: tool.inputSchema || {}
      }));
      lastServerUrl = serverUrl;

      return NextResponse.json({
        success: true,
        connected: true,
        tools: mcpTools,
        message: 'MCP服务器连接成功！'
      });
    } else {
      await client.close();
      return NextResponse.json(
        { 
          success: false, 
          connected: false,
          error: '服务器没有可用工具' 
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ MCP连接失败:', error);
    
    // 清理失败的连接
    if (mcpClient) {
      try {
        await mcpClient.close();
      } catch (e) {
        console.log('清理连接时出错:', e);
      }
      mcpClient = null;
      mcpTools = [];
      lastServerUrl = '';
    }

    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    return NextResponse.json(
      { 
        success: false, 
        connected: false,
        error: `连接失败: ${errorMessage}` 
      },
      { status: 500 }
    );
  }
}

// 获取当前连接状态
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      connected: mcpClient !== null,
      tools: mcpTools,
      serverUrl: lastServerUrl
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        connected: false,
        error: '获取状态失败' 
      },
      { status: 500 }
    );
  }
}

// 断开连接
export async function DELETE() {
  try {
    if (mcpClient) {
      await mcpClient.close();
      mcpClient = null;
      mcpTools = [];
      lastServerUrl = '';
      
      return NextResponse.json({
        success: true,
        message: 'MCP连接已断开'
      });
    } else {
      return NextResponse.json({
        success: true,
        message: '没有活动的连接'
      });
    }
  } catch (error) {
    console.error('断开MCP连接时出错:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '断开连接失败' 
      },
      { status: 500 }
    );
  }
} 