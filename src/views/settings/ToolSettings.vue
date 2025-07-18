<template>
  <div class="tool-settings">
    <!-- 页面标题 -->
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-2">
        工具设置
      </h2>
      <p class="text-sm text-gray-600">
        配置各种工具的参数和选项
      </p>
    </div>

    <!-- 网络搜索设置 -->
    <div class="bg-white rounded-lg border border-gray-200 mb-6">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center space-x-3">
          <GlobalOutlined class="text-lg text-blue-500" />
          <div>
            <h3 class="text-base font-medium text-gray-900">
              网络搜索
            </h3>
            <p class="text-sm text-gray-500">
              配置网络搜索引擎和相关参数
            </p>
          </div>
        </div>
      </div>

      <div class="p-6 space-y-6">
        <!-- 搜索服务商 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            搜索服务商
          </label>
          <a-select
            v-model:value="webSearchSettings.defaultEngine"
            class="w-full"
            placeholder="选择默认搜索引擎"
            @change="saveWebSearchSettings"
          >
            <a-select-option
              v-for="engine in availableEngines"
              :key="engine.id"
              :value="engine.id"
            >
              <div class="flex items-center space-x-2">
                <component
                  :is="engine.icon"
                  :class="engine.color"
                  class="text-sm"
                />
                <span>{{ engine.name }}</span>
                <span class="text-xs text-gray-500">({{ engine.description }})</span>
              </div>
            </a-select-option>
          </a-select>
        </div>

        <!-- 常规设置 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            常规设置
          </label>

          <div class="space-y-4">
            <!-- 搜索包含日期 -->
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm font-medium text-gray-900">
                  搜索包含日期
                </div>
                <div class="text-xs text-gray-500">
                  在搜索结果中显示发布日期信息
                </div>
              </div>
              <a-switch
                v-model:checked="webSearchSettings.includeDates"
                @change="saveWebSearchSettings"
              />
            </div>

            <!-- 搜索结果个数 -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <div class="text-sm font-medium text-gray-900">
                  搜索结果个数
                </div>
                <div class="text-sm text-gray-500">
                  {{ webSearchSettings.maxResults }}
                </div>
              </div>
              <a-slider
                v-model:value="webSearchSettings.maxResults"
                :min="1"
                :max="20"
                :step="1"
                :marks="{ 1: '1', 5: '5', 10: '10', 20: '20' }"
                @change="saveWebSearchSettings"
              />
            </div>

            <!-- 搜索结果压缩 -->
            <div>
              <div class="text-sm font-medium text-gray-900 mb-2">
                搜索结果压缩
              </div>
              <div class="flex items-center justify-between">
                <div class="text-sm text-gray-700">
                  压缩方法
                </div>
                <a-select
                  v-model:value="webSearchSettings.compressionMethod"
                  class="w-32"
                  @change="saveWebSearchSettings"
                >
                  <a-select-option value="none">
                    不压缩
                  </a-select-option>
                  <a-select-option value="summary">
                    摘要压缩
                  </a-select-option>
                  <a-select-option value="keywords">
                    关键词提取
                  </a-select-option>
                </a-select>
              </div>
            </div>
          </div>
        </div>

        <!-- 黑名单 -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium text-gray-700">
              黑名单
            </label>
            <a-button
              size="small"
              type="primary"
              @click="showAddBlacklistModal = true"
            >
              添加订阅
            </a-button>
          </div>
          <div class="text-sm text-gray-600 mb-3">
            在搜索结果中不会出现以下网站的结果
          </div>

          <!-- 黑名单输入 -->
          <a-textarea
            v-model:value="blacklistInput"
            placeholder="请输入以下格式(每行一个)：&#10;匹配格式: *//*.example.com/*&#10;正则表达式: /example\.(net|org)/"
            :auto-size="{ minRows: 3, maxRows: 6 }"
            class="mb-3"
          />

          <div class="flex justify-end mb-4">
            <a-button
              type="primary"
              size="small"
              @click="saveBlacklist"
            >
              保存
            </a-button>
          </div>

          <!-- 黑名单订阅 -->
          <div v-if="webSearchSettings.blacklistSubscriptions.length > 0">
            <div class="text-sm font-medium text-gray-700 mb-2">
              黑名单订阅
            </div>
            <div class="space-y-2">
              <div
                v-for="(subscription, index) in webSearchSettings.blacklistSubscriptions"
                :key="index"
                class="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div class="flex-1">
                  <div class="text-sm font-medium">
                    {{ subscription.name }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ subscription.url }}
                  </div>
                </div>
                <a-button
                  size="small"
                  type="text"
                  danger
                  @click="removeBlacklistSubscription(index)"
                >
                  删除
                </a-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 文档预处理设置 -->
    <div class="bg-white rounded-lg border border-gray-200 mb-6">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center space-x-3">
          <FileTextOutlined class="text-lg text-green-500" />
          <div>
            <h3 class="text-base font-medium text-gray-900">
              文档预处理
            </h3>
            <p class="text-sm text-gray-500">
              配置文档处理和解析选项
            </p>
          </div>
        </div>
      </div>

      <div class="p-6 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium text-gray-900">
              自动提取文档结构
            </div>
            <div class="text-xs text-gray-500">
              自动识别标题、段落、列表等文档结构
            </div>
          </div>
          <a-switch
            v-model:checked="documentSettings.autoExtractStructure"
            @change="saveDocumentSettings"
          />
        </div>

        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium text-gray-900">
              保留原始格式
            </div>
            <div class="text-xs text-gray-500">
              在处理过程中保留文档的原始格式信息
            </div>
          </div>
          <a-switch
            v-model:checked="documentSettings.preserveFormatting"
            @change="saveDocumentSettings"
          />
        </div>

        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium text-gray-900">
              智能分段
            </div>
            <div class="text-xs text-gray-500">
              根据内容语义自动分段，提高处理效果
            </div>
          </div>
          <a-switch
            v-model:checked="documentSettings.smartSegmentation"
            @change="saveDocumentSettings"
          />
        </div>
      </div>
    </div>

    <!-- OCR 设置 -->
    <div class="bg-white rounded-lg border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center space-x-3">
          <ScanOutlined class="text-lg text-purple-500" />
          <div>
            <h3 class="text-base font-medium text-gray-900">
              OCR
            </h3>
            <p class="text-sm text-gray-500">
              配置光学字符识别选项
            </p>
          </div>
        </div>
      </div>

      <div class="p-6 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium text-gray-900">
              启用 OCR
            </div>
            <div class="text-xs text-gray-500">
              自动识别图片中的文字内容
            </div>
          </div>
          <a-switch
            v-model:checked="ocrSettings.enabled"
            @change="saveOcrSettings"
          />
        </div>

        <div v-if="ocrSettings.enabled">
          <div class="text-sm font-medium text-gray-700 mb-2">
            识别语言
          </div>
          <a-select
            v-model:value="ocrSettings.language"
            class="w-full"
            @change="saveOcrSettings"
          >
            <a-select-option value="auto">
              自动检测
            </a-select-option>
            <a-select-option value="zh-cn">
              简体中文
            </a-select-option>
            <a-select-option value="zh-tw">
              繁体中文
            </a-select-option>
            <a-select-option value="en">
              英语
            </a-select-option>
            <a-select-option value="ja">
              日语
            </a-select-option>
            <a-select-option value="ko">
              韩语
            </a-select-option>
          </a-select>
        </div>

        <div
          v-if="ocrSettings.enabled"
          class="flex items-center justify-between"
        >
          <div>
            <div class="text-sm font-medium text-gray-900">
              高精度模式
            </div>
            <div class="text-xs text-gray-500">
              使用更精确但较慢的识别算法
            </div>
          </div>
          <a-switch
            v-model:checked="ocrSettings.highAccuracy"
            @change="saveOcrSettings"
          />
        </div>
      </div>
    </div>

    <!-- 添加黑名单订阅模态框 -->
    <a-modal
      v-model:open="showAddBlacklistModal"
      title="添加黑名单订阅"
      :width="500"
      @ok="addBlacklistSubscription"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            订阅名称
          </label>
          <a-input
            v-model:value="newBlacklistSubscription.name"
            placeholder="输入订阅名称"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            订阅 URL
          </label>
          <a-input
            v-model:value="newBlacklistSubscription.url"
            placeholder="输入订阅链接"
          />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  GlobalOutlined,
  FileTextOutlined,
  ScanOutlined,
  GoogleOutlined,
  WindowsOutlined,
} from '@ant-design/icons-vue'
import type { SearchEngine } from '@/types/webSearch'
import { useToolSettingsStore } from '@/store'

const toolSettingsStore = useToolSettingsStore()

// 可用的搜索引擎
const availableEngines: SearchEngine[] = [
  {
    id: 'bing',
    name: 'Bing',
    description: '免费',
    icon: WindowsOutlined,
    color: 'text-blue-600',
  },
  {
    id: 'tavily',
    name: 'Tavily',
    description: 'API 密钥',
    icon: GlobalOutlined,
    color: 'text-green-500',
  },
  {
    id: 'searxng',
    name: 'Searxng',
    description: '免费',
    icon: GlobalOutlined,
    color: 'text-orange-500',
  },
  {
    id: 'exa',
    name: 'Exa',
    description: 'API 密钥',
    icon: GlobalOutlined,
    color: 'text-purple-500',
  },
  {
    id: 'google',
    name: 'Google',
    description: '免费',
    icon: GoogleOutlined,
    color: 'text-blue-500',
  },
  {
    id: 'baidu',
    name: 'Baidu',
    description: '免费',
    icon: GlobalOutlined,
    color: 'text-red-500',
  },
  {
    id: 'bocha',
    name: 'Bocha',
    description: 'API 密钥',
    icon: GlobalOutlined,
    color: 'text-indigo-500',
  },
]

// 网络搜索设置
const webSearchSettings = reactive({
  defaultEngine: 'bing',
  includeDates: true,
  maxResults: 5,
  compressionMethod: 'none' as 'none' | 'summary' | 'keywords',
  blacklist: [] as string[],
  blacklistSubscriptions: [] as Array<{ name: string; url: string }>,
})

// 文档处理设置
const documentSettings = reactive({
  autoExtractStructure: true,
  preserveFormatting: false,
  smartSegmentation: true,
})

// OCR 设置
const ocrSettings = reactive({
  enabled: false,
  language: 'auto',
  highAccuracy: false,
})

// 黑名单相关
const blacklistInput = ref('')
const showAddBlacklistModal = ref(false)
const newBlacklistSubscription = reactive({
  name: '',
  url: '',
})

// 保存网络搜索设置
const saveWebSearchSettings = () => {
  try {
    localStorage.setItem('webSearchSettings', JSON.stringify(webSearchSettings))
    message.success('网络搜索设置已保存')
  } catch (error) {
    console.error('保存网络搜索设置失败:', error)
    message.error('保存设置失败')
  }
}

// 保存文档处理设置
const saveDocumentSettings = () => {
  try {
    localStorage.setItem('documentSettings', JSON.stringify(documentSettings))
    message.success('文档处理设置已保存')
  } catch (error) {
    console.error('保存文档处理设置失败:', error)
    message.error('保存设置失败')
  }
}

// 保存 OCR 设置
const saveOcrSettings = () => {
  try {
    localStorage.setItem('ocrSettings', JSON.stringify(ocrSettings))
    message.success('OCR 设置已保存')
  } catch (error) {
    console.error('保存 OCR 设置失败:', error)
    message.error('保存设置失败')
  }
}

// 保存黑名单
const saveBlacklist = () => {
  try {
    const blacklistItems = blacklistInput.value
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0)

    webSearchSettings.blacklist = blacklistItems
    saveWebSearchSettings()
    message.success('黑名单已保存')
  } catch (error) {
    console.error('保存黑名单失败:', error)
    message.error('保存黑名单失败')
  }
}

// 添加黑名单订阅
const addBlacklistSubscription = () => {
  if (!newBlacklistSubscription.name.trim() || !newBlacklistSubscription.url.trim()) {
    message.error('请填写完整的订阅信息')
    return
  }

  webSearchSettings.blacklistSubscriptions.push({
    name: newBlacklistSubscription.name.trim(),
    url: newBlacklistSubscription.url.trim(),
  })

  // 重置表单
  newBlacklistSubscription.name = ''
  newBlacklistSubscription.url = ''
  showAddBlacklistModal.value = false

  saveWebSearchSettings()
  message.success('黑名单订阅已添加')
}

// 删除黑名单订阅
const removeBlacklistSubscription = (index: number) => {
  webSearchSettings.blacklistSubscriptions.splice(index, 1)
  saveWebSearchSettings()
  message.success('黑名单订阅已删除')
}

// 更新搜索引擎
// const updateSearchEngine = (engine: string) => {
//   toolSettingsStore.setDefaultSearchEngine(engine)
//   saveWebSearchSettings()
// }

// 加载设置
const loadSettings = () => {
  toolSettingsStore.loadFromLocalStorage()

  // 加载黑名单到输入框
  if (webSearchSettings.blacklist.length > 0) {
    blacklistInput.value = webSearchSettings.blacklist.join('\n')
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.tool-settings {
  /* 自定义样式 */
}
</style>
