<template>
  <div class="h-full flex flex-col bg-gray-50">
    <!--    <DatabaseTest/>-->
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
          <!-- 角色选择器 -->
          <div class="flex items-center">
            <ChatRoleSelector />
          </div>

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
        @show-search-results="handleShowSearchResults"
      />

      <!-- 搜索结果面板 -->
      <SearchResultsPanel
        v-if="showSearchResults"
        :search-results="searchResults"
        @close="showSearchResults = false"
        @result-click="handleSearchResultClick"
        @clear-results="clearSearchResults"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { message as antMessage } from 'ant-design-vue'
import { USE_PLAN_MODE, useChatStore, useRoleStore } from '@/store'
import type { MCPMessage, MCPServerStats } from './chat.type'
import { ConnectReActApi, PostChatSendApi, PostPlanCreateApi } from '@/api/chatApi'
import ChatModel from '@/views/chat/components/chatModel.vue'
import ChatMcp from '@/views/chat/components/chatMcp.vue'
import ChatModelServer from '@/views/chat/components/chatModelServer.vue'
import ChatRoleSelector from '@/views/chat/components/ChatRoleSelector.vue'
import ChatSidebar from '@/views/chat/components/ChatSidebar.vue'
import ChatArea from '@/views/chat/components/ChatArea.vue'
import SearchResultsPanel from '@/views/chat/components/SearchResultsPanel.vue'
import { CommunicationRole } from '@/views/chat/constant'

const chatStore = useChatStore()
const roleStore = useRoleStore()

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
const showSearchResults = ref(false)
const searchResults = ref<any[]>([])

// DOM 引用
const chatAreaRef = ref<InstanceType<typeof ChatArea>>()

// 计算属性
const isConnected = computed(() => true)

const usePlanMode = computed(() => chatStore.usePlanMode)

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
        contentLimited: {
          cardList: message?.message?.content?.cardList || [],
        },
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

    // 获取当前选中的角色
    const selectedRole = roleStore.selectedRole

    // 准备消息列表，如果有角色系统提示词，则添加到消息开头
    let messagesToSend = [...messages.value]
    if (selectedRole && selectedRole.systemPrompt) {
      // 检查是否已经有系统消息，如果没有则添加
      const hasSystemMessage = messagesToSend.some(msg => msg.role === CommunicationRole.SYSTEM)
      if (!hasSystemMessage) {
        const systemMessage: MCPMessage = {
          id: `system_${Date.now()}`,
          role: CommunicationRole.SYSTEM,
          content: selectedRole.systemPrompt,
          timestamp: Date.now(),
        }

        messagesToSend = [systemMessage, ...messagesToSend.map(v => ({...v}))]
      }
    }

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
      oldMessage: messagesToSend,
      content,
      conversationId: currentConversationId.value,
      metadata: {
        model: selectedModel.value.model.name,
        setting: {
          ...chatStore.assistantSettings,
        },
        service: {
          id: selectedModel.value.service.id,
          name: selectedModel.value.service.name,
          apiUrl: selectedModel.value.service.apiUrl,
          apiKey: selectedModel.value.service.apiKey,
        },
        knowledgeBase: chatStore.getKnowledgeBase,
        searchEngine: chatStore.getSearchEngine,
      },
    })

    if (!response) {
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

// 处理搜索结果点击
const handleSearchResultClick = (result: any) => {
  // 可以将搜索结果插入到聊天中或执行其他操作
  console.log('Search result clicked:', result)
}

// 清空搜索结果
const clearSearchResults = () => {
  searchResults.value = []
}

// 处理显示搜索结果
const handleShowSearchResults = () => {
  // 添加一些示例搜索结果用于演示
  if (searchResults.value.length === 0) {
    searchResults.value = [
      {
        id: '1',
        type: 'weather',
        title: '北京天气预报',
        snippet: '今天7天 8-15℃ 40℃ 雷达图 25日（今天）中雨转雷阵雨 30℃ 26日（明天）雷阵雨 32℃ 3级 27日（后天）雷阵雨 31℃',
        source: '天气预报',
        metadata: {
          weather: {
            temperature: '8-15℃',
            humidity: '65%',
            wind: '3级',
          },
        },
      },
      {
        id: '2',
        type: 'web',
        title: '北京-天气预报',
        snippet: '国家气象中心提供权威的天气预报信息，包括温度、湿度、风力等详细数据，为您的出行提供参考。',
        url: 'http://www.nmc.cn/publish/forecast/ABeijing/Beijing.html',
        source: 'www.nmc.cn',
        metadata: {
          publishTime: '2024-03-13',
          tags: ['天气', '预报', '北京', '气象', '温度'],
        },
      },
      {
        id: '3',
        type: 'ping',
        title: 'Google 网络连接测试',
        snippet: '对 google.com 进行网络连接测试，检测网络延迟和稳定性，帮助诊断网络问题。',
        metadata: {
          ping: {
            latency: 45,
            packetLoss: 0,
          },
          tags: ['网络', '测试', 'Google', '延迟'],
        },
      },
      {
        id: '4',
        type: 'knowledge',
        title: '人工智能发展历程',
        snippet: '人工智能从1956年达特茅斯会议开始，经历了多次发展浪潮，如今在深度学习推动下迎来新的突破。',
        source: '知识库',
        metadata: {
          tags: ['AI', '历史', '技术'],
        },
      },
    ]
  }

  showSearchResults.value = true
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
  scrollToBottom()

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
