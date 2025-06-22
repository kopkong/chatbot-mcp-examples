'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Components } from 'react-markdown';
import { Message, Config } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  config: Config;
  loading: boolean;
  typing: boolean;
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
  onOpenConfig: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  config,
  loading,
  typing,
  onSendMessage,
  onClearChat,
  onOpenConfig
}) => {
  const [inputValue, setInputValue] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // 工具函数
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  // 发送消息
  const sendMessage = useCallback(() => {
    const message = inputValue.trim();
    if (!message) return;

    if (!config.apiKey) {
      // 这里可以触发通知，但需要从父组件传入
      onOpenConfig();
      return;
    }

    onSendMessage(message);
    setInputValue('');
  }, [inputValue, config.apiKey, onSendMessage, onOpenConfig]);

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

  // Markdown 组件配置
  const markdownComponents: Components = {
    // 自定义代码块样式
    code: ({ inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline ? (
        <pre className="code-block">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      ) : (
        <code className="inline-code" {...props}>
          {children}
        </code>
      );
    },
    // 自定义表格样式
    table: ({ children }: any) => (
      <div className="table-wrapper">
        <table className="markdown-table">{children}</table>
      </div>
    ),
    // 自定义链接样式
    a: ({ href, children }: any) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="markdown-link">
        {children}
      </a>
    ),
    // 自定义列表样式
    ul: ({ children }: any) => (
      <ul className="markdown-list">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="markdown-list">{children}</ol>
    ),
    // 自定义标题样式
    h1: ({ children }: any) => <h1 className="markdown-h1">{children}</h1>,
    h2: ({ children }: any) => <h2 className="markdown-h2">{children}</h2>,
    h3: ({ children }: any) => <h3 className="markdown-h3">{children}</h3>,
    h4: ({ children }: any) => <h4 className="markdown-h4">{children}</h4>,
    h5: ({ children }: any) => <h5 className="markdown-h5">{children}</h5>,
    h6: ({ children }: any) => <h6 className="markdown-h6">{children}</h6>,
    // 自定义引用样式
    blockquote: ({ children }: any) => (
      <blockquote className="markdown-blockquote">{children}</blockquote>
    ),
    // 自定义分割线样式
    hr: () => <hr className="markdown-hr" />,
  };

  return (
    <div className="main-content">
      {/* 工具栏 */}
      <div className="toolbar">
        <button className="toolbar-btn" onClick={onOpenConfig}>
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
          <button className="toolbar-btn" onClick={onClearChat}>
            <i className="fas fa-trash"></i>
            <span>清空</span>
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
                  <div className="message-text">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
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
  );
};

export default ChatInterface; 