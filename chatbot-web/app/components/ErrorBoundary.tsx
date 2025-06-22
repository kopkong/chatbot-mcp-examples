'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <i className="fas fa-exclamation-triangle fa-3x"></i>
            <h2>出现了错误</h2>
            <p>应用遇到了一个错误，请刷新页面重试。</p>
            <div className="error-details">
              <details>
                <summary>错误详情</summary>
                <pre>{this.state.error?.stack}</pre>
              </details>
            </div>
            <div className="error-actions">
              <button 
                className="btn btn-primary" 
                onClick={() => window.location.reload()}
              >
                <i className="fas fa-refresh"></i> 刷新页面
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => this.setState({ hasError: false })}
              >
                <i className="fas fa-undo"></i> 重试
              </button>
            </div>
          </div>
          
          <style jsx>{`
            .error-boundary {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: var(--background-color);
              color: var(--text-primary);
              padding: 2rem;
            }
            
            .error-content {
              text-align: center;
              max-width: 500px;
              padding: 2rem;
              background: var(--surface-color);
              border-radius: var(--border-radius-lg);
              box-shadow: var(--shadow-lg);
            }
            
            .error-content i {
              color: var(--danger-color);
              margin-bottom: 1rem;
            }
            
            .error-content h2 {
              margin-bottom: 1rem;
              color: var(--text-primary);
            }
            
            .error-content p {
              margin-bottom: 1.5rem;
              color: var(--text-secondary);
              line-height: 1.6;
            }
            
            .error-details {
              margin: 1.5rem 0;
              text-align: left;
            }
            
            .error-details summary {
              cursor: pointer;
              color: var(--text-secondary);
              margin-bottom: 0.5rem;
            }
            
            .error-details pre {
              background: var(--background-color);
              padding: 1rem;
              border-radius: var(--border-radius);
              overflow-x: auto;
              font-size: 0.8rem;
              color: var(--danger-color);
            }
            
            .error-actions {
              display: flex;
              gap: 1rem;
              justify-content: center;
              flex-wrap: wrap;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 