#!/bin/bash

# MCP Server Chart 容器启动脚本

IMAGE_NAME="mcp-server-chart:latest"
CONTAINER_NAME="mcp-server-chart-container"
PORT=1122

echo "正在启动 MCP Server Chart 容器..."

# 检查镜像是否存在
if ! docker images --format "table {{.Repository}}:{{.Tag}}" | grep -q "$IMAGE_NAME"; then
    echo "镜像 $IMAGE_NAME 不存在，正在构建..."
    ./build.sh
    if [ $? -ne 0 ]; then
        echo "镜像构建失败，无法启动容器"
        exit 1
    fi
fi

# 停止并删除现有容器（如果存在）
if docker ps -a --format "table {{.Names}}" | grep -q "$CONTAINER_NAME"; then
    echo "停止现有容器..."
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
fi

# 启动新容器
echo "启动容器 $CONTAINER_NAME..."
docker run -d \
    --name $CONTAINER_NAME \
    -p $PORT:1122 \
    $IMAGE_NAME

# 检查容器是否启动成功
if [ $? -eq 0 ]; then
    echo "✅ 容器启动成功！"
    echo ""
    echo "服务信息："
    echo "- 容器名称: $CONTAINER_NAME"
    echo "- 端口映射: $PORT:1122"
    echo "- 访问地址: http://localhost:$PORT"
    echo ""
    echo "查看容器状态："
    echo "docker ps | grep $CONTAINER_NAME"
    echo ""
    echo "查看容器日志："
    echo "docker logs $CONTAINER_NAME"
    echo ""
    echo "停止容器："
    echo "docker stop $CONTAINER_NAME"
else
    echo "❌ 容器启动失败！"
    exit 1
fi 