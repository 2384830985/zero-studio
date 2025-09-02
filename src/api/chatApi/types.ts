import {AssistantSettings} from '@/store'
import type {MCPMessage} from '@/views/chat/chat.type.ts'
import {KnowledgeBase} from '@/types/knowledge.ts'

export interface IChatServiceConfig {
  id: string
  name: string,
  apiUrl: string,
  apiKey: string,
}

export interface IChatParams {
  oldMessage: MCPMessage[]
  content: string
  conversationId: string
  metadata: Partial<{
    model: string,
    setting: AssistantSettings,
    service: IChatServiceConfig,
    knowledgeBase?: KnowledgeBase,
    searchEngine?: string,
  }>
}
