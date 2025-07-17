<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-bold text-gray-900 mb-1">
        缩放设置
      </h2>
      <p class="text-sm text-gray-600 mb-4">
        调整应用界面的缩放比例
      </p>

      <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">
          缩放
        </h3>
        <div class="flex items-center space-x-3">
          <button
            class="w-7 h-7 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-50"
            @click="decreaseZoom"
          >
            <MinusOutlined class="h-3 w-3" />
          </button>
          <div class="flex items-center space-x-2">
            <span class="text-sm font-medium">{{ zoomLevel }}%</span>
          </div>
          <button
            class="w-7 h-7 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-50"
            @click="increaseZoom"
          >
            <PlusOutlined class="h-3 w-3" />
          </button>
          <button
            class="ml-3 w-7 h-7 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-50"
            @click="resetZoom"
          >
            <ReloadOutlined class="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import {
  MinusOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue'

// 本地存储的键名
const STORAGE_KEY = 'zoom-settings-config'

// 响应式数据
const zoomLevel = ref(100)

// 缩放控制方法
const increaseZoom = () => {
  if (zoomLevel.value < 200) {
    zoomLevel.value += 10
  }
}

const decreaseZoom = () => {
  if (zoomLevel.value > 50) {
    zoomLevel.value -= 10
  }
}

const resetZoom = () => {
  zoomLevel.value = 100
}

// 本地存储相关方法
const saveToLocalStorage = () => {
  try {
    const configData = {
      zoomLevel: zoomLevel.value,
      lastUpdated: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configData))
    console.log('缩放设置已保存到本地存储')
  } catch (error) {
    console.error('保存缩放设置失败:', error)
  }
}

const loadFromLocalStorage = () => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY)
    if (savedData) {
      const configData = JSON.parse(savedData)
      zoomLevel.value = configData.zoomLevel || 100
      console.log('从本地存储加载缩放设置成功')
    }
  } catch (error) {
    console.error('加载缩放设置失败:', error)
  }
}

// 组件挂载时加载配置
onMounted(() => {
  loadFromLocalStorage()
})

// 监听配置变化，自动保存
watch(zoomLevel, () => {
  saveToLocalStorage()
})
</script>
