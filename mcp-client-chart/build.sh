#!/bin/bash

# 构建 Docker 镜像
echo "正在构建 MCP 客户端 Docker 镜像..."
docker build -t mcp-client-chart:latest .

# 检查构建是否成功
if [ $? -eq 0 ]; then
    echo "✅ Docker 镜像构建成功！"
    echo ""
    echo "🚀 运行客户端的命令："
    echo "docker run --rm mcp-client-chart:latest npm run test"
    echo ""
    echo "🔗 连接到指定服务器："
    echo "docker run --rm mcp-client-chart:latest node client.js connect --server http://your-server:1122"
    echo ""
    echo "📋 查看镜像信息："
    echo "docker images | grep mcp-client-chart"
    echo ""
    echo "💡 本地开发运行："
    echo "npm install && npm start"
else
    echo "❌ Docker 镜像构建失败！"
    exit 1
fi 