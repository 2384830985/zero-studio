<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-bold text-gray-900 mb-1">
        MCP 服务器
      </h2>
      <p class="text-sm text-gray-600 mb-4">
        管理 Model Context Protocol (MCP) 服务器配置
      </p>

      <!-- 操作按钮 -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <a-input
            v-model:value="searchQuery"
            placeholder="搜索 MCP"
            class="w-64"
          >
            <template #prefix>
              <SearchOutlined class="text-gray-400" />
            </template>
          </a-input>
        </div>
        <div class="flex items-center space-x-3">
          <a-button
            type="primary"
            @click="showAddModal = true"
          >
            <template #icon>
              <PlusOutlined />
            </template>
            添加服务器
          </a-button>
          <a-button @click="syncServers">
            <template #icon>
              <SyncOutlined />
            </template>
            同步服务器
          </a-button>
        </div>
      </div>

      <!-- MCP 服务器列表 -->
      <div class="space-y-3">
        <div
          v-for="server in filteredServers"
          :key="server.id"
          class="bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
        >
          <div class="p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3 flex-1 min-w-0">
                <div
                  class="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  :style="{ backgroundColor: server.color || '#6b7280' }"
                >
                  {{ server.name.charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2 mb-1">
                    <h3 class="text-sm font-medium text-gray-900 truncate">
                      {{ server.name }}
                    </h3>
                    <div
                      class="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"
                    />
                    <a-tag
                      size="small"
                      :color="getTypeColor(server.type)"
                      class="flex-shrink-0"
                    >
                      {{ getTypeLabel(server.type) }}
                    </a-tag>
                  </div>
                  <p class="text-xs text-gray-500 truncate mb-2">
                    {{ server.description }}
                  </p>

                  <!-- 工具和环境变量信息 -->
                  <div class="flex items-center space-x-3 text-xs text-gray-400">
                    <span class="flex items-center space-x-1">
                      <ToolOutlined class="w-3 h-3" />
                      <span>{{ server.tools.length }} 工具</span>
                    </span>
                    <span
                      v-if="server.env && Object.keys(server.env).length > 0"
                      class="flex items-center space-x-1 text-green-600"
                    >
                      <SettingOutlined class="w-3 h-3" />
                      <span>{{ Object.keys(server.env).length }} 环境变量</span>
                    </span>
                  </div>

                  <!-- 当前工具列表 -->
                  <div
                    v-if="server.tools && server.tools.length > 0"
                    class="mt-2"
                  >
                    <div class="flex flex-wrap gap-1">
                      <a-tag
                        v-for="tool in server.tools.slice(0, 3)"
                        :key="tool.name"
                        size="small"
                        color="blue"
                        class="text-xs"
                        :title="tool.description"
                      >
                        {{ tool.name }}
                      </a-tag>
                      <a-tag
                        v-if="server.tools.length > 3"
                        size="small"
                        color="default"
                        class="text-xs"
                        :title="`还有 ${server.tools.length - 3} 个工具: ${server.tools.slice(3).map(t => t.name).join(', ')}`"
                      >
                        +{{ server.tools.length - 3 }} 更多
                      </a-tag>
                    </div>
                  </div>

                  <!-- 无工具时的提示 -->
                  <div
                    v-else-if="server.enabled"
                    class="mt-2"
                  >
                    <div class="flex items-center space-x-1 text-xs text-gray-400">
                      <span>暂无工具信息</span>
                      <a-button
                        size="small"
                        type="link"
                        class="p-0 h-auto text-xs"
                        @click="refreshServerTools(server.id)"
                      >
                        点击获取
                      </a-button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex items-center space-x-2 flex-shrink-0">
                <a-switch
                  :checked="server.enabled"
                  size="small"
                  @change="() => toggleServer(server.id)"
                />
                <a-button
                  v-if="server.enabled"
                  size="small"
                  type="text"
                  title="刷新工具"
                  @click="refreshServerTools(server.id)"
                >
                  <template #icon>
                    <SyncOutlined />
                  </template>
                </a-button>
                <a-button
                  size="small"
                  type="text"
                  title="编辑"
                  @click="editServer(server)"
                >
                  <template #icon>
                    <EditOutlined />
                  </template>
                </a-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-if="filteredServers.length === 0"
        class="text-center py-8"
      >
        <div class="text-gray-400 mb-3">
          <ApiOutlined class="text-3xl" />
        </div>
        <h3 class="text-base font-medium text-gray-900 mb-2">
          暂无 MCP 服务器
        </h3>
        <p class="text-sm text-gray-500 mb-4">
          添加 MCP 服务器以启用工具调用功能
        </p>
        <a-button
          type="primary"
          size="small"
          @click="showAddModal = true"
        >
          添加第一个服务器
        </a-button>
      </div>
    </div>

    <!-- 添加/编辑服务器模态框 -->
    <a-modal
      v-model:open="showAddModal"
      :title="editingServer ? '编辑 MCP 服务器' : '添加 MCP 服务器'"
      :width="600"
      @ok="handleSaveServer"
      @cancel="handleCancelEdit"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            名称 *
          </label>
          <a-input
            v-model:value="serverForm.name"
            placeholder="输入服务器名称"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            描述
          </label>
          <a-textarea
            v-model:value="serverForm.description"
            placeholder="输入服务器描述"
            :rows="2"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            类型 *
          </label>
          <a-select
            v-model:value="serverForm.type"
            class="w-full"
          >
            <a-select-option value="stdio">
              标准输入/输出 (stdio)
            </a-select-option>
            <a-select-option value="local">
              本地进程
            </a-select-option>
            <a-select-option value="remote">
              远程服务
            </a-select-option>
          </a-select>
        </div>

        <div v-if="serverForm.type === 'local' || serverForm.type === 'stdio'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            命令 *
          </label>
          <a-input
            v-model:value="serverForm.command"
            placeholder="例如: npx"
          />
        </div>

        <div v-if="serverForm.type === 'local' || serverForm.type === 'stdio'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            参数
          </label>
          <a-textarea
            v-model:value="serverForm.argsText"
            placeholder="每行一个参数，例如:&#10;-y&#10;@jetbrains/mcp-proxy"
            :rows="3"
          />
        </div>

        <div v-if="serverForm.type === 'local' || serverForm.type === 'stdio'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            环境变量
          </label>
          <a-textarea
            v-model:value="serverForm.envText"
            placeholder="每行一个环境变量，格式: KEY=VALUE&#10;例如:&#10;NODE_ENV=production&#10;API_KEY=your_api_key"
            :rows="4"
          />
        </div>

        <div v-if="serverForm.type === 'remote'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            服务器 URL *
          </label>
          <a-input
            v-model:value="serverForm.url"
            placeholder="例如: http://localhost:3001/mcp"
          />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { message } from 'ant-design-vue'
import {
  SearchOutlined,
  PlusOutlined,
  SyncOutlined,
  EditOutlined,
  ApiOutlined,
  ToolOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue'
import {useMCPServiceStore} from '@/store'
import type { MCPServerConfig } from '../../types/mcp'

const mcpServiceStore = useMCPServiceStore()

const mcpServers = computed(() => mcpServiceStore.mcpServers)

// 响应式数据
const searchQuery = ref('')
const showAddModal = ref(false)
const editingServer = ref<MCPServerConfig | null>(null)

// 服务器表单
const serverForm = reactive({
  name: '',
  description: '',
  type: 'stdio' as 'local' | 'remote' | 'stdio',
  command: 'npx',
  argsText: '',
  envText: '',
  url: '',
})

// 计算属性
const filteredServers = computed(() => {

  if (!searchQuery.value) {
    return mcpServers.value
  }
  const query = searchQuery.value.toLowerCase()
  return mcpServers.value.filter(server =>
    server.name.toLowerCase().includes(query) ||
    server.description.toLowerCase().includes(query),
  )
})

// 方法
const toggleServer = async (id: string) => {
  const wasEnabled = mcpServers.value.find(s => s.id === id)?.enabled
  mcpServiceStore.toggleMCPServer(id)

  // 如果服务器被启用，自动获取工具信息
  const isNowEnabled = mcpServers.value.find(s => s.id === id)?.enabled
  if (!wasEnabled && isNowEnabled) {
    try {
      await mcpServiceStore.fetchMCPServerTools(id)
    } catch (error) {
      console.error('获取工具信息失败:', error)
    }
  }
}

const editServer = (server: MCPServerConfig) => {
  editingServer.value = server
  serverForm.name = server.name
  serverForm.description = server.description
  serverForm.type = server.type
  serverForm.command = server.command || 'npx'
  serverForm.argsText = server.args?.join('\n') || ''
  serverForm.envText = server.env ? Object.entries(server.env).map(([key, value]) => `${key}=${value}`).join('\n') : ''
  serverForm.url = server.url || ''
  showAddModal.value = true
}
console.log('111111', mcpServiceStore.mcpServers)
const handleSaveServer = () => {
  if (!serverForm.name.trim()) {
    message.error('请输入服务器名称')
    return
  }

  if ((serverForm.type === 'local' || serverForm.type === 'stdio') && !serverForm.command.trim()) {
    message.error('请输入命令')
    return
  }

  if (serverForm.type === 'remote' && !serverForm.url.trim()) {
    message.error('请输入服务器 URL')
    return
  }

  const args = serverForm.argsText
    .split('\n')
    .map(arg => arg.trim())
    .filter(arg => arg)
  console.log('22222', mcpServiceStore.mcpServers)
  // 解析环境变量
  const env: Record<string, string> = {}
  if (serverForm.envText.trim()) {
    serverForm.envText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line.includes('='))
      .forEach(line => {
        const [key, ...valueParts] = line.split('=')
        if (key.trim()) {
          env[key.trim()] = valueParts.join('=').trim()
        }
      })
  }
  console.log('333333', mcpServiceStore.mcpServers)
  const config = {
    name: serverForm.name,
    description: serverForm.description,
    enabled: false,
    type: serverForm.type,
    command: (serverForm.type === 'local' || serverForm.type === 'stdio') ? serverForm.command : undefined,
    args: (serverForm.type === 'local' || serverForm.type === 'stdio') ? args : undefined,
    env: (serverForm.type === 'local' || serverForm.type === 'stdio') && Object.keys(env).length > 0 ? env : undefined,
    url: serverForm.type === 'remote' ? serverForm.url : undefined,
    tools: [],
    timeout: 30000,
    retryCount: 3,
    color: '#' + Math.floor(Math.random() * 16777215).toString(16),
  }

  console.log('config', config)

  if (editingServer.value) {
    mcpServiceStore.updateMCPServer(editingServer.value.id, config)
    message.success('服务器配置已更新')
  } else {
    console.log('config222', mcpServiceStore.mcpServers)
    mcpServiceStore.addMCPServers(config)
  }

  handleCancelEdit()
}

const handleCancelEdit = () => {
  showAddModal.value = false
  editingServer.value = null

  // 重置表单
  serverForm.name = ''
  serverForm.description = ''
  serverForm.type = 'stdio'
  serverForm.command = 'npx'
  serverForm.argsText = ''
  serverForm.envText = ''
  serverForm.url = ''
}

const refreshServerTools = async (id: string) => {
  try {
    message.info('正在刷新工具信息...')
    const tools = await mcpServiceStore.fetchMCPServerTools(id)
    message.success(`已刷新工具信息，发现 ${tools.length} 个工具`)
  } catch (error) {
    console.error('刷新工具信息失败:', error)
    message.error('刷新工具信息失败')
  }
}

const syncServers = async () => {
  message.info('正在同步服务器状态...')

  for (const server of mcpServers.value.filter(s => s.enabled)) {
    await mcpServiceStore.testMCPServerConnection(server.id)
  }

  message.success('服务器状态同步完成')
}

// 辅助方法
const getTypeLabel = (type: string) => {
  const labels = {
    local: '本地',
    remote: '远程',
    stdio: 'STDIO',
  }
  return labels[type as keyof typeof labels] || type
}

const getTypeColor = (type: string) => {
  const colors = {
    local: 'blue',
    remote: 'green',
    stdio: 'orange',
  }
  return colors[type as keyof typeof colors] || 'default'
}
</script>

<style scoped>
/* 自定义样式 */
</style>
