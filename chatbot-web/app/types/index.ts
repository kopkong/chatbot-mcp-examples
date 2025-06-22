// 消息类型
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// 配置类型
export interface Config {
  llmProvider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  mcpEnabled: boolean;
  mcpServer: string;
}

// LLM响应类型
export interface LLMResponse {
  success: boolean;
  content?: string;
  error?: string;
  usage?: any;
}

// 通知类型
export interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

// MCP工具类型
export interface MCPTool {
  name: string;
  description: string;
  inputSchema?: any;
}

// LLM配置组件Props类型
export interface LLMConfigProps {
  llmProvider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  onConfigChange: (key: string, value: any) => void;
}

// Prompt配置组件Props类型
export interface PromptConfigProps {
  systemPrompt: string;
  onConfigChange: (key: string, value: any) => void;
}

// MCP配置组件Props类型
export interface MCPConfigProps {
  mcpEnabled: boolean;
  mcpServer: string;
  onConfigChange: (key: string, value: any) => void;
  onNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
} 