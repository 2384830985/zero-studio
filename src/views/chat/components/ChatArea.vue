<template>
  <div class="flex-1 flex flex-col">
    <!-- 消息列表 -->
    <div
      ref="messagesContainer"
      class="flex-1 overflow-y-auto px-4 py-4 space-y-3"
    >
      <!-- 欢迎消息 -->
      <div
        v-if="messages.length === 0 && !streamingMessage"
        class="flex items-center justify-center h-full"
      >
        <div class="text-center">
          <RobotOutlined class="text-6xl text-gray-400 mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            {{ usePlanModeName }}
          </h3>
          <p class="text-gray-500">
            {{ usePlanModeName }}
          </p>
        </div>
      </div>

      <!-- 消息列表 -->
      <div
        v-for="message in messages"
        :key="message.id"
        class="flex"
        :class="message.role === CommunicationRole.USER ? 'justify-end pr-2' : 'justify-start pl-2'"
      >
        <div
          :class="[
            'max-w-[70%] rounded-2xl px-4 py-3',
            message.role === CommunicationRole.USER
              ? 'bg-blue-500 text-white mr-2'
              : 'bg-white text-gray-800 shadow-sm border border-gray-200 ml-2'
          ]"
        >
          <template
            v-if="!!message?.contentLimited?.cardList?.length"
          >
            <template
              v-for="card in message?.contentLimited?.cardList"
              :key="`${card.type}_${Date.now()}`"
            >
              <div
                v-if="card.content"
                class="text-sm leading-relaxed mb-2"
                v-html="formatMessage(card.content)"
              />
              <!-- MCP 工具调用显示 -->
              <MCPToolDisplay
                v-if="card.type === Exhibition.TOOLS"
                :tool-calls="card.toolCalls"
                :tool-results="card.toolResults"
                class="mb-3"
              />
            </template>
          </template>
          <div
            v-else
            class="text-sm leading-relaxed mb-2"
            v-html="formatMessage(message.content)"
          />
          <div
            :class="[
              'text-xs mt-2 opacity-70',
              message.role === CommunicationRole.USER ? 'text-right text-blue-100' : 'text-left text-gray-500'
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
        class="flex justify-start pl-2"
      >
        <div class="max-w-[70%] bg-white text-gray-800 shadow-sm border border-gray-200 rounded-2xl px-4 py-3 ml-2">
          <div
            class="text-sm leading-relaxed mb-2"
            v-html="formatMessage(streamingMessage.content)"
          />
          <!-- MCP 工具调用显示 -->
          <MCPToolDisplay
            v-if="streamingMessage.metadata?.toolCalls || streamingMessage.metadata?.toolResults"
            :tool-calls="streamingMessage.metadata?.toolCalls"
            :tool-results="streamingMessage.metadata?.toolResults"
            class="mb-3"
          />
          <div class="text-xs mt-2 text-gray-500 flex items-center">
            <LoadingOutlined class="mr-1" />
            正在输入...
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="border-t border-gray-200 bg-white px-4 py-3">
      <div class="bg-gray-50 rounded-xl p-3">
        <a-textarea
          v-model:value="inputMessage"
          :placeholder="usePlanModeName"
          :auto-size="{ minRows: 1, maxRows: 4 }"
          class="!border-none !bg-transparent !shadow-none !p-0 text-sm"
          :disabled="!isConnected || isSending"
          @keydown="handleKeyDown"
        />
        <div class="flex justify-between items-center mt-2">
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-2">
              <div
                class="w-5 h-5 flex items-center justify-center text-gray-400 cursor-pointer hover:text-blue-500 transition-colors duration-200"
                title="附件"
              >
                <PaperClipOutlined style="font-size: 16px;" />
              </div>
              <div
                class="w-5 h-5 flex items-center justify-center text-gray-400 cursor-pointer hover:text-blue-500 transition-colors duration-200"
                title="链接"
              >
                <LinkOutlined style="font-size: 16px;" />
              </div>
              <div
                class="w-5 h-5 flex items-center justify-center text-gray-400 cursor-pointer hover:text-blue-500 transition-colors duration-200"
                title="网络搜索"
                @click="$emit('show-web-search')"
              >
                <GlobalOutlined style="font-size: 16px;" />
              </div>
              <div
                class="w-5 h-5 flex items-center justify-center text-gray-400 cursor-pointer hover:text-purple-500 transition-colors duration-200"
                title="显示搜索结果"
                @click="$emit('show-search-results')"
              >
                <SearchOutlined style="font-size: 16px;" />
              </div>
            </div>
            <!-- 知识库选择器 -->
            <div class="flex items-center">
              <KnowledgeBaseSelector @knowledge-base-changed="handleKnowledgeBaseChanged" />
            </div>
            <!-- 执行环境组件 -->
            <div class="flex items-center">
              <ExecutionEnvironment />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <a-button
              size="small"
              :disabled="messages.length === 0"
              @click="handleClearConversation"
            >
              清空
            </a-button>
            <a-button
              type="primary"
              shape="circle"
              :loading="isSending"
              :disabled="!isConnected || !inputMessage.trim()"
              @click="handleSendMessage"
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
</template>

<script setup lang="ts">
import {defineEmits, defineProps, nextTick, ref} from 'vue'
import {Modal} from 'ant-design-vue'
import {
  ArrowUpOutlined,
  GlobalOutlined,
  LinkOutlined,
  LoadingOutlined,
  PaperClipOutlined,
  RobotOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue'
import ExecutionEnvironment from '@/components/common/ExecutionEnvironment.vue'
import KnowledgeBaseSelector from '@/components/common/KnowledgeBaseSelector.vue'
import MCPToolDisplay from './MCPToolDisplay.vue'
import type {MCPMessage} from '../chat.type'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import mermaid from 'mermaid'
import {CommunicationRole, Exhibition} from '@/views/chat/constant'

// Props 定义
interface Props {
  messages: MCPMessage[]
  streamingMessage: MCPMessage | null
  usePlanModeName: string
  isConnected: boolean
  isSending: boolean
}

const props = defineProps<Props>()

// Emits 定义
const emit = defineEmits<{
  'send-message': [content: string]
  'clear-conversation': []
  'show-web-search': []
  'show-search-results': []
}>()

// 响应式数据
const inputMessage = ref('')
const messagesContainer = ref<HTMLElement>()

// 初始化 Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'inherit',
})

// 初始化 markdown-it 实例
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: function (str: string, lang: string): string {
    console.log('lang', lang, str)
    // 处理 Mermaid 图表
    if (lang === 'mermaid') {
      const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      // 延迟渲染 Mermaid
      nextTick(() => {
        const element = document.getElementById(id)
        if (element) {
          mermaid.render(`mermaid-svg-${id}`, str).then(({ svg }) => {
            element.innerHTML = svg
          }).catch((error) => {
            console.error('Mermaid rendering error:', error)
            element.innerHTML = `<pre style="padding: 0!important;"><code>${md.utils.escapeHtml(str)}</code></pre>`
          })
        }
      })
      return `<div id="${id}" class="mermaid-container"></div>`
    }

    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
               hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
               '</code></pre>'
      } catch {
        // 忽略错误，使用默认处理
      }
    }

    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>'
  },
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
  if (typeof content !== 'string') {
    return '返回数据错误'
  }
  return md.render(content)
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 处理发送消息
const handleSendMessage = () => {
  if (!inputMessage.value.trim() || !props.isConnected || props.isSending) {
    return
  }

  const content = inputMessage.value.trim()
  // 先清空输入框，再发送消息，避免数据丢失
  inputMessage.value = ''
  emit('send-message', content)
}

// 处理键盘事件
const handleKeyDown = (event: KeyboardEvent) => {
  const isEnterPressed = event.key === 'Enter'
  if (isEnterPressed && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault()

    // 直接从事件目标获取当前输入值，避免响应式延迟问题
    const target = event.target as HTMLTextAreaElement
    const currentValue = target.value.trim()

    if (!currentValue || !props.isConnected || props.isSending) {
      return
    }

    // 立即清空输入框和响应式变量
    target.value = ''
    inputMessage.value = ''

    // 发送消息
    emit('send-message', currentValue)
  }
}

// 处理知识库变更
const handleKnowledgeBaseChanged = (kb: any) => {
  console.log('知识库已变更:', kb)
  // 这里可以添加知识库变更后的处理逻辑
  // 比如更新聊天上下文、显示提示信息等
}

// 处理清空对话
const handleClearConversation = () => {
  Modal.confirm({
    title: '确认清空对话',
    content: '确定要清空当前对话的所有消息吗？此操作不可撤销。',
    okText: '确定',
    cancelText: '取消',
    okType: 'danger',
    onOk() {
      emit('clear-conversation')
    },
  })
}

// 暴露滚动到底部方法
defineExpose({
  scrollToBottom,
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

/* Markdown 样式 */
:deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
  font-weight: 600;
  margin: 1em 0 0.5em 0;
  line-height: 1.3;
  color: #1f2937;
}

:deep(h1) {
  font-size: 1.5em;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.3em;
}
:deep(h2) {
  font-size: 1.3em;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 0.2em;
}
:deep(h3) {
  font-size: 1.15em;
  color: #374151;
}

:deep(p) {
  margin: 0.6em 0;
  line-height: 1.6;
}

:deep(p:first-child) {
  margin-top: 0;
}

:deep(p:last-child) {
  margin-bottom: 0;
}

/* 行内代码 */
:deep(code:not(pre code)) {
  background-color: #f1f5f9;
  color: #e11d48;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', monospace;
  font-size: 0.85em;
  font-weight: 500;
}

/* 代码块 */
:deep(pre) {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.25rem;
  overflow-x: auto;
  margin: 1rem 0;
  font-size: 0.875em;
  line-height: 1.5;
}

:deep(pre code) {
  background-color: transparent;
  color: inherit;
  padding: 0;
  border-radius: 0;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', monospace;
  font-weight: normal;
}

/* highlight.js 样式覆盖 */
:deep(.hljs) {
  background: #f8fafc !important;
  color: #334155;
  padding-left: 1rem !important;
  padding-right: 1rem !important;
  padding-top: 0.5rem !important;
  padding-bottom: .5rem !important;
}

:deep(blockquote) {
  border-left: 3px solid #e2e8f0;
  padding-left: 1rem;
  margin: 0.75em 0;
  color: #64748b;
  font-style: italic;
}

:deep(ul), :deep(ol) {
  margin: 0.5em 0 !important;
  padding-left: 1.25rem;
}

:deep(li) {
  margin: 0.15em 0 !important;
  margin-bottom: 0.15em !important;
  padding: 0;
  line-height: 1.5;
}

:deep(a) {
  color: #2563eb;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;
}

:deep(a:hover) {
  color: #1d4ed8;
  border-bottom-color: #1d4ed8;
}

:deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.75em 0;
  font-size: 0.9em;
}

:deep(th), :deep(td) {
  border: 1px solid #e2e8f0;
  padding: 0.5rem 0.75rem;
  text-align: left;
}

:deep(th) {
  background-color: #f8fafc;
  font-weight: 600;
  color: #374151;
}

:deep(tr:nth-child(even)) {
  background-color: #f9fafb;
}

/* Mermaid 图表样式 */
:deep(.mermaid-container) {
  margin: 1rem 0;
  text-align: center;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
}

:deep(.mermaid-container svg) {
  max-width: 100%;
  height: auto;
}

/* 减少第一个和最后一个元素的边距 */
:deep(*:first-child) {
  margin-top: 0 !important;
}

:deep(*:last-child) {
  margin-bottom: 0 !important;
}
</style>
