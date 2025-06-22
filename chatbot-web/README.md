# 智能聊天机器人 - Next.js 版

> 🚀 **现代化的智能聊天机器人网页应用** - 支持多种LLM提供商、自定义Prompt工程和MCP工具集成

[![Next.js](https://img.shields.io/badge/Next.js-14.2.30-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://www.docker.com/)

## 📖 项目简介

智能聊天机器人是一个现代化的网页应用，基于 **Next.js 14** 和 **React 18** 构建，支持多种大语言模型（LLM）提供商，具备强大的自定义功能和现代化的用户界面。

## ✨ 特性

### 🧠 多LLM支持
- **OpenAI**: GPT-3.5/GPT-4 系列模型
- **DeepSeek**: 高性能中文大语言模型
- **Ollama**: 本地部署的开源模型
- **自定义**: 支持任何兼容OpenAI API的服务

### 💬 Prompt工程
- 预设角色模板（助手、分析师、程序员、教师、创意写作）
- 自定义系统提示词
- 温度和Token数控制
- 对话历史管理

### 🔌 MCP集成
- Model Context Protocol协议支持
- 工具调用和函数执行
- 图表生成等扩展功能
- 实时连接状态监控

### 🎨 现代化UI
- 响应式设计，支持移动端
- 深色模式自动适配
- 实时打字效果
- 消息格式化显示
- 优雅的动画效果

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
# 或使用启动脚本
./start.sh
```

应用将在 http://localhost:3000 启动

### 生产构建
```bash
npm run build
npm start
```

## 📦 项目结构

```
chatbot-web/
├── app/                    # Next.js App Router
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页面
├── public/                # 静态资源
├── next.config.js         # Next.js配置
├── package.json          # 项目配置
├── tsconfig.json         # TypeScript配置
└── start.sh              # 启动脚本
```

## ⚙️ 配置说明

### LLM配置
1. 选择服务提供商
2. 输入API密钥
3. 配置模型参数（温度、最大Token数等）
4. 测试连接

### Prompt设置
- 自定义系统提示词
- 选择预设角色模板
- 调整对话风格

### MCP设置
- 启用MCP功能
- 配置服务器地址
- 连接并查看可用工具

## 🛠️ 技术栈

- **框架**: Next.js 14
- **语言**: TypeScript
- **样式**: CSS Modules + CSS Variables
- **状态管理**: React Hooks
- **API**: REST API + MCP协议
- **部署**: Vercel/Docker支持

## 📱 功能亮点

### 智能对话
- 支持多轮对话
- 上下文理解
- 实时流式回复
- 错误处理和重试

### 数据管理
- 本地配置存储
- 对话历史导出
- 一键清空会话
- 配置备份恢复

### 用户体验
- 热重载开发
- 快捷键支持 (Ctrl+Enter)
- 字符计数显示
- 通知提示系统

## 🔧 高级配置

### 环境变量
```bash
# .env.local
NEXT_PUBLIC_DEFAULT_API_KEY=your_api_key
NEXT_PUBLIC_DEFAULT_BASE_URL=https://api.openai.com/v1
```

### Docker部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License

## 🆕 更新日志

### v2.0.0 (Next.js版)
- 完全迁移到Next.js 14
- 支持服务端渲染和静态生成
- 改进的TypeScript类型定义
- 更好的SEO和性能优化
- App Router支持

### v1.0.0 (React版)
- 基础聊天功能
- 多LLM支持
- MCP集成
- Prompt工程

## 🔗 相关链接

- [Next.js 文档](https://nextjs.org/docs)
- [MCP 协议](https://modelcontextprotocol.io/)
- [OpenAI API](https://platform.openai.com/docs)
- [TypeScript 指南](https://www.typescriptlang.org/docs)

---

💡 **提示**: 首次使用请点击左上角配置按钮设置API密钥和偏好设置 