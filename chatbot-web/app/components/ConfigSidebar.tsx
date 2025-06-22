'use client'

import React from 'react';
import { Config, Notification } from '../types';
import MCPConfig from './MCPConfig';
import PromptConfig from './PromptConfig';
import LLMConfig from './LLMConfig';

interface ConfigSidebarProps {
  config: Config;
  sidebarOpen: boolean;
  loading: boolean;
  onConfigChange: (key: string, value: any) => void;
  onCloseSidebar: () => void;
  onSaveConfig: () => void;
  onTestConnection: () => void;
  onResetConfig: () => void;
  onNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

const ConfigSidebar: React.FC<ConfigSidebarProps> = ({
  config,
  sidebarOpen,
  loading,
  onConfigChange,
  onCloseSidebar,
  onSaveConfig,
  onTestConnection,
  onResetConfig,
  onNotification
}) => {
  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h3><i className="fas fa-cog"></i> 配置面板</h3>
        <button className="sidebar-toggle" onClick={onCloseSidebar}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* LLM 配置 */}
      <LLMConfig
        llmProvider={config.llmProvider}
        apiKey={config.apiKey}
        baseUrl={config.baseUrl}
        model={config.model}
        temperature={config.temperature}
        maxTokens={config.maxTokens}
        onConfigChange={onConfigChange}
      />

      {/* Prompt 配置 */}
      <PromptConfig
        systemPrompt={config.systemPrompt}
        onConfigChange={onConfigChange}
      />

      {/* MCP 配置 */}
      <MCPConfig
        mcpEnabled={config.mcpEnabled}
        mcpServer={config.mcpServer}
        onConfigChange={onConfigChange}
        onNotification={onNotification}
      />

      {/* 配置操作 */}
      <div className="config-actions">
        <button className="btn btn-primary" onClick={onSaveConfig}>
          <i className="fas fa-save"></i> 保存配置
        </button>
        <button className="btn btn-secondary" onClick={onTestConnection}>
          <i className="fas fa-vial"></i> 测试连接
        </button>
        <button className="btn btn-secondary" onClick={onResetConfig}>
          <i className="fas fa-undo"></i> 重置配置
        </button>
      </div>
    </div>
  );
};

export default ConfigSidebar; 