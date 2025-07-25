<template>
  <div
    class="bg-white rounded-lg p-2.5 hover:bg-gray-50 transition-all duration-200 cursor-pointer border border-gray-100 hover:border-gray-200 hover:shadow-sm"
    @click="$emit('click', result)"
  >
    <!-- 结果头部 -->
    <div class="flex items-start justify-between mb-1.5">
      <div class="flex items-center gap-2 flex-1">
        <!-- 结果类型图标 -->
        <div
          class="w-4 h-4 rounded flex items-center justify-center text-white text-xs flex-shrink-0"
          :class="getResultTypeClass(result.type)"
        >
          <component :is="getResultIcon(result.type)" />
        </div>

        <!-- 标题和来源 -->
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-medium text-gray-900 truncate leading-tight">
            {{ result.title }}
          </h4>
          <p class="text-xs text-gray-500 truncate mt-0.5">
            {{ result.source || getSourceFromUrl(result.url) }}
          </p>
        </div>

        <!-- 序号 -->
        <span class="text-xs text-gray-400 font-medium flex-shrink-0 bg-gray-100 px-1.5 py-0.5 rounded">
          {{ index + 1 }}
        </span>
      </div>
    </div>

    <!-- 内容摘要 -->
    <div class="text-sm text-gray-600 leading-relaxed mb-1.5">
      <p class="line-clamp-2">
        {{ result.snippet || result.content }}
      </p>
    </div>

    <!-- 特殊内容展示 -->
    <div
      v-if="result.metadata"
      class="space-y-1.5"
    >
      <!-- 天气信息 -->
      <WeatherInfo
        v-if="result.type === 'weather' && result.metadata.weather"
        :weather="result.metadata.weather"
      />

      <!-- Ping 信息 -->
      <PingInfo
        v-if="result.type === 'ping' && result.metadata.ping"
        :ping="result.metadata.ping"
      />

      <!-- 网络搜索信息 -->
      <div
        v-if="result.type === 'web' && result.metadata.publishTime"
        class="text-xs text-gray-500 flex items-center"
      >
        <CalendarOutlined class="mr-1" />
        {{ formatTime(result.metadata.publishTime) }}
      </div>

      <!-- 标签 -->
      <div
        v-if="result.metadata.tags && result.metadata.tags.length > 0"
        class="flex flex-wrap gap-1"
      >
        <span
          v-for="tag in result.metadata.tags.slice(0, 2)"
          :key="tag"
          class="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded"
        >
          {{ tag }}
        </span>
        <span
          v-if="result.metadata.tags.length > 2"
          class="px-1.5 py-0.5 bg-gray-50 text-gray-500 text-xs rounded"
        >
          +{{ result.metadata.tags.length - 2 }}
        </span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex items-center justify-end gap-1 mt-1.5 pt-1.5 border-t border-gray-100">
      <a-button
        v-if="result.url"
        type="text"
        size="small"
        class="text-xs h-6"
        @click.stop="openUrl(result.url)"
      >
        <template #icon>
          <LinkOutlined />
        </template>
        访问
      </a-button>
      <a-button
        type="text"
        size="small"
        class="text-xs h-6"
        @click.stop="copyResult(result)"
      >
        <template #icon>
          <CopyOutlined />
        </template>
        复制
      </a-button>
      <a-button
        type="text"
        size="small"
        class="text-xs h-6"
        @click.stop="insertToChat(result)"
      >
        <template #icon>
          <PlusOutlined />
        </template>
        引用
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import { message as antMessage } from 'ant-design-vue'
import {
  LinkOutlined,
  CopyOutlined,
  PlusOutlined,
  CalendarOutlined,
  CloudOutlined,
  GlobalOutlined,
  WifiOutlined,
  FileTextOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue'
import WeatherInfo from './WeatherInfo.vue'
import PingInfo from './PingInfo.vue'

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
  result: SearchResult
  index: number
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  'click': [result: SearchResult]
  'copy': [result: SearchResult]
  'insert': [result: SearchResult]
}>()

// 获取结果类型对应的样式类
const getResultTypeClass = (type: string) => {
  const classMap: Record<string, string> = {
    weather: 'bg-blue-500',
    web: 'bg-green-500',
    ping: 'bg-orange-500',
    knowledge: 'bg-purple-500',
    general: 'bg-gray-500',
  }
  return classMap[type] || classMap.general
}

// 获取结果类型对应的图标
const getResultIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    weather: CloudOutlined,
    web: GlobalOutlined,
    ping: WifiOutlined,
    knowledge: FileTextOutlined,
    general: SearchOutlined,
  }
  return iconMap[type] || iconMap.general
}

// 从URL提取域名
const getSourceFromUrl = (url?: string) => {
  if (!url) {return ''}
  try {
    const domain = new URL(url).hostname
    return domain.replace('www.', '')
  } catch (error) {
    return url
  }
}

// 格式化时间
const formatTime = (timeStr: string) => {
  try {
    const date = new Date(timeStr)
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    })
  } catch (error) {
    return timeStr
  }
}

// 打开链接
const openUrl = (url: string) => {
  if ((window as any).electronAPI?.openExternal) {
    (window as any).electronAPI.openExternal(url)
  } else {
    window.open(url, '_blank')
  }
}

// 复制结果
const copyResult = async (result: SearchResult) => {
  try {
    const textToCopy = `${result.title}\n${result.snippet || result.content}\n${result.url || ''}`
    await navigator.clipboard.writeText(textToCopy)
    antMessage.success('已复制到剪贴板')
    emit('copy', result)
  } catch (error) {
    antMessage.error('复制失败')
  }
}

// 插入到聊天
const insertToChat = (result: SearchResult) => {
  emit('insert', result)
  antMessage.success('已引用到聊天')
}
</script>

<style scoped>
/* 文本截断样式 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 按钮样式优化 */
:deep(.ant-btn-sm) {
  height: 24px;
  padding: 0 6px;
  font-size: 11px;
  border: none;
  box-shadow: none;
}

:deep(.ant-btn-sm .anticon) {
  font-size: 10px;
}

:deep(.ant-btn-sm:hover) {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>
