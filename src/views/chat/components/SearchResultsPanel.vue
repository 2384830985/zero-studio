<template>
  <div class="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
    <!-- 头部 -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-gray-100 min-h-[40px]">
      <h3 class="text-sm font-medium text-gray-900 leading-none m-0">
        引用内容
      </h3>
      <a-button
        type="text"
        size="small"
        class="flex-shrink-0 !h-6 !w-6 !p-0 flex items-center justify-center"
        @click="$emit('close')"
      >
        <template #icon>
          <CloseOutlined class="!text-xs" />
        </template>
      </a-button>
    </div>

    <!-- 搜索结果列表 -->
    <div class="flex-1 overflow-y-auto px-3 pt-2 pb-3 space-y-2">
      <!-- 搜索结果项 -->
      <SearchResultCard
        v-for="(result, index) in searchResults"
        :key="result.id || index"
        :result="result"
        :index="index"
        @click="handleResultClick"
        @copy="handleResultCopy"
        @insert="handleResultInsert"
      />

      <!-- 空状态 -->
      <div
        v-if="searchResults.length === 0"
        class="flex flex-col items-center justify-center py-12 text-gray-400"
      >
        <SearchOutlined class="text-4xl mb-3" />
        <p class="text-sm">
          暂无搜索结果
        </p>
      </div>
    </div>

    <!-- 底部操作 -->
    <div class="border-t border-gray-100 px-4 py-1.5">
      <div class="flex items-center justify-between text-xs text-gray-500">
        <span>共 {{ searchResults.length }} 条结果</span>
        <a-button
          type="text"
          size="small"
          @click="clearResults"
        >
          清空
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import {
  CloseOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue'
import SearchResultCard from './SearchResultCard.vue'

// 搜索结果类型定义
interface SearchResult {
  id?: string
  type: 'weather' | 'web' | 'ping' | 'knowledge' | 'general'
  title: string
  content?: string
  snippet?: string
  url?: string
  source?: string
  metadata?: {
    weather?: {
      temperature: string
      humidity: string
      wind: string
    }
    ping?: {
      latency: number
      packetLoss: number
    }
    publishTime?: string
    tags?: string[]
    [key: string]: any
  }
}

// Props
interface Props {
  searchResults: SearchResult[]
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  'close': []
  'result-click': [result: SearchResult]
  'clear-results': []
}>()

// 处理结果点击
const handleResultClick = (result: SearchResult) => {
  emit('result-click', result)
}

// 处理结果复制
const handleResultCopy = (result: SearchResult) => {
  console.log('Result copied:', result)
}

// 处理结果插入
const handleResultInsert = (result: SearchResult) => {
  emit('result-click', result)
}

// 清空结果
const clearResults = () => {
  emit('clear-results')
}
</script>

<style scoped>
/* 自定义滚动条 */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 按钮样式优化 */
:deep(.ant-btn-sm) {
  height: 24px;
  padding: 0 6px;
  font-size: 12px;
}

:deep(.ant-btn-sm .anticon) {
  font-size: 12px;
}

/* 头部关闭按钮样式 */
:deep(.ant-btn.flex-shrink-0) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  min-width: 24px !important;
  height: 24px !important;
  padding: 0 !important;
  border: none !important;
  box-shadow: none !important;
}

:deep(.ant-btn.flex-shrink-0 .anticon) {
  font-size: 12px !important;
  line-height: 1 !important;
}
</style>
