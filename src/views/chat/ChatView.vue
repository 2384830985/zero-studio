<template>
  <div class="h-full flex flex-col bg-gray-50">
    <!-- 顶部状态栏 -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <h1 class="text-xl font-semibold text-gray-900">
            聊天
          </h1>
          <div class="flex items-center space-x-2">
            <div
              :class="[
                'w-2 h-2 rounded-full',
                connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
              ]"
            />
            <span class="text-sm text-gray-600">
              {{ connectionStatus === 'connected' ? '已连接' : '未连接' }}
            </span>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <!-- 模式切换按钮 -->
          <a-button
            size="small"
            :type="usePlanMode ? 'primary' : 'default'"
            @click="usePlanMode = !usePlanMode"
          >
            <template #icon>
              <BulbOutlined v-if="usePlanMode" />
              <MessageOutlined v-else />
            </template>
            {{ usePlanMode ? '计划模式' : '聊天模式' }}
          </a-button>

          <!-- 模型选择器 -->
          <a-dropdown
            v-model:open="showModelSelector"
            placement="bottomRight"
            :trigger="['click']"
          >
            <a-button size="small">
              <template #icon>
                <SettingOutlined />
              </template>
              {{ selectedModel ? `${selectedModel.service.name} - ${selectedModel.model.name}` : '选择模型' }}
            </a-button>
            <template #overlay>
              <a-menu
                class="max-h-80 overflow-y-auto"
                style="min-width: 300px;"
              >
                <template
                  v-for="service in enabledModelServices"
                  :key="service.id"
                >
                  <a-menu-item-group :title="service.name">
                    <a-menu-item
                      v-for="model in service.models.filter(m => m.enabled)"
                      :key="`${service.id}-${model.name}`"
                      @click="selectModel(service, model)"
                    >
                      <div class="flex items-center space-x-3">
                        <div
                          class="w-4 h-4 rounded-full flex-shrink-0"
                          :style="{ backgroundColor: model.color || service.color }"
                        />
                        <div class="flex-1 min-w-0">
                          <div class="text-sm font-medium text-gray-900 truncate">
                            {{ model.name }}
                          </div>
                          <div class="text-xs text-gray-500 truncate">
                            {{ model.description }}
                          </div>
                        </div>
                        <div
                          v-if="selectedModel?.service.id === service.id && selectedModel?.model.name === model.name"
                          class="text-blue-500 text-xs"
                        >
                          ✓
                        </div>
                      </div>
                    </a-menu-item>
                  </a-menu-item-group>
                </template>
                <a-menu-divider v-if="enabledModelServices.length > 0" />
                <a-menu-item @click="$router.push('/settings/model')">
                  <div class="flex items-center space-x-2 text-gray-500">
                    <SettingOutlined />
                    <span>管理模型服务</span>
                  </div>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>

          <a-button
            size="small"
            @click="showStats = !showStats"
          >
            统计信息
          </a-button>
          <a-button
            size="small"
            :disabled="!isConnected"
            @click="reconnect"
          >
            重连
          </a-button>
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
      <!-- 对话列表 -->
      <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div class="p-4 border-b border-gray-200">
          <a-button
            type="primary"
            block
            @click="startNewConversation"
          >
            <PlusOutlined />
            新建对话
          </a-button>
        </div>
        <div class="flex-1 overflow-y-auto">
          <div
            v-for="conv in conversations"
            :key="conv.id"
            :class="[
              'p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50',
              currentConversationId === conv.id ? 'bg-blue-50 border-blue-200' : ''
            ]"
            @click="switchConversation(conv.id)"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">
                  对话 {{ conv.id.slice(-8) }}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  {{ conv.messageCount }} 条消息
                </p>
              </div>
              <div class="text-xs text-gray-400">
                {{ formatTime(conv.lastActivity) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 聊天区域 -->
      <div class="flex-1 flex flex-col">
        <!-- 消息列表 -->
        <div
          ref="messagesContainer"
          class="flex-1 overflow-y-auto p-6 space-y-4"
        >
          <!-- 欢迎消息 -->
          <div
            v-if="messages.length === 0 && !streamingMessage"
            class="flex items-center justify-center h-full"
          >
            <div class="text-center">
              <RobotOutlined class="text-6xl text-gray-400 mb-4" />
              <h3 class="text-lg font-medium text-gray-900 mb-2">
                {{ usePlanMode ? '计划执行助手' : '聊天助手' }}
              </h3>
              <p class="text-gray-500">
                {{ usePlanMode ? '输入目标任务，AI 将制定详细的执行计划并逐步执行' : '支持 Streamable HTTP 协议的 MCP 服务器' }}
              </p>
            </div>
          </div>

          <!-- 消息列表 -->
          <div
            v-for="message in messages"
            :key="message.id"
            class="flex"
            :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              :class="[
                'max-w-[70%] rounded-2xl px-4 py-3',
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-200'
              ]"
            >
              <div
                class="text-sm leading-relaxed whitespace-pre-wrap"
                v-html="formatMessage(message.content)"
              />
              <div
                :class="[
                  'text-xs mt-2 opacity-70',
                  message.role === 'user' ? 'text-right text-blue-100' : 'text-left text-gray-500'
                ]"
              >
                {{ formatTime(message.timestamp) }}
                <span
                  v-if="message.metadata?.model"
                  class="ml-2"
                >
                  · {{ message.metadata.model }}
                </span>
              </div>
            </div>
          </div>

          <!-- 流式消息 -->
          <div
            v-if="streamingMessage"
            class="flex justify-start"
          >
            <div class="max-w-[70%] bg-white text-gray-800 shadow-sm border border-gray-200 rounded-2xl px-4 py-3">
              <div
                class="text-sm leading-relaxed whitespace-pre-wrap"
                v-html="formatMessage(streamingMessage.content)"
              />
              <div class="text-xs mt-2 text-gray-500 flex items-center">
                <LoadingOutlined class="mr-1" />
                正在输入...
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="border-t border-gray-200 bg-white p-4">
          <div class="bg-gray-50 rounded-xl p-3">
            <a-textarea
              v-model:value="inputMessage"
              :placeholder="usePlanMode ? '输入目标任务，AI 将制定执行计划... (Shift+Enter 换行，Enter 发送)' : '输入消息... (Shift+Enter 换行，Enter 发送)'"
              :auto-size="{ minRows: 1, maxRows: 4 }"
              class="!border-none !bg-transparent !shadow-none !p-0 text-sm"
              :disabled="!isConnected || isSending"
              @keydown="handleKeyDown"
            />
            <div class="flex justify-between items-center mt-2">
              <div class="flex gap-3">
                <PaperClipOutlined class="text-gray-400 cursor-pointer text-base hover:text-blue-500" />
                <LinkOutlined class="text-gray-400 cursor-pointer text-base hover:text-blue-500" />
                <GlobalOutlined class="text-gray-400 cursor-pointer text-base hover:text-blue-500" />
              </div>
              <div class="flex items-center gap-2">
                <a-button
                  size="small"
                  :disabled="messages.length === 0"
                  @click="clearCurrentConversation"
                >
                  清空
                </a-button>
                <a-button
                  type="primary"
                  shape="circle"
                  :loading="isSending"
                  :disabled="!isConnected || !inputMessage.trim()"
                  @click="sendMessage"
                >
                  <template #icon>
                    <ArrowUpOutlined />
                  </template>
                </a-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { message as antMessage } from 'ant-design-vue'
import {
  PlusOutlined,
  RobotOutlined,
  LoadingOutlined,
  PaperClipOutlined,
  LinkOutlined,
  GlobalOutlined,
  ArrowUpOutlined,
  SettingOutlined,
  BulbOutlined,
  MessageOutlined,
} from '@ant-design/icons-vue'
import { createSettingsStorage, STORAGE_KEYS } from '../../utils/settingsStorage'

interface MCPMessage {
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

interface MCPConversation {
  id: string
  messages: MCPMessage[]
  messageCount: number
  lastActivity: number
}

interface MCPServerStats {
  connectedClients: number
  totalConversations: number
  totalMessages: number
  port: number
  config: object
}

interface ModelService {
  id: string
  name: string
  description: string
  color: string
  enabled: boolean
  apiKey: string
  apiUrl: string
  models: ModelInfo[]
}

interface ModelInfo {
  name: string
  description: string
  enabled: boolean
  color: string
}

// 响应式数据
const messages = ref<MCPMessage[]>([])
const streamingMessage = ref<MCPMessage | null>(null)
const inputMessage = ref('')
const isSending = ref(false)
const connectionStatus = ref<'connected' | 'disconnected' | 'connecting'>('disconnected')
const currentConversationId = ref<string>('')
const conversations = ref<MCPConversation[]>([])
const serverStats = ref<MCPServerStats | null>(null)
const showStats = ref(false)
const usePlanMode = ref(false)

// 模型相关数据
const modelServices = ref<ModelService[]>([])
const selectedModel = ref<{ service: ModelService; model: ModelInfo } | null>(null)
const showModelSelector = ref(false)

// DOM 引用
const messagesContainer = ref<HTMLElement>()

// EventSource 连接
let eventSource: EventSource | null = null

// 计算属性
const isConnected = computed(() => connectionStatus.value === 'connected')

// 获取启用的模型服务
const enabledModelServices = computed(() => {
  return modelServices.value.filter(service => service.enabled && service.models.some(m => m.enabled))
})

// 格式化时间
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 格式化消息内容
const formatMessage = (content: string) => {
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 连接到 MCP 服务器
const connectToMCPServer = async () => {
  if (eventSource) {
    eventSource.close()
  }

  try {
    connectionStatus.value = 'connecting'

    const url = currentConversationId.value
      ? `http://localhost:3002/mcp/chat/stream/${currentConversationId.value}`
      : 'http://localhost:3002/mcp/chat/stream'

    eventSource = new EventSource(url)

    eventSource.onopen = () => {
      connectionStatus.value = 'connected'
      console.log('[MCP Chat] Connected to MCP server')
    }

    eventSource.onerror = (error) => {
      console.error('[MCP Chat] EventSource error:', error)
      connectionStatus.value = 'disconnected'
      antMessage.error('连接 MCP 服务器失败')
    }

    eventSource.addEventListener('connected', (event) => {
      const data = JSON.parse(event.data)
      console.log('[MCP Chat] Connected:', data)
      if (data.conversationId && !currentConversationId.value) {
        currentConversationId.value = data.conversationId
      }
    })

    eventSource.addEventListener('history', (event) => {
      const data = JSON.parse(event.data)
      console.log('[MCP Chat] History received:', data)
      if (data.messages) {
        messages.value = data.messages
        scrollToBottom()
      }
    })

    eventSource.addEventListener('message', (event) => {
      const data = JSON.parse(event.data)
      console.log('[MCP Chat] Message received:', data)

      if (data.message) {
        const existingIndex = messages.value.findIndex(m => m.id === data.message.id)
        if (existingIndex >= 0) {
          messages.value[existingIndex] = data.message
        } else {
          messages.value.push(data.message)
        }
        streamingMessage.value = null
        scrollToBottom()
      }
    })

    eventSource.addEventListener('streaming', (event) => {
      const data = JSON.parse(event.data)
      console.log('[MCP Chat] Streaming:', data)

      streamingMessage.value = {
        id: data.messageId,
        role: data.role,
        content: data.content,
        timestamp: data.timestamp,
      }
      scrollToBottom()
    })

    eventSource.addEventListener('conversation_cleared', (event) => {
      const data = JSON.parse(event.data)
      console.log('[MCP Chat] Conversation cleared:', data)
      messages.value = []
      streamingMessage.value = null
      antMessage.info('对话已清空')
    })

  } catch (error) {
    console.error('[MCP Chat] Failed to connect:', error)
    connectionStatus.value = 'disconnected'
    antMessage.error('无法连接到 MCP 服务器')
  }
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || !isConnected.value || isSending.value) {
    return
  }

  const content = inputMessage.value.trim()
  inputMessage.value = ''
  isSending.value = true

  try {
    // 构建请求元数据，包含选中的模型信息
    const metadata: any = {
      stream: true,
    }

    if (selectedModel.value) {
      metadata.model = selectedModel.value.model.name
      metadata.service = {
        id: selectedModel.value.service.id,
        name: selectedModel.value.service.name,
        apiUrl: selectedModel.value.service.apiUrl,
        apiKey: selectedModel.value.service.apiKey,
      }
    } else {
      metadata.model = 'mcp-default'
    }

    // 根据模式选择不同的 API 端点
    const apiEndpoint = usePlanMode.value
      ? 'http://localhost:3002/mcp/plan/create'
      : 'http://localhost:3002/mcp/chat/send'

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        conversationId: currentConversationId.value,
        metadata,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('[MCP Chat] Message sent:', result)

    if (result.conversationId && result.conversationId !== currentConversationId.value) {
      currentConversationId.value = result.conversationId
    }

  } catch (error) {
    console.error('[MCP Chat] Failed to send message:', error)
    antMessage.error('发送消息失败')
    inputMessage.value = content // 恢复输入内容
  } finally {
    isSending.value = false
  }
}

// 处理键盘事件
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

// 开始新对话
const startNewConversation = () => {
  currentConversationId.value = ''
  messages.value = []
  streamingMessage.value = null
  connectToMCPServer()
  loadConversations()
}

// 切换对话
const switchConversation = (conversationId: string) => {
  if (conversationId === currentConversationId.value) {
    return
  }

  currentConversationId.value = conversationId
  messages.value = []
  streamingMessage.value = null
  connectToMCPServer()
}

// 清空当前对话
const clearCurrentConversation = async () => {
  if (!currentConversationId.value) {
    return
  }

  try {
    const response = await fetch(`http://localhost:3002/mcp/conversations/${currentConversationId.value}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    console.log('[MCP Chat] Conversation cleared')
    loadConversations()
  } catch (error) {
    console.error('[MCP Chat] Failed to clear conversation:', error)
    antMessage.error('清空对话失败')
  }
}

// 重新连接
const reconnect = () => {
  connectToMCPServer()
  loadServerStats()
  loadConversations()
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

// 加载对话列表
const loadConversations = async () => {
  try {
    if (window.electronAPI && (window.electronAPI as any).invoke) {
      const convs = await (window.electronAPI as any).invoke('get-mcp-conversations')
      conversations.value = convs.sort((a: any, b: any) => b.lastActivity - a.lastActivity)
    }
  } catch (error) {
    console.error('[MCP Chat] Failed to load conversations:', error)
  }
}

// 加载模型服务配置
const loadModelServices = () => {
  try {
    const storage = createSettingsStorage(STORAGE_KEYS.MODEL_SERVICES)
    const savedData = storage.load()

    if (savedData && savedData.services && Array.isArray(savedData.services)) {
      modelServices.value = savedData.services
      console.log('[MCP Chat] 模型服务配置加载成功:', modelServices.value.length, '个服务')

      // 如果没有选中的模型，自动选择第一个启用的模型
      if (!selectedModel.value && enabledModelServices.value.length > 0) {
        const firstService = enabledModelServices.value[0]
        const firstModel = firstService.models.find(m => m.enabled)
        if (firstModel) {
          selectModel(firstService, firstModel)
        }
      }
    } else {
      console.log('[MCP Chat] 没有找到保存的模型服务配置')
    }
  } catch (error) {
    console.error('[MCP Chat] 加载模型服务配置失败:', error)
  }
}

// 选择模型
const selectModel = (service: ModelService, model: ModelInfo) => {
  selectedModel.value = { service, model }
  showModelSelector.value = false
  console.log('[MCP Chat] 选择模型:', service.name, '-', model.name)
  antMessage.success(`已选择模型: ${service.name} - ${model.name}`)
}

// 定期更新统计信息
let statsInterval: NodeJS.Timeout | null = null

onMounted(() => {
  connectToMCPServer()
  loadServerStats()
  loadConversations()
  loadModelServices()

  // 每5秒更新一次统计信息
  statsInterval = setInterval(() => {
    if (showStats.value) {
      loadServerStats()
    }
    loadConversations()
  }, 5000)
})

onUnmounted(() => {
  if (eventSource) {
    eventSource.close()
  }
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
</style>
