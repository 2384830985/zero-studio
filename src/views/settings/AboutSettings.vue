<template>
  <div class="about-settings">
    <!-- 页面标题 -->
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-2">
        关于我们
      </h2>
      <p class="text-sm text-gray-600">
        了解 Big Brother Studio 的详细信息
      </p>
    </div>

    <!-- 应用信息卡片 -->
    <div class="bg-white rounded-lg border border-gray-200 mb-6">
      <div class="p-6">
        <div class="flex items-center space-x-4 mb-6">
          <!-- 应用图标 -->
          <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <RobotOutlined class="text-2xl text-white" />
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-900 mb-1">
              Big Brother Studio
            </h3>
            <p class="text-gray-600 mb-2">
              一款为创造者而生的 AI 助手
            </p>
            <div class="flex items-center space-x-2">
              <a-tag
                color="blue"
                class="text-xs"
              >
                v{{ appVersion }}
              </a-tag>
              <a-tag
                color="green"
                class="text-xs"
              >
                {{ buildDate }}
              </a-tag>
            </div>
          </div>
          <div class="ml-auto">
            <a-button
              type="primary"
              size="small"
              :loading="checkingUpdate"
              @click="checkForUpdates"
            >
              {{ checkingUpdate ? '检查中...' : '立即更新' }}
            </a-button>
          </div>
        </div>

        <!-- 应用描述 -->
        <div class="prose prose-sm max-w-none text-gray-700">
          <p>
            Big Brother Studio 是一个强大的 AI 助手平台，集成了多种先进的人工智能服务和工具。
            我们致力于为用户提供最佳的 AI 体验，帮助提高工作效率和创造力。
          </p>
        </div>
      </div>
    </div>

    <!-- 功能特性 -->
    <div class="bg-white rounded-lg border border-gray-200 mb-6">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-base font-medium text-gray-900">
          核心功能
        </h3>
      </div>
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div class="flex-shrink-0">
              <component
                :is="feature.icon"
                :class="feature.color"
                class="text-lg"
              />
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-900 mb-1">
                {{ feature.title }}
              </h4>
              <p class="text-xs text-gray-600">
                {{ feature.description }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 系统信息 -->
    <div class="bg-white rounded-lg border border-gray-200 mb-6">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-base font-medium text-gray-900">
          系统信息
        </h3>
      </div>
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="info in systemInfo"
            :key="info.label"
            class="flex justify-between items-center py-2"
          >
            <span class="text-sm text-gray-600">{{ info.label }}</span>
            <span class="text-sm font-medium text-gray-900">{{ info.value }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 更新日志 -->
    <div class="bg-white rounded-lg border border-gray-200 mb-6">
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 class="text-base font-medium text-gray-900">
          更新日志
        </h3>
        <a-button
          type="text"
          size="small"
          @click="showFullChangelog = !showFullChangelog"
        >
          {{ showFullChangelog ? '收起' : '查看全部' }}
        </a-button>
      </div>
      <div class="p-6">
        <div class="space-y-4">
          <div
            v-for="(release, index) in (showFullChangelog ? changelog : changelog.slice(0, 3))"
            :key="release.version"
            class="border-l-2 border-blue-200 pl-4"
            :class="{ 'border-blue-500': index === 0 }"
          >
            <div class="flex items-center space-x-2 mb-2">
              <h4 class="text-sm font-semibold text-gray-900">
                v{{ release.version }}
              </h4>
              <a-tag
                v-if="index === 0"
                color="green"
                size="small"
              >
                最新
              </a-tag>
              <span class="text-xs text-gray-500">{{ release.date }}</span>
            </div>
            <ul class="space-y-1">
              <li
                v-for="change in release.changes"
                :key="change"
                class="text-sm text-gray-600 flex items-start space-x-2"
              >
                <span class="text-green-500 mt-1">•</span>
                <span>{{ change }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷链接 -->
    <div class="bg-white rounded-lg border border-gray-200 mb-6">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-base font-medium text-gray-900">
          快捷链接
        </h3>
      </div>
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a-button
            v-for="link in quickLinks"
            :key="link.title"
            class="flex items-center justify-between h-12 px-4"
            @click="handleLinkClick(link)"
          >
            <div class="flex items-center space-x-3">
              <component
                :is="link.icon"
                :class="link.color"
                class="text-lg"
              />
              <span class="text-sm font-medium">{{ link.title }}</span>
            </div>
            <div class="text-xs text-gray-500">
              {{ link.action }}
            </div>
          </a-button>
        </div>
      </div>
    </div>

    <!-- 开发团队 -->
    <div class="bg-white rounded-lg border border-gray-200 mb-6">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-base font-medium text-gray-900">
          开发团队
        </h3>
      </div>
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="member in teamMembers"
            :key="member.name"
            class="text-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <a-avatar
              :size="48"
              :src="member.avatar"
              class="mb-3"
            >
              {{ member.name.charAt(0) }}
            </a-avatar>
            <h4 class="text-sm font-medium text-gray-900 mb-1">
              {{ member.name }}
            </h4>
            <p class="text-xs text-gray-600 mb-2">
              {{ member.role }}
            </p>
            <div class="flex justify-center space-x-2">
              <a-button
                v-if="member.github"
                type="text"
                size="small"
                @click="openLink(member.github)"
              >
                <GithubOutlined />
              </a-button>
              <a-button
                v-if="member.email"
                type="text"
                size="small"
                @click="openLink(`mailto:${member.email}`)"
              >
                <MailOutlined />
              </a-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 许可证信息 -->
    <div class="bg-white rounded-lg border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-base font-medium text-gray-900">
          许可证信息
        </h3>
      </div>
      <div class="p-6">
        <div class="prose prose-sm max-w-none text-gray-700">
          <p class="mb-4">
            Big Brother Studio 采用 MIT 许可证开源发布。
          </p>
          <div class="bg-gray-50 rounded-lg p-4 text-xs font-mono">
            <p class="mb-2">
              MIT License
            </p>
            <p class="mb-2">
              Copyright (c) {{ currentYear }} Big Brother Studio Team
            </p>
            <p class="text-gray-600">
              Permission is hereby granted, free of charge, to any person obtaining a copy
              of this software and associated documentation files...
            </p>
          </div>
          <div class="mt-4 flex items-center space-x-4 text-sm">
            <a-button
              type="link"
              size="small"
              @click="openLink('https://github.com/your-repo/license')"
            >
              查看完整许可证
            </a-button>
            <a-button
              type="link"
              size="small"
              @click="openLink('https://github.com/your-repo')"
            >
              GitHub 仓库
            </a-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  RobotOutlined,
  MessageOutlined,
  ApiOutlined,
  ToolOutlined,
  GlobalOutlined,
  FileTextOutlined,
  ScanOutlined,
  SettingOutlined,
  GithubOutlined,
  MailOutlined,
  HomeOutlined,
  BugOutlined,
  BookOutlined,
} from '@ant-design/icons-vue'

// 应用信息
const appVersion = ref('1.5.1')
const buildDate = ref('2024-01-15')
const checkingUpdate = ref(false)
const showFullChangelog = ref(false)

// 当前年份
const currentYear = computed(() => new Date().getFullYear())

// 核心功能列表
const features = [
  {
    title: '智能对话',
    description: '支持多种 AI 模型的智能对话功能',
    icon: MessageOutlined,
    color: 'text-blue-500',
  },
  {
    title: 'MCP 服务器',
    description: '模型上下文协议服务器集成',
    icon: ApiOutlined,
    color: 'text-green-500',
  },
  {
    title: '工具集成',
    description: '丰富的工具和插件生态系统',
    icon: ToolOutlined,
    color: 'text-purple-500',
  },
  {
    title: '网络搜索',
    description: '集成多种搜索引擎的网络搜索功能',
    icon: GlobalOutlined,
    color: 'text-orange-500',
  },
  {
    title: '文档处理',
    description: '智能文档解析和处理能力',
    icon: FileTextOutlined,
    color: 'text-indigo-500',
  },
  {
    title: 'OCR 识别',
    description: '光学字符识别和图像处理',
    icon: ScanOutlined,
    color: 'text-pink-500',
  },
]

// 系统信息
const systemInfo = ref([
  { label: '操作系统', value: 'macOS Sequoia' },
  { label: '架构', value: 'arm64' },
  { label: 'Node.js 版本', value: 'v18.17.0' },
  { label: 'Electron 版本', value: 'v25.3.0' },
  { label: '安装路径', value: '/Applications/BigBrotherStudio.app' },
  { label: '数据目录', value: '~/Library/Application Support/BigBrotherStudio' },
])

// 更新日志
const changelog = [
  {
    version: '1.5.1',
    date: '2024-01-15',
    changes: [
      '新增全局记忆功能',
      'MCP 支持 DXT 格式导入',
      '全局快捷键支持 Linux 系统',
      '模型思考过程增加动画效果',
      '错误修复和性能优化',
    ],
  },
  {
    version: '1.5.0',
    date: '2024-01-10',
    changes: [
      '添加工具设置页面',
      '支持网络搜索配置',
      '新增文档预处理功能',
      '集成 OCR 识别能力',
      '优化用户界面体验',
    ],
  },
  {
    version: '1.4.11',
    date: '2024-01-05',
    changes: [
      '修复聊天记录同步问题',
      '改进模型响应速度',
      '增加更多快捷键支持',
      '优化内存使用',
    ],
  },
  {
    version: '1.4.10',
    date: '2023-12-28',
    changes: [
      '支持自定义主题',
      '新增批量操作功能',
      '改进错误处理机制',
      '更新依赖库版本',
    ],
  },
]

// 快捷链接
const quickLinks = [
  {
    title: '更新日志',
    action: '查看',
    icon: BookOutlined,
    color: 'text-blue-500',
    url: 'https://github.com/your-repo/releases',
  },
  {
    title: '官方网站',
    action: '查看',
    icon: HomeOutlined,
    color: 'text-green-500',
    url: 'https://bigbrotherstudio.com',
  },
  {
    title: '意见反馈',
    action: '反馈',
    icon: BugOutlined,
    color: 'text-orange-500',
    url: 'https://github.com/your-repo/issues',
  },
  {
    title: '许可证',
    action: '查看',
    icon: BookOutlined,
    color: 'text-purple-500',
    url: 'https://github.com/your-repo/blob/main/LICENSE',
  },
  {
    title: '邮件联系',
    action: '邮件',
    icon: MailOutlined,
    color: 'text-red-500',
    url: 'mailto:support@bigbrotherstudio.com',
  },
  {
    title: '调试面板',
    action: '打开',
    icon: SettingOutlined,
    color: 'text-gray-500',
    action_type: 'debug',
  },
]

// 开发团队
const teamMembers = [
  {
    name: '张三',
    role: '项目负责人',
    avatar: '',
    github: 'https://github.com/zhangsan',
    email: 'zhangsan@bigbrotherstudio.com',
  },
  {
    name: '李四',
    role: '前端开发',
    avatar: '',
    github: 'https://github.com/lisi',
    email: 'lisi@bigbrotherstudio.com',
  },
  {
    name: '王五',
    role: '后端开发',
    avatar: '',
    github: 'https://github.com/wangwu',
    email: 'wangwu@bigbrotherstudio.com',
  },
  {
    name: '赵六',
    role: 'UI/UX 设计',
    avatar: '',
    github: 'https://github.com/zhaoliu',
    email: 'zhaoliu@bigbrotherstudio.com',
  },
]

// 检查更新
const checkForUpdates = async () => {
  checkingUpdate.value = true
  try {
    // 模拟检查更新
    await new Promise(resolve => setTimeout(resolve, 2000))
    message.info('当前已是最新版本')
  } catch (error) {
    message.error('检查更新失败')
  } finally {
    checkingUpdate.value = false
  }
}

// 处理链接点击
const handleLinkClick = (link: any) => {
  if (link.action_type === 'debug') {
    // 打开调试面板
    try {
      if (window.electronAPI && (window.electronAPI as any).openDevTools) {
        (window.electronAPI as any).openDevTools()
      }
      message.info('调试面板已打开')
    } catch (error) {
      message.error('无法打开调试面板')
    }
  } else if (link.url) {
    openLink(link.url)
  }
}

// 打开外部链接
const openLink = (url: string) => {
  try {
    if (window.electronAPI && (window.electronAPI as any).openExternal) {
      (window.electronAPI as any).openExternal(url)
    } else {
      window.open(url, '_blank')
    }
  } catch (error) {
    window.open(url, '_blank')
  }
}

// 获取系统信息
const getSystemInfo = () => {
  try {
    if (window.electronAPI && (window.electronAPI as any).getSystemInfo) {
      // 从 Electron 获取系统信息
      (window.electronAPI as any).getSystemInfo().then((info: any) => {
        systemInfo.value = [
          { label: '操作系统', value: info.platform || 'Unknown' },
          { label: '架构', value: info.arch || 'Unknown' },
          { label: 'Node.js 版本', value: info.nodeVersion || 'Unknown' },
          { label: 'Electron 版本', value: info.electronVersion || 'Unknown' },
          { label: '应用版本', value: info.appVersion || appVersion.value },
          { label: '构建时间', value: info.buildTime || buildDate.value },
        ]
      }).catch(() => {
        // 如果获取失败，使用默认值
      })
    }
  } catch (error) {
    // 如果获取失败，使用默认值
  }
}

onMounted(() => {
  getSystemInfo()
})
</script>

<style scoped>
.about-settings {
  /* 自定义样式 */
}

.prose {
  line-height: 1.6;
}

.prose p {
  margin-bottom: 1rem;
}
</style>
