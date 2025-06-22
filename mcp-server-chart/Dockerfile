# 使用 Node.js 官方镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 全局安装 @antv/mcp-server-chart
RUN npm install -g @antv/mcp-server-chart

# 暴露端口 (根据应用需要调整)
EXPOSE 1122

# 设置启动命令
CMD ["mcp-server-chart", "--transport", "streamable"] 