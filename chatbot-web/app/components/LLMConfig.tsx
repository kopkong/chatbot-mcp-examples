'use client'

import React from 'react';
import { LLMConfigProps } from '../types';

const LLMConfig: React.FC<LLMConfigProps> = ({ 
  llmProvider, 
  apiKey, 
  baseUrl, 
  model, 
  temperature, 
  maxTokens, 
  onConfigChange 
}) => {
  // 提供商变更处理
  const handleProviderChange = (provider: string) => {
    let newConfig: { [key: string]: any } = { llmProvider: provider };
    
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
    
    // 批量更新配置
    Object.entries(newConfig).forEach(([key, value]) => {
      onConfigChange(key, value);
    });
  };

  return (
    <div className="config-section">
      <h4><i className="fas fa-brain"></i> LLM 设置</h4>
      <div className="form-group">
        <label htmlFor="llmProvider">服务提供商:</label>
        <select 
          id="llmProvider" 
          value={llmProvider}
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
          value={apiKey}
          onChange={(e) => onConfigChange('apiKey', e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="baseUrl">Base URL:</label>
        <input 
          type="text" 
          id="baseUrl" 
          placeholder="https://api.openai.com/v1"
          value={baseUrl}
          onChange={(e) => onConfigChange('baseUrl', e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="model">模型:</label>
        <input 
          type="text" 
          id="model" 
          placeholder="gpt-3.5-turbo"
          value={model}
          onChange={(e) => onConfigChange('model', e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="temperature">温度 (0-2): {temperature}</label>
        <input 
          type="range" 
          id="temperature" 
          min="0" 
          max="2" 
          step="0.1" 
          value={temperature}
          onChange={(e) => onConfigChange('temperature', parseFloat(e.target.value))}
        />
      </div>
      <div className="form-group">
        <label htmlFor="maxTokens">最大Token数:</label>
        <input 
          type="number" 
          id="maxTokens" 
          value={maxTokens} 
          min="1" 
          max="8000"
          onChange={(e) => onConfigChange('maxTokens', parseInt(e.target.value))}
        />
      </div>
    </div>
  );
};

export default LLMConfig; 