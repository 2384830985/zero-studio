<template>
  <div class="chat-interface">
    <div class="chat-header">
      <h2>AI 对话助手</h2>
      <div class="connection-status">
        <span :class="['status-indicator', connectionStatus]" />
        <span class="status-text">{{ connectionStatusText }}</span>
      </div>
    </div>

    <div
      ref="messagesContainer"
      class="chat-messages"
    >
      <div
        v-for="message in messages"
        :key="message.id"
        :class="['message', message.role]"
      >
        <div class="message-content">
          <div
            class="message-text"
            v-html="formatMessage(message.content)"
          />
          <div class="message-time">
            {{ formatTime(message.timestamp) }}
          </div>
        </div>
      </div>

      <!-- 流式消息显示 -->
      <div
        v-if="streamingMessage"
        class="message assistant streaming"
      >
        <div class="message-content">
          <div
            class="message-text"
            v-html="formatMessage(streamingMessage.content)"
          />
          <div class="typing-indicator">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>

    <div class="chat-input">
      <div class="input-container">
        <a-textarea
          v-model:value="inputMessage"
          :placeholder="isConnected ? '输入你的消息...' : '连接中，请稍候...'"
          :disabled="!isConnected || isSending"
          :auto-size="{ minRows: 1, maxRows: 4 }"
          class="message-input"
          @keydown="handleKeyDown"
        />
        <a-button
          type="primary"
          :loading="isSending"
          :disabled="!isConnected || !inputMessage.trim()"
          class="send-button"
          @click="sendMessage"
        >
          发送
        </a-button>
      </div>
      <div class="input-actions">
        <a-button
          size="small"
          :disabled="messages.length === 0"
          @click="clearChat"
        >
          清空对话
        </a-button>
        <a-button
          size="small"
          :disabled="isConnected"
          @click="reconnect"
        >
          重新连接
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import { message as antMessage } from 'ant-design-vue'

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
    return '已连接'
  case 'connecting':
    return '连接中...'
  case 'disconnected':
    return '未连接'
  default:
    return '未知状态'
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
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  border-radius: 8px 8px 0 0;
}

.chat-header h2 {
  margin: 0;
  color: #1890ff;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
}

.status-indicator.connected {
  background: #52c41a;
}

.status-indicator.connecting {
  background: #faad14;
  animation: pulse 1.5s infinite;
}

.status-indicator.disconnected {
  background: #ff4d4f;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-text {
  font-size: 12px;
  color: #666;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f8f9fa;
}

.message {
  margin-bottom: 16px;
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.assistant {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  position: relative;
}

.message.user .message-content {
  background: #1890ff;
  color: white;
  border-bottom-right-radius: 4px;
}

.message.assistant .message-content {
  background: white;
  color: #333;
  border: 1px solid #e8e8e8;
  border-bottom-left-radius: 4px;
}

.message.streaming .message-content {
  border-color: #1890ff;
}

.message-text {
  line-height: 1.5;
  word-wrap: break-word;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
  text-align: right;
}

.message.assistant .message-time {
  text-align: left;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #1890ff;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.chat-input {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  background: white;
  border-radius: 0 0 8px 8px;
}

.input-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
}

.send-button {
  flex-shrink: 0;
}

.input-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  justify-content: flex-end;
}
</style>
