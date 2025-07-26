import {AssistantSettings} from '@/store'
import type {MCPMessage} from '@/views/chat/chat.type.ts'

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
  metadata: {
    model: string,
    setting: AssistantSettings,
    service: IChatServiceConfig,
  }
}
