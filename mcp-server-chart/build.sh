#!/bin/bash

# 构建 Docker 镜像
echo "正在构建 Docker 镜像..."
docker build -t mcp-server-chart:latest .

# 检查构建是否成功
if [ $? -eq 0 ]; then
    echo "Docker 镜像构建成功！"
    echo ""
    echo "运行容器的命令："
    echo "docker run -p 1122:1122 mcp-server-chart:latest"
    echo ""
    echo "查看镜像信息："
    echo "docker images | grep mcp-server-chart"
else
    echo "Docker 镜像构建失败！"
    exit 1
fi 