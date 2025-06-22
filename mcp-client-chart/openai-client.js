import axios from 'axios';

/**
 * OpenAI Compatible API 工具类
 * 支持任何兼容OpenAI API格式的服务
 */
class OpenAIClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || 'https://api.openai.com/v1';
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.model = config.model || 'gpt-3.5-turbo';
    this.timeout = config.timeout || 30000;
    
    // 创建axios实例
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🚀 发送请求: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ 请求错误:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ 收到响应: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        console.error('❌ 响应错误:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 聊天完成
   * @param {Array} messages - 消息数组
   * @param {Object} options - 可选参数
   * @returns {Promise<Object>} 响应数据
   */
  async chatCompletion(messages, options = {}) {
    try {
      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 1,
        stream: options.stream || false,
        ...options
      };

      console.log('💬 开始聊天完成请求...');
      console.log('📝 消息数量:', messages.length);
      console.log('🎯 使用模型:', payload.model);

      const response = await this.client.post('/chat/completions', payload);
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const result = response.data.choices[0].message;
        console.log('✨ 聊天完成成功');
        console.log('📊 使用token:', response.data.usage);
        return {
          success: true,
          data: result,
          usage: response.data.usage,
          raw: response.data
        };
      } else {
        throw new Error('响应数据格式异常');
      }
    } catch (error) {
      console.error('❌ 聊天完成失败:', error.message);
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * 流式聊天完成
   * @param {Array} messages - 消息数组
   * @param {Function} onData - 数据回调函数
   * @param {Object} options - 可选参数
   * @returns {Promise<Object>} 响应数据
   */
  async streamChatCompletion(messages, onData, options = {}) {
    try {
      const payload = {
        model: options.model || this.model,
        messages: messages,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 1,
        stream: true,
        ...options
      };

      console.log('🌊 开始流式聊天完成请求...');

      const response = await this.client.post('/chat/completions', payload, {
        responseType: 'stream'
      });

      let fullContent = '';
      
      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              console.log('✅ 流式响应完成');
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0].delta.content) {
                const content = parsed.choices[0].delta.content;
                fullContent += content;
                if (onData) {
                  onData(content, fullContent);
                }
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      });

      return new Promise((resolve) => {
        response.data.on('end', () => {
          resolve({
            success: true,
            data: { content: fullContent },
            raw: response.data
          });
        });
      });

    } catch (error) {
      console.error('❌ 流式聊天完成失败:', error.message);
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * 文本完成（legacy）
   * @param {string} prompt - 提示文本
   * @param {Object} options - 可选参数
   * @returns {Promise<Object>} 响应数据
   */
  async textCompletion(prompt, options = {}) {
    try {
      const payload = {
        model: options.model || 'text-davinci-003',
        prompt: prompt,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 1,
        ...options
      };

      console.log('📝 开始文本完成请求...');
      console.log('🎯 使用模型:', payload.model);

      const response = await this.client.post('/completions', payload);
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const result = response.data.choices[0].text;
        console.log('✨ 文本完成成功');
        console.log('📊 使用token:', response.data.usage);
        return {
          success: true,
          data: { content: result },
          usage: response.data.usage,
          raw: response.data
        };
      } else {
        throw new Error('响应数据格式异常');
      }
    } catch (error) {
      console.error('❌ 文本完成失败:', error.message);
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * 获取可用模型列表
   * @returns {Promise<Object>} 模型列表
   */
  async listModels() {
    try {
      console.log('📋 获取模型列表...');
      const response = await this.client.get('/models');
      
      if (response.data && response.data.data) {
        console.log('✅ 获取模型列表成功');
        console.log('🎯 可用模型数量:', response.data.data.length);
        return {
          success: true,
          data: response.data.data,
          raw: response.data
        };
      } else {
        throw new Error('响应数据格式异常');
      }
    } catch (error) {
      console.error('❌ 获取模型列表失败:', error.message);
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * 创建嵌入向量
   * @param {string|Array} input - 输入文本或文本数组
   * @param {Object} options - 可选参数
   * @returns {Promise<Object>} 嵌入向量数据
   */
  async createEmbeddings(input, options = {}) {
    try {
      const payload = {
        model: options.model || 'text-embedding-ada-002',
        input: input,
        ...options
      };

      console.log('🎯 创建嵌入向量...');
      console.log('📝 输入类型:', Array.isArray(input) ? '数组' : '字符串');

      const response = await this.client.post('/embeddings', payload);
      
      if (response.data && response.data.data) {
        console.log('✅ 创建嵌入向量成功');
        console.log('📊 使用token:', response.data.usage);
        return {
          success: true,
          data: response.data.data,
          usage: response.data.usage,
          raw: response.data
        };
      } else {
        throw new Error('响应数据格式异常');
      }
    } catch (error) {
      console.error('❌ 创建嵌入向量失败:', error.message);
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * 设置API密钥
   * @param {string} apiKey - API密钥
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    this.client.defaults.headers['Authorization'] = `Bearer ${apiKey}`;
    console.log('🔑 API密钥已更新');
  }

  /**
   * 设置基础URL
   * @param {string} baseURL - 基础URL
   */
  setBaseURL(baseURL) {
    this.baseURL = baseURL;
    this.client.defaults.baseURL = baseURL;
    console.log('🌐 基础URL已更新:', baseURL);
  }

  /**
   * 健康检查
   * @returns {Promise<boolean>} 服务状态
   */
  async healthCheck() {
    try {
      console.log('🔍 进行健康检查...');
      const result = await this.listModels();
      if (result.success) {
        console.log('✅ 服务正常');
        return true;
      } else {
        console.log('❌ 服务异常');
        return false;
      }
    } catch (error) {
      console.error('❌ 健康检查失败:', error.message);
      return false;
    }
  }
}

export { OpenAIClient }; 