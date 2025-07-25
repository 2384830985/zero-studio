<template>
  <div class="h-full flex flex-col bg-gray-50">
    <!-- 顶部状态栏 -->
    <div class="bg-white border-b border-gray-200 px-6 py-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <h1 class="text-base font-medium text-gray-900 absolute top-3">
            翻译
          </h1>
        </div>
        <div
          class="flex items-center space-x-1"
          style="height: 32px;"
        >
          <!-- 语言选择器 -->
          <div class="flex items-center space-x-2">
            <a-select
              v-model:value="sourceLanguage"
              size="small"
              style="width: 100px"
              class="translate-select"
            >
              <a-select-option value="auto">
                自动检测
              </a-select-option>
              <a-select-option value="zh">
                中文
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
              <a-select-option value="fr">
                法语
              </a-select-option>
              <a-select-option value="de">
                德语
              </a-select-option>
              <a-select-option value="es">
                西班牙语
              </a-select-option>
            </a-select>

            <a-button
              type="text"
              size="small"
              class="swap-btn"
              :disabled="sourceLanguage === 'auto'"
              @click="swapLanguages"
            >
              <SwapOutlined />
            </a-button>

            <a-select
              v-model:value="targetLanguage"
              size="small"
              style="width: 100px"
              class="translate-select"
            >
              <a-select-option value="zh">
                中文
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
              <a-select-option value="fr">
                法语
              </a-select-option>
              <a-select-option value="de">
                德语
              </a-select-option>
              <a-select-option value="es">
                西班牙语
              </a-select-option>
            </a-select>
          </div>

          <!-- 翻译按钮 -->
          <a-button
            type="primary"
            size="small"
            :loading="isTranslating"
            :disabled="!inputText.trim()"
            @click="translateText"
          >
            翻译
          </a-button>
        </div>
      </div>
    </div>

    <!-- 翻译内容区域 -->
    <div class="flex-1 flex overflow-hidden">
      <!-- 输入区域 -->
      <div class="flex-1 flex flex-col border-r border-gray-200">
        <!-- 输入标题 -->
        <div class="bg-white border-b border-gray-200 px-4 py-2 min-h-[41px]">
          <div class="flex items-center justify-between h-full">
            <span class="text-sm font-medium text-gray-700 leading-none">
              {{ getLanguageName(sourceLanguage) }}
              <span
                v-if="detectedLanguage && sourceLanguage === 'auto'"
                class="text-blue-500"
              >
                (检测到: {{ getLanguageName(detectedLanguage) }})
              </span>
            </span>
            <div class="flex items-center space-x-1">
              <a-tooltip title="清空">
                <a-button
                  type="text"
                  size="small"
                  class="!h-6 !w-6 !p-0 flex items-center justify-center"
                  @click="clearInput"
                >
                  <DeleteOutlined class="!text-xs" />
                </a-button>
              </a-tooltip>
              <a-tooltip title="粘贴">
                <a-button
                  type="text"
                  size="small"
                  class="!h-6 !w-6 !p-0 flex items-center justify-center"
                  @click="pasteText"
                >
                  <CopyOutlined class="!text-xs" />
                </a-button>
              </a-tooltip>
            </div>
          </div>
        </div>

        <!-- 输入文本区域 -->
        <div class="flex-1 flex flex-col">
          <div class="flex-1 p-4">
            <a-textarea
              v-model:value="inputText"
              placeholder="请输入要翻译的文本..."
              class="input-textarea"
              :auto-size="{ minRows: 10 }"
              @input="onInputChange"
            />
          </div>

          <!-- 输入底部信息 -->
          <div class="border-t border-gray-200 bg-white px-4 py-2">
            <div class="flex justify-between items-center text-xs text-gray-500">
              <span :class="{ 'text-red-500': inputText.length > 4500 }">
                {{ inputText.length }}/5000
              </span>
              <span v-if="inputText.trim()">
                {{ inputText.trim().split(/\s+/).length }} 词
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="flex-1 flex flex-col">
        <!-- 输出标题 -->
        <div class="bg-white border-b border-gray-200 px-4 py-2 min-h-[41px]">
          <div class="flex items-center justify-between h-full">
            <span class="text-sm font-medium text-gray-700 leading-none">
              {{ getLanguageName(targetLanguage) }}
            </span>
            <div
              v-if="outputText"
              class="flex items-center space-x-1"
            >
              <a-tooltip title="复制">
                <a-button
                  type="text"
                  size="small"
                  class="!h-6 !w-6 !p-0 flex items-center justify-center"
                  @click="copyResult"
                >
                  <CopyOutlined class="!text-xs" />
                </a-button>
              </a-tooltip>
              <a-tooltip title="朗读">
                <a-button
                  type="text"
                  size="small"
                  class="!h-6 !w-6 !p-0 flex items-center justify-center"
                  @click="speakResult"
                >
                  <SoundOutlined class="!text-xs" />
                </a-button>
              </a-tooltip>
              <a-tooltip title="收藏">
                <a-button
                  type="text"
                  size="small"
                  class="!h-6 !w-6 !p-0 flex items-center justify-center"
                  @click="saveTranslation"
                >
                  <StarOutlined class="!text-xs" />
                </a-button>
              </a-tooltip>
            </div>
          </div>
        </div>

        <!-- 输出文本区域 -->
        <div class="flex-1 flex flex-col">
          <div class="flex-1 p-4">
            <!-- 空状态 -->
            <div
              v-if="!outputText && !isTranslating"
              class="h-full flex items-center justify-center text-center text-gray-400"
            >
              <div>
                <TranslationOutlined class="text-4xl mb-2" />
                <p class="text-sm">
                  翻译结果将在这里显示
                </p>
              </div>
            </div>

            <!-- 加载状态 -->
            <div
              v-else-if="isTranslating"
              class="h-full flex items-center justify-center text-center text-gray-600"
            >
              <div>
                <a-spin size="large" />
                <p class="mt-2 text-sm">
                  正在翻译...
                </p>
              </div>
            </div>

            <!-- 翻译结果 -->
            <div
              v-else
              class="h-full"
            >
              <a-textarea
                :value="outputText"
                readonly
                class="output-textarea"
                :auto-size="{ minRows: 10 }"
              />
              <div class="mt-2 text-xs text-gray-500 flex items-center justify-between">
                <span>{{ formatTime(translationTime) }}</span>
                <span v-if="translationDuration">
                  耗时 {{ translationDuration }}ms
                </span>
              </div>
            </div>
          </div>

          <!-- 输出底部信息 -->
          <div
            v-if="outputText"
            class="border-t border-gray-200 bg-white px-4 py-2"
          >
            <div class="flex justify-between items-center text-xs text-gray-500">
              <span>{{ outputText.length }} 字符</span>
              <span>{{ outputText.trim().split(/\s+/).length }} 词</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速翻译建议 -->
    <div
      v-if="!inputText && !outputText"
      class="border-t border-gray-200 bg-white px-4 py-3"
    >
      <div class="text-xs text-gray-500 mb-2">
        快速开始
      </div>
      <div class="flex flex-wrap gap-2">
        <a-tag
          v-for="suggestion in quickSuggestions"
          :key="suggestion.text"
          class="cursor-pointer hover:bg-blue-50 hover:border-blue-300"
          @click="applySuggestion(suggestion)"
        >
          {{ suggestion.icon }} {{ suggestion.text }}
        </a-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  SwapOutlined,
  DeleteOutlined,
  CopyOutlined,
  SoundOutlined,
  TranslationOutlined,
  StarOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const sourceLanguage = ref('auto')
const targetLanguage = ref('zh')
const inputText = ref('')
const outputText = ref('')
const isTranslating = ref(false)
const detectedLanguage = ref('')
const translationTime = ref(0)
const translationDuration = ref(0)

// 语言名称映射
const languageNames: Record<string, string> = {
  'auto': '自动检测',
  'zh': '中文',
  'en': '英语',
  'ja': '日语',
  'ko': '韩语',
  'fr': '法语',
  'de': '德语',
  'es': '西班牙语',
}

// 快速建议
const quickSuggestions = [
  { icon: '👋', text: 'Hello, how are you?', from: 'en', to: 'zh' },
  { icon: '💼', text: '会议将在明天上午9点开始', from: 'zh', to: 'en' },
  { icon: '🍜', text: 'おいしいラーメンを食べたい', from: 'ja', to: 'zh' },
  { icon: '📚', text: 'Je voudrais apprendre le français', from: 'fr', to: 'zh' },
]

const getLanguageName = (code: string) => {
  return languageNames[code] || code
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const swapLanguages = () => {
  if (sourceLanguage.value !== 'auto') {
    const temp = sourceLanguage.value
    sourceLanguage.value = targetLanguage.value
    targetLanguage.value = temp

    // 同时交换输入输出文本
    const tempText = inputText.value
    inputText.value = outputText.value
    outputText.value = tempText
  }
}

const translateText = async () => {
  if (!inputText.value.trim()) {
    message.warning('请输入要翻译的文本')
    return
  }

  isTranslating.value = true
  const startTime = Date.now()

  try {
    // 模拟翻译API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 模拟语言检测
    if (sourceLanguage.value === 'auto') {
      detectedLanguage.value = 'en' // 模拟检测结果
    }

    // 这里应该调用实际的翻译API
    // 现在只是模拟翻译结果
    if (targetLanguage.value === 'en') {
      outputText.value = 'This is a simulated translation result with better styling.'
    } else if (targetLanguage.value === 'ja') {
      outputText.value = 'これはより良いスタイリングを持つシミュレートされた翻訳結果です。'
    } else {
      outputText.value = '这是一个具有更好样式的模拟翻译结果。'
    }

    translationDuration.value = Date.now() - startTime
    translationTime.value = Date.now()
    message.success('翻译完成')
  } catch (error) {
    message.error('翻译失败，请重试')
  } finally {
    isTranslating.value = false
  }
}

const onInputChange = () => {
  if (inputText.value.length > 5000) {
    inputText.value = inputText.value.substring(0, 5000)
    message.warning('输入文本不能超过5000个字符')
  }
}

const clearInput = () => {
  inputText.value = ''
  outputText.value = ''
  detectedLanguage.value = ''
}

const pasteText = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
    message.success('已粘贴文本')
  } catch (error) {
    message.error('粘贴失败')
  }
}

const copyResult = async () => {
  try {
    await navigator.clipboard.writeText(outputText.value)
    message.success('已复制到剪贴板')
  } catch (error) {
    message.error('复制失败')
  }
}

const speakResult = () => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(outputText.value)
    utterance.lang = targetLanguage.value === 'zh' ? 'zh-CN' : targetLanguage.value
    speechSynthesis.speak(utterance)
    message.info('开始朗读')
  } else {
    message.error('您的浏览器不支持语音播放')
  }
}

const saveTranslation = () => {
  // 这里可以实现保存翻译到收藏夹的功能
  message.success('已添加到收藏夹')
}

const applySuggestion = (suggestion: any) => {
  inputText.value = suggestion.text
  sourceLanguage.value = suggestion.from
  targetLanguage.value = suggestion.to
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

/* 输入框样式 */
.input-textarea {
  border: none !important;
  box-shadow: none !important;
  resize: none;
  font-size: 14px;
  line-height: 1.6;
}

.input-textarea:focus {
  border: none !important;
  box-shadow: none !important;
}

/* 输出框样式 */
.output-textarea {
  border: none !important;
  box-shadow: none !important;
  resize: none;
  font-size: 14px;
  line-height: 1.6;
  background: transparent !important;
}

.output-textarea:focus {
  border: none !important;
  box-shadow: none !important;
}

/* 翻译选择器样式 */
:deep(.translate-select .ant-select-selector) {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
}

:deep(.translate-select.ant-select-focused .ant-select-selector) {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

/* 交换按钮样式 */
.swap-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.swap-btn:hover:not(:disabled) {
  background-color: #f0f0f0;
  transform: rotate(180deg);
}

.swap-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 统一按钮样式 */
:deep(.ant-btn-sm) {
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* 快速建议标签样式 */
:deep(.ant-tag) {
  margin-bottom: 4px;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  transition: all 0.3s ease;
}
</style>
