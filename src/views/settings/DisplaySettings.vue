<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-bold text-gray-900 mb-1">
        显示设置
      </h2>
      <p class="text-sm text-gray-600 mb-4">
        自定义应用外观和主题配置
      </p>

      <!-- 主题设置 -->
      <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-4">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">
          主题
        </h3>
        <div class="flex space-x-3">
          <button
            v-for="theme in themes"
            :key="theme.key"
            class="flex items-center px-3 py-1.5 rounded-lg border transition-colors text-sm"
            :class="selectedTheme === theme.key ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'"
            @click="selectedTheme = theme.key"
          >
            <component
              :is="theme.icon"
              class="mr-1.5 h-3 w-3"
            />
            {{ theme.label }}
          </button>
        </div>
      </div>

      <!-- 主题颜色 -->
      <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-4">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">
          主题颜色
        </h3>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="color in themeColors"
            :key="color.value"
            class="w-6 h-6 rounded-full cursor-pointer border-2 transition-transform hover:scale-110"
            :class="selectedColor === color.value ? 'border-gray-400 scale-110' : 'border-gray-200'"
            :style="{ backgroundColor: color.value }"
            @click="selectedColor = color.value"
          />
          <div class="flex items-center ml-3">
            <span class="text-xs font-mono text-gray-600">{{ selectedColor }}</span>
          </div>
        </div>
      </div>

      <!-- 透明窗口 -->
      <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-gray-900">
              透明窗口
            </h3>
            <p class="text-xs text-gray-500 mt-0.5">
              启用窗口透明效果
            </p>
          </div>
          <a-switch
            v-model:checked="transparentWindow"
            size="small"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import {
  BulbOutlined,
  EyeInvisibleOutlined,
  LaptopOutlined,
} from '@ant-design/icons-vue'

// 本地存储的键名
const STORAGE_KEY = 'display-settings-config'

// 主题选项
const themes = [
  { key: 'light', label: '浅色', icon: BulbOutlined },
  { key: 'dark', label: '深色', icon: EyeInvisibleOutlined },
  { key: 'system', label: '系统', icon: LaptopOutlined },
]

// 主题颜色
const themeColors = [
  { value: '#10b981' },
  { value: '#f43f5e' },
  { value: '#06b6d4' },
  { value: '#8b5cf6' },
  { value: '#a855f7' },
  { value: '#ec4899' },
  { value: '#3b82f6' },
  { value: '#f59e0b' },
  { value: '#8b5cf6' },
  { value: '#06b6d4' },
  { value: '#1e40af' },
  { value: '#00B96B' },
]

// 响应式数据
const selectedTheme = ref('light')
const selectedColor = ref('#00B96B')
const transparentWindow = ref(false)

// 本地存储相关方法
const saveToLocalStorage = () => {
  try {
    const configData = {
      selectedTheme: selectedTheme.value,
      selectedColor: selectedColor.value,
      transparentWindow: transparentWindow.value,
      lastUpdated: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configData))
    console.log('显示设置已保存到本地存储')
  } catch (error) {
    console.error('保存显示设置失败:', error)
  }
}

const loadFromLocalStorage = () => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY)
    if (savedData) {
      const configData = JSON.parse(savedData)
      selectedTheme.value = configData.selectedTheme || 'light'
      selectedColor.value = configData.selectedColor || '#00B96B'
      transparentWindow.value = configData.transparentWindow || false
      console.log('从本地存储加载显示设置成功')
    }
  } catch (error) {
    console.error('加载显示设置失败:', error)
  }
}

// 组件挂载时加载配置
onMounted(() => {
  loadFromLocalStorage()
})

// 监听配置变化，自动保存
watch([selectedTheme, selectedColor, transparentWindow], () => {
  saveToLocalStorage()
})
</script>
