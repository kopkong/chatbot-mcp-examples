'use client'

import React, { useState, useEffect, useCallback } from 'react';

// 类型定义
interface MCPTool {
  name: string;
  description: string;
  inputSchema?: any;
}

interface MCPConfigProps {
  mcpEnabled: boolean;
  mcpServer: string;
  onConfigChange: (key: string, value: any) => void;
  onNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const MCPConfig: React.FC<MCPConfigProps> = ({
  mcpEnabled,
  mcpServer,
  onConfigChange,
  onNotification
}) => {
  // MCP 相关状态
  const [mcpConnected, setMcpConnected] = useState(false);
  const [mcpTools, setMcpTools] = useState<MCPTool[]>([]);
  const [mcpConnecting, setMcpConnecting] = useState(false);

  // 获取MCP连接状态
  const checkMCPStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/mcp/connect');
      const data = await response.json();
      
      if (data.success) {
        setMcpConnected(data.connected);
        setMcpTools(data.tools || []);
      }
    } catch (error) {
      console.error('获取MCP状态失败:', error);
    }
  }, []);

  // MCP连接 - 调用后端API
  const connectToMCP = useCallback(async () => {
    if (!mcpServer.trim()) {
      onNotification('请输入MCP服务器地址！', 'warning');
      return;
    }

    setMcpConnecting(true);
    try {
      console.log('🔌 正在连接到 MCP 服务器:', mcpServer);
      
      const response = await fetch('/api/mcp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverUrl: mcpServer
        })
      });

      const data = await response.json();

      if (data.success && data.connected) {
        setMcpConnected(true);
        setMcpTools(data.tools || []);
        onNotification(data.message || 'MCP服务器连接成功！', 'success');
        console.log('✅ MCP连接成功，可用工具:', data.tools);
      } else {
        throw new Error(data.error || '连接失败');
      }
    } catch (error) {
      setMcpConnected(false);
      setMcpTools([]);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      onNotification('MCP服务器连接失败: ' + errorMessage, 'error');
      console.error('❌ MCP连接失败:', error);
    } finally {
      setMcpConnecting(false);
    }
  }, [mcpServer, onNotification]);

  // 断开MCP连接
  const disconnectMCP = useCallback(async () => {
    try {
      const response = await fetch('/api/mcp/connect', {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        setMcpConnected(false);
        setMcpTools([]);
        onNotification(data.message || 'MCP连接已断开', 'info');
      }
    } catch (error) {
      console.error('断开MCP连接失败:', error);
      onNotification('断开连接失败', 'error');
    }
  }, [onNotification]);

  // 组件挂载时检查连接状态
  useEffect(() => {
    if (typeof window !== 'undefined' && mcpEnabled) {
      checkMCPStatus();
    }
  }, [checkMCPStatus, mcpEnabled]);

  // 测试连接
  const testConnection = useCallback(async () => {
    if (!mcpServer.trim()) {
      onNotification('请先输入MCP服务器地址！', 'warning');
      return;
    }

    await connectToMCP();
  }, [connectToMCP, mcpServer]);

  return (
    <div className="config-section">
      <h4><i className="fas fa-plug"></i> MCP 设置</h4>
      
      <div className="form-group">
        <label htmlFor="mcpEnabled">启用MCP:</label>
        <input 
          type="checkbox" 
          id="mcpEnabled" 
          className="checkbox"
          checked={mcpEnabled}
          onChange={(e) => onConfigChange('mcpEnabled', e.target.checked)}
        />
        <span className="checkbox-label">
          启用 Model Context Protocol 工具集成
        </span>
      </div>

      <div className="form-group">
        <label htmlFor="mcpServer">MCP 服务器地址:</label>
        <input 
          type="text" 
          id="mcpServer" 
          placeholder="http://localhost:1122"
          value={mcpServer}
          onChange={(e) => onConfigChange('mcpServer', e.target.value)}
          disabled={!mcpEnabled}
        />
        <small className="form-help">
          请确保MCP服务器正在运行并且可以访问
        </small>
      </div>
      
      {mcpEnabled && (
        <>
          <div className="form-group">
            <div className="mcp-connection-controls">
              <button 
                className="btn btn-secondary"
                onClick={connectToMCP}
                disabled={mcpConnecting || mcpConnected || !mcpServer.trim()}
              >
                <i className={mcpConnecting ? "fas fa-spinner fa-spin" : "fas fa-plug"}></i>
                {mcpConnecting ? '连接中...' : '连接MCP服务器'}
              </button>
              
              {mcpConnected && (
                <button 
                  className="btn btn-warning"
                  onClick={disconnectMCP}
                  style={{ marginLeft: '8px' }}
                >
                  <i className="fas fa-unlink"></i>
                  断开连接
                </button>
              )}

              <button 
                className="btn btn-secondary"
                onClick={testConnection}
                disabled={mcpConnecting || !mcpServer.trim()}
                style={{ marginLeft: '8px' }}
              >
                <i className="fas fa-vial"></i>
                测试连接
              </button>
            </div>
            
            <div className="status-indicator">
              <span className={`status-dot ${mcpConnected ? 'status-connected' : 'status-disconnected'}`}></span>
              <span>{mcpConnected ? '已连接' : '未连接'}</span>
              {mcpConnected && mcpTools.length > 0 && (
                <span style={{ marginLeft: '8px', color: 'var(--text-secondary)' }}>
                  ({mcpTools.length} 个工具)
                </span>
              )}
            </div>

            {/* 连接状态详情 */}
            {mcpConnected && (
              <div className="mcp-status-details">
                <div className="status-item">
                  <i className="fas fa-server"></i>
                  <span>服务器: {mcpServer}</span>
                </div>
                <div className="status-item">
                  <i className="fas fa-clock"></i>
                  <span>连接时间: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            )}
          </div>
          
          {mcpTools.length > 0 && (
            <div className="form-group">
              <label>可用工具:</label>
              <div className="tools-list">
                {mcpTools.map((tool, index) => (
                  <div key={index} className="tool-item">
                    <div className="tool-header">
                      <strong>{tool.name}</strong>
                      <span className="tool-badge">
                        <i className="fas fa-check-circle"></i>
                        可用
                      </span>
                    </div>
                    <small>{tool.description || '无描述'}</small>
                    {tool.inputSchema && (
                      <div className="tool-schema">
                        <small>参数: {Object.keys(tool.inputSchema.properties || {}).join(', ')}</small>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MCP帮助信息 */}
          <div className="form-group">
            <div className="mcp-help">
              <h5><i className="fas fa-info-circle"></i> MCP 说明</h5>
              <ul>
                <li>MCP (Model Context Protocol) 提供工具扩展能力</li>
                <li>连接后可使用图表生成、数据查询等工具</li>
                <li>确保MCP服务器正常运行且网络可达</li>
                <li>支持的工具将在连接后自动显示</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MCPConfig; 