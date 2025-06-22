import { NextRequest, NextResponse } from 'next/server';
import { MemoryDB } from '../../lib/memoryDB';
import { createMCPClient } from '@/app/lib/mcp';
import { MCPTool } from '@/app/types';
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

interface ToolCallDecision {
  needsTools: boolean;
  toolName?: string;
  parameters?: any;
  reasoning?: string;
  inputSchema?: any;
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

// 根据用户提问和inputSchema生成满足要求的schema对象
async function generateSchemaFromUserInput(userMessage: string, inputSchema: any, config: any): Promise<any> {
  try {
    // 构建schema描述
    const schemaDescription = JSON.stringify(inputSchema, null, 2);
    
    // 构建生成提示词
    const generationPrompt = `你是一个专业的参数生成助手。根据用户的问题和工具的输入schema，生成符合要求的参数对象。

工具的输入schema：
${schemaDescription}

用户问题：${userMessage}

请根据用户的问题，从schema中提取相关信息，生成一个完全符合schema要求的参数对象。

要求：
1. 生成的参数必须完全符合schema的格式和类型要求
2. 如果schema中有required字段，必须包含所有必需参数
3. 参数值应该从用户问题中合理推断
4. 如果用户问题中没有提供足够信息，使用合理的默认值
5. 只返回JSON格式的参数对象，不要包含其他解释

请直接返回JSON对象：`;

    const generationMessages = [
      { role: 'system', content: '你是一个专业的参数生成助手，只返回符合schema要求的JSON对象。' },
      { role: 'user', content: generationPrompt }
    ];

    const response = await callLLMAPI(generationMessages, config);
    
    if (!response.success) {
      throw new Error('LLM参数生成失败: ' + response.error);
    }

    try {
      // 尝试解析JSON响应
      const jsonMatch = response.content!.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('LLM响应格式不正确');
      }

      const generatedParams = JSON.parse(jsonMatch[0]);
      
      // 验证生成的参数是否符合schema
      if (inputSchema.properties) {
        for (const [key, value] of Object.entries(inputSchema.properties)) {
          const prop = value as any;
          if (prop.required && !(key in generatedParams)) {
            throw new Error(`缺少必需参数: ${key}`);
          }
        }
      }

      return generatedParams;
    } catch (parseError) {
      console.error('解析生成的参数失败:', parseError);
      throw new Error('参数解析失败: ' + (parseError instanceof Error ? parseError.message : '未知错误'));
    }
  } catch (error) {
    console.error('参数生成失败:', error);
    throw error;
  }
}

// 使用LLM判断是否需要调用工具
async function analyzeToolNeed(userMessage: string, config: any): Promise<ToolCallDecision> {
  try {
    const { mcpServer } = config;

    if (!mcpServer || !mcpServer.trim()) {
      return { needsTools: false, reasoning: '没有可用的MCP工具' };
    }

    console.log(`🔌 正在连接到 MCP 服务器: ${mcpServer}`);

    // 发现工具和能力
    const client = await createMCPClient(mcpServer);

    // 获取服务器能力
    const listTools = await client.listTools();

    // 所有可用的能力
    const allMCPTools = listTools.tools;
    
    if (allMCPTools.length === 0) {
      return { needsTools: false, reasoning: '没有可用的MCP工具' };
    }

    // 构建工具描述
    const toolDescriptions = allMCPTools.map(tool => 
      `- ${tool.name}: ${tool.description}`
    ).join('\n');

    // 构建分析提示词
    const analysisPrompt = `你是一个智能助手，需要分析用户的消息是否需要调用外部工具来完成任务。

可用的工具：
${toolDescriptions}

用户消息：${userMessage}

请分析这个用户消息是否需要调用上述任何工具。如果需要，请指定具体的工具名称。

请按以下JSON格式回复：
{
  "needsTools": true/false,
  "toolName": "工具名称（如果需要工具）",
  "reasoning": "判断理由"
}

注意：
1. 只有当用户明确要求执行特定操作时才返回needsTools: true
2. 如果是一般性问题、聊天或咨询，返回needsTools: false
3. 工具名称必须完全匹配可用工具列表中的名称`;

    const analysisMessages = [
      { role: 'system', content: '你是一个专业的工具调用分析助手。' },
      { role: 'user', content: analysisPrompt }
    ];

    const response = await callLLMAPI(analysisMessages, config);
    
    if (!response.success) {
      return { needsTools: false, reasoning: 'LLM分析失败' };
    }

    try {
      // 尝试解析JSON响应
      const jsonMatch = response.content!.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { needsTools: false, reasoning: 'LLM响应格式不正确' };
      }

      const decision: ToolCallDecision = JSON.parse(jsonMatch[0]);
      
      // 验证工具名称是否存在
      if (decision.needsTools && decision.toolName) {
        const toolExists = allMCPTools.some(tool => tool.name === decision.toolName);

        if (!toolExists) {
          return { 
            needsTools: false, 
            reasoning: `工具 "${decision.toolName}" 不存在于可用工具列表中` 
          };
        }

        // 找到对应的工具并获取inputSchema
        const targetTool = allMCPTools.find(tool => tool.name === decision.toolName);
        if (targetTool && targetTool.inputSchema) {
          // 使用generateSchemaFromUserInput生成参数
          try {
            console.log(`🔧 为工具 ${decision.toolName} 生成参数...`);
            const generatedParameters = await generateSchemaFromUserInput(userMessage, targetTool.inputSchema, config);
            decision.parameters = generatedParameters;
            decision.inputSchema = targetTool.inputSchema;
          } catch (paramError) {
            console.error('参数生成失败:', paramError);
            return { 
              needsTools: false, 
              reasoning: `参数生成失败: ${paramError instanceof Error ? paramError.message : '未知错误'}` 
            };
          }
        } else {
          // 如果没有inputSchema，返回空参数
          decision.parameters = {};
          decision.inputSchema = targetTool?.inputSchema;
        }
      }

      return decision;
    } catch (parseError) {
      console.error('解析LLM响应失败:', parseError);
      return { needsTools: false, reasoning: 'LLM响应解析失败' };
    }
  } catch (error) {
    console.error('工具需求分析失败:', error);
    return { needsTools: false, reasoning: '分析过程出错' };
  }
}

// 调用MCP工具
async function callMCPTool(decision: ToolCallDecision, config: any): Promise<string> {
  try {
    const client = await createMCPClient(config.mcpServer);

    // 调用MCP工具API
    const toolResponse = await client.callTool({
      name: decision.toolName ?? '', 
      arguments: decision.parameters ?? {}});
    
    if (toolResponse.content) {
      return `工具调用成功：${JSON.stringify(toolResponse.content)}`;
    } else {
      console.error(toolResponse);
      return `工具调用失败：${toolResponse}`;
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

    // 如果启用了MCP，使用LLM分析是否需要调用工具
    if (config.mcpEnabled) {
      console.log('🔍 使用LLM分析是否需要调用MCP工具...');
      
      const toolDecision = await analyzeToolNeed(lastUserMessage.content, config);
      console.log('🤖 LLM分析结果:', toolDecision);

      if (toolDecision.needsTools && toolDecision.toolName) {
        console.log(`🔧 调用工具: ${toolDecision.toolName}`);
        
        // 调用MCP工具
        const mcpResult = await callMCPTool(
          toolDecision,
          config
        );

        console.log('mcpResult:', mcpResult);
        
        // 将MCP结果添加到消息历史中，让LLM基于工具结果生成最终回复
        const messagesWithMCP = [
          {
            role: 'system',
            content: `你是一个具有MCP工具调用能力的AI助手，工具调用结果：${mcpResult}\n\n请基于上述工具调用结果，为用户提供有帮助的回复。如果工具调用结果中包含了链接，请将链接以markdown图片的形式添加到回复中`
          },
          ...messages.filter(messages => messages.role === 'user')
        ];

        console.log(messagesWithMCP);

        // 调用LLM处理包含MCP结果的消息
        const llmResponse = await callLLMAPI(messagesWithMCP, config);
        
        return NextResponse.json(llmResponse);
      } else {
        console.log('💬 无需调用工具，直接使用LLM回复');
        console.log('判断理由:', toolDecision.reasoning);
      }
    }

    // 直接调用LLM
    console.log('💬 直接调用LLM');
    const llmResponse = await callLLMAPI(messages, config);
    return NextResponse.json(llmResponse);

  } catch (error) {
    console.error('聊天API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    });
  }
} 