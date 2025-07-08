<template>
  <div class="space-y-8">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 mb-6">
        话题设置
      </h2>

      <!-- 话题位置 -->
      <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          话题位置
        </h3>
        <div class="flex space-x-4">
          <button
            v-for="position in topicPositions"
            :key="position.key"
            class="px-4 py-2 rounded-lg border transition-colors"
            :class="selectedTopicPosition === position.key ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'"
            @click="selectedTopicPosition = position.key"
          >
            {{ position.label }}
          </button>
        </div>
      </div>

      <!-- 自动切换到话题 -->
      <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">
              自动切换到话题
            </h3>
            <p class="text-sm text-gray-500 mt-1">
              新建对话时自动切换到话题视图
            </p>
          </div>
          <a-switch v-model:checked="autoSwitchTopic" />
        </div>
      </div>

      <!-- 显示话题时间 -->
      <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">
              显示话题时间
            </h3>
            <p class="text-sm text-gray-500 mt-1">
              在话题列表中显示创建时间
            </p>
          </div>
          <a-switch v-model:checked="showTopicTime" />
        </div>
      </div>

      <!-- 固定话题窗口 -->
      <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">
              固定话题窗口
            </h3>
            <p class="text-sm text-gray-500 mt-1">
              话题窗口始终保持打开状态
            </p>
          </div>
          <a-switch v-model:checked="fixTopicWindow" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

// 本地存储的键名
const STORAGE_KEY = 'topic-settings-config'

// 话题位置选项
const topicPositions = [
  { key: 'left', label: '左侧' },
  { key: 'right', label: '右侧' },
]

// 响应式数据
const selectedTopicPosition = ref('left')
const autoSwitchTopic = ref(true)
const showTopicTime = ref(false)
const fixTopicWindow = ref(false)

// 本地存储相关方法
const saveToLocalStorage = () => {
  try {
    const configData = {
      selectedTopicPosition: selectedTopicPosition.value,
      autoSwitchTopic: autoSwitchTopic.value,
      showTopicTime: showTopicTime.value,
      fixTopicWindow: fixTopicWindow.value,
      lastUpdated: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configData))
    console.log('话题设置已保存到本地存储')
  } catch (error) {
    console.error('保存话题设置失败:', error)
  }
}

const loadFromLocalStorage = () => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY)
    if (savedData) {
      const configData = JSON.parse(savedData)
      selectedTopicPosition.value = configData.selectedTopicPosition || 'left'
      autoSwitchTopic.value = configData.autoSwitchTopic ?? true
      showTopicTime.value = configData.showTopicTime ?? false
      fixTopicWindow.value = configData.fixTopicWindow ?? false
      console.log('从本地存储加载话题设置成功')
    }
  } catch (error) {
    console.error('加载话题设置失败:', error)
  }
}

// 组件挂载时加载配置
onMounted(() => {
  loadFromLocalStorage()
})

// 监听配置变化，自动保存
watch([selectedTopicPosition, autoSwitchTopic, showTopicTime, fixTopicWindow], () => {
  saveToLocalStorage()
})
</script>
