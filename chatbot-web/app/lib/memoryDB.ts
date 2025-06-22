// SQLite数据库类型定义
import Database from 'better-sqlite3';
import { join } from 'path';
import { Client } from "@modelcontextprotocol/sdk/client/index.js"

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

// SQLite数据库类 - 只存储服务器和工具信息
export class MemoryDB {
  private static instance: MemoryDB;
  private db: Database.Database;
  private mcpClients: Map<string, Client> = new Map();
  
  // 连接信息使用内存存储（临时状态）
  private activeConnections: Map<string, MCPConnection> = new Map();
  private connectionHistory: MCPConnection[] = [];

  private constructor() {
    // 在项目根目录创建数据库文件
    const dbPath = join(process.cwd(), 'mcp_data.sqlite');
    console.log(`初始化SQLite数据库: ${dbPath}`);
    
    this.db = new Database(dbPath);
    this.initDatabase();
  }

  static getInstance(): MemoryDB {
    if (!MemoryDB.instance) {
      MemoryDB.instance = new MemoryDB();
    }
    return MemoryDB.instance;
  }

  private initDatabase(): void {
    console.log('创建数据库表...');
    
    // 只创建MCP服务器表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS mcp_servers (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        connected BOOLEAN DEFAULT FALSE,
        connected_at DATETIME,
        last_ping DATETIME,
        status TEXT DEFAULT 'disconnected',
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 只创建工具表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS mcp_tools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        input_schema TEXT,
        output_schema TEXT,
        parameters TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (server_id) REFERENCES mcp_servers (id) ON DELETE CASCADE,
        UNIQUE(server_id, name)
      )
    `);

    // 创建索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_servers_url ON mcp_servers(url);
      CREATE INDEX IF NOT EXISTS idx_servers_status ON mcp_servers(status);
      CREATE INDEX IF NOT EXISTS idx_tools_server ON mcp_tools(server_id);
    `);

    console.log('数据库表创建完成（仅包含服务器和工具表）');
  }

  // MCP服务器管理
  addMCPServer(server: MCPServer, client: Client): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO mcp_servers 
      (id, url, name, connected, connected_at, last_ping, status, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      server.id,
      server.url,
      server.name,
      server.connected ? 1 : 0,
      server.connectedAt.toISOString(),
      server.lastPing.toISOString(),
      server.status,
      server.errorMessage || null
    );

    // 添加工具到数据库
    const deleteToolsStmt = this.db.prepare('DELETE FROM mcp_tools WHERE server_id = ?');
    deleteToolsStmt.run(server.id);

    if (server.tools && server.tools.length > 0) {
      const insertToolStmt = this.db.prepare(`
        INSERT INTO mcp_tools (server_id, name, description, input_schema, output_schema, parameters)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const tool of server.tools) {
        insertToolStmt.run(
          server.id,
          tool.name,
          tool.description || null,
          tool.inputSchema ? JSON.stringify(tool.inputSchema) : null,
          tool.outputSchema ? JSON.stringify(tool.outputSchema) : null,
          tool.parameters ? JSON.stringify(tool.parameters) : null
        );
      }
    }

    this.mcpClients.set(server.id, client);
    console.log(`MCP服务器已添加到数据库: ${server.name} (${server.url}), 共有tools: ${server.tools.length}`);
  }

  getMCPServer(id: string): MCPServer | undefined {
    const stmt = this.db.prepare('SELECT * FROM mcp_servers WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return undefined;

    return this.mapRowToServer(row);
  }

  getMCPClient(id: string): Client | undefined {
    return this.mcpClients.get(id);
  }

  getMCPServerByUrl(url: string): MCPServer | undefined {
    const stmt = this.db.prepare('SELECT * FROM mcp_servers WHERE url = ?');
    const row = stmt.get(url) as any;
    
    if (!row) return undefined;

    return this.mapRowToServer(row);
  }

  updateMCPServer(id: string, updates: Partial<MCPServer>): boolean {
    const server = this.getMCPServer(id);
    if (!server) return false;

    const fields = [];
    const values = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.connected !== undefined) {
      fields.push('connected = ?');
      values.push(updates.connected ? 1 : 0);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.errorMessage !== undefined) {
      fields.push('error_message = ?');
      values.push(updates.errorMessage);
    }

    fields.push('last_ping = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = this.db.prepare(`UPDATE mcp_servers SET ${fields.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);

    if (result.changes > 0) {
      console.log(`MCP服务器已更新: ${server.name}`);
      return true;
    }
    return false;
  }

  removeMCPServer(id: string): boolean {
    const server = this.getMCPServer(id);
    if (!server) return false;

    const stmt = this.db.prepare('DELETE FROM mcp_servers WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes > 0) {
      this.mcpClients.delete(id);
      console.log(`MCP服务器已从数据库移除: ${server.name}`);
      return true;
    }
    return false;
  }

  getAllMCPServers(): MCPServer[] {
    const stmt = this.db.prepare('SELECT * FROM mcp_servers ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    
    return rows.map(row => this.mapRowToServer(row));
  }

  getConnectedMCPServers(): MCPServer[] {
    const stmt = this.db.prepare('SELECT * FROM mcp_servers WHERE connected = 1 ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    
    return rows.map(row => this.mapRowToServer(row));
  }

  // 连接管理 - 使用内存存储
  addConnection(connection: MCPConnection): void {
    this.activeConnections.set(connection.serverId, connection);
    this.connectionHistory.push(connection);
    console.log(`MCP连接已建立（内存存储）: ${connection.serverUrl}`);
  }

  removeConnection(serverId: string): boolean {
    const connection = this.activeConnections.get(serverId);
    if (connection) {
      connection.isActive = false;
      this.activeConnections.delete(serverId);
      console.log(`MCP连接已断开（内存存储）: ${connection.serverUrl}`);
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
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO mcp_tools (server_id, name, description, input_schema, output_schema, parameters)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      serverId,
      tool.name,
      tool.description || null,
      tool.inputSchema ? JSON.stringify(tool.inputSchema) : null,
      tool.outputSchema ? JSON.stringify(tool.outputSchema) : null,
      tool.parameters ? JSON.stringify(tool.parameters) : null
    );

    if (result.changes > 0) {
      const server = this.getMCPServer(serverId);
      console.log(`工具已添加到数据库 ${server?.name || serverId}: ${tool.name}`);
      return true;
    }
    return false;
  }

  getServerTools(serverId: string): MCPTool[] {
    const stmt = this.db.prepare('SELECT * FROM mcp_tools WHERE server_id = ?');
    const rows = stmt.all(serverId) as any[];
    
    return rows.map(row => ({
      name: row.name,
      description: row.description || '',
      inputSchema: row.input_schema ? JSON.parse(row.input_schema) : undefined,
      outputSchema: row.output_schema ? JSON.parse(row.output_schema) : undefined,
      parameters: row.parameters ? JSON.parse(row.parameters) : undefined
    }));
  }

  getAllTools(): { serverId: string; serverName: string; tools: MCPTool[] }[] {
    const stmt = this.db.prepare(`
      SELECT s.id as server_id, s.name as server_name, t.name, t.description, 
             t.input_schema, t.output_schema, t.parameters
      FROM mcp_servers s
      LEFT JOIN mcp_tools t ON s.id = t.server_id
      ORDER BY s.name, t.name
    `);
    const rows = stmt.all() as any[];
    
    const serverMap = new Map<string, { serverId: string; serverName: string; tools: MCPTool[] }>();
    
    for (const row of rows) {
      if (!serverMap.has(row.server_id)) {
        serverMap.set(row.server_id, {
          serverId: row.server_id,
          serverName: row.server_name,
          tools: []
        });
      }
      
      if (row.name) {
        const server = serverMap.get(row.server_id)!;
        server.tools.push({
          name: row.name,
          description: row.description || '',
          inputSchema: row.input_schema ? JSON.parse(row.input_schema) : undefined,
          outputSchema: row.output_schema ? JSON.parse(row.output_schema) : undefined,
          parameters: row.parameters ? JSON.parse(row.parameters) : undefined
        });
      }
    }
    
    return Array.from(serverMap.values());
  }

  // 状态管理
  updateServerStatus(serverId: string, status: MCPServer['status'], errorMessage?: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE mcp_servers 
      SET status = ?, error_message = ?, last_ping = ?
      WHERE id = ?
    `);

    const result = stmt.run(status, errorMessage || null, new Date().toISOString(), serverId);

    if (result.changes > 0) {
      const server = this.getMCPServer(serverId);
      console.log(`服务器状态已更新（数据库）: ${server?.name || serverId} -> ${status}`);
      return true;
    }
    return false;
  }

  // 清理过期连接 - 只清理内存中的连接
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
      console.log(`已清理 ${expiredConnections.length} 个过期连接（内存）`);
    }
  }

  // 获取统计信息
  getStats(): {
    totalServers: number;
    connectedServers: number;
    activeConnections: number;
    totalTools: number;
  } {
    const totalServersStmt = this.db.prepare('SELECT COUNT(*) as count FROM mcp_servers');
    const connectedServersStmt = this.db.prepare('SELECT COUNT(*) as count FROM mcp_servers WHERE connected = 1');
    const totalToolsStmt = this.db.prepare('SELECT COUNT(*) as count FROM mcp_tools');

    const totalServers = (totalServersStmt.get() as any).count;
    const connectedServers = (connectedServersStmt.get() as any).count;
    const activeConnections = this.activeConnections.size; // 从内存获取
    const totalTools = (totalToolsStmt.get() as any).count;

    return {
      totalServers,
      connectedServers,
      activeConnections,
      totalTools
    };
  }

  // 重置数据库
  reset(): void {
    // 清理数据库中的数据
    this.db.exec('DELETE FROM mcp_tools');
    this.db.exec('DELETE FROM mcp_servers');
    
    // 清理内存中的数据
    this.mcpClients.clear();
    this.activeConnections.clear();
    this.connectionHistory = [];
    
    console.log('数据库已重置（服务器和工具数据），连接信息已清理（内存）');
  }

  // 私有辅助方法
  private mapRowToServer(row: any): MCPServer {
    const tools = this.getServerTools(row.id);
    
    return {
      id: row.id,
      url: row.url,
      name: row.name,
      connected: Boolean(row.connected),
      connectedAt: new Date(row.connected_at || Date.now()),
      lastPing: new Date(row.last_ping || Date.now()),
      tools,
      status: row.status || 'disconnected',
      errorMessage: row.error_message || undefined
    };
  }

  // 关闭数据库连接
  close(): void {
    this.db.close();
    console.log('数据库连接已关闭');
  }
}

// 测试单例模式
const instance1 = MemoryDB.getInstance();
const instance2 = MemoryDB.getInstance();
console.log('Compare MemoryDB instances: ', instance1 === instance2);

// 导出全局实例 (保留原有的导出方式以兼容现有代码)
// export const memoryDB = new MemoryDB();