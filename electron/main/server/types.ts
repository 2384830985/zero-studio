import { CommunicationRole } from '../mcp'
import {IMetadata} from './llm'

export type IMessageMetadata = Partial<IMetadata> & {
  // MCP 工具调用相关信息
  toolCalls?: MCPToolCall[] | undefined
  toolResults?: MCPToolResult[] | undefined
}

export interface MCPMessage {
  id: string
  role: CommunicationRole
  content: string
  timestamp: number
  metadata?: IMessageMetadata
}

export interface MCPStreamChunk {
  id: string
  object: 'chat.completion.chunk'
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: string
      content?: string
    }
    finish_reason?: string | null
  }>
}

export interface MCPServerInfo {
  id: string
  name: string
  description?: string
  version?: string
  status: 'active' | 'inactive' | 'error'
  endpoint?: string
  capabilities?: string[]
  lastActivity?: number
}

export interface MCPServerConfig {
  port: number
  enableCors?: boolean
  maxConnections?: number
  streamingEnabled?: boolean
  enabledMCPServers?: MCPServerInfo[]
  AIGC?: {
    apiUrl?: string
    appId: string
    defaultModel?: string
  }
}

export interface StreamingData {
  conversationId: string
  messageId: string
  role: string
  content: string
  timestamp: number
  isComplete?: boolean
}

export interface ConversationSummary {
  id: string
  messageCount: number
  lastMessage: MCPMessage
  createdAt: number
}

export interface ServerStats {
  totalConversations: number
  totalMessages: number
  port: number
  config: MCPServerConfig
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
