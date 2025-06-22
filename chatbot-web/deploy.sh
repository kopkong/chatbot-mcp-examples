#!/bin/bash

# 智能聊天机器人 Next.js 版本部署脚本

set -e

echo "🚀 开始部署智能聊天机器人 Next.js 版本..."

# 检查 Node.js 版本
NODE_VERSION=$(node --version 2>/dev/null || echo "未安装")
echo "📋 Node.js 版本: $NODE_VERSION"

if [[ "$NODE_VERSION" == "未安装" ]]; then
    echo "❌ 请先安装 Node.js 18 或更高版本"
    exit 1
fi

# 检查 npm 版本
NPM_VERSION=$(npm --version 2>/dev/null || echo "未安装")
echo "📋 npm 版本: $NPM_VERSION"

# 检查 Docker（可选）
DOCKER_VERSION=$(docker --version 2>/dev/null || echo "未安装")
echo "📋 Docker 版本: $DOCKER_VERSION"

echo ""
echo "请选择部署方式:"
echo "1) 本地开发模式"
echo "2) 生产构建模式"
echo "3) Docker 部署"
echo "4) Docker Compose 部署"
read -p "请输入选项 (1-4): " choice

case $choice in
    1)
        echo "🔧 启动本地开发模式..."
        if [ ! -d "node_modules" ]; then
            echo "📦 安装依赖..."
            npm install
        fi
        echo "🎯 启动开发服务器..."
        npm run dev
        ;;
    2)
        echo "🏗️ 构建生产版本..."
        if [ ! -d "node_modules" ]; then
            echo "📦 安装依赖..."
            npm install
        fi
        echo "🔨 构建应用..."
        npm run build
        echo "🚀 启动生产服务器..."
        npm start
        ;;
    3)
        echo "🐳 Docker 部署..."
        if [[ "$DOCKER_VERSION" == "未安装" ]]; then
            echo "❌ 请先安装 Docker"
            exit 1
        fi
        
        echo "🔨 构建 Docker 镜像..."
        docker build -t chatbot-web-nextjs .
        
        echo "🚀 启动 Docker 容器..."
        docker run -d \
            --name chatbot-web \
            -p 3000:3000 \
            --restart unless-stopped \
            chatbot-web-nextjs
        
        echo "✅ Docker 容器已启动，访问 http://localhost:3000"
        ;;
    4)
        echo "🐳 Docker Compose 部署..."
        if [[ "$DOCKER_VERSION" == "未安装" ]]; then
            echo "❌ 请先安装 Docker 和 Docker Compose"
            exit 1
        fi
        
        # 检查 docker-compose 命令
        if command -v docker-compose &> /dev/null; then
            COMPOSE_CMD="docker-compose"
        elif docker compose version &> /dev/null; then
            COMPOSE_CMD="docker compose"
        else
            echo "❌ 请先安装 Docker Compose"
            exit 1
        fi
        
        echo "🔨 使用 Docker Compose 构建和启动..."
        $COMPOSE_CMD up -d --build
        
        echo "✅ Docker Compose 服务已启动，访问 http://localhost:3000"
        ;;
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac

echo ""
echo "🎉 部署完成！"
echo "📖 访问 http://localhost:3000 开始使用智能聊天机器人"
echo "⚙️ 请在配置面板中设置您的 API Key 和其他参数"
echo ""
echo "📚 使用提示:"
echo "  - 支持 OpenAI、DeepSeek、Ollama 等多种 LLM"
echo "  - 可启用 MCP 集成获取更多工具"
echo "  - 支持自定义 Prompt 和模板"
echo "  - 响应式设计，支持移动端"
echo ""
echo "🛠️ 如需停止服务:"
case $choice in
    3)
        echo "  docker stop chatbot-web && docker rm chatbot-web"
        ;;
    4)
        echo "  $COMPOSE_CMD down"
        ;;
    *)
        echo "  Ctrl+C 停止开发服务器"
        ;;
esac 