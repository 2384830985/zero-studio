<template>
  <div class="translate-content-container">
    <!-- 顶部标题 -->
    <div class="translate-header">
      <h1>翻译</h1>
    </div>

    <!-- 翻译控制区域 -->
    <div class="translate-controls">
      <!-- 语言选择区域 -->
      <div class="language-selector">
        <div class="language-item">
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
          class="swap-button"
          @click="swapLanguages"
        >
          <SwapOutlined />
        </div>

        <div class="language-item">
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
      <div class="translate-button">
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
    <div class="translate-content">
      <!-- 输入区域 -->
      <div class="input-section">
        <a-textarea
          v-model:value="inputText"
          placeholder="输入文本进行翻译"
          :rows="8"
          class="translate-input"
          @input="onInputChange"
        />
        <div class="input-actions">
          <div class="char-count">
            {{ inputText.length }}/5000
          </div>
          <div class="action-buttons">
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
      <div class="output-section">
        <div class="translate-output">
          <div
            v-if="!outputText && !isTranslating"
            class="placeholder"
          >
            翻译
          </div>
          <div
            v-else-if="isTranslating"
            class="loading"
          >
            <a-spin />
            <span>翻译中...</span>
          </div>
          <div
            v-else
            class="result-text"
          >
            {{ outputText }}
          </div>
        </div>
        <div
          v-if="outputText"
          class="output-actions"
        >
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

<style scoped>
.translate-content-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: #ffffff;
  padding: 24px;
  box-sizing: border-box;
}

.translate-header {
  margin-bottom: 24px;
}

.translate-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* 翻译控制区域 */
.translate-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 8px;
}

.language-selector {
  display: flex;
  align-items: center;
  gap: 16px;
}

.swap-button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
}

.swap-button:hover {
  background-color: #e6f7ff;
  color: #1890ff;
}

/* 翻译内容区域 */
.translate-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  min-height: 0; /* 确保网格可以收缩 */
}

.input-section, .output-section {
  display: flex;
  flex-direction: column;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}

.translate-input {
  border: none;
  resize: none;
  padding: 16px;
  font-size: 14px;
  line-height: 1.6;
}

.translate-input:focus {
  box-shadow: none;
  border-color: #e8e8e8;
}

.input-actions, .output-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: #fafafa;
  border-top: 1px solid #e8e8e8;
}

.char-count {
  font-size: 12px;
  color: #999;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.translate-output {
  flex: 1;
  padding: 16px;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder {
  color: #ccc;
  font-size: 16px;
}

.loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
}

.result-text {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  width: 100%;
  text-align: left;
}
</style>
