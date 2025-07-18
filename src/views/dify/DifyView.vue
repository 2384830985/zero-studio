<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <!-- 顶部工具栏 -->
    <div class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <h1 class="text-xl font-semibold text-gray-900">
          Dify AI 平台
        </h1>
        <div class="flex items-center space-x-2">
          <a-tag :color="connectionStatus === 'connected' ? 'green' : 'red'">
            {{ connectionStatus === 'connected' ? '已连接' : '未连接' }}
          </a-tag>
        </div>
      </div>

      <div class="flex items-center space-x-3">
        <!-- 集成模式切换 -->
        <a-select
          v-model:value="integrationMode"
          style="width: 120px"
          @change="handleModeChange"
        >
          <a-select-option value="iframe">
            Web 嵌入
          </a-select-option>
          <a-select-option value="api">
            API 集成
          </a-select-option>
          <a-select-option value="local">
            本地部署
          </a-select-option>
        </a-select>

        <!-- 设置按钮 -->
        <a-button
          type="primary"
          @click="showConfigModal = true"
        >
          <template #icon>
            <SettingOutlined />
          </template>
          配置
        </a-button>

        <!-- 刷新按钮 -->
        <a-button @click="refreshDify">
          <template #icon>
            <ReloadOutlined />
          </template>
        </a-button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="flex-1 relative">
      <!-- iframe 模式 -->
      <div
        v-if="integrationMode === 'iframe'"
        class="h-full"
      >
        <div
          v-if="!difyUrl"
          class="h-full flex items-center justify-center"
        >
          <div class="text-center">
            <CloudServerOutlined class="text-6xl text-gray-400 mb-4" />
            <h3 class="text-lg font-medium text-gray-900 mb-2">
              配置 Dify 服务地址
            </h3>
            <p class="text-gray-500 mb-4">
              请先配置 Dify 服务的访问地址
            </p>
            <a-button
              type="primary"
              @click="showConfigModal = true"
            >
              立即配置
            </a-button>
          </div>
        </div>
        <iframe
          v-else
          :src="difyUrl"
          name="dify"
          class="w-full h-full border-0"
          @load="handleIframeLoad"
        />
      </div>

      <!-- API 集成模式 -->
      <div
        v-else-if="integrationMode === 'api'"
        class="h-full p-6"
      >
        <div class="max-w-4xl mx-auto">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
              Dify API 集成
            </h2>

            <!-- API 配置状态 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">API 端点</span>
                  <a-tag :color="apiConfig.endpoint ? 'green' : 'orange'">
                    {{ apiConfig.endpoint ? '已配置' : '未配置' }}
                  </a-tag>
                </div>
                <p class="text-xs text-gray-500 mt-1">
                  {{ apiConfig.endpoint || '未设置' }}
                </p>
              </div>

              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">API 密钥</span>
                  <a-tag :color="apiConfig.apiKey ? 'green' : 'orange'">
                    {{ apiConfig.apiKey ? '已配置' : '未配置' }}
                  </a-tag>
                </div>
                <p class="text-xs text-gray-500 mt-1">
                  {{ apiConfig.apiKey ? '••••••••' : '未设置' }}
                </p>
              </div>
            </div>

            <!-- API 测试 -->
            <div class="border-t border-gray-200 pt-4">
              <h3 class="text-md font-medium text-gray-900 mb-3">
                API 测试
              </h3>
              <div class="flex space-x-3">
                <a-input
                  v-model:value="testMessage"
                  placeholder="输入测试消息..."
                  class="flex-1"
                  @press-enter="testDifyAPI"
                />
                <a-button
                  type="primary"
                  :loading="apiTesting"
                  :disabled="!apiConfig.endpoint || !apiConfig.apiKey"
                  @click="testDifyAPI"
                >
                  测试
                </a-button>
              </div>

              <!-- API 响应 -->
              <div
                v-if="apiResponse"
                class="mt-4 p-4 bg-gray-50 rounded-lg"
              >
                <h4 class="text-sm font-medium text-gray-700 mb-2">
                  API 响应：
                </h4>
                <pre class="text-xs text-gray-600 whitespace-pre-wrap">{{ apiResponse }}</pre>
              </div>
            </div>
          </div>

          <!-- 可用的 Dify 应用列表 -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
              Dify 应用
            </h2>
            <div
              v-if="difyApps.length === 0"
              class="text-center py-8"
            >
              <AppstoreOutlined class="text-4xl text-gray-400 mb-2" />
              <p class="text-gray-500">
                暂无可用应用
              </p>
              <a-button
                type="link"
                @click="loadDifyApps"
              >
                刷新应用列表
              </a-button>
            </div>
            <div
              v-else
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <div
                v-for="app in difyApps"
                :key="app.id"
                class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                @click="selectDifyApp(app)"
              >
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-medium text-gray-900">
                    {{ app.name }}
                  </h3>
                  <a-tag :color="app.status === 'active' ? 'green' : 'orange'">
                    {{ app.status === 'active' ? '活跃' : '停用' }}
                  </a-tag>
                </div>
                <p class="text-sm text-gray-500 mb-3">
                  {{ app.description }}
                </p>
                <div class="flex items-center justify-between text-xs text-gray-400">
                  <span>类型: {{ app.type }}</span>
                  <span>{{ app.updated_at }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 本地部署模式 -->
      <div
        v-else-if="integrationMode === 'local'"
        class="h-full p-6"
      >
        <div class="max-w-4xl mx-auto">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
              本地 Dify 部署
            </h2>

            <div class="space-y-6">
              <!-- Docker 部署 -->
              <div class="border border-gray-200 rounded-lg p-4">
                <h3 class="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <CloudServerOutlined class="mr-2" />
                  Docker 部署
                </h3>
                <p class="text-sm text-gray-600 mb-4">
                  使用 Docker Compose 快速部署 Dify
                </p>

                <div class="bg-gray-900 rounded-lg p-4 mb-4">
                  <code class="text-green-400 text-sm">
                    # 克隆 Dify 仓库<br>
                    git clone https://github.com/langgenius/dify.git<br>
                    cd dify/docker<br><br>
                    # 启动服务<br>
                    docker-compose up -d
                  </code>
                </div>

                <div class="flex space-x-3">
                  <a-button
                    type="primary"
                    @click="checkDockerStatus"
                  >
                    检查 Docker 状态
                  </a-button>
                  <a-button @click="openDifyDocs">
                    查看文档
                  </a-button>
                </div>
              </div>

              <!-- 源码部署 -->
              <div class="border border-gray-200 rounded-lg p-4">
                <h3 class="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <CodeOutlined class="mr-2" />
                  源码部署
                </h3>
                <p class="text-sm text-gray-600 mb-4">
                  从源码构建和部署 Dify
                </p>

                <div class="bg-gray-900 rounded-lg p-4 mb-4">
                  <code class="text-green-400 text-sm">
                    # 安装依赖<br>
                    cd api && pip install -r requirements.txt<br>
                    cd ../web && npm install<br><br>
                    # 启动后端<br>
                    cd ../api && python app.py<br><br>
                    # 启动前端<br>
                    cd ../web && npm run dev
                  </code>
                </div>

                <a-button @click="openGithubRepo">
                  访问 GitHub 仓库
                </a-button>
              </div>

              <!-- 部署状态 -->
              <div class="border border-gray-200 rounded-lg p-4">
                <h3 class="text-md font-medium text-gray-900 mb-3">
                  部署状态
                </h3>
                <div class="grid grid-cols-2 gap-4">
                  <div class="bg-gray-50 rounded-lg p-3">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium text-gray-700">API 服务</span>
                      <a-tag color="red">
                        未运行
                      </a-tag>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">
                      http://localhost:5001
                    </p>
                  </div>
                  <div class="bg-gray-50 rounded-lg p-3">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium text-gray-700">Web 服务</span>
                      <a-tag color="red">
                        未运行
                      </a-tag>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">
                      http://localhost:3000
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 配置模态框 -->
    <a-modal
      v-model:open="showConfigModal"
      title="Dify 配置"
      width="600px"
      @ok="saveConfig"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">服务地址</label>
          <a-input
            v-model:value="configForm.url"
            placeholder="https://your-dify-instance.com"
          />
          <p class="text-xs text-gray-500 mt-1">
            Dify 服务的访问地址
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">API 端点</label>
          <a-input
            v-model:value="configForm.apiEndpoint"
            placeholder="https://api.dify.ai/v1"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">API 密钥</label>
          <a-input-password
            v-model:value="configForm.apiKey"
            placeholder="app-xxxxxxxxxxxxxxxx"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">应用 ID</label>
          <a-input
            v-model:value="configForm.appId"
            placeholder="应用的唯一标识符"
          />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  SettingOutlined,
  ReloadOutlined,
  CloudServerOutlined,
  AppstoreOutlined,
  CodeOutlined,
} from '@ant-design/icons-vue'

// 响应式数据
const integrationMode = ref<'iframe' | 'api' | 'local'>('iframe')
const connectionStatus = ref<'connected' | 'disconnected'>('disconnected')
const showConfigModal = ref(false)
const difyUrl = ref('')
const apiTesting = ref(false)
const testMessage = ref('')
const apiResponse = ref('')

// 配置表单
const configForm = ref({
  url: 'https://cloud.dify.ai',
  apiEndpoint: 'https://api.dify.ai/v1',
  apiKey: '',
  appId: '',
})

// API 配置
const apiConfig = ref({
  endpoint: '',
  apiKey: '',
  appId: '',
})

// Dify 应用列表
const difyApps = ref<Array<{
  id: string
  name: string
  description: string
  type: string
  status: string
  updated_at: string
}>>([])

// 方法
const handleModeChange = (mode: string) => {
  console.log('切换到模式:', mode)
  if (mode === 'iframe' && difyUrl.value) {
    checkConnection()
  }
}

const handleIframeLoad = () => {
  connectionStatus.value = 'connected'
}

const refreshDify = () => {
  if (integrationMode.value === 'iframe' && difyUrl.value) {
    // 重新加载 iframe
    const iframe = document.querySelector('iframe')
    if (iframe) {
      const currentSrc = iframe.src
      iframe.src = ''
      iframe.src = currentSrc
    }
  } else if (integrationMode.value === 'api') {
    loadDifyApps()
  }
}

const saveConfig = () => {
  // 保存配置
  difyUrl.value = configForm.value.url
  apiConfig.value = {
    endpoint: configForm.value.apiEndpoint,
    apiKey: configForm.value.apiKey,
    appId: configForm.value.appId,
  }

  // 保存到本地存储
  localStorage.setItem('dify-config', JSON.stringify(configForm.value))

  showConfigModal.value = false

  if (integrationMode.value === 'iframe') {
    checkConnection()
  }
}

const checkConnection = () => {
  // 检查连接状态
  if (difyUrl.value) {
    connectionStatus.value = 'connected'
  } else {
    connectionStatus.value = 'disconnected'
  }
}

const testDifyAPI = async () => {
  if (!testMessage.value.trim()) {return}

  apiTesting.value = true
  try {
    // 模拟 API 调用
    const response = await fetch(`${apiConfig.value.endpoint}/chat-messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.value.apiKey}`,
      },
      body: JSON.stringify({
        inputs: {},
        query: testMessage.value,
        response_mode: 'blocking',
        conversation_id: '',
        user: 'test-user',
      }),
    })

    const data = await response.json()
    apiResponse.value = JSON.stringify(data, null, 2)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    apiResponse.value = `错误: ${errorMessage}`
  } finally {
    apiTesting.value = false
  }
}

const loadDifyApps = async () => {
  // 模拟加载应用列表
  difyApps.value = [
    {
      id: '1',
      name: 'ChatBot Assistant',
      description: '智能聊天助手，支持多轮对话',
      type: 'chatbot',
      status: 'active',
      updated_at: '2024-01-15',
    },
    {
      id: '2',
      name: 'Document QA',
      description: '文档问答系统，基于知识库回答问题',
      type: 'qa',
      status: 'active',
      updated_at: '2024-01-10',
    },
  ]
}

const selectDifyApp = (app: any) => {
  console.log('选择应用:', app)
  // 这里可以切换到选中的应用
}

const checkDockerStatus = () => {
  // 检查 Docker 状态
  console.log('检查 Docker 状态')
}

const openDifyDocs = () => {
  window.open('https://docs.dify.ai/', '_blank')
}

const openGithubRepo = () => {
  window.open('https://github.com/langgenius/dify', '_blank')
}

// 生命周期
onMounted(() => {
  // 加载保存的配置
  const savedConfig = localStorage.getItem('dify-config')
  if (savedConfig) {
    const config = JSON.parse(savedConfig)
    configForm.value = config
    difyUrl.value = config.url
    apiConfig.value = {
      endpoint: config.apiEndpoint,
      apiKey: config.apiKey,
      appId: config.appId,
    }
  }

  checkConnection()
  loadDifyApps()
})
</script>

<style scoped>
/* 自定义样式 */
.ant-tag {
  border-radius: 4px;
}

code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: 1.5;
}
</style>
