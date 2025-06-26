<template>
  <div class="flex flex-col h-full w-full bg-white p-6 box-border">
    <!-- 顶部标题 -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-800 m-0">
        翻译
      </h1>
    </div>

    <!-- 翻译控制区域 -->
    <div class="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
      <!-- 语言选择区域 -->
      <div class="flex items-center gap-4">
        <div>
          <a-select
            v-model:value="sourceLanguage"
            style="width: 120px"
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
        </div>

        <div
          class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 cursor-pointer transition-all hover:bg-blue-50 hover:text-blue-500"
          @click="swapLanguages"
        >
          <SwapOutlined />
        </div>

        <div>
          <a-select
            v-model:value="targetLanguage"
            style="width: 120px"
          >
            <a-select-option value="zh">
              🇨🇳 中文
            </a-select-option>
            <a-select-option value="en">
              🇺🇸 英语
            </a-select-option>
            <a-select-option value="ja">
              🇯🇵 日语
            </a-select-option>
            <a-select-option value="ko">
              🇰🇷 韩语
            </a-select-option>
            <a-select-option value="fr">
              🇫🇷 法语
            </a-select-option>
            <a-select-option value="de">
              🇩🇪 德语
            </a-select-option>
            <a-select-option value="es">
              🇪🇸 西班牙语
            </a-select-option>
          </a-select>
        </div>
      </div>

      <!-- 翻译按钮 -->
      <div>
        <a-button
          type="primary"
          :loading="isTranslating"
          @click="translateText"
        >
          翻译
        </a-button>
      </div>
    </div>

    <!-- 翻译内容区域 -->
    <div class="flex-1 grid grid-cols-2 gap-6 min-h-0">
      <!-- 输入区域 -->
      <div class="flex flex-col border border-gray-200 rounded-lg overflow-hidden">
        <a-textarea
          v-model:value="inputText"
          placeholder="输入文本进行翻译"
          :rows="8"
          class="!border-none resize-none p-4 text-sm leading-relaxed"
          @input="onInputChange"
        />
        <div class="flex justify-between items-center px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div class="text-xs text-gray-400">
            {{ inputText.length }}/5000
          </div>
          <div class="flex gap-2">
            <a-button
              type="text"
              size="small"
              @click="clearInput"
            >
              <DeleteOutlined />
            </a-button>
            <a-button
              type="text"
              size="small"
              @click="pasteText"
            >
              <CopyOutlined />
            </a-button>
          </div>
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="flex flex-col border border-gray-200 rounded-lg overflow-hidden">
        <div class="flex-1 p-4 min-h-[150px] flex items-center justify-center">
          <div
            v-if="!outputText && !isTranslating"
            class="text-gray-300 text-base"
          >
            翻译
          </div>
          <div
            v-else-if="isTranslating"
            class="flex items-center gap-2 text-gray-600"
          >
            <a-spin />
            <span>翻译中...</span>
          </div>
          <div
            v-else
            class="text-sm leading-relaxed text-gray-800 w-full text-left"
          >
            {{ outputText }}
          </div>
        </div>
        <div
          v-if="outputText"
          class="flex justify-between items-center px-4 py-2 bg-gray-50 border-t border-gray-200"
        >
          <div />
          <div class="flex gap-2">
            <a-button
              type="text"
              size="small"
              @click="copyResult"
            >
              <CopyOutlined />
            </a-button>
            <a-button
              type="text"
              size="small"
              @click="speakResult"
            >
              <SoundOutlined />
            </a-button>
          </div>
        </div>
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
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const sourceLanguage = ref('auto')
const targetLanguage = ref('zh')
const inputText = ref('')
const outputText = ref('')
const isTranslating = ref(false)

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
  
  try {
    // 模拟翻译API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 这里应该调用实际的翻译API
    // 现在只是模拟翻译结果
    if (targetLanguage.value === 'en') {
      outputText.value = 'This is a simulated translation result.'
    } else if (targetLanguage.value === 'ja') {
      outputText.value = 'これはシミュレートされた翻訳結果です。'
    } else {
      outputText.value = '这是一个模拟的翻译结果。'
    }
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
}

const pasteText = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
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
  } else {
    message.error('您的浏览器不支持语音播放')
  }
}
</script>
