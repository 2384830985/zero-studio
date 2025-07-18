<template>
  <div class="settings-container">
    <!-- 助手设置 -->
    <div class="settings-section">
      <div class="section-header">
        <div class="section-icon">
          🤖
        </div>
        <h3 class="section-title">
          助手设置
        </h3>
      </div>
      <div class="section-content">
        <div class="setting-item">
          <div class="setting-label">
            <span>模型温度</span>
            <span class="setting-value">{{ modelTemperature }}</span>
          </div>
          <div class="setting-control">
            <a-slider
              v-model:value="modelTemperature"
              :min="0"
              :max="2"
              :step="0.1"
              class="custom-slider"
            />
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span>上下文数</span>
            <span class="setting-value">{{ contextCount }}</span>
          </div>
          <div class="setting-control">
            <a-input-number
              v-model:value="contextCount"
              :min="1"
              :max="20"
              size="small"
              class="custom-input-number"
            />
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span>流式输出</span>
          </div>
          <div class="setting-control">
            <a-switch
              v-model:checked="streamOutput"
              size="small"
            />
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span>最大 Token 数</span>
          </div>
          <div class="setting-control">
            <a-switch
              v-model:checked="maxTokenEnabled"
              size="small"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 消息设置 -->
    <div class="settings-section">
      <div class="section-header">
        <div class="section-icon">
          💬
        </div>
        <h3 class="section-title">
          消息设置
        </h3>
      </div>
      <div class="section-content">
        <div class="setting-item">
          <div class="setting-label">
            <span>显示提示词</span>
          </div>
          <div class="setting-control">
            <a-switch
              v-model:checked="showPrompts"
              size="small"
            />
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span>显示 Token 用量</span>
          </div>
          <div class="setting-control">
            <a-switch
              v-model:checked="showTokenUsage"
              size="small"
            />
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span>使用等宽字体</span>
          </div>
          <div class="setting-control">
            <a-switch
              v-model:checked="useMonospaceFont"
              size="small"
            />
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span>思考内容自动折叠</span>
          </div>
          <div class="setting-control">
            <a-switch
              v-model:checked="autoCollapseThinking"
              size="small"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 消息样式 -->
    <div class="settings-section">
      <div class="section-header">
        <div class="section-icon">
          🎨
        </div>
        <h3 class="section-title">
          消息样式
        </h3>
      </div>
      <div class="section-content">
        <div class="setting-item">
          <div class="setting-label">
            <span>消息样式</span>
          </div>
          <div class="setting-control">
            <a-select
              v-model:value="messageStyle"
              size="small"
              class="custom-select"
            >
              <a-select-option value="simple">
                简洁
              </a-select-option>
              <a-select-option value="standard">
                标准模式
              </a-select-option>
            </a-select>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span>多模型回答样式</span>
          </div>
          <div class="setting-control">
            <a-select
              v-model:value="multiModelStyle"
              size="small"
              class="custom-select"
            >
              <a-select-option value="standard">
                标准模式
              </a-select-option>
            </a-select>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span>对话导航按钮</span>
          </div>
          <div class="setting-control">
            <a-select
              v-model:value="conversationNavStyle"
              size="small"
              class="custom-select"
            >
              <a-select-option value="hide">
                不显示
              </a-select-option>
              <a-select-option value="show">
                显示
              </a-select-option>
            </a-select>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span>数学公式引擎</span>
          </div>
          <div class="setting-control">
            <a-select
              v-model:value="mathEngine"
              size="small"
              class="custom-select"
            >
              <a-select-option value="katex">
                KaTeX
              </a-select-option>
            </a-select>
          </div>
        </div>
      </div>
    </div>

    <!-- 字体设置 -->
    <div class="settings-section">
      <div class="section-header">
        <div class="section-icon">
          📝
        </div>
        <h3 class="section-title">
          字体设置
        </h3>
      </div>
      <div class="section-content">
        <div class="setting-item">
          <div class="setting-label">
            <span>消息字体大小</span>
            <span class="setting-value">{{ fontSize }}px</span>
          </div>
          <div class="setting-control font-size-control">
            <span class="font-preview small">A</span>
            <a-slider
              v-model:value="fontSize"
              :min="12"
              :max="20"
              :step="1"
              class="custom-slider flex-1"
            />
            <span class="font-preview large">A</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 代码块设置 -->
    <div class="settings-section">
      <div class="section-header">
        <div class="section-icon">
          💻
        </div>
        <h3 class="section-title">
          代码块设置
        </h3>
      </div>
      <div class="section-content">
        <div class="placeholder-content">
          <div class="placeholder-icon">
            ⚙️
          </div>
          <div class="placeholder-text">
            代码块相关设置
          </div>
          <div class="placeholder-hint">
            更多设置即将推出
          </div>
        </div>
      </div>
    </div>

    <!-- 重置按钮 -->
    <div class="reset-section">
      <button
        class="reset-btn"
        @click="resetSettings"
      >
        <span class="reset-icon">🔄</span>
        <span>重置所有设置</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'

// 助手设置
const modelTemperature = ref(0.7)
const contextCount = ref(10)
const streamOutput = ref(true)
const maxTokenEnabled = ref(false)

// 消息设置
const showPrompts = ref(false)
const showTokenUsage = ref(true)
const useMonospaceFont = ref(false)
const autoCollapseThinking = ref(true)

// 消息样式
const messageStyle = ref('simple')
const multiModelStyle = ref('standard')
const conversationNavStyle = ref('hide')
const mathEngine = ref('katex')

// 字体大小
const fontSize = ref(14)

// 重置设置
const resetSettings = () => {
  modelTemperature.value = 0.7
  contextCount.value = 10
  streamOutput.value = true
  maxTokenEnabled.value = false
  showPrompts.value = false
  showTokenUsage.value = true
  useMonospaceFont.value = false
  autoCollapseThinking.value = true
  messageStyle.value = 'simple'
  multiModelStyle.value = 'standard'
  conversationNavStyle.value = 'hide'
  mathEngine.value = 'katex'
  fontSize.value = 14

  message.success('设置已重置为默认值')
}
</script>

<style scoped>
.settings-container {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

/* 设置区块 */
.settings-section {
  background: #ffffff;
  border-radius: 12px;
  margin-bottom: 12px;
  border: 1px solid #f0f0f0;
  transition: all 0.2s ease;
}

.settings-section:hover {
  border-color: #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

/* 区块头部 */
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f5f5f5;
}

.section-icon {
  font-size: 16px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 6px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

/* 区块内容 */
.section-content {
  padding: 12px 16px 16px;
}

/* 设置项 */
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  min-height: 36px;
}

.setting-item:not(:last-child) {
  border-bottom: 1px solid #f8f9fa;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

.setting-value {
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 自定义组件样式 */
.custom-slider {
  width: 80px;
}

:deep(.custom-slider .ant-slider-rail) {
  background: #f1f3f4;
  height: 4px;
}

:deep(.custom-slider .ant-slider-track) {
  background: #3b82f6;
  height: 4px;
}

:deep(.custom-slider .ant-slider-handle) {
  width: 14px;
  height: 14px;
  border: 2px solid #3b82f6;
  background: #ffffff;
}

.custom-input-number {
  width: 60px;
}

:deep(.custom-input-number .ant-input-number-input) {
  padding: 2px 6px;
  font-size: 12px;
}

.custom-select {
  width: 100px;
}

:deep(.custom-select .ant-select-selector) {
  border-radius: 6px;
  border-color: #e5e7eb;
  font-size: 12px;
}

:deep(.custom-select .ant-select-selection-item) {
  font-size: 12px;
}

/* 字体大小控制 */
.font-size-control {
  width: 100%;
  gap: 12px;
}

.font-preview {
  font-weight: 500;
  color: #6b7280;
  flex-shrink: 0;
}

.font-preview.small {
  font-size: 12px;
}

.font-preview.large {
  font-size: 16px;
}

/* 占位内容 */
.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  text-align: center;
}

.placeholder-icon {
  font-size: 24px;
  margin-bottom: 8px;
  opacity: 0.6;
}

.placeholder-text {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 4px;
}

.placeholder-hint {
  font-size: 11px;
  color: #9ca3af;
}

/* 重置按钮区域 */
.reset-section {
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
  margin-top: 8px;
}

.reset-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
}

.reset-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #374151;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.reset-btn:active {
  transform: translateY(0);
}

.reset-icon {
  font-size: 14px;
}

/* 开关样式 */
:deep(.ant-switch-small) {
  min-width: 28px;
  height: 16px;
}

:deep(.ant-switch-small .ant-switch-handle) {
  width: 12px;
  height: 12px;
}

:deep(.ant-switch-small.ant-switch-checked .ant-switch-handle) {
  left: calc(100% - 12px - 2px);
}

/* 滚动条样式 */
.settings-container::-webkit-scrollbar {
  width: 4px;
}

.settings-container::-webkit-scrollbar-track {
  background: transparent;
}

.settings-container::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.settings-container::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* 响应式设计 */
@media (max-width: 320px) {
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .setting-control {
    width: 100%;
    justify-content: flex-end;
  }

  .font-size-control {
    justify-content: space-between;
  }
}
</style>
