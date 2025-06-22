import { NextRequest, NextResponse } from 'next/server';
import { memoryDB } from '../../lib/memoryDB';

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  config: {
    llmProvider: string;
    apiKey: string;
    baseUrl: string;
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
    mcpEnabled: boolean;
    mcpServer: string;
  };
}

interface LLMResponse {
  success: boolean;
  content?: string;
  error?: string;
  usage?: any;
}

// 调用LLM API
async function callLLMAPI(messages: ChatMessage[], config: any): Promise<LLMResponse> {
  const requestBody = {
    model: config.model,
    messages: messages,
    temperature: config.temperature,
    max_tokens: config.maxTokens
  };

  try {
    const response = await fetch(config.baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      content: data.choices[0].message.content,
      usage: data.usage
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

// 检查是否需要调用MCP工具
function needsMCPTools(content: string): boolean {
  // 检查用户消息中是否包含工具调用相关的关键词
  const toolKeywords = [
    '文件', '读取', '写入', '搜索', '查询', '数据库', '网络', '天气', 
    '时间', '日期', '计算', '翻译', '代码', '执行', '运行', '工具',
    'file', 'read', 'write', 'search', 'query', 'database', 'network', 
    'weather', 'time', 'date', 'calculate', 'translate', 'code', 'execute', 'run', 'tool'
  ];
  
  return toolKeywords.some(keyword => 
    content.toLowerCase().includes(keyword.toLowerCase())
  );
}

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

// 调用MCP工具
async function callMCPTools(content: string, config: any): Promise<string> {
  try {
    // 检查MCP连接状态
    const connectedServers = memoryDB.getConnectedMCPServers();
    if (connectedServers.length === 0) {
      return 'MCP服务器未连接，无法使用工具功能。请先在配置面板中连接MCP服务器。';
    }

    // 解析工具调用
    const toolCall = parseToolCall(content);
    if (!toolCall) {
      return '未识别到需要调用的工具。';
    }

    // 检查工具是否在连接的服务器中可用
    const availableTools = memoryDB.getAllTools();
    const toolAvailable = availableTools.some((serverTools: any) => 
      serverTools.tools.some((tool: any) => tool.name === toolCall.toolName)
    );

    if (!toolAvailable) {
      return `工具 "${toolCall.toolName}" 在连接的MCP服务器中不可用。`;
    }

    // 调用MCP工具API
    const toolResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/mcp/tools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        toolName: toolCall.toolName,
        parameters: toolCall.parameters,
        config: config
      })
    });

    const toolData = await toolResponse.json();
    
    if (toolData.success) {
      return `工具调用成功：${toolData.result}`;
    } else {
      return `工具调用失败：${toolData.error}`;
    }
  } catch (error) {
    console.error('MCP工具调用失败:', error);
    return 'MCP工具调用失败: ' + (error instanceof Error ? error.message : '未知错误');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, config } = body;

    // 获取最后一条用户消息
    const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
    console.log('lastUserMessage is: ', lastUserMessage);
    
    if (!lastUserMessage) {
      return NextResponse.json({
        success: false,
        error: '没有找到用户消息'
      });
    }

    // 检查是否需要调用MCP工具
    const shouldUseMCP = config.mcpEnabled && needsMCPTools(lastUserMessage.content);

    if (shouldUseMCP) {
      console.log('🔧 检测到需要调用MCP工具');
      
      // 调用MCP工具
      const mcpResult = await callMCPTools(lastUserMessage.content, config);
      
      // 将MCP结果添加到消息历史中
      const messagesWithMCP = [
        ...messages,
        {
          role: 'assistant',
          content: `工具调用结果：${mcpResult}`
        }
      ];

      // 调用LLM处理包含MCP结果的消息
      const llmResponse = await callLLMAPI(messagesWithMCP, config);
      
      return NextResponse.json(llmResponse);
    } else {
      console.log('💬 直接调用LLM');
      
      // 直接调用LLM
      const llmResponse = await callLLMAPI(messages, config);
      return NextResponse.json(llmResponse);
    }
  } catch (error) {
    console.error('聊天API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
} 