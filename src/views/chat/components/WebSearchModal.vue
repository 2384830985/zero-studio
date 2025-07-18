<template>
  <a-modal
    v-model:open="visible"
    title="网络搜索"
    :width="600"
    :footer="null"
    @cancel="handleCancel"
  >
    <div class="web-search-modal">
      <!-- 搜索引擎选择 -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          选择搜索引擎
        </label>
        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="engine in searchEngines"
            :key="engine.id"
            :class="[
              'flex items-center p-3 border rounded-lg cursor-pointer transition-all',
              selectedEngine === engine.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            ]"
            @click="selectedEngine = engine.id"
          >
            <div class="flex items-center space-x-3">
              <component
                :is="engine.icon"
                class="text-lg"
                :class="engine.color"
              />
              <div>
                <div class="font-medium text-sm">
                  {{ engine.name }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ engine.description }}
                </div>
              </div>
            </div>
            <div class="ml-auto">
              <div
                v-if="selectedEngine === engine.id"
                class="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
              >
                <CheckOutlined class="text-white text-xs" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 搜索查询输入 -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          搜索内容
        </label>
        <a-textarea
          v-model:value="searchQuery"
          placeholder="请输入要搜索的内容..."
          :auto-size="{ minRows: 2, maxRows: 4 }"
          class="w-full"
        />
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-end space-x-3">
        <a-button @click="handleCancel">
          取消
        </a-button>
        <a-button
          type="primary"
          :loading="isSearching"
          :disabled="!searchQuery.trim() || !selectedEngine"
          @click="handleSearch"
        >
          <template #icon>
            <SearchOutlined />
          </template>
          搜索
        </a-button>
      </div>

      <!-- 搜索结果 -->
      <div
        v-if="searchResults.length > 0"
        class="mt-6 border-t pt-4"
      >
        <h3 class="text-sm font-medium text-gray-900 mb-3">
          搜索结果 ({{ searchResults.length }} 条)
        </h3>
        <div class="space-y-3 max-h-60 overflow-y-auto">
          <div
            v-for="(result, index) in searchResults"
            :key="index"
            class="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
            @click="selectResult(result)"
          >
            <div class="font-medium text-sm text-blue-600 hover:text-blue-800 mb-1">
              {{ result.title }}
            </div>
            <div class="text-xs text-gray-500 mb-1">
              {{ result.url }}
            </div>
            <div class="text-sm text-gray-700">
              {{ result.snippet }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { message as antMessage } from 'ant-design-vue'
import {
  SearchOutlined,
  CheckOutlined,
  GlobalOutlined,
  GoogleOutlined,
  WindowsOutlined,
} from '@ant-design/icons-vue'
import type { SearchEngine, SearchResult } from '@/types/webSearch'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'search-result', result: SearchResult): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const selectedEngine = ref('google')
const searchQuery = ref('')
const isSearching = ref(false)
const searchResults = ref<SearchResult[]>([])

// 搜索引擎配置
const searchEngines: SearchEngine[] = [
  {
    id: 'google',
    name: 'Google',
    description: '全球最大的搜索引擎',
    icon: GoogleOutlined,
    color: 'text-blue-500',
  },
  {
    id: 'bing',
    name: 'Bing',
    description: '微软搜索引擎',
    icon: WindowsOutlined,
    color: 'text-blue-600',
  },
  {
    id: 'baidu',
    name: '百度',
    description: '中文搜索引擎',
    icon: GlobalOutlined,
    color: 'text-red-500',
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    description: '注重隐私的搜索引擎',
    icon: GlobalOutlined,
    color: 'text-orange-500',
  },
]

// 处理搜索
const handleSearch = async () => {
  if (!searchQuery.value.trim() || !selectedEngine.value) {
    return
  }

  isSearching.value = true
  searchResults.value = []

  try {
    // 调用 Electron 主进程进行网络搜索
    const result = await window.ipcRenderer.invoke('web-search', {
      query: searchQuery.value.trim(),
      engine: selectedEngine.value,
    })

    if (result.success && result.results) {
      searchResults.value = result.results
      antMessage.success(`搜索完成，找到 ${result.results.length} 条结果`)
    } else {
      antMessage.warning('未找到相关结果')
    }
  } catch (error) {
    console.error('搜索失败:', error)
    antMessage.error('搜索失败，请稍后重试')
  } finally {
    isSearching.value = false
  }
}

// 选择搜索结果
const selectResult = (result: SearchResult) => {
  emit('search-result', result)
  handleCancel()
}

// 取消操作
const handleCancel = () => {
  visible.value = false
  searchQuery.value = ''
  searchResults.value = []
  isSearching.value = false
}
</script>

<style scoped>
.web-search-modal {
  /* 自定义样式 */
}
</style>
