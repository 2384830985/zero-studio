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
    planId?: string
    error?: boolean
    executionSummary?: {
      totalSteps: number
      completedSteps: number
      failedSteps: number
      status: string
    }
  }
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
