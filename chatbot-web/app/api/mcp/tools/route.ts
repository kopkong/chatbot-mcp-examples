import { NextRequest, NextResponse } from 'next/server';
import { memoryDB } from '../../../lib/memoryDB';

interface ToolCallRequest {
  toolName: string;
  parameters: any;
  config: {
    mcpServer: string;
  };
}

// MCP工具调用映射
const mcpTools = {
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

// 解析用户消息，识别需要调用的工具
function parseToolCall(content: string): { toolName: string; parameters: any } | null {
  const lowerContent = content.toLowerCase();
  
  // 文件读取
  if (lowerContent.includes('读取') || lowerContent.includes('read') || lowerContent.includes('打开')) {
    const fileMatch = content.match(/(?:读取|read|打开)\s*["""]?([^"""]+)["""]?/);
    if (fileMatch) {
      return {
        toolName: 'file_read',
        parameters: { path: fileMatch[1] }
      };
    }
  }
  
  // 文件写入
  if (lowerContent.includes('写入') || lowerContent.includes('write') || lowerContent.includes('保存')) {
    const fileMatch = content.match(/(?:写入|write|保存)\s*["""]?([^"""]+)["""]?/);
    if (fileMatch) {
      return {
        toolName: 'file_write',
        parameters: { path: fileMatch[1] }
      };
    }
  }
  
  // 网络搜索
  if (lowerContent.includes('搜索') || lowerContent.includes('search') || lowerContent.includes('查找')) {
    const searchMatch = content.match(/(?:搜索|search|查找)\s*["""]?([^"""]+)["""]?/);
    if (searchMatch) {
      return {
        toolName: 'web_search',
        parameters: { query: searchMatch[1] }
      };
    }
  }
  
  // 天气查询
  if (lowerContent.includes('天气') || lowerContent.includes('weather')) {
    const weatherMatch = content.match(/(?:天气|weather)\s*["""]?([^"""]+)["""]?/);
    if (weatherMatch) {
      return {
        toolName: 'weather',
        parameters: { location: weatherMatch[1] }
      };
    }
  }
  
  // 计算器
  if (lowerContent.includes('计算') || lowerContent.includes('calculate') || lowerContent.includes('=')) {
    const calcMatch = content.match(/(?:计算|calculate|=\s*)([0-9+\-*/().\s]+)/);
    if (calcMatch) {
      return {
        toolName: 'calculator',
        parameters: { expression: calcMatch[1].trim() }
      };
    }
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body: ToolCallRequest = await request.json();
    const { toolName, parameters, config } = body;

    // 检查工具是否存在
    if (!mcpTools[toolName as keyof typeof mcpTools]) {
      return NextResponse.json({
        success: false,
        error: `工具 "${toolName}" 不存在`
      });
    }

    // 检查MCP连接状态
    const connectedServers = memoryDB.getConnectedMCPServers();
    if (connectedServers.length === 0) {
      return NextResponse.json({
        success: false,
        error: '没有连接的MCP服务器'
      });
    }

    // 调用工具
    const tool = mcpTools[toolName as keyof typeof mcpTools];
    const result = await tool.handler(parameters);

    // 记录工具调用到内存数据库
    const serverId = connectedServers[0].id; // 使用第一个连接的服务器
    memoryDB.updateMCPServer(serverId, {
      lastPing: new Date()
    });

    return NextResponse.json({
      success: true,
      result: result,
      toolName: toolName,
      description: tool.description,
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
    const connectedServers = memoryDB.getConnectedMCPServers();
    const allTools = memoryDB.getAllTools();
    
    // 合并内置工具和MCP服务器工具
    const builtinTools = Object.entries(mcpTools).map(([name, tool]) => ({
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