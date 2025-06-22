#!/bin/bash

# Next.js 聊天机器人启动脚本
echo "🚀 正在启动智能聊天机器人 Next.js 应用..."

# 检查Node.js版本
echo "📋 检查Node.js版本..."
node_version=$(node -v)
echo "当前Node.js版本: $node_version"

if [[ $node_version < "v18" ]]; then
    echo "⚠️  警告: 建议使用Node.js 18或更高版本以获得最佳性能"
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 检查Next.js配置
if [ ! -f "next.config.js" ]; then
    echo "⚠️  未找到Next.js配置文件"
fi

# 设置环境变量
export NODE_ENV=development

echo "🌟 启动Next.js开发服务器..."
echo "📍 应用将在 http://localhost:3000 启动"
echo "🔄 支持热重载和快速刷新"
echo ""
echo "💡 使用说明:"
echo "   - 在浏览器中打开 http://localhost:3000"
echo "   - 点击左上角配置按钮设置API密钥"
echo "   - 支持多种LLM提供商和MCP工具集成"
echo ""
echo "🛑 按 Ctrl+C 停止服务器"
echo ""

# 启动Next.js开发服务器
npm run dev 