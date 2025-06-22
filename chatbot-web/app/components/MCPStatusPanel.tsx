'use client'

import React, { useState, useEffect } from 'react';

interface MCPStats {
  totalServers: number;
  connectedServers: number;
  activeConnections: number;
  totalTools: number;
  totalCapabilities: number;
}

interface MCPServer {
  id: string;
  url: string;
  name: string;
  connected: boolean;
  connectedAt: string;
  lastPing: string;
  tools: any[];
  capabilities: string[];
  status: 'connected' | 'disconnected' | 'error';
  errorMessage?: string;
}

interface MCPTool {
  name: string;
  description: string;
  serverId?: string;
  serverName?: string;
  type: 'builtin' | 'mcp';
}

interface MCPStatusPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const MCPStatusPanel: React.FC<MCPStatusPanelProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<MCPStats | null>(null);
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'servers' | 'tools'>('overview');

  const fetchMCPStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/mcp/status');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
        setServers(data.servers.all || []);
      }
    } catch (error) {
      console.error('获取MCP状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTools = async () => {
    try {
      const response = await fetch('/api/mcp/tools');
      const data = await response.json();
      
      if (data.success) {
        setTools(data.tools.all || []);
      }
    } catch (error) {
      console.error('获取工具列表失败:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMCPStatus();
      fetchTools();
    }
  }, [isOpen]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'disconnected': return 'text-red-500';
      case 'error': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return 'fas fa-check-circle';
      case 'disconnected': return 'fas fa-times-circle';
      case 'error': return 'fas fa-exclamation-triangle';
      default: return 'fas fa-question-circle';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            <i className="fas fa-plug mr-2"></i>
            MCP 状态面板
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* 标签页 */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          >
            <i className="fas fa-chart-bar mr-2"></i>
            概览
          </button>
          <button
            onClick={() => setActiveTab('servers')}
            className={`px-4 py-2 ${activeTab === 'servers' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          >
            <i className="fas fa-server mr-2"></i>
            服务器
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-4 py-2 ${activeTab === 'tools' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          >
            <i className="fas fa-tools mr-2"></i>
            工具
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <i className="fas fa-spinner fa-spin text-2xl text-blue-500"></i>
            </div>
          ) : (
            <>
              {/* 概览标签页 */}
              {activeTab === 'overview' && stats && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.totalServers}</div>
                      <div className="text-sm text-gray-600">总服务器</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.connectedServers}</div>
                      <div className="text-sm text-gray-600">已连接</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">{stats.activeConnections}</div>
                      <div className="text-sm text-gray-600">活跃连接</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-600">{stats.totalTools}</div>
                      <div className="text-sm text-gray-600">可用工具</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-red-600">{stats.totalCapabilities}</div>
                      <div className="text-sm text-gray-600">能力</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">系统状态</h3>
                    <div className="text-sm text-gray-600">
                      <div>MCP内存数据库运行正常</div>
                      <div>自动清理已启用（每5分钟）</div>
                      <div>连接超时：30分钟</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 服务器标签页 */}
              {activeTab === 'servers' && (
                <div className="space-y-4">
                  {servers.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <i className="fas fa-server text-4xl mb-4"></i>
                      <div>暂无MCP服务器</div>
                    </div>
                  ) : (
                    servers.map(server => (
                      <div key={server.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{server.name}</h3>
                          <div className="flex items-center space-x-2">
                            <i className={`${getStatusIcon(server.status)} ${getStatusColor(server.status)}`}></i>
                            <span className={`text-sm ${getStatusColor(server.status)}`}>
                              {server.status === 'connected' ? '已连接' : 
                               server.status === 'disconnected' ? '已断开' : '错误'}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>URL: {server.url}</div>
                          <div>连接时间: {formatDate(server.connectedAt)}</div>
                          <div>最后活动: {formatDate(server.lastPing)}</div>
                          <div>工具数量: {server.tools.length}</div>
                          <div>能力数量: {server.capabilities.length}</div>
                          {server.errorMessage && (
                            <div className="text-red-500">错误: {server.errorMessage}</div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 工具标签页 */}
              {activeTab === 'tools' && (
                <div className="space-y-4">
                  {tools.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <i className="fas fa-tools text-4xl mb-4"></i>
                      <div>暂无可用工具</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tools.map((tool, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{tool.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded ${
                              tool.type === 'builtin' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                            }`}>
                              {tool.type === 'builtin' ? '内置' : 'MCP'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div>{tool.description}</div>
                            {tool.serverName && (
                              <div className="text-xs text-gray-500 mt-1">
                                服务器: {tool.serverName}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* 底部操作 */}
        <div className="flex justify-end space-x-2 p-4 border-t">
          <button
            onClick={fetchMCPStatus}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            刷新
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default MCPStatusPanel; 