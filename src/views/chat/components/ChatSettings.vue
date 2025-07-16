<template>
  <div class="p-4 space-y-4">
    <!-- 助手设置 -->
    <div class="bg-gray-50 rounded-lg p-4">
      <h3 class="text-sm font-semibold text-gray-900 mb-3">
        助手设置
      </h3>
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-700">模型温度</span>
          <a-slider
            v-model:value="modelTemperature"
            :min="0"
            :max="2"
            :step="0.1"
            class="w-20"
          />
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-700">上下文数</span>
          <a-input-number
            v-model:value="contextCount"
            :min="1"
            :max="20"
            size="small"
            class="w-20"
          />
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-700">流式输出</span>
          <a-switch v-model:checked="streamOutput" />
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-700">最大 Token 数</span>
          <a-switch v-model:checked="maxTokenEnabled" />
        </div>
      </div>
    </div>

    <!-- 消息设置 -->
    <div class="bg-gray-50 rounded-lg p-4">
      <h3 class="text-sm font-semibold text-gray-900 mb-3">
        消息设置
      </h3>
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-700">显示提示词</span>
          <a-switch v-model:checked="showPrompts" />
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-700">显示 Token 用量</span>
          <a-switch v-model:checked="showTokenUsage" />
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-700">使用等宽字体</span>
          <a-switch v-model:checked="useMonospaceFont" />
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-700">思考内容自动折叠</span>
          <a-switch v-model:checked="autoCollapseThinking" />
        </div>
      </div>
    </div>

    <!-- 消息样式 -->
    <div class="bg-gray-50 rounded-lg p-4">
      <h3 class="text-sm font-semibold text-gray-900 mb-3">
        消息样式
      </h3>
      <div class="space-y-3">
        <div>
          <span class="text-sm text-gray-700 block mb-2">消息样式</span>
          <a-select
            v-model:value="messageStyle"
            size="small"
            class="w-full"
          >
            <a-select-option value="simple">
              简洁
            </a-select-option>
            <a-select-option value="standard">
              标准模式
            </a-select-option>
          </a-select>
        </div>
        <div>
          <span class="text-sm text-gray-700 block mb-2">多模型回答样式</span>
          <a-select
            v-model:value="multiModelStyle"
            size="small"
            class="w-full"
          >
            <a-select-option value="standard">
              标准模式
            </a-select-option>
          </a-select>
        </div>
        <div>
          <span class="text-sm text-gray-700 block mb-2">对话导航按钮</span>
          <a-select
            v-model:value="conversationNavStyle"
            size="small"
            class="w-full"
          >
            <a-select-option value="hide">
              不显示
            </a-select-option>
            <a-select-option value="show">
              显示
            </a-select-option>
          </a-select>
        </div>
        <div>
          <span class="text-sm text-gray-700 block mb-2">数学公式引擎</span>
          <a-select
            v-model:value="mathEngine"
            size="small"
            class="w-full"
          >
            <a-select-option value="katex">
              KaTeX
            </a-select-option>
          </a-select>
        </div>
      </div>
    </div>

    <!-- 消息字体大小 -->
    <div class="bg-gray-50 rounded-lg p-4">
      <h3 class="text-sm font-semibold text-gray-900 mb-3">
        消息字体大小
      </h3>
      <div class="flex items-center space-x-4">
        <span class="text-sm">A</span>
        <a-slider
          v-model:value="fontSize"
          :min="12"
          :max="20"
          :step="1"
          class="flex-1"
        />
        <span class="text-lg">A</span>
      </div>
    </div>

    <!-- 代码块设置 -->
    <div class="bg-gray-50 rounded-lg p-4">
      <h3 class="text-sm font-semibold text-gray-900 mb-3">
        代码块设置
      </h3>
      <div class="text-center text-gray-500">
        <div class="text-2xl mb-2">
          ⚙️
        </div>
        <p class="text-sm">
          代码块相关设置
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

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
</script>
