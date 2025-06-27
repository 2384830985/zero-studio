<template>
  <div class="flex h-full w-full bg-gray-100">
    <!-- 中间聊天列表 -->
    <div class="w-80 min-w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      <!-- 顶部标签 -->
      <div class="flex px-4 pt-4 border-b border-gray-100">
        <div class="px-4 py-2 cursor-pointer text-gray-600 rounded-md transition-all bg-gray-100 text-blue-500">
          助手
        </div>
        <div class="px-4 py-2 cursor-pointer text-gray-600 rounded-md transition-all hover:bg-gray-100">
          话题
        </div>
        <div class="px-4 py-2 cursor-pointer text-gray-600 rounded-md transition-all hover:bg-gray-100">
          设置
        </div>
      </div>

      <!-- 聊天项目 -->
      <div class="flex-1 p-4">
        <div class="flex items-center p-3 rounded-lg cursor-pointer mb-2 transition-all bg-blue-50">
          <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-base">
            😊
          </div>
          <div class="flex-1">
            <div class="text-sm text-gray-800">
              默认助手
            </div>
          </div>
          <div class="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
            1
          </div>
        </div>
        
        <div class="flex items-center p-3 text-gray-600 cursor-pointer rounded-lg transition-all hover:bg-gray-50">
          <PlusOutlined />
          <span class="ml-2 text-sm">添加助手</span>
        </div>
      </div>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="flex-1 flex flex-col bg-white min-w-0 overflow-hidden">
      <!-- 连接状态 -->
      <div class="px-6 py-2 border-b border-gray-100 bg-gray-50">
        <div class="flex items-center gap-2 text-sm">
          <span :class="['w-2 h-2 rounded-full', connectionStatusClass]" />
          <span class="text-gray-600">{{ connectionStatusText }}</span>
        </div>
      </div>

      <!-- 聊天内容 -->
      <div
        ref="messagesContainer"
        class="flex-1 overflow-y-auto p-6"
      >
        <!-- 欢迎消息 -->
        <div
          v-if="messages.length === 0 && !streamingMessage"
          class="flex items-center justify-center h-full"
        >
          <div class="text-gray-600 text-base text-center">
            你好，我是默认助手，你可以立刻开始跟我聊天
          </div>
        </div>

        <!-- 消息列表 -->
        <div
          v-for="message in messages"
          :key="message.id"
          class="mb-6"
        >
          <div :class="['flex', message.role === 'user' ? 'justify-end' : 'justify-start']">
            <div
              :class="['max-w-[70%] rounded-2xl px-4 py-3', 
                       message.role === 'user' 
                         ? 'bg-blue-500 text-white' 
                         : 'bg-gray-100 text-gray-800'
              ]"
            >
              <div
                class="text-sm leading-relaxed"
                v-html="formatMessage(message.content)"
              />
              <div
                :class="['text-xs mt-2 opacity-70', 
                         message.role === 'user' ? 'text-right' : 'text-left'
                ]"
              >
                {{ formatTime(message.timestamp) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 流式消息 -->
        <div
          v-if="streamingMessage"
          class="mb-6"
        >
          <div class="flex justify-start">
            <div class="max-w-[70%] rounded-2xl px-4 py-3 bg-gray-100 text-gray-800 border-2 border-blue-200">
              <div
                class="text-sm leading-relaxed"
                v-html="formatMessage(streamingMessage.content)"
              />
              <div class="flex items-center gap-1 mt-2">
                <div class="typing-indicator">
                  <span />
                  <span />
                  <span />
                </div>
                <span class="text-xs text-gray-500 ml-2">正在输入...</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="px-6 py-4 border-t border-gray-100 flex-shrink-0">
        <div class="bg-gray-50 rounded-xl p-3 mb-3">
          <a-textarea
            v-model:value="inputMessage"
            :placeholder="isConnected ? '在这里输入消息...' : '连接中，请稍候...'"
            :disabled="!isConnected || isSending"
            :auto-size="{ minRows: 1, maxRows: 4 }"
            class="!border-none !bg-transparent !shadow-none !p-0 text-sm"
            @keydown="handleKeyDown"
          />
          <div class="flex gap-3 mt-2">
            <PaperClipOutlined class="text-gray-400 cursor-pointer text-base transition-colors hover:text-blue-500" />
            <LinkOutlined class="text-gray-400 cursor-pointer text-base transition-colors hover:text-blue-500" />
            <AudioOutlined class="text-gray-400 cursor-pointer text-base transition-colors hover:text-blue-500" />
            <GlobalOutlined class="text-gray-400 cursor-pointer text-base transition-colors hover:text-blue-500" />
            <FileImageOutlined class="text-gray-400 cursor-pointer text-base transition-colors hover:text-blue-500" />
            <VideoCameraOutlined class="text-gray-400 cursor-pointer text-base transition-colors hover:text-blue-500" />
            <UserOutlined class="text-gray-400 cursor-pointer text-base transition-colors hover:text-blue-500" />
            <ClockCircleOutlined class="text-gray-400 cursor-pointer text-base transition-colors hover:text-blue-500" />
          </div>
        </div>
        <div class="flex justify-between items-center">
          <div class="flex gap-2">
            <TranslationOutlined class="text-gray-400 cursor-pointer text-base hover:text-blue-500" />
            <a-button
              size="small"
              :disabled="messages.length === 0"
              class="text-xs"
              @click="clearChat"
            >
              清空
            </a-button>
            <a-button
              size="small"
              :disabled="isConnected"
              class="text-xs"
              @click="reconnect"
            >
              重连
            </a-button>
          </div>
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
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import { message as antMessage } from 'ant-design-vue'
import {
  PlusOutlined,
  PaperClipOutlined,
  LinkOutlined,
  AudioOutlined,
  GlobalOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  UserOutlined,
  ClockCircleOutlined,
  TranslationOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons-vue'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface StreamingMessage {
  id: string
  role: 'assistant'
  content: string
  timestamp: number
  isComplete: boolean
}

// 响应式数据
const messages = ref<ChatMessage[]>([])
const streamingMessage = ref<StreamingMessage | null>(null)
const inputMessage = ref('')
const isSending = ref(false)
const isConnected = ref(false)
const connectionStatus = ref<'connected' | 'connecting' | 'disconnected'>('disconnected')
const messagesContainer = ref<HTMLElement>()

// SSE 连接
let eventSource: EventSource | null = null

// 计算属性
const connectionStatusText = computed(() => {
  switch (connectionStatus.value) {
  case 'connected':
    return '已连接到服务器'
  case 'connecting':
    return '正在连接服务器...'
  case 'disconnected':
    return '服务器连接断开'
  default:
    return '未知状态'
  }
})

const connectionStatusClass = computed(() => {
  switch (connectionStatus.value) {
  case 'connected':
    return 'bg-green-500'
  case 'connecting':
    return 'bg-yellow-500 animate-pulse'
  case 'disconnected':
    return 'bg-red-500'
  default:
    return 'bg-gray-400'
  }
})

// 连接 SSE
const connectSSE = () => {
  if (eventSource) {
    eventSource.close()
  }

  connectionStatus.value = 'connecting'
  isConnected.value = false

  try {
    eventSource = new EventSource('http://localhost:3001/chat/stream')

    eventSource.onopen = () => {
      console.log('SSE connection opened')
      connectionStatus.value = 'connected'
      isConnected.value = true
      antMessage.success('已连接到聊天服务器')
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      connectionStatus.value = 'disconnected'
      isConnected.value = false
      antMessage.error('连接服务器失败')
    }

    // 监听不同类型的事件
    eventSource.addEventListener('connected', (event) => {
      const data = JSON.parse(event.data)
      console.log('Connected:', data)
    })

    eventSource.addEventListener('message', (event) => {
      const message: ChatMessage = JSON.parse(event.data)
      console.log('Received message:', message)
      
      // 如果是流式消息的完成，清除流式显示
      if (streamingMessage.value && streamingMessage.value.id === message.id) {
        streamingMessage.value = null
      }
      
      // 检查是否已存在该消息
      const existingIndex = messages.value.findIndex(m => m.id === message.id)
      if (existingIndex >= 0) {
        messages.value[existingIndex] = message
      } else {
        messages.value.push(message)
      }
      
      scrollToBottom()
    })

    eventSource.addEventListener('streaming', (event) => {
      const data: StreamingMessage = JSON.parse(event.data)
      console.log('Streaming:', data)
      streamingMessage.value = data
      scrollToBottom()
    })

    eventSource.addEventListener('history', (event) => {
      const data = JSON.parse(event.data)
      console.log('History:', data)
      if (data.messages && Array.isArray(data.messages)) {
        messages.value = data.messages
        scrollToBottom()
      }
    })

    eventSource.addEventListener('cleared', (event) => {
      const data = JSON.parse(event.data)
      console.log('Chat cleared:', data)
      messages.value = []
      streamingMessage.value = null
      antMessage.info('聊天记录已清空')
    })

  } catch (error) {
    console.error('Failed to create SSE connection:', error)
    connectionStatus.value = 'disconnected'
    isConnected.value = false
    antMessage.error('无法连接到服务器')
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
    const response = await fetch('http://localhost:3001/chat/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('Message sent:', result)
  } catch (error) {
    console.error('Failed to send message:', error)
    antMessage.error('发送消息失败')
    // 恢复输入内容
    inputMessage.value = content
  } finally {
    isSending.value = false
  }
}

// 清空聊天
const clearChat = async () => {
  try {
    const response = await fetch('http://localhost:3001/chat/clear', {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    console.log('Chat cleared')
  } catch (error) {
    console.error('Failed to clear chat:', error)
    antMessage.error('清空聊天失败')
  }
}

// 重新连接
const reconnect = () => {
  connectSSE()
}

// 处理键盘事件
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 格式化消息内容
const formatMessage = (content: string) => {
  return content.replace(/\n/g, '<br>')
}

// 格式化时间
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// 生命周期
onMounted(() => {
  connectSSE()
})

onUnmounted(() => {
  if (eventSource) {
    eventSource.close()
  }
})

// 监听消息变化，自动滚动
watch(messages, () => {
  scrollToBottom()
}, { deep: true })
</script>

<style scoped>
.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3b82f6;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { 
  animation-delay: -0.32s; 
}

.typing-indicator span:nth-child(2) { 
  animation-delay: -0.16s; 
}

@keyframes typing {
  0%, 80%, 100% { 
    transform: scale(0); 
  }
  40% { 
    transform: scale(1); 
  }
}
</style>
