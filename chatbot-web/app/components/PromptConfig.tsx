'use client'

import React from 'react';
import { PromptConfigProps } from '../types';

const PromptConfig: React.FC<PromptConfigProps> = ({ systemPrompt, onConfigChange }) => {
  // Prompt模板
  const promptTemplates = {
    assistant: "你是一个有帮助的AI助手。请提供准确、有用的回答，并保持友好和专业的语调。",
    analyst: "你是一个专业的数据分析师。请用专业的角度分析数据，提供洞察和建议。",
    programmer: "你是一个经验丰富的程序员。请提供准确的代码建议，并解释技术概念。",
    teacher: "你是一个耐心的教师。请用通俗易懂的方式解释概念，并提供学习建议。",
    creative: "你是一个创意写作助手。请发挥想象力，创作有趣和富有创意的内容。"
  };

  // 模板变更处理
  const handleTemplateChange = (template: string) => {
    if (template && promptTemplates[template as keyof typeof promptTemplates]) {
      onConfigChange('systemPrompt', promptTemplates[template as keyof typeof promptTemplates]);
    }
  };

  return (
    <div className="config-section">
      <h4><i className="fas fa-comment-dots"></i> Prompt 设置</h4>
      <div className="form-group">
        <label htmlFor="systemPrompt">系统提示词:</label>
        <textarea 
          id="systemPrompt" 
          rows={6} 
          placeholder="你是一个有帮助的AI助手..."
          value={systemPrompt}
          onChange={(e) => onConfigChange('systemPrompt', e.target.value)}
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
  );
};

export default PromptConfig; 