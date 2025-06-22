/**
 * OpenAI Compatible API 配置示例
 * 复制此文件为 openai-config.js 并根据需要修改配置
 */

// 多种服务配置示例
export const configs = {
  // OpenAI 官方API
  openai: {
    baseURL: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key',
    model: 'gpt-3.5-turbo',
    timeout: 30000
  },

  // Azure OpenAI
  azure: {
    baseURL: 'https://your-resource.openai.azure.com/openai/deployments/your-deployment',
    apiKey: process.env.AZURE_OPENAI_API_KEY || 'your-azure-api-key',
    model: 'gpt-35-turbo',
    timeout: 30000,
    headers: {
      'api-version': '2023-12-01-preview'
    }
  },

  // DeepSeek API
  deepseek: {
    baseURL: 'https://api.deepseek.com/v1',
    apiKey: process.env.DEEPSEEK_API_KEY || 'your-deepseek-api-key',
    model: 'deepseek-chat',
    timeout: 30000
  },

  // 本地 Ollama 服务
  ollama: {
    baseURL: 'http://localhost:11434/v1',
    apiKey: 'ollama', // Ollama 通常不需要真实的API key
    model: 'qwen2.5:7b', // 或者你安装的其他模型
    timeout: 60000
  },

  // LocalAI 本地部署
  localai: {
    baseURL: 'http://localhost:8080/v1',
    apiKey: 'not-needed',
    model: 'gpt-3.5-turbo', // LocalAI 中配置的模型名
    timeout: 60000
  },

  // vLLM 服务
  vllm: {
    baseURL: 'http://localhost:8000/v1',
    apiKey: 'not-needed',
    model: 'your-model-name',
    timeout: 60000
  },

  // 通义千问 (DashScope)
  qwen: {
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: process.env.DASHSCOPE_API_KEY || 'your-dashscope-api-key',
    model: 'qwen-turbo',
    timeout: 30000
  },

  // 智谱AI (GLM)
  glm: {
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: process.env.GLM_API_KEY || 'your-glm-api-key',
    model: 'glm-4',
    timeout: 30000
  },

  // 月之暗面 (Moonshot)
  moonshot: {
    baseURL: 'https://api.moonshot.cn/v1',
    apiKey: process.env.MOONSHOT_API_KEY || 'your-moonshot-api-key',
    model: 'moonshot-v1-8k',
    timeout: 30000
  }
};

// 默认配置（可以根据需要切换）
export const defaultConfig = configs.ollama; // 默认使用本地Ollama服务

// 环境变量配置（优先级最高）
export const envConfig = {
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL,
  timeout: parseInt(process.env.OPENAI_TIMEOUT) || 30000
};

/**
 * 获取最终配置
 * 优先级: 环境变量 > 传入配置 > 默认配置
 */
export function getConfig(configName = null, customConfig = {}) {
  let baseConfig = defaultConfig;
  
  if (configName && configs[configName]) {
    baseConfig = configs[configName];
  }
  
  // 合并配置，环境变量优先
  const finalConfig = {
    ...baseConfig,
    ...customConfig
  };
  
  // 如果设置了环境变量，则覆盖相应字段
  if (envConfig.baseURL) finalConfig.baseURL = envConfig.baseURL;
  if (envConfig.apiKey) finalConfig.apiKey = envConfig.apiKey;
  if (envConfig.model) finalConfig.model = envConfig.model;
  if (envConfig.timeout) finalConfig.timeout = envConfig.timeout;
  
  return finalConfig;
}

// 配置验证函数
export function validateConfig(config) {
  const errors = [];
  
  if (!config.baseURL) {
    errors.push('baseURL 是必需的');
  }
  
  if (!config.apiKey) {
    errors.push('apiKey 是必需的');
  }
  
  if (!config.model) {
    errors.push('model 是必需的');
  }
  
  if (config.timeout && (config.timeout < 1000 || config.timeout > 300000)) {
    errors.push('timeout 应该在 1000-300000 毫秒之间');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// 使用示例:
/*
import { getConfig, configs } from './openai-config.js';

// 使用默认配置
const config1 = getConfig();

// 使用指定配置
const config2 = getConfig('openai');

// 使用自定义配置
const config3 = getConfig('ollama', {
  model: 'llama2:13b',
  timeout: 120000
});

// 完全自定义
const config4 = getConfig(null, {
  baseURL: 'http://my-custom-api.com/v1',
  apiKey: 'my-api-key',
  model: 'my-model'
});
*/ 