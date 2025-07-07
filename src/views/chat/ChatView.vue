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

      <!-- Plan-and-Execute 执行计划显示 -->
      <div
        v-if="currentPlan && planAndExecuteMode"
        class="px-6 py-4 border-t border-gray-100 bg-blue-50"
      >
        <div class="mb-3">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium text-gray-900">
              执行计划
            </h3>
            <a-tag :color="getPlanStatusColor(currentPlan.status)">
              {{ getPlanStatusText(currentPlan.status) }}
            </a-tag>
          </div>
          <p class="text-xs text-gray-600 mb-3">
            {{ currentPlan.question }}
          </p>

          <!-- 步骤列表 -->
          <div class="space-y-2">
            <div
              v-for="(step, index) in currentPlan.steps"
              :key="step.id"
              class="flex items-start gap-3 p-2 rounded-lg bg-white border"
              :class="getStepBorderClass(step.status)"
            >
              <div class="flex-shrink-0 mt-1">
                <div
                  class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                  :class="getStepIconClass(step.status)"
                >
                  <template v-if="step.status === 'completed'">
                    <CheckOutlined />
                  </template>
                  <template v-else-if="step.status === 'failed'">
                    <CloseOutlined />
                  </template>
                  <template v-else-if="step.status === 'executing'">
                    <LoadingOutlined class="animate-spin" />
                  </template>
                  <template v-else>
                    {{ index + 1 }}
                  </template>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-900 mb-1">
                  {{ step.description }}
                </p>
                <div
                  v-if="step.result"
                  class="text-xs text-gray-600 bg-gray-50 p-2 rounded"
                >
                  {{ step.result.substring(0, 100) }}{{ step.result.length > 100 ? '...' : '' }}
                </div>
                <div
                  v-if="step.error"
                  class="text-xs text-red-600 bg-red-50 p-2 rounded"
                >
                  错误: {{ step.error }}
                </div>
                <div
                  v-if="step.startTime"
                  class="text-xs text-gray-400 mt-1"
                >
                  {{ formatTime(step.startTime) }}
                  <span v-if="step.endTime"> - {{ formatTime(step.endTime) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 最终答案 -->
          <div
            v-if="currentPlan.finalAnswer"
            class="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg"
          >
            <h4 class="text-sm font-medium text-green-900 mb-2">
              最终答案
            </h4>
            <p class="text-sm text-green-800">
              {{ currentPlan.finalAnswer }}
            </p>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="px-6 py-4 border-t border-gray-100 flex-shrink-0">
        <!-- 模式切换 -->
        <div class="flex items-center gap-3 mb-3">
          <span class="text-sm text-gray-600">模式:</span>
          <a-radio-group
            v-model:value="chatMode"
            size="small"
          >
            <a-radio-button value="normal">
              普通聊天
            </a-radio-button>
            <a-radio-button value="plan-execute">
              Plan & Execute
            </a-radio-button>
          </a-radio-group>
          <a-tooltip
            v-if="chatMode === 'plan-execute'"
            title="Plan-and-Execute 模式会将复杂问题分解为多个步骤逐步执行"
          >
            <QuestionCircleOutlined class="text-gray-400" />
          </a-tooltip>
        </div>

        <div class="bg-gray-50 rounded-xl p-3 mb-3">
          <!-- :disabled="!isConnected || isSending || (planAndExecuteMode && currentPlan?.status === 'executing')" -->
          <a-textarea
            v-model:value="inputMessage"
            :placeholder="getInputPlaceholder()"
            :auto-size="{ minRows: chatMode === 'plan-execute' ? 2 : 1, maxRows: 4 }"
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
              :disabled="messages.length === 0 && !currentPlan"
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
            <a-button
              v-if="planAndExecuteMode && currentPlan?.status === 'executing'"
              size="small"
              class="text-xs"
              @click="stopPlanExecution"
            >
              停止执行
            </a-button>
          </div>
          <!-- :disabled="!isConnected || !inputMessage.trim() || (planAndExecuteMode && currentPlan?.status === 'executing')" -->
          <a-button
            type="primary"
            shape="circle"
            :loading="isSending"
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
  CheckOutlined,
  CloseOutlined,
  LoadingOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons-vue'
import {
  createDifyClient,
  loadDifyConfig,
  type ExecutionPlan,
  type DifyClient,
} from '../../utils/dify-client'

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

// Plan-and-Execute 相关
const chatMode = ref<'normal' | 'plan-execute'>('normal')
const currentPlan = ref<ExecutionPlan | null>(null)
const difyClient = ref<DifyClient | null>(null)

// SSE 连接
const eventSource: EventSource | null = null

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

const planAndExecuteMode = computed(() => chatMode.value === 'plan-execute')

// 连接 SSE
const connectSSE = () => {
  if (eventSource) {
    eventSource.close()
  }

  connectionStatus.value = 'connecting'
  isConnected.value = false

  try {
    // eventSource = new EventSource('http://localhost:3001/chat/stream')
    //
    // eventSource.onopen = () => {
    //   console.log('SSE connection opened')
    //   connectionStatus.value = 'connected'
    //   isConnected.value = true
    //   antMessage.success('已连接到聊天服务器')
    // }
    //
    // eventSource.onerror = (error) => {
    //   console.error('SSE connection error:', error)
    //   connectionStatus.value = 'disconnected'
    //   isConnected.value = false
    //   antMessage.error('连接服务器失败')
    // }
    //
    // // 监听不同类型的事件
    // eventSource.addEventListener('connected', (event) => {
    //   const data = JSON.parse(event.data)
    //   console.log('Connected:', data)
    // })
    //
    // eventSource.addEventListener('message', (event) => {
    //   const message: ChatMessage = JSON.parse(event.data)
    //   console.log('Received message:', message)
    //
    //   // 如果是流式消息的完成，清除流式显示
    //   if (streamingMessage.value && streamingMessage.value.id === message.id) {
    //     streamingMessage.value = null
    //   }
    //
    //   // 检查是否已存在该消息
    //   const existingIndex = messages.value.findIndex(m => m.id === message.id)
    //   if (existingIndex >= 0) {
    //     messages.value[existingIndex] = message
    //   } else {
    //     messages.value.push(message)
    //   }
    //
    //   scrollToBottom()
    // })
    //
    // eventSource.addEventListener('streaming', (event) => {
    //   const data: StreamingMessage = JSON.parse(event.data)
    //   console.log('Streaming:', data)
    //   streamingMessage.value = data
    //   scrollToBottom()
    // })
    //
    // eventSource.addEventListener('history', (event) => {
    //   const data = JSON.parse(event.data)
    //   console.log('History:', data)
    //   if (data.messages && Array.isArray(data.messages)) {
    //     messages.value = data.messages
    //     scrollToBottom()
    //   }
    // })
    //
    // eventSource.addEventListener('cleared', (event) => {
    //   const data = JSON.parse(event.data)
    //   console.log('Chat cleared:', data)
    //   messages.value = []
    //   streamingMessage.value = null
    //   antMessage.info('聊天记录已清空')
    // })

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

  // Plan-and-Execute 模式
  if (planAndExecuteMode.value) {
    await executePlanAndExecute(content)
    return
  }

  // 普通聊天模式
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
    // 清空本地数据
    messages.value = []
    streamingMessage.value = null
    currentPlan.value = null

    // 如果是普通聊天模式，调用服务器清空接口
    if (!planAndExecuteMode.value) {
      const response = await fetch('http://localhost:3001/chat/clear', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      console.log('Chat cleared')
    }

    antMessage.success('聊天记录已清空')
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

// Plan-and-Execute 相关方法
const initializeDifyClient = () => {
  const config = loadDifyConfig()
  if (config && config.endpoint && config.apiKey) {
    difyClient.value = createDifyClient(config)
    isConnected.value = true
    connectionStatus.value = 'connected'
  } else {
    isConnected.value = false
    connectionStatus.value = 'disconnected'
    antMessage.warning('请先在 Dify 页面配置 API 信息')
  }
}

const getInputPlaceholder = () => {
  if (!isConnected.value) {
    return '连接中，请稍候...'
  }
  if (planAndExecuteMode.value) {
    return '输入复杂问题，AI 将制定执行计划并逐步解决...'
  }
  return '在这里输入消息...'
}

const getPlanStatusColor = (status: string) => {
  switch (status) {
  case 'planning': return 'blue'
  case 'executing': return 'orange'
  case 'completed': return 'green'
  case 'failed': return 'red'
  default: return 'default'
  }
}

const getPlanStatusText = (status: string) => {
  switch (status) {
  case 'planning': return '规划中'
  case 'executing': return '执行中'
  case 'completed': return '已完成'
  case 'failed': return '执行失败'
  default: return '未知状态'
  }
}

const getStepBorderClass = (status: string) => {
  switch (status) {
  case 'executing': return 'border-blue-300 bg-blue-50'
  case 'completed': return 'border-green-300 bg-green-50'
  case 'failed': return 'border-red-300 bg-red-50'
  default: return 'border-gray-200'
  }
}

const getStepIconClass = (status: string) => {
  switch (status) {
  case 'executing': return 'bg-blue-500 text-white'
  case 'completed': return 'bg-green-500 text-white'
  case 'failed': return 'bg-red-500 text-white'
  default: return 'bg-gray-200 text-gray-600'
  }
}

const executePlanAndExecute = async (question: string) => {
  if (!difyClient.value) {
    antMessage.error('Dify 客户端未初始化')
    return
  }

  try {
    isSending.value = true

    // 添加用户消息
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: Date.now(),
    }
    messages.value.push(userMessage)

    // 执行 Plan-and-Execute
    await difyClient.value.planAndExecute(question, {
      maxSteps: 5,
      onPlanGenerated: (generatedPlan) => {
        currentPlan.value = generatedPlan
        scrollToBottom()
      },
      onStepStart: (step, plan) => {
        currentPlan.value = plan
        scrollToBottom()
      },
      onStepComplete: (step, plan) => {
        currentPlan.value = plan
        scrollToBottom()
      },
      onComplete: (completedPlan) => {
        currentPlan.value = completedPlan

        // 添加最终答案作为助手消息
        if (completedPlan.finalAnswer) {
          const assistantMessage: ChatMessage = {
            id: `assistant_${Date.now()}`,
            role: 'assistant',
            content: completedPlan.finalAnswer,
            timestamp: Date.now(),
          }
          messages.value.push(assistantMessage)
        }

        scrollToBottom()
        antMessage.success('Plan-and-Execute 执行完成')
      },
      onError: (error) => {
        console.error('Plan-and-Execute 执行失败:', error)
        antMessage.error(`执行失败: ${error.message}`)
      },
    })

  } catch (error) {
    console.error('Plan-and-Execute 执行错误:', error)
    antMessage.error('执行过程中发生错误')
  } finally {
    isSending.value = false
  }
}

const stopPlanExecution = () => {
  // 这里可以实现停止执行的逻辑
  if (currentPlan.value) {
    currentPlan.value.status = 'failed'
    antMessage.info('已停止执行')
  }
}

// 生命周期
onMounted(() => {
  // 初始化连接
  if (planAndExecuteMode.value) {
    initializeDifyClient()
  } else {
    connectSSE()
  }
})

// 监听模式切换
watch(chatMode, (newMode) => {
  if (newMode === 'plan-execute') {
    initializeDifyClient()
  } else {
    connectSSE()
  }
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
