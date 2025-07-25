<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <!-- 页面头部 -->
    <div class="bg-white border-b border-gray-200 px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <!-- 返回按钮 -->
          <a-button
            type="text"
            size="small"
            class="flex items-center gap-1 hover:bg-gray-50"
            @click="goBack"
          >
            <template #icon>
              <ArrowLeftOutlined />
            </template>
            返回
          </a-button>

          <!-- 分割线 -->
          <div class="w-px h-4 bg-gray-300" />

          <!-- 工具图标和标题 -->
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
              <ApiOutlined class="text-xs" />
            </div>
            <h1 class="text-base font-medium text-gray-900 mb-0">
              JSON 转换工具
            </h1>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <a-button
            size="small"
            @click="clearAll"
          >
            清空
          </a-button>
          <a-button
            type="primary"
            size="small"
            @click="formatJson"
          >
            格式化
          </a-button>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="bg-white border-b border-gray-200 px-4 py-3">
      <div class="flex items-center gap-3">
        <a-radio-group
          v-model:value="conversionMode"
          size="small"
          @change="handleModeChange"
        >
          <a-radio-button value="string-to-json">
            String → JSON
          </a-radio-button>
          <a-radio-button value="json-to-string">
            JSON → String
          </a-radio-button>
        </a-radio-group>

        <a-divider type="vertical" />

        <a-checkbox
          v-model:checked="autoFormat"
          size="small"
        >
          自动格式化
        </a-checkbox>

        <a-checkbox
          v-model:checked="escapeUnicode"
          size="small"
        >
          转义Unicode
        </a-checkbox>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="flex-1 flex overflow-hidden">
      <!-- 输入区域 -->
      <div class="flex-1 flex flex-col bg-white border-r border-gray-200">
        <div class="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-700">输入</span>
            <span class="text-xs text-gray-500">
              {{ conversionMode === 'string-to-json' ? '字符串' : 'JSON对象' }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500">
              {{ inputText.length }} 字符
            </span>
            <a-button
              type="text"
              size="small"
              @click="pasteFromClipboard"
            >
              <template #icon>
                <CopyOutlined />
              </template>
              粘贴
            </a-button>
          </div>
        </div>
        <div class="flex-1 p-4">
          <a-textarea
            v-model:value="inputText"
            placeholder="请输入要转换的内容..."
            class="h-full resize-none border-0 shadow-none"
            :auto-size="false"
            @input="handleInputChange"
          />
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="flex-1 flex flex-col bg-white">
        <div class="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-700">输出</span>
            <span class="text-xs text-gray-500">
              {{ conversionMode === 'string-to-json' ? 'JSON对象' : '字符串' }}
            </span>
            <div
              v-if="conversionStatus"
              class="flex items-center gap-1"
            >
              <div
                class="w-2 h-2 rounded-full"
                :class="conversionStatus === 'success' ? 'bg-green-500' : 'bg-red-500'"
              />
              <span
                class="text-xs"
                :class="conversionStatus === 'success' ? 'text-green-600' : 'text-red-600'"
              >
                {{ conversionStatus === 'success' ? '转换成功' : '转换失败' }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500">
              {{ outputText.length }} 字符
            </span>
            <a-button
              type="text"
              size="small"
              :disabled="!outputText"
              @click="copyToClipboard"
            >
              <template #icon>
                <CopyOutlined />
              </template>
              复制
            </a-button>
          </div>
        </div>
        <div class="flex-1 p-4">
          <a-textarea
            v-model:value="outputText"
            :placeholder="outputPlaceholder"
            class="h-full resize-none border-0 shadow-none"
            :auto-size="false"
            readonly
          />
        </div>
      </div>
    </div>

    <!-- 错误信息 -->
    <div
      v-if="errorMessage"
      class="bg-red-50 border-t border-red-200 px-4 py-3"
    >
      <div class="flex items-start gap-2">
        <ExclamationCircleOutlined class="text-red-500 mt-0.5 flex-shrink-0" />
        <div class="flex-1">
          <p class="text-sm font-medium text-red-800 mb-1">
            转换错误
          </p>
          <p class="text-xs text-red-600 font-mono">
            {{ errorMessage }}
          </p>
        </div>
        <a-button
          type="text"
          size="small"
          @click="errorMessage = ''"
        >
          <template #icon>
            <CloseOutlined />
          </template>
        </a-button>
      </div>
    </div>

    <!-- 底部状态栏 -->
    <div class="bg-white border-t border-gray-200 px-4 py-2">
      <div class="flex items-center justify-between text-xs text-gray-500">
        <div class="flex items-center gap-4">
          <span>模式: {{ conversionMode === 'string-to-json' ? 'String → JSON' : 'JSON → String' }}</span>
          <span v-if="lastConvertTime">
            最后转换: {{ formatTime(lastConvertTime) }}
          </span>
        </div>
        <div class="flex items-center gap-4">
          <span>保留转义: {{ escapeUnicode ? '是' : '否' }}</span>
          <span>自动格式化: {{ autoFormat ? '是' : '否' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { message as antMessage } from 'ant-design-vue'
import {
  CopyOutlined,
  ExclamationCircleOutlined,
  CloseOutlined,
  ArrowLeftOutlined,
  ApiOutlined,
} from '@ant-design/icons-vue'

const router = useRouter()

// 响应式数据
const conversionMode = ref<'string-to-json' | 'json-to-string'>('string-to-json')
const inputText = ref('')
const outputText = ref('')
const autoFormat = ref(true)
const escapeUnicode = ref(false)
const errorMessage = ref('')
const conversionStatus = ref<'success' | 'error' | null>(null)
const lastConvertTime = ref<Date | null>(null)

// 计算属性
const outputPlaceholder = computed(() => {
  return conversionMode.value === 'string-to-json'
    ? '转换后的JSON对象将显示在这里...'
    : '转换后的字符串将显示在这里...'
})

// 监听输入变化
watch(inputText, () => {
  if (autoFormat.value) {
    convertText()
  }
})

// 监听模式变化
watch(conversionMode, () => {
  // 清空输出和错误信息
  outputText.value = ''
  errorMessage.value = ''
  conversionStatus.value = null

  // 如果有输入内容，自动转换
  if (inputText.value.trim()) {
    convertText()
  }
})

// 方法
const handleModeChange = () => {
  // 模式切换时的处理逻辑已在watch中处理
}

const handleInputChange = () => {
  // 清除之前的错误状态
  errorMessage.value = ''
  conversionStatus.value = null
}

const convertText = () => {
  if (!inputText.value.trim()) {
    outputText.value = ''
    conversionStatus.value = null
    return
  }

  try {
    if (conversionMode.value === 'string-to-json') {
      // String to JSON
      const parsed = JSON.parse(inputText.value)
      outputText.value = JSON.stringify(parsed, null, 2)
    } else {
      // JSON to String
      const parsed = JSON.parse(inputText.value)
      outputText.value = JSON.stringify(parsed, null, escapeUnicode.value ? undefined : 0)
        .replace(/\\u[\dA-F]{4}/gi, (match) => {
          if (escapeUnicode.value) {return match}
          return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
        })
    }

    conversionStatus.value = 'success'
    errorMessage.value = ''
    lastConvertTime.value = new Date()
  } catch (error) {
    conversionStatus.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : '未知错误'
    outputText.value = ''
  }
}

const formatJson = () => {
  convertText()
}

const clearAll = () => {
  inputText.value = ''
  outputText.value = ''
  errorMessage.value = ''
  conversionStatus.value = null
}

const copyToClipboard = async () => {
  if (!outputText.value) {return}

  try {
    await navigator.clipboard.writeText(outputText.value)
    antMessage.success('已复制到剪贴板')
  } catch (error) {
    antMessage.error('复制失败')
  }
}

const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
    if (autoFormat.value) {
      convertText()
    }
    antMessage.success('已从剪贴板粘贴')
  } catch (error) {
    antMessage.error('粘贴失败')
  }
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const goBack = () => {
  router.push('/tools')
}
</script>

<style scoped>
/* 自定义文本域样式 */
:deep(.ant-input) {
  border: none !important;
  box-shadow: none !important;
  padding: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  background: transparent;
}

:deep(.ant-input:focus) {
  border: none !important;
  box-shadow: none !important;
}

/* 单选按钮组样式 */
:deep(.ant-radio-button-wrapper) {
  border-radius: 6px;
}

:deep(.ant-radio-button-wrapper:first-child) {
  border-radius: 6px 0 0 6px;
}

:deep(.ant-radio-button-wrapper:last-child) {
  border-radius: 0 6px 6px 0;
}

/* 修复按钮图标居中问题 */
:deep(.ant-btn) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.ant-btn .ant-btn-icon) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.ant-btn .anticon) {
  display: flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}
</style>
