<template>
  <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
    <!-- 标签页头部 -->
    <div class="border-b border-gray-200">
      <div class="flex">
        <div
          v-for="tab in tabs"
          :key="tab.key"
          :class="[
            'flex-1 px-4 py-3 text-center cursor-pointer text-sm font-medium transition-colors',
            activeTab === tab.key
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          ]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </div>
      </div>
    </div>

    <!-- 标签页内容 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 助手标签页 -->
      <div
        v-if="activeTab === 'assistant'"
        class="flex-1 flex flex-col"
      >
        <div class="p-4 border-b border-gray-200">
          <a-button
            type="primary"
            block
            @click="$emit('startNewConversation')"
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
            @click="$emit('switchConversation', conv.id)"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ conv.title || `对话 ${conv.id.slice(-8)}` }}
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

      <!-- 话题标签页 -->
      <div
        v-else-if="activeTab === 'topic'"
        class="flex-1 flex flex-col"
      >
        <div class="p-4 border-b border-gray-200">
          <a-button
            type="primary"
            block
            @click="createNewTopic"
          >
            <PlusOutlined />
            新建话题
          </a-button>
        </div>
        <div class="flex-1 overflow-y-auto p-4">
          <div class="text-center text-gray-500 mt-8">
            <div class="text-4xl mb-4">
              💬
            </div>
            <p>暂无话题</p>
            <p class="text-xs mt-2">
              点击上方按钮创建新话题
            </p>
          </div>
        </div>
      </div>

      <!-- 设置标签页 -->
      <div
        v-else-if="activeTab === 'settings'"
        class="flex-1 overflow-y-auto"
      >
        <ChatSettings />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { message as antMessage } from 'ant-design-vue'
import type { MCPConversation } from '../chat.type'
import ChatSettings from './ChatSettings.vue'

interface Props {
  conversations: MCPConversation[]
  currentConversationId: string
}

defineProps<Props>()

defineEmits<{
  startNewConversation: []
  switchConversation: [conversationId: string],
}>()

// 标签页数据
const tabs = [
  { key: 'assistant', label: '助手' },
  { key: 'topic', label: '话题' },
  { key: 'settings', label: '设置' },
]

const activeTab = ref('assistant')

// 格式化时间
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 创建新话题
const createNewTopic = () => {
  antMessage.info('新建话题功能开发中...')
}
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
