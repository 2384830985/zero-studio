/**
 * MCP (Model Context Protocol) 相关类型定义
 */

// MCP 工具定义
export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: string
    properties: Record<string, any>
    required?: string[]
  }
}

// MCP 服务器配置
export interface MCPServerConfig {
  id: string
  name: string
  description: string
  enabled: boolean

  // 连接配置
  type: 'local' | 'remote' | 'stdio'

  // 本地服务器配置
  command?: string
  args?: string[]
  env?: Record<string, string>
  cwd?: string

  // 远程服务器配置
  url?: string
  headers?: Record<string, string>

  // 认证配置
  auth?: {
    type: 'bearer' | 'basic' | 'apikey'
    token?: string
    username?: string
    password?: string
    apiKey?: string
  }

  // 工具配置
  tools: MCPTool[]

  // 其他配置
  timeout?: number
  retryCount?: number
  color?: string

  // 元数据
  createdAt: number
  updatedAt: number
}

// MCP 工具调用请求
export interface MCPToolCallRequest {
  serverId: string
  toolName: string
  arguments: Record<string, any>
}

// MCP 工具调用响应
export interface MCPToolCallResponse {
  success: boolean
  result?: any
  error?: string
  metadata?: {
    executionTime?: number
    serverId: string
    toolName: string
  }
}

// MCP 服务器状态
export interface MCPServerStatus {
  id: string
  connected: boolean
  lastPing?: number
  error?: string
  toolsCount: number
}

// MCP 配置存储格式
export interface MCPSettings {
  servers: MCPServerConfig[]
  globalSettings: {
    enableAutoConnect: boolean
    defaultTimeout: number
    maxRetries: number
    logLevel: 'debug' | 'info' | 'warn' | 'error'
  }
  lastUpdated: number
}

// 预定义的MCP服务器模板
export interface MCPServerTemplate {
  id: string
  name: string
  description: string
  type: MCPServerConfig['type']
  command?: string
  args?: string[]
  url?: string
  defaultTools: Omit<MCPTool, 'name'>[]
  category: 'development' | 'productivity' | 'ai' | 'system' | 'custom'
}
