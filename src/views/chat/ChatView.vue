<template>
  <div class="h-full flex flex-col bg-gray-50">
    <!-- 顶部状态栏 -->
    <div class="bg-white border-b border-gray-200 px-6 py-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <h1 class="text-base font-medium text-gray-900 absolute top-3">
            聊天
          </h1>
        </div>
        <div
          class="flex items-center space-x-1"
          style="height: 32px;"
        >
          <!-- 选择模块 -->
          <div class="flex items-center">
            <ChatModel />
          </div>

          <!-- 模型选择器 -->
          <div class="flex items-center">
            <ChatModelServer />
          </div>

          <!-- MCP 选择器 -->
          <div class="flex items-center">
            <ChatMcp />
          </div>

          <div class="flex items-center">
            <a-button
              size="small"
              @click="showStats = !showStats"
            >
              统计信息
            </a-button>
          </div>
        </div>
      </div>

      <!-- 统计信息面板 -->
      <div
        v-if="showStats && serverStats"
        class="mt-4 p-4 bg-gray-50 rounded-lg"
      >
        <div class="grid grid-cols-4 gap-4 text-sm">
          <div>
            <span class="text-gray-600">连接数:</span>
            <span class="ml-2 font-medium">{{ serverStats.connectedClients }}</span>
          </div>
          <div>
            <span class="text-gray-600">对话数:</span>
            <span class="ml-2 font-medium">{{ serverStats.totalConversations }}</span>
          </div>
          <div>
            <span class="text-gray-600">消息数:</span>
            <span class="ml-2 font-medium">{{ serverStats.totalMessages }}</span>
          </div>
          <div>
            <span class="text-gray-600">端口:</span>
            <span class="ml-2 font-medium">{{ serverStats.port }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 聊天内容区域 -->
    <div class="flex-1 flex overflow-hidden">
      <!-- 左侧标签页区域 -->
      <ChatSidebar
        :conversations="conversations"
        :current-conversation-id="currentConversationId"
        @start-new-conversation="startNewConversation"
        @switch-conversation="switchConversation"
        @delete-conversation="deleteConversation"
      />

      <!-- 聊天区域 -->
      <ChatArea
        ref="chatAreaRef"
        :messages="messages"
        :streaming-message="streamingMessage"
        :use-plan-mode-name="usePlanModeName"
        :is-connected="isConnected"
        :is-sending="isSending"
        @send-message="handleSendMessage"
        @clear-conversation="clearCurrentConversation"
        @show-web-search="showWebSearchModal = true"
      />
    </div>

    <!-- 网络搜索模态框 -->
    <WebSearchModal
      v-model="showWebSearchModal"
      @search-result="handleSearchResult"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { message as antMessage } from 'ant-design-vue'
import { USE_PLAN_MODE, useChatStore, useMCPServiceStore  } from '@/store'
import type { MCPMessage, MCPServerStats } from './chat.type'
import type { SearchResult } from '@/types/webSearch'
import {ConnectReActApi, PostChatSendApi, PostPlanCreateApi} from '@/api/chatApi.ts'
import ChatModel from '@/views/chat/components/chatModel.vue'
import ChatMcp from '@/views/chat/components/chatMcp.vue'
import ChatModelServer from '@/views/chat/components/chatModelServer.vue'
import ChatSidebar from '@/views/chat/components/ChatSidebar.vue'
import ChatArea from '@/views/chat/components/ChatArea.vue'
import WebSearchModal from '@/views/chat/components/WebSearchModal.vue'

const chatStore = useChatStore()
const mcpServiceStore = useMCPServiceStore()

// MCP 相关数据
const selectedMCPServers = computed(() => chatStore.selectedMCPServers)
const usePlanModeName = computed(() => chatStore.usePlanModeName)
const selectedModel = computed(() => chatStore.selectedModel)
const currentConversationId = computed(() => chatStore.currentConversationId)
// 响应式数据
const messages = computed(() => chatStore.messages)

const streamingMessage = ref<MCPMessage | null>(null)
const isSending = ref(false)
const conversations = computed(() => chatStore.sortedConversations)
const serverStats = ref<MCPServerStats | null>(null)
const showStats = ref(false)
const showWebSearchModal = ref(false)

// DOM 引用
const chatAreaRef = ref<InstanceType<typeof ChatArea>>()

// 计算属性
const isConnected = computed(() => true)

const usePlanMode = computed(() => chatStore.usePlanMode)

// 获取启用的MCP服务器
const enabledMCPServers = computed(() => mcpServiceStore.enabledMCPServers)


// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (chatAreaRef.value) {
      chatAreaRef.value.scrollToBottom()
    }
  })
}

// 连接到 MCP 服务器
const connectToMCPServer = async () => {

  try {
    // 监听主进程的回复
    window.ipcRenderer.on('streaming', (_event, message) => {
      streamingMessage.value = {
        id: message.messageId,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
      }
      scrollToBottom()
    })
    // 监听主进程的回复
    window.ipcRenderer.on('message', (_event, message) => {
      if (message.message) {
        chatStore.spliceMessages(message.message)
        streamingMessage.value = null
        scrollToBottom()
      }
    })
  } catch (error) {
    console.error('[MCP Chat] Failed to connect:', error)
    antMessage.error('无法连接到 MCP 服务器')
  }
}

// 处理发送消息
const handleSendMessage = async (content: string) => {
  if (!content.trim() || !isConnected.value || isSending.value) {
    return
  }

  if (!selectedModel.value) {
    return antMessage.error('请选择一个请求的模型')
  }

  isSending.value = true

  try {
    console.log('messages', messages.value)

    // 根据模式选择不同的 API 端点
    const apiEndpoint = usePlanMode.value === USE_PLAN_MODE.QUEST_ANSWERS
      ? PostChatSendApi
      : usePlanMode.value === USE_PLAN_MODE.RE_ACT
        ? ConnectReActApi
        : PostPlanCreateApi

    const selectedMCPServersObj: { [key: string]: boolean } = {}
    selectedMCPServers.value.map(item => {
      selectedMCPServersObj[item] = true
    })

    const response = await apiEndpoint({
      oldMessage: messages.value,
      content,
      conversationId: currentConversationId.value,
      metadata: {
        stream: true,
        model: selectedModel.value.model.name,
        service: {
          id: selectedModel.value.service.id,
          name: selectedModel.value.service.name,
          apiUrl: selectedModel.value.service.apiUrl,
          apiKey: selectedModel.value.service.apiKey,
        },
      },
      enabledMCPServers: enabledMCPServers.value.map(item => {
        return {...item}
      }).filter(item => selectedMCPServersObj[item.id]),
    })

    if (!response.conversationId) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

  } catch (error) {
    console.error('[MCP Chat] Failed to send message:', error)
    antMessage.error('发送消息失败')
  } finally {
    isSending.value = false
  }
}

// 开始新对话
const startNewConversation = () => {
  chatStore.createNewConversation()
  streamingMessage.value = null
  connectToMCPServer()
}

// 切换对话
const switchConversation = (conversationId: string) => {
  if (conversationId === currentConversationId.value) {
    return
  }

  chatStore.switchToConversation(conversationId)
  streamingMessage.value = null
  connectToMCPServer()
}

const deleteConversation = async (conversationId: string) => {
  try {
    if (!conversationId) {
      return
    }
    chatStore.deleteConversation(conversationId)
    console.log('[MCP Chat] Conversation deleted')
  } catch (error) {
    console.error('[MCP Chat] Failed to delete conversation:', error)
    antMessage.error('删除对话失败')
  }
}

// 清空当前对话
const clearCurrentConversation = async () => {
  if (!currentConversationId.value) {
    return
  }

  try {
    chatStore.clearCurrentConversation()
    console.log('[MCP Chat] Conversation cleared')
  } catch (error) {
    console.error('[MCP Chat] Failed to clear conversation:', error)
    antMessage.error('清空对话失败')
  }
}

// 处理网络搜索结果
const handleSearchResult = (result: SearchResult) => {
  // 将搜索结果传递给聊天区域组件
  const searchInfo = `[网络搜索结果]\n标题: ${result.title}\n链接: ${result.url}\n摘要: ${result.snippet}\n\n`
  // 这里可以通过事件或其他方式将搜索结果传递给 ChatArea 组件
  console.log('Search result:', searchInfo)
}

// 加载服务器统计信息
const loadServerStats = async () => {
  try {
    if (window.electronAPI && (window.electronAPI as any).invoke) {
      const stats = await (window.electronAPI as any).invoke('get-mcp-server-stats')
      serverStats.value = stats
    }
  } catch (error) {
    console.error('[MCP Chat] Failed to load server stats:', error)
  }
}


// 定期更新统计信息
const statsInterval: NodeJS.Timeout | null = null

onMounted(() => {
  // 初始化store，确保有默认对话
  chatStore.initializeStore()

  connectToMCPServer()
  loadServerStats()

  // 每5秒更新一次统计信息
  // statsInterval = setInterval(() => {
  //   if (showStats.value) {
  //     loadServerStats()
  //   }
  //   loadConversations()
  // }, 5000)
})

onUnmounted(() => {
  if (statsInterval) {
    clearInterval(statsInterval)
  }
})
</script>

<style scoped>
/* 自定义滚动条 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 统一顶部按钮样式 */
:deep(.ant-btn-sm) {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

:deep(.ant-btn-sm .ant-btn-icon) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.ant-btn-sm .anticon) {
  display: flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}
</style>
