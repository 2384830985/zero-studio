<template>
  <div class="h-screen flex bg-gray-50">
    <!-- 左侧导航 -->
    <div class="w-64 bg-white border-r border-gray-200 flex flex-col">
      <!-- 标题 -->
      <div class="px-4 py-3 border-b border-gray-200">
        <h1 class="text-lg font-semibold text-gray-900">
          设置
        </h1>
      </div>
      
      <!-- 导航菜单 -->
      <div class="flex-1 py-3">
        <div class="space-y-1 px-2">
          <router-link
            v-for="item in menuItems"
            :key="item.key"
            :to="item.path"
            class="flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors"
            :class="$route.path === item.path ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
          >
            <component
              :is="item.icon"
              class="mr-2.5 h-4 w-4"
            />
            {{ item.label }}
          </router-link>
        </div>
      </div>
    </div>

    <!-- 右侧内容区域 -->
    <div class="flex-1 overflow-auto">
      <div class="max-w-4xl mx-auto p-6">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  DesktopOutlined,
  ExpandOutlined,
  MessageOutlined,
  RobotOutlined,
  ApiOutlined,
  ToolOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons-vue'

// 菜单项
const menuItems = [
  { key: 'model', label: '模型服务', icon: RobotOutlined, path: '/settings/model' },
  { key: 'mcp', label: 'MCP 服务器', icon: ApiOutlined, path: '/settings/mcp' },
  { key: 'tool', label: '工具设置', icon: ToolOutlined, path: '/settings/tool' },
  { key: 'display', label: '显示设置', icon: DesktopOutlined, path: '/settings/display' },
  { key: 'zoom', label: '缩放设置', icon: ExpandOutlined, path: '/settings/zoom' },
  { key: 'topic', label: '话题设置', icon: MessageOutlined, path: '/settings/topic' },
  { key: 'assistant', label: '助手设置', icon: RobotOutlined, path: '/settings/assistant' },
  { key: 'about', label: '关于我们', icon: InfoCircleOutlined, path: '/settings/about' },
]
</script>

<style scoped>
/* 自定义样式 */
</style>
