export interface MCPMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  metadata?: {
    model?: string
    temperature?: number
    maxTokens?: number
    stream?: boolean
    // MCP 工具调用相关信息
    toolCalls?: MCPToolCall[]
    toolResults?: MCPToolResult[]
  }
}

export interface MCPConversation {
  id: string
  title: string
  messages: MCPMessage[]
  messageCount: number
  lastActivity: number
  createdAt: number
}

export interface MCPServerStats {
  connectedClients: number
  totalConversations: number
  totalMessages: number
  port: number
  config: object
}

export interface ModelService {
  id: string
  name: string
  description: string
  color: string
  enabled: boolean
  apiKey: string
  apiUrl: string
  models: ModelInfo[]
}

export interface ModelInfo {
  name: string
  description: string
  enabled: boolean
  color: string
}

// MCP 工具调用信息
export interface MCPToolCall {
  id: string
  name: string
  arguments: Record<string, any>
  serverId?: string
  serverName?: string
}

// MCP 工具调用结果
export interface MCPToolResult {
  toolCallId: string
  toolName: string
  success: boolean
  result?: any
  error?: string
  executionTime?: number
}
