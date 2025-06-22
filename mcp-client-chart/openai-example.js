#!/usr/bin/env node

import { OpenAIClient } from './openai-client.js';
import { program } from 'commander';
import dotenv from 'dotenv';

/**
 * OpenAI Client 使用示例
 */

// 配置示例
const config = {
  // OpenAI官方API
  // baseURL: 'https://api.openai.com/v1',
  // apiKey: 'your-openai-api-key',
  
  // 本地Ollama服务（兼容OpenAI API）
  // baseURL: 'http://localhost:11434/v1',
  // apiKey: 'ollama', // Ollama通常不需要真实的API key
  // model: 'qwen2.5:7b', // 或者其他你安装的模型
  
  // 其他兼容服务示例
  // 从.env文件中读取api-key
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY,
  model: 'deepseek-chat',
  
  timeout: 60000 // 60秒超时
};

async function basicChatExample() {
  console.log('=== 基础聊天示例 ===');
  
  const client = new OpenAIClient(config);
  
  // 健康检查
  const isHealthy = await client.healthCheck();
  if (!isHealthy) {
    console.log('❌ 服务不可用，跳过示例');
    return;
  }
  
  // 简单对话
  const messages = [
    { role: 'system', content: '你是一个有帮助的AI助手。请用中文回答。' },
    { role: 'user', content: '请介绍一下什么是机器学习？' }
  ];
  
  const result = await client.chatCompletion(messages, {
    maxTokens: 500,
    temperature: 0.7
  });
  
  if (result.success) {
    console.log('🤖 AI回答:', result.data.content);
    console.log('📊 Token使用:', result.usage);
  } else {
    console.error('❌ 对话失败:', result.error);
  }
}

async function streamChatExample() {
  console.log('\n=== 流式聊天示例 ===');
  
  const client = new OpenAIClient(config);
  
  const messages = [
    { role: 'system', content: '你是一个创意写作助手。' },
    { role: 'user', content: '请写一个关于太空探索的短故事开头。' }
  ];
  
  console.log('🌊 开始流式对话...');
  process.stdout.write('🤖 AI回答: ');
  
  await client.streamChatCompletion(
    messages,
    (chunk, fullContent) => {
      // 实时显示生成的内容
      process.stdout.write(chunk);
    },
    {
      maxTokens: 300,
      temperature: 0.8
    }
  );
  
  console.log('\n✅ 流式对话完成');
}

async function modelsExample() {
  console.log('\n=== 模型列表示例 ===');
  
  const client = new OpenAIClient(config);
  
  const result = await client.listModels();
  
  if (result.success) {
    console.log('📋 可用模型:');
    result.data.slice(0, 10).forEach((model, index) => {
      console.log(`${index + 1}. ${model.id} (${model.owned_by || 'unknown'})`);
    });
    
    if (result.data.length > 10) {
      console.log(`... 还有 ${result.data.length - 10} 个模型`);
    }
  } else {
    console.error('❌ 获取模型失败:', result.error);
  }
}

async function embeddingsExample() {
  console.log('\n=== 嵌入向量示例 ===');
  
  const client = new OpenAIClient(config);
  
  const texts = [
    '机器学习是人工智能的一个分支',
    '深度学习使用神经网络来模拟人脑',
    '自然语言处理帮助计算机理解人类语言'
  ];
  
  const result = await client.createEmbeddings(texts, {
    model: 'text-embedding-ada-002' // 如果服务支持的话
  });
  
  if (result.success) {
    console.log('✅ 嵌入向量创建成功');
    console.log('📊 向量数量:', result.data.length);
    console.log('📏 向量维度:', result.data[0]?.embedding?.length || 'unknown');
    console.log('📊 Token使用:', result.usage);
  } else {
    console.error('❌ 创建嵌入向量失败:', result.error);
    console.log('💡 提示: 某些服务可能不支持嵌入向量API');
  }
}

async function chartAnalysisExample() {
  console.log('\n=== 图表分析示例 ===');
  
  const client = new OpenAIClient(config);
  
  const chartData = {
    type: 'bar',
    data: {
      labels: ['1月', '2月', '3月', '4月', '5月'],
      datasets: [{
        label: '销售额(万元)',
        data: [120, 190, 300, 500, 200]
      }]
    }
  };
  
  const messages = [
    {
      role: 'system',
      content: '你是一个数据分析专家。请分析用户提供的图表数据，给出专业的见解和建议。'
    },
    {
      role: 'user',
      content: `请分析这个销售数据图表：${JSON.stringify(chartData, null, 2)}`
    }
  ];
  
  const result = await client.chatCompletion(messages, {
    maxTokens: 800,
    temperature: 0.3
  });
  
  if (result.success) {
    console.log('📊 图表分析结果:');
    console.log(result.data.content);
  } else {
    console.error('❌ 图表分析失败:', result.error);
  }
}

async function configSwitchExample() {
  console.log('\n=== 配置切换示例 ===');
  
  const client = new OpenAIClient(config);
  
  console.log('🔧 当前配置:');
  console.log('- 基础URL:', client.baseURL);
  console.log('- 模型:', client.model);
  
  // 动态切换到不同的服务
  const newConfig = {
    baseURL: 'https://api.openai.com/v1',
    apiKey: 'sk-test-key',
    model: 'gpt-3.5-turbo'
  };
  
  client.setBaseURL(newConfig.baseURL);
  client.setApiKey(newConfig.apiKey);
  
  console.log('🔄 切换后配置:');
  console.log('- 基础URL:', client.baseURL);
  console.log('- API密钥:', client.apiKey ? '已设置' : '未设置');
}

// 命令行接口
program
  .name('openai-example')
  .description('OpenAI Client 使用示例')
  .version('1.0.0');

program
  .command('basic')
  .description('基础聊天示例')
  .action(basicChatExample);

program
  .command('stream')
  .description('流式聊天示例')
  .action(streamChatExample);

program
  .command('models')
  .description('获取模型列表')
  .action(modelsExample);

program
  .command('embeddings')
  .description('嵌入向量示例')
  .action(embeddingsExample);

program
  .command('chart')
  .description('图表分析示例')
  .action(chartAnalysisExample);

program
  .command('config')
  .description('配置切换示例')
  .action(configSwitchExample);

program
  .command('all')
  .description('运行所有示例')
  .action(async () => {
    await basicChatExample();
    await streamChatExample();
    await modelsExample();
    await embeddingsExample();
    await chartAnalysisExample();
    await configSwitchExample();
    console.log('\n🎉 所有示例运行完成！');
  });

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.length === 2) {
    // 没有参数时运行基础示例
    console.log('🚀 运行基础示例...');
    await basicChatExample();
  } else {
    program.parse();
  }
}

export { config }; 