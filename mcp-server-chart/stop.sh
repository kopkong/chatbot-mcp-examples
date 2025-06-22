#!/bin/bash

# MCP Server Chart 容器停止脚本

CONTAINER_NAME="mcp-server-chart-container"

echo "正在停止 MCP Server Chart 容器..."

# 检查容器是否存在并运行
if docker ps --format "table {{.Names}}" | grep -q "$CONTAINER_NAME"; then
    echo "停止容器 $CONTAINER_NAME..."
    docker stop $CONTAINER_NAME
    
    if [ $? -eq 0 ]; then
        echo "✅ 容器已停止"
        
        # 询问是否删除容器
        read -p "是否删除容器？(y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker rm $CONTAINER_NAME
            echo "✅ 容器已删除"
        fi
    else
        echo "❌ 停止容器失败"
        exit 1
    fi
elif docker ps -a --format "table {{.Names}}" | grep -q "$CONTAINER_NAME"; then
    echo "容器 $CONTAINER_NAME 已经停止"
    
    # 询问是否删除容器
    read -p "是否删除容器？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker rm $CONTAINER_NAME
        echo "✅ 容器已删除"
    fi
else
    echo "容器 $CONTAINER_NAME 不存在"
fi

echo ""
echo "当前运行的容器："
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(NAMES|mcp-server-chart)" || echo "没有相关容器在运行" 