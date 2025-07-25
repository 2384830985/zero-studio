import { defineStore } from 'pinia'
import type {MCPMessage, ModelInfo, ModelService, MCPConversation} from '@/views/chat/chat.type.ts'

export enum USE_PLAN_MODE {
  // 问答模式
  QUEST_ANSWERS = 'QUEST_ANSWERS',
  // 计划模式
  PLAN_NING_MODE = 'PLAN_NING_MODE',
  // ReACT 模式
  RE_ACT = 'RE_ACT'
}

export interface IUsePlanMode {
  name: string,
  value: USE_PLAN_MODE
}

// 助手设置接口
export interface AssistantSettings {
  modelTemperature: number
  contextCount: number
  streamOutput: boolean
  maxTokens: number
}

interface IIseChatStore {
  UsePlanModeList: IUsePlanMode[],
  usePlanMode: USE_PLAN_MODE,
  selectedMCPServers: string[],
  // 当前活跃的对话ID
  currentConversationId: string,
  // 所有对话的映射表
  conversations: Record<string, MCPConversation>,
  // 对话列表（按时间排序）
  conversationList: string[],
  selectedModel?: {
    service: ModelService,
    model: ModelInfo
  },
  // 助手设置
  assistantSettings: AssistantSettings
}

const UsePlanModeList: IUsePlanMode[] = [
  {
    name: '问答模式',
    value: USE_PLAN_MODE.QUEST_ANSWERS,
  },
  {
    name: '计划模式',
    value: USE_PLAN_MODE.PLAN_NING_MODE,
  },
  {
    name: 'ReAct',
    value: USE_PLAN_MODE.RE_ACT,
  },
]

// 生成对话ID的工具函数
const generateConversationId = (): string => {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const useChatStore = defineStore('chat', {
  state(): IIseChatStore {
    return {
      UsePlanModeList,
      usePlanMode: USE_PLAN_MODE.QUEST_ANSWERS,
      selectedMCPServers: [],
      currentConversationId: '',
      conversations: {},
      conversationList: [],
      selectedModel: undefined,
      // 助手设置默认值
      assistantSettings: {
        modelTemperature: 0.7,
        contextCount: 10,
        streamOutput: true,
        maxTokens: 2000,
      },
    }
  },
  getters: {
    usePlanModeName (state) {
      return state.UsePlanModeList?.find(usePlan => usePlan.value === state.usePlanMode)?.name || ''
    },
    // 获取当前对话的消息列表
    messages (state) {
      if (!state.currentConversationId || !state.conversations[state.currentConversationId]) {
        return []
      }
      return state.conversations[state.currentConversationId].messages
    },
    // 获取当前对话信息
    currentConversation (state) {
      if (!state.currentConversationId) {
        return null
      }
      return state.conversations[state.currentConversationId] || null
    },
    // 获取所有对话列表（按最后活动时间排序）
    sortedConversations (state) {
      return state.conversationList
        .map(id => state.conversations[id])
        .filter(Boolean)
        .sort((a, b) => b.lastActivity - a.lastActivity)
    },
  },
  actions: {
    selectUsePlanMode (value: USE_PLAN_MODE){
      this.usePlanMode = value
    },
    selectSettingModel (service: ModelService, model: ModelInfo) {
      this.selectedModel = { service, model }
    },

    // 创建新对话
    createNewConversation (title?: string): string {
      const conversationId = generateConversationId()
      const now = Date.now()

      const conversation: MCPConversation = {
        id: conversationId,
        title: title || '新对话',
        messages: [],
        messageCount: 0,
        lastActivity: now,
        createdAt: now,
      }

      this.conversations[conversationId] = conversation
      this.conversationList.unshift(conversationId)
      this.currentConversationId = conversationId

      return conversationId
    },

    // 切换到指定对话
    switchToConversation (conversationId: string) {
      if (this.conversations[conversationId]) {
        this.currentConversationId = conversationId
        // 更新最后活动时间
        this.conversations[conversationId].lastActivity = Date.now()
      }
    },

    // 删除对话
    deleteConversation (conversationId: string) {
      if (this.conversations[conversationId]) {
        delete this.conversations[conversationId]
        const index = this.conversationList.indexOf(conversationId)
        if (index > -1) {
          this.conversationList.splice(index, 1)
        }

        // 如果删除的是当前对话，切换到最新的对话或创建新对话
        if (this.currentConversationId === conversationId) {
          if (this.conversationList.length > 0) {
            this.currentConversationId = this.conversationList[0]
          } else {
            this.createNewConversation()
          }
        }
      }
    },

    // 更新对话标题
    updateConversationTitle (conversationId: string, title: string) {
      if (this.conversations[conversationId]) {
        this.conversations[conversationId].title = title
        this.conversations[conversationId].lastActivity = Date.now()
      }
    },

    // 清空当前对话的消息
    clearCurrentConversation () {
      if (this.currentConversationId && this.conversations[this.currentConversationId]) {
        this.conversations[this.currentConversationId].messages = []
        this.conversations[this.currentConversationId].messageCount = 0
        this.conversations[this.currentConversationId].lastActivity = Date.now()
      }
    },

    // 添加消息到当前对话
    pushMessage (message: MCPMessage) {
      if (!this.currentConversationId) {
        this.createNewConversation()
      }

      const conversation = this.conversations[this.currentConversationId]
      if (conversation) {
        conversation.messages.push(message)
        conversation.messageCount = conversation.messages.length
        conversation.lastActivity = Date.now()

        // 如果是第一条用户消息，可以用它来生成对话标题
        if (conversation.messages.length === 1 && message.role === 'user') {
          const title = message.content.length > 30
            ? message.content.substring(0, 30) + '...'
            : message.content
          conversation.title = title
        }
      }
    },

    // 更新指定消息
    updateMessage (messageId: string, updatedMessage: MCPMessage) {
      if (!this.currentConversationId) {
        return
      }

      const conversation = this.conversations[this.currentConversationId]
      if (conversation) {
        const index = conversation.messages.findIndex(m => m.id === messageId)
        if (index > -1) {
          conversation.messages[index] = updatedMessage
          conversation.lastActivity = Date.now()
        }
      }
    },

    // 替换消息（用于流式更新）
    spliceMessages (message: MCPMessage) {
      if (!this.currentConversationId) {
        return
      }

      const conversation = this.conversations[this.currentConversationId]
      if (conversation) {
        const index = conversation.messages.findIndex(m => m.id === message.id)
        if (index > -1) {
          conversation.messages[index] = message
        } else {
          conversation.messages.push(message)
          conversation.messageCount = conversation.messages.length
        }
        conversation.lastActivity = Date.now()
      }
    },

    // 获取指定对话的消息
    getConversationMessages (conversationId: string): MCPMessage[] {
      return this.conversations[conversationId]?.messages || []
    },

    // 清空所有对话
    clearAllConversations () {
      this.conversations = {}
      this.conversationList = []
      this.currentConversationId = ''
    },

    toggleMCPServer (serverId: string){
      const index = this.selectedMCPServers.indexOf(serverId)
      if (index > -1) {
        this.selectedMCPServers.splice(index, 1)
      } else {
        this.selectedMCPServers.push(serverId)
      }
      return index
    },

    // 更新助手设置
    updateAssistantSettings(settings: Partial<AssistantSettings>) {
      this.assistantSettings = {
        ...this.assistantSettings,
        ...settings,
      }
    },

    // 重置助手设置
    resetAssistantSettings() {
      this.assistantSettings = {
        modelTemperature: 0.7,
        contextCount: 10,
        streamOutput: true,
        maxTokens: 2000,
      }
    },

    // 初始化store时确保有一个默认对话
    initializeStore () {
      if (this.conversationList.length === 0) {
        this.createNewConversation()
      } else if (!this.currentConversationId && this.conversationList.length > 0) {
        this.currentConversationId = this.conversationList[0]
      }
    },
  },
  // 这是按照插件的文档，在实例上启用了该插件，这个选项是插件特有的
  persist: true,
})
