<template>
  <div class="h-screen flex bg-gray-50">
    <!-- 左侧导航 -->
    <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
      <!-- 标题 -->
      <div class="px-6 py-4 border-b border-gray-200">
        <h1 class="text-xl font-semibold text-gray-900">
          设置
        </h1>
      </div>
      
      <!-- 导航菜单 -->
      <div class="flex-1 py-4">
        <div class="space-y-1 px-3">
          <div
            v-for="item in menuItems"
            :key="item.key"
            class="flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors"
            :class="activeTab === item.key ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
            @click="activeTab = item.key"
          >
            <component
              :is="item.icon"
              class="mr-3 h-5 w-5"
            />
            {{ item.label }}
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧内容区域 -->
    <div class="flex-1 overflow-auto">
      <div class="max-w-4xl mx-auto p-8">
        <!-- 显示设置 -->
        <div
          v-if="activeTab === 'display'"
          class="space-y-8"
        >
          <div>
            <h2 class="text-2xl font-bold text-gray-900 mb-6">
              显示设置
            </h2>
            
            <!-- 主题设置 -->
            <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">
                主题
              </h3>
              <div class="flex space-x-4">
                <button
                  v-for="theme in themes"
                  :key="theme.key"
                  class="flex items-center px-4 py-2 rounded-lg border transition-colors"
                  :class="selectedTheme === theme.key ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'"
                  @click="selectedTheme = theme.key"
                >
                  <component
                    :is="theme.icon"
                    class="mr-2 h-4 w-4"
                  />
                  {{ theme.label }}
                </button>
              </div>
            </div>

            <!-- 主题颜色 -->
            <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">
                主题颜色
              </h3>
              <div class="flex flex-wrap gap-3">
                <div
                  v-for="color in themeColors"
                  :key="color.value"
                  class="w-8 h-8 rounded-full cursor-pointer border-2 transition-transform hover:scale-110"
                  :class="selectedColor === color.value ? 'border-gray-400 scale-110' : 'border-gray-200'"
                  :style="{ backgroundColor: color.value }"
                  @click="selectedColor = color.value"
                />
                <div class="flex items-center ml-4">
                  <span class="text-sm font-mono text-gray-600">{{ selectedColor }}</span>
                </div>
              </div>
            </div>

            <!-- 透明窗口 -->
            <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">
                    透明窗口
                  </h3>
                  <p class="text-sm text-gray-500 mt-1">
                    启用窗口透明效果
                  </p>
                </div>
                <a-switch v-model:checked="transparentWindow" />
              </div>
            </div>
          </div>
        </div>

        <!-- 缩放设置 -->
        <div
          v-if="activeTab === 'zoom'"
          class="space-y-8"
        >
          <div>
            <h2 class="text-2xl font-bold text-gray-900 mb-6">
              缩放设置
            </h2>
            
            <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">
                缩放
              </h3>
              <div class="flex items-center space-x-4">
                <button
                  class="w-8 h-8 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-50"
                  @click="decreaseZoom"
                >
                  <MinusOutlined class="h-4 w-4" />
                </button>
                <div class="flex items-center space-x-2">
                  <span class="text-lg font-medium">{{ zoomLevel }}%</span>
                </div>
                <button
                  class="w-8 h-8 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-50"
                  @click="increaseZoom"
                >
                  <PlusOutlined class="h-4 w-4" />
                </button>
                <button
                  class="ml-4 w-8 h-8 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-50"
                  @click="resetZoom"
                >
                  <ReloadOutlined class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 话题设置 -->
        <div
          v-if="activeTab === 'topic'"
          class="space-y-8"
        >
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

        <!-- 助手设置 -->
        <div
          v-if="activeTab === 'assistant'"
          class="space-y-8"
        >
          <div>
            <h2 class="text-2xl font-bold text-gray-900 mb-6">
              助手设置
            </h2>
            
            <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">
                助手配置
              </h3>
              <p class="text-gray-500">
                助手相关设置将在此处配置...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  DesktopOutlined,
  ExpandOutlined,
  MessageOutlined,
  RobotOutlined,
  BulbOutlined,
  EyeInvisibleOutlined,
  LaptopOutlined,
  MinusOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue'

// 当前激活的标签页
const activeTab = ref('display')

// 菜单项
const menuItems = [
  { key: 'display', label: '显示设置', icon: DesktopOutlined },
  { key: 'zoom', label: '缩放设置', icon: ExpandOutlined },
  { key: 'topic', label: '话题设置', icon: MessageOutlined },
  { key: 'assistant', label: '助手设置', icon: RobotOutlined },
]

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

// 话题位置选项
const topicPositions = [
  { key: 'left', label: '左侧' },
  { key: 'right', label: '右侧' },
]

// 响应式数据
const selectedTheme = ref('light')
const selectedColor = ref('#00B96B')
const transparentWindow = ref(false)
const zoomLevel = ref(100)
const selectedTopicPosition = ref('left')
const autoSwitchTopic = ref(true)
const showTopicTime = ref(false)
const fixTopicWindow = ref(false)

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
</script>

<style scoped>
/* 自定义样式 */
</style>
