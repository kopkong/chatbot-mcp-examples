# SQLite数据库升级说明

## 概述

本次升级将原有的内存数据库改为基于SQLite的持久化数据库，实现了数据的持久化存储和跨重启共享。

## 主要改进

### 1. 数据持久化
- **之前**: 数据存储在内存中，应用重启后数据丢失
- **现在**: 数据存储在SQLite数据库中，应用重启后数据仍然保留

### 2. 数据共享
- **之前**: 每个应用实例有独立的内存数据
- **现在**: 所有应用实例共享同一个SQLite数据库

### 3. 性能优化
- 添加了适当的数据库索引
- 使用了prepared statements提高查询性能
- 支持事务操作确保数据一致性

## 技术细节

### 数据库文件
- 位置: `chatbot-web/mcp_data.sqlite`
- 引擎: better-sqlite3 (高性能SQLite库)

### 表结构

#### mcp_servers表 (SQLite存储)
存储MCP服务器信息：
- id: 主键
- url: 服务器URL (唯一)
- name: 服务器名称
- connected: 连接状态
- status: 服务器状态
- 时间戳字段

#### mcp_tools表 (SQLite存储)
存储MCP工具信息：
- 与服务器的外键关联
- 支持JSON格式的schema存储
- 唯一约束防止重复工具

#### 连接信息 (内存存储)
连接状态为临时信息，使用内存存储：
- activeConnections: 当前活跃连接
- connectionHistory: 连接历史记录
- 应用重启后连接状态重置

### 索引优化
- url索引：快速查找服务器
- status索引：快速筛选状态
- 外键索引：优化关联查询

## 使用方式

### 单例模式
```typescript
const memoryDB = MemoryDB.getInstance();
```

### API兼容性
所有原有的API方法保持不变：
- `addMCPServer()`
- `getMCPServer()`
- `getAllMCPServers()`
- `getConnectedMCPServers()`
- 等等...

## 数据库管理

### 查看数据库
```bash
sqlite3 mcp_data.sqlite
.tables
.schema
```

### 重置数据库
通过API调用：
```bash
curl -X DELETE http://localhost:3000/api/mcp/status
```

### 备份数据库
```bash
cp mcp_data.sqlite mcp_data.backup.sqlite
```

## 注意事项

1. **数据库文件**: 请确保应用有权限在工作目录创建和写入数据库文件
2. **并发访问**: SQLite支持多读但写操作需要排队
3. **备份**: 建议定期备份数据库文件
4. **清理**: 应用提供了自动清理过期连接的机制

## 新增依赖

```json
{
  "better-sqlite3": "^9.4.0",
  "@types/better-sqlite3": "^7.6.9"
}
```

## 升级完成

✅ 内存数据库 → SQLite数据库
✅ 数据持久化存储
✅ 单例模式保持不变
✅ API接口完全兼容
✅ 性能和索引优化
✅ 数据库表结构完整 