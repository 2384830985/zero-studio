<template>
  <div class="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
    <!-- 页面头部 -->
    <div class="relative bg-gradient-to-r from-blue-50/80 via-white/90 to-purple-50/80 backdrop-blur-xl border-b border-gray-200/30 shadow-lg">
      <!-- 背景装饰 -->
      <div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5" />
      <div class="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full -translate-y-16 -translate-x-16" />
      <div class="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-purple-400/10 to-transparent rounded-full translate-y-12 translate-x-12" />

      <div class="relative z-10 px-8 py-4">
        <div class="flex items-center justify-between max-w-7xl mx-auto">
          <div class="flex items-center gap-3">
            <!-- 主图标 -->
            <div class="relative">
              <div class="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 transform hover:scale-105 transition-transform duration-300">
                <AppstoreOutlined class="text-base" />
              </div>
              <div class="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
            </div>

            <!-- 标题区域 -->
            <div class="flex flex-col justify-center">
              <div class="flex items-center gap-2">
                <h1 class="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent leading-tight">
                  开发工具
                </h1>
                <div class="px-1.5 py-0.5 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded text-xs font-semibold border border-blue-200/50">
                  BETA
                </div>
              </div>
              <p class="text-xs text-gray-600 font-medium mt-0.5 leading-tight">
                🚀 提升开发效率的实用工具集合
              </p>
            </div>
          </div>

          <!-- 右侧信息 -->
          <div class="flex items-center gap-2">
            <!-- 工具统计 -->
            <div class="flex items-center gap-1.5 px-3 py-1.5 bg-white/70 backdrop-blur-sm rounded-lg border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span class="text-sm font-semibold text-gray-700">{{ tools.length }}</span>
              <span class="text-xs text-gray-500">个工具</span>
            </div>

            <!-- 状态指示 -->
            <div class="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200/50">
              <div class="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span class="text-xs font-medium text-green-700">在线</span>
            </div>
          </div>
        </div>

        <!-- 底部装饰线 -->
        <div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300/50 to-transparent" />
      </div>
    </div>

    <!-- 工具列表 -->
    <div class="flex-1 overflow-y-auto p-6">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          <div
            v-for="tool in tools"
            :key="tool.id"
            class="group bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 cursor-pointer relative overflow-hidden hover:border-blue-200 hover:-translate-y-2 hover:bg-white/90"
            @click="navigateToTool(tool.path)"
          >
            <!-- 背景装饰 -->
            <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-12 translate-x-12 group-hover:scale-150 transition-transform duration-700" />
            <div class="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-pink-500/5 to-orange-500/5 rounded-full translate-y-8 -translate-x-8 group-hover:scale-125 transition-transform duration-700" />

            <!-- 工具图标 -->
            <div class="flex items-center justify-center mb-4 relative z-10">
              <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                <ApiOutlined class="text-2xl" />
              </div>
            </div>

            <!-- 工具信息 -->
            <div class="text-center mb-4 relative z-10">
              <h3 class="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                {{ tool.name }}
              </h3>
              <div class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 mb-3">
                {{ tool.category }}
              </div>
              <p class="text-sm text-gray-600 leading-relaxed line-clamp-3">
                {{ tool.description }}
              </p>
            </div>

            <!-- 标签 -->
            <div class="flex flex-wrap gap-1.5 justify-center mb-4 relative z-10">
              <span
                v-for="tag in tool.tags.slice(0, 3)"
                :key="tag"
                class="text-xs px-2 py-1 rounded-full font-medium bg-blue-50 text-blue-600 border border-blue-100"
              >
                {{ tag }}
              </span>
              <span
                v-if="tool.tags.length > 3"
                class="text-xs px-2 py-1 rounded-full font-medium bg-gray-50 text-gray-500 border border-gray-200"
              >
                +{{ tool.tags.length - 3 }}
              </span>
            </div>

            <!-- 状态指示器 -->
            <div class="flex items-center justify-center gap-2 relative z-10">
              <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span class="text-xs text-gray-500 font-medium">可用</span>
            </div>

            <!-- 悬停效果箭头 -->
            <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
              <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white">
                <svg
                  class="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div
          v-if="tools.length === 0"
          class="text-center py-20"
        >
          <div class="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AppstoreOutlined class="text-4xl text-gray-400" />
          </div>
          <h3 class="text-2xl font-bold text-gray-900 mb-3">
            暂无工具
          </h3>
          <p class="text-gray-600 max-w-md mx-auto leading-relaxed">
            更多实用的开发工具正在开发中，敬请期待...
          </p>
        </div>

        <!-- 即将推出的工具预览 -->
        <div class="mt-12">
          <div class="text-center mb-8">
            <h2 class="text-xl font-bold text-gray-900 mb-2">
              即将推出
            </h2>
            <p class="text-gray-600">
              更多实用工具正在开发中
            </p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div
              v-for="comingTool in comingTools"
              :key="comingTool.id"
              class="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 relative overflow-hidden"
            >
              <div class="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-gray-100/50" />
              <div class="relative z-10 opacity-60">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                    <AppstoreOutlined class="text-gray-400" />
                  </div>
                  <div>
                    <h4 class="font-semibold text-gray-700">
                      {{ comingTool.name }}
                    </h4>
                    <p class="text-xs text-gray-500">
                      {{ comingTool.category }}
                    </p>
                  </div>
                </div>
                <p class="text-sm text-gray-600 mb-3">
                  {{ comingTool.description }}
                </p>
                <div class="flex items-center justify-between">
                  <span class="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full font-medium">
                    开发中
                  </span>
                  <span class="text-xs text-gray-500">{{ comingTool.eta }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  AppstoreOutlined,
  ApiOutlined,
} from '@ant-design/icons-vue'

const router = useRouter()

// 工具列表
const tools = ref([
  {
    id: 'json-converter',
    name: 'JSON 转换器',
    description: '字符串与JSON对象之间的相互转换，支持格式化和压缩，提供语法高亮和错误提示',
    category: '数据处理',
    icon: 'ApiOutlined',
    path: '/tools/json-converter',
    tags: ['JSON', '格式化', '转换', '验证'],
  },
])

// 即将推出的工具
const comingTools = ref([
  {
    id: 'base64-converter',
    name: 'Base64 编解码',
    description: 'Base64 编码解码工具，支持文本和文件转换',
    category: '编码转换',
    icon: 'CodeOutlined',
    eta: '下个版本',
  },
  {
    id: 'regex-tester',
    name: '正则表达式测试',
    description: '正则表达式在线测试工具，支持实时匹配和语法高亮',
    category: '文本处理',
    icon: 'BugOutlined',
    eta: '开发中',
  },
  {
    id: 'markdown-preview',
    name: 'Markdown 预览',
    description: 'Markdown 实时预览和编辑器，支持多种主题',
    category: '文档工具',
    icon: 'FileTextOutlined',
    eta: '规划中',
  },
  {
    id: 'sql-formatter',
    name: 'SQL 格式化',
    description: 'SQL 语句格式化和美化工具，支持多种数据库方言',
    category: '数据库',
    icon: 'DatabaseOutlined',
    eta: '规划中',
  },
])

// 方法
const navigateToTool = (path: string) => {
  router.push(path)
}
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 过渡动画 */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}

/* 动画关键帧 */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.group:hover .animate-float {
  animation: float 3s ease-in-out infinite;
}
</style>
