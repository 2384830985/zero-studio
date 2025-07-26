import { AssistantSettings } from '@/store'
import {CommunicationRole, Exhibition} from '@/views/chat/constant'

interface ICard {
  type: Exhibition
  content: string
  searchContent?: string
  // MCP 工具调用相关信息
  toolCalls?: MCPToolCall[]
  toolResults?: MCPToolResult[]
}

interface IReturnObject {
  cardList: Array<ICard>
}

export interface MCPMessage {
  id: string
  role: CommunicationRole
  // 请求的数据
  content: string
  // 展示的数据
  contentLimited?: IReturnObject
  timestamp: number
  metadata?: {
    model?: string
    temperature?: number
    maxTokens?: number
    stream?: boolean
    assistantSettings?: AssistantSettings
    // MCP 工具调用相关信息
    toolCalls?: MCPToolCall[]
    toolResults?: MCPToolResult[]
  }
}

export interface Conversation {
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
