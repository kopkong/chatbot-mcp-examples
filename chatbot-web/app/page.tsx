'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Message, Config, LLMResponse, Notification } from './types';
import ChatInterface from './components/ChatInterface';
import ConfigSidebar from './components/ConfigSidebar';
import NotificationComponent from './components/Notification';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [notification, setNotification] = useState<Notification>({ show: false, message: '', type: 'info' });

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

  // LLM API调用
  const callLLM = useCallback(async (messages: Array<{role: string; content: string}>): Promise<LLMResponse> => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          config: config
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }, [config]);

  // 发送消息
  const sendMessage = useCallback(async (message: string) => {
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
  }, [config, messages, callLLM, showNotification]);

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
      <ConfigSidebar
        config={config}
        sidebarOpen={sidebarOpen}
        loading={loading}
        onConfigChange={handleConfigChange}
        onCloseSidebar={() => setSidebarOpen(false)}
        onSaveConfig={saveConfig}
        onTestConnection={testConnection}
        onResetConfig={resetConfig}
        onNotification={showNotification}
      />

      {/* 聊天界面 */}
      <ChatInterface
        messages={messages}
        config={config}
        loading={loading}
        typing={typing}
        onSendMessage={sendMessage}
        onClearChat={clearChat}
        onOpenConfig={() => setSidebarOpen(true)}
      />

      {/* 通知 */}
      <NotificationComponent
        notification={notification}
        onClose={() => setNotification(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
} 