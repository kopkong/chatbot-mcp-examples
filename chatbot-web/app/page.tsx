'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import MCPConfig from './components/MCPConfig';

// 类型定义
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Config {
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

interface LLMResponse {
  success: boolean;
  content?: string;
  error?: string;
  usage?: any;
}



export default function Home() {
  // 状态管理
  const [config, setConfig] = useState<Config>(() => {
    const defaultConfig: Config = {
      llmProvider: 'openai',
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: '你是一个有帮助的AI助手。请提供准确、有用的回答，并保持友好和专业的语调。',
      mcpEnabled: false,
      mcpServer: 'http://localhost:1122'
    };
    return defaultConfig;
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({ show: false, message: '', type: 'info' });


  // 引用
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Prompt模板
  const promptTemplates = {
    assistant: "你是一个有帮助的AI助手。请提供准确、有用的回答，并保持友好和专业的语调。",
    analyst: "你是一个专业的数据分析师。请用专业的角度分析数据，提供洞察和建议。",
    programmer: "你是一个经验丰富的程序员。请提供准确的代码建议，并解释技术概念。",
    teacher: "你是一个耐心的教师。请用通俗易懂的方式解释概念，并提供学习建议。",
    creative: "你是一个创意写作助手。请发挥想象力，创作有趣和富有创意的内容。"
  };

  // 初始化配置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedConfig = localStorage.getItem('chatbot-config');
      if (savedConfig) {
        setConfig(prev => ({ ...prev, ...JSON.parse(savedConfig) }));
      }
    }
  }, []);

  // 工具函数
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  const formatMessage = useCallback((content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/\n/g, '<br>');
  }, []);

  // LLM API调用
  const callLLM = useCallback(async (messages: Array<{role: string; content: string}>): Promise<LLMResponse> => {
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
  }, [config]);



  // 发送消息
  const sendMessage = useCallback(async () => {
    const message = inputValue.trim();
    if (!message) return;

    if (!config.apiKey) {
      showNotification('请先配置API Key！', 'warning');
      setSidebarOpen(true);
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);
    setTyping(true);

    try {
      const messageHistory = [
        { role: 'system', content: config.systemPrompt },
        ...messages.slice(-10).map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: message }
      ];

      const response = await callLLM(messageHistory);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.success ? response.content! : '抱歉，我遇到了一些问题：' + response.error,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: '抱歉，发生了错误：' + (error instanceof Error ? error.message : '未知错误'),
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTyping(false);
    }
  }, [inputValue, config, messages, callLLM, showNotification]);

  // 配置保存
  const saveConfig = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatbot-config', JSON.stringify(config));
      showNotification('配置已保存！', 'success');
    }
  }, [config, showNotification]);

  // 重置配置
  const resetConfig = useCallback(() => {
    if (typeof window !== 'undefined' && window.confirm('确定要重置所有配置吗？')) {
      localStorage.removeItem('chatbot-config');
      window.location.reload();
    }
  }, []);

  // 清空聊天
  const clearChat = useCallback(() => {
    if (typeof window !== 'undefined' && window.confirm('确定要清空所有对话吗？')) {
      setMessages([]);
      showNotification('对话已清空！', 'success');
    }
  }, [showNotification]);

  // 导出对话
  const exportChat = useCallback(() => {
    if (messages.length === 0) {
      showNotification('没有对话可以导出！', 'warning');
      return;
    }

    const chatData = {
      timestamp: new Date().toISOString(),
      config: config,
      messages: messages
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatbot-conversation-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('对话已导出！', 'success');
  }, [messages, config, showNotification]);

  // 测试连接
  const testConnection = useCallback(async () => {
    setLoading(true);
    try {
      const response = await callLLM([
        { role: 'user', content: '请回复"连接测试成功"' }
      ]);

      if (response.success) {
        showNotification('LLM连接测试成功！', 'success');
      } else {
        showNotification('LLM连接测试失败: ' + response.error, 'error');
      }
    } catch (error) {
      showNotification('连接测试失败: ' + (error instanceof Error ? error.message : '未知错误'), 'error');
    } finally {
      setLoading(false);
    }
  }, [callLLM, showNotification]);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // 处理输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  }, []);

  // 自动调整输入框高度
  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.style.height = 'auto';
      messageInputRef.current.style.height = messageInputRef.current.scrollHeight + 'px';
    }
  }, [inputValue]);

  // 滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages, typing, scrollToBottom]);

  // 提供商变更处理
  const handleProviderChange = useCallback((provider: string) => {
    let newConfig = { ...config, llmProvider: provider };
    
    switch (provider) {
      case 'openai':
        newConfig.baseUrl = 'https://api.openai.com/v1';
        newConfig.model = 'gpt-3.5-turbo';
        break;
      case 'deepseek':
        newConfig.baseUrl = 'https://api.deepseek.com/v1';
        newConfig.model = 'deepseek-chat';
        break;
      case 'ollama':
        newConfig.baseUrl = 'http://localhost:11434/v1';
        newConfig.model = 'qwen2.5:7b';
        break;
    }
    
    setConfig(newConfig);
  }, [config]);

  // 模板变更处理
  const handleTemplateChange = useCallback((template: string) => {
    if (template && promptTemplates[template as keyof typeof promptTemplates]) {
      setConfig(prev => ({
        ...prev,
        systemPrompt: promptTemplates[template as keyof typeof promptTemplates]
      }));
    }
  }, [promptTemplates]);

  // 配置变更处理
  const handleConfigChange = useCallback((key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  return (
    <div className="app-container">
      {/* 侧边栏配置面板 */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3><i className="fas fa-cog"></i> 配置面板</h3>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(false)}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* LLM 配置 */}
        <div className="config-section">
          <h4><i className="fas fa-brain"></i> LLM 设置</h4>
          <div className="form-group">
            <label htmlFor="llmProvider">服务提供商:</label>
            <select 
              id="llmProvider" 
              value={config.llmProvider}
              onChange={(e) => handleProviderChange(e.target.value)}
            >
              <option value="openai">OpenAI</option>
              <option value="deepseek">DeepSeek</option>
              <option value="ollama">Ollama (本地)</option>
              <option value="custom">自定义</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="apiKey">API Key:</label>
            <input 
              type="password" 
              id="apiKey" 
              placeholder="输入您的API Key"
              value={config.apiKey}
              onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="baseUrl">Base URL:</label>
            <input 
              type="text" 
              id="baseUrl" 
              placeholder="https://api.openai.com/v1"
              value={config.baseUrl}
              onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="model">模型:</label>
            <input 
              type="text" 
              id="model" 
              placeholder="gpt-3.5-turbo"
              value={config.model}
              onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="temperature">温度 (0-2): {config.temperature}</label>
            <input 
              type="range" 
              id="temperature" 
              min="0" 
              max="2" 
              step="0.1" 
              value={config.temperature}
              onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="maxTokens">最大Token数:</label>
            <input 
              type="number" 
              id="maxTokens" 
              value={config.maxTokens} 
              min="1" 
              max="8000"
              onChange={(e) => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
            />
          </div>
        </div>

        {/* Prompt 配置 */}
        <div className="config-section">
          <h4><i className="fas fa-comment-dots"></i> Prompt 设置</h4>
          <div className="form-group">
            <label htmlFor="systemPrompt">系统提示词:</label>
            <textarea 
              id="systemPrompt" 
              rows={6} 
              placeholder="你是一个有帮助的AI助手..."
              value={config.systemPrompt}
              onChange={(e) => setConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="promptTemplates">预设模板:</label>
            <select 
              id="promptTemplates"
              onChange={(e) => handleTemplateChange(e.target.value)}
              value=""
            >
              <option value="">选择预设模板</option>
              <option value="assistant">通用助手</option>
              <option value="analyst">数据分析师</option>
              <option value="programmer">编程助手</option>
              <option value="teacher">教学助手</option>
              <option value="creative">创意写作</option>
            </select>
          </div>
        </div>

        {/* MCP 配置 */}
        <MCPConfig
          mcpEnabled={config.mcpEnabled}
          mcpServer={config.mcpServer}
          onConfigChange={handleConfigChange}
          onNotification={showNotification}
        />

        {/* 配置操作 */}
        <div className="config-actions">
          <button className="btn btn-primary" onClick={saveConfig}>
            <i className="fas fa-save"></i> 保存配置
          </button>
          <button className="btn btn-secondary" onClick={testConnection}>
            <i className="fas fa-vial"></i> 测试连接
          </button>
          <button className="btn btn-secondary" onClick={resetConfig}>
            <i className="fas fa-undo"></i> 重置配置
          </button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="main-content">
        {/* 工具栏 */}
        <div className="toolbar">
          <button className="toolbar-btn" onClick={() => setSidebarOpen(true)}>
            <i className="fas fa-cog"></i>
            <span>配置</span>
          </button>
          
          <div className="toolbar-title">
            <h2>
              <i className="fas fa-robot"></i>
              智能聊天机器人
            </h2>
          </div>
          
          <div className="toolbar-actions">
            <button className="toolbar-btn" onClick={clearChat}>
              <i className="fas fa-trash"></i>
              <span>清空</span>
            </button>
            <button className="toolbar-btn" onClick={exportChat}>
              <i className="fas fa-download"></i>
              <span>导出</span>
            </button>
          </div>
        </div>

        {/* 聊天容器 */}
        <div className="chat-container" ref={chatContainerRef}>
          {messages.length === 0 ? (
            <div className="welcome-message">
              <div className="welcome-content">
                <i className="fas fa-robot fa-4x"></i>
                <h3>欢迎使用智能聊天机器人</h3>
                <p>支持多种LLM提供商、自定义Prompt工程和MCP工具集成</p>
                
                <div className="welcome-features">
                  <div className="feature">
                    <i className="fas fa-brain"></i>
                    <span>多LLM支持</span>
                  </div>
                  <div className="feature">
                    <i className="fas fa-edit"></i>
                    <span>Prompt工程</span>
                  </div>
                  <div className="feature">
                    <i className="fas fa-plug"></i>
                    <span>MCP集成</span>
                  </div>
                  <div className="feature">
                    <i className="fas fa-palette"></i>
                    <span>现代UI</span>
                  </div>
                </div>
                
                <div className="welcome-tip">
                  💡 提示：点击左上角的配置按钮开始设置您的API密钥和偏好设置
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div key={index} className={`message ${message.role}`}>
                  <div className="message-content">
                    <div 
                      className="message-text"
                      dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                    />
                    <div className="message-time">{message.timestamp}</div>
                  </div>
                </div>
              ))}
              
              {typing && (
                <div className="typing-indicator">
                  <i className="fas fa-robot"></i>
                  <span>AI正在思考中</span>
                  <div className="typing-dots">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 输入区域 */}
        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            <textarea
              ref={messageInputRef}
              className="message-input"
              placeholder="输入您的消息... (Ctrl+Enter 发送)"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <div className="input-actions">
              <button 
                className="input-btn send-btn" 
                onClick={sendMessage}
                disabled={loading || !inputValue.trim()}
              >
                <i className={loading ? "fas fa-spinner fa-spin" : "fas fa-paper-plane"}></i>
              </button>
            </div>
          </div>
          <div className="input-footer">
            <span className="char-count">{inputValue.length} 字符</span>
            <span>Ctrl+Enter 快速发送</span>
          </div>
        </div>
      </div>

      {/* 通知 */}
      {notification.show && (
        <div className={`notification show ${notification.type}`}>
          <div className="notification-content">{notification.message}</div>
          <button 
            className="notification-close"
            onClick={() => setNotification(prev => ({ ...prev, show: false }))}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
    </div>
  );
} 