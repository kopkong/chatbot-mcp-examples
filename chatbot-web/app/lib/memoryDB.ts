// 内存数据库类型定义
export interface MCPServer {
  id: string;
  url: string;
  name: string;
  connected: boolean;
  connectedAt: Date;
  lastPing: Date;
  tools: MCPTool[];
  status: 'connected' | 'disconnected' | 'error';
  errorMessage?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema?: any;
  outputSchema?: any;
  parameters?: any;
}

export interface MCPConnection {
  serverId: string;
  serverUrl: string;
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
}

// 内存数据库类
class MemoryDB {
  private mcpServers: Map<string, MCPServer> = new Map();
  private activeConnections: Map<string, MCPConnection> = new Map();
  private connectionHistory: MCPConnection[] = [];

  // MCP服务器管理
  addMCPServer(server: MCPServer): void {
    this.mcpServers.set(server.id, server);
    console.log(`MCP服务器已添加: ${server.name} (${server.url})`);
  }

  getMCPServer(id: string): MCPServer | undefined {
    return this.mcpServers.get(id);
  }

  getMCPServerByUrl(url: string): MCPServer | undefined {
    for (const server of this.mcpServers.values()) {
      if (server.url === url) {
        return server;
      }
    }
    return undefined;
  }

  updateMCPServer(id: string, updates: Partial<MCPServer>): boolean {
    const server = this.mcpServers.get(id);
    if (server) {
      Object.assign(server, updates);
      server.lastPing = new Date();
      this.mcpServers.set(id, server);
      console.log(`MCP服务器已更新: ${server.name}`);
      return true;
    }
    return false;
  }

  removeMCPServer(id: string): boolean {
    const server = this.mcpServers.get(id);
    if (server) {
      this.mcpServers.delete(id);
      console.log(`MCP服务器已移除: ${server.name}`);
      return true;
    }
    return false;
  }

  getAllMCPServers(): MCPServer[] {
    return Array.from(this.mcpServers.values());
  }

  getConnectedMCPServers(): MCPServer[] {
    return Array.from(this.mcpServers.values()).filter(server => server.connected);
  }

  // 连接管理
  addConnection(connection: MCPConnection): void {
    this.activeConnections.set(connection.serverId, connection);
    this.connectionHistory.push(connection);
    console.log(`MCP连接已建立: ${connection.serverUrl}`);
  }

  removeConnection(serverId: string): boolean {
    const connection = this.activeConnections.get(serverId);
    if (connection) {
      connection.isActive = false;
      this.activeConnections.delete(serverId);
      console.log(`MCP连接已断开: ${connection.serverUrl}`);
      return true;
    }
    return false;
  }

  getActiveConnection(serverId: string): MCPConnection | undefined {
    return this.activeConnections.get(serverId);
  }

  getAllActiveConnections(): MCPConnection[] {
    return Array.from(this.activeConnections.values());
  }

  getConnectionHistory(): MCPConnection[] {
    return this.connectionHistory;
  }

  // 工具管理
  addToolToServer(serverId: string, tool: MCPTool): boolean {
    const server = this.mcpServers.get(serverId);
    if (server) {
      const existingToolIndex = server.tools.findIndex(t => t.name === tool.name);
      if (existingToolIndex >= 0) {
        server.tools[existingToolIndex] = tool;
      } else {
        server.tools.push(tool);
      }
      this.mcpServers.set(serverId, server);
      console.log(`工具已添加到服务器 ${server.name}: ${tool.name}`);
      return true;
    }
    return false;
  }

  getServerTools(serverId: string): MCPTool[] {
    const server = this.mcpServers.get(serverId);
    return server ? server.tools : [];
  }

  getAllTools(): { serverId: string; serverName: string; tools: MCPTool[] }[] {
    return Array.from(this.mcpServers.values()).map(server => ({
      serverId: server.id,
      serverName: server.name,
      tools: server.tools
    }));
  }

  // 状态管理
  updateServerStatus(serverId: string, status: MCPServer['status'], errorMessage?: string): boolean {
    const server = this.mcpServers.get(serverId);
    if (server) {
      server.status = status;
      server.errorMessage = errorMessage;
      server.lastPing = new Date();
      this.mcpServers.set(serverId, server);
      console.log(`服务器状态已更新: ${server.name} -> ${status}`);
      return true;
    }
    return false;
  }

  // 清理过期连接
  cleanupExpiredConnections(maxAgeMinutes: number = 30): void {
    const now = new Date();
    const expiredConnections: string[] = [];

    for (const [serverId, connection] of this.activeConnections.entries()) {
      const ageMinutes = (now.getTime() - connection.lastActivity.getTime()) / (1000 * 60);
      if (ageMinutes > maxAgeMinutes) {
        expiredConnections.push(serverId);
      }
    }

    expiredConnections.forEach(serverId => {
      this.removeConnection(serverId);
      this.updateServerStatus(serverId, 'disconnected', '连接超时');
    });

    if (expiredConnections.length > 0) {
      console.log(`已清理 ${expiredConnections.length} 个过期连接`);
    }
  }

  // 获取统计信息
  getStats(): {
    totalServers: number;
    connectedServers: number;
    activeConnections: number;
    totalTools: number;
  } {
    const totalServers = this.mcpServers.size;
    const connectedServers = this.getConnectedMCPServers().length;
    const activeConnections = this.activeConnections.size;
    const totalTools = Array.from(this.mcpServers.values()).reduce((sum, server) => sum + server.tools.length, 0);

    return {
      totalServers,
      connectedServers,
      activeConnections,
      totalTools
    };
  }

  // 重置数据库
  reset(): void {
    this.mcpServers.clear();
    this.activeConnections.clear();
    this.connectionHistory = [];
    console.log('内存数据库已重置');
  }
}

// 创建全局实例
export const memoryDB = new MemoryDB();

// 定期清理过期连接
setInterval(() => {
  memoryDB.cleanupExpiredConnections();
}, 5 * 60 * 1000); // 每5分钟清理一次 