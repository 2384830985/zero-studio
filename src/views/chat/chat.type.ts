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
  }
}

export interface MCPConversation {
  id: string
  messages: MCPMessage[]
  messageCount: number
  lastActivity: number
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
