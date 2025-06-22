import { NextRequest, NextResponse } from 'next/server';
import { MemoryDB } from '../../../lib/memoryDB';

interface ToolCallRequest {
  toolName: string;
  parameters: any;
  config: {
    mcpServer: string;
  };
}

// 内置工具调用映射（用于模拟MCP工具调用）
const builtinToolHandlers = {
  'file_read': {
    description: '读取文件内容',
    handler: async (params: any) => {
      // 这里应该调用实际的MCP文件读取工具
      return `文件读取功能：${params.path || '未指定路径'}`;
    }
  },
  'file_write': {
    description: '写入文件内容',
    handler: async (params: any) => {
      // 这里应该调用实际的MCP文件写入工具
      return `文件写入功能：${params.path || '未指定路径'}`;
    }
  },
  'web_search': {
    description: '网络搜索',
    handler: async (params: any) => {
      // 这里应该调用实际的MCP网络搜索工具
      return `网络搜索结果：${params.query || '未指定查询'}`;
    }
  },
  'weather': {
    description: '获取天气信息',
    handler: async (params: any) => {
      // 这里应该调用实际的MCP天气工具
      return `天气信息：${params.location || '未指定位置'}`;
    }
  },
  'calculator': {
    description: '计算器',
    handler: async (params: any) => {
      // 这里应该调用实际的MCP计算器工具
      try {
        const result = eval(params.expression);
        return `计算结果：${params.expression} = ${result}`;
      } catch (error) {
        return `计算错误：${error instanceof Error ? error.message : '未知错误'}`;
      }
    }
  }
};

// 调用MCP工具
async function callMCPTool(toolName: string, parameters: any): Promise<string> {
  try {
    // 首先检查是否为内置工具处理器
    if (builtinToolHandlers[toolName as keyof typeof builtinToolHandlers]) {
      const handler = builtinToolHandlers[toolName as keyof typeof builtinToolHandlers];
      return await handler.handler(parameters);
    }

    // 这里应该调用真正的MCP工具
    // 目前返回模拟结果
    return `MCP工具 "${toolName}" 调用成功，参数：${JSON.stringify(parameters)}`;
  } catch (error) {
    throw new Error(`工具调用失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ToolCallRequest = await request.json();
    const { toolName, parameters, config } = body;

    console.log(`🔧 调用工具: ${toolName}，参数:`, parameters);

    // 检查MCP连接状态
    const memoryDB = MemoryDB.getInstance();
    const connectedServers = memoryDB.getConnectedMCPServers();
    if (connectedServers.length === 0) {
      return NextResponse.json({
        success: false,
        error: '没有连接的MCP服务器'
      });
    }

    // 检查工具是否在连接的服务器中可用
    const availableTools = memoryDB.getAllTools();
    const allMCPTools = availableTools.flatMap(serverTools => serverTools.tools);
    
    const targetTool = allMCPTools.find(tool => tool.name === toolName);
    if (!targetTool && !builtinToolHandlers[toolName as keyof typeof builtinToolHandlers]) {
      return NextResponse.json({
        success: false,
        error: `工具 "${toolName}" 不存在`
      });
    }

    // 调用工具
    const result = await callMCPTool(toolName, parameters);

    // 记录工具调用到内存数据库
    const serverId = connectedServers[0].id; // 使用第一个连接的服务器
    memoryDB.updateMCPServer(serverId, {
      lastPing: new Date()
    });

    console.log(`✅ 工具调用成功: ${toolName}`);

    return NextResponse.json({
      success: true,
      result: result,
      toolName: toolName,
      description: targetTool?.description || builtinToolHandlers[toolName as keyof typeof builtinToolHandlers]?.description,
      serverId: serverId
    });
  } catch (error) {
    console.error('MCP工具调用错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '工具调用失败'
    });
  }
}

// 获取可用工具列表
export async function GET() {
  try {
    const memoryDB = MemoryDB.getInstance();
    const connectedServers = memoryDB.getConnectedMCPServers();
    const allTools = memoryDB.getAllTools();
    
    // 合并内置工具和MCP服务器工具
    const builtinTools = Object.entries(builtinToolHandlers).map(([name, tool]) => ({
      name,
      description: tool.description,
      type: 'builtin'
    }));

    const mcpServerTools = allTools.flatMap(serverTools => 
      serverTools.tools.map(tool => ({
        ...tool,
        serverId: serverTools.serverId,
        serverName: serverTools.serverName,
        type: 'mcp'
      }))
    );

    return NextResponse.json({
      success: true,
      tools: {
        builtin: builtinTools,
        mcp: mcpServerTools,
        all: [...builtinTools, ...mcpServerTools]
      },
      servers: connectedServers,
      stats: memoryDB.getStats()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取工具列表失败'
    });
  }
} 