/**
 * MCP 管理器
 * 负责管理 MCP 服务器连接、工具调用等功能
 */

import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { createSettingsStorage, STORAGE_KEYS } from './settingsStorage'
import type {
  MCPServerConfig,
  MCPSettings,
  MCPServerStatus,
  MCPTool,
  MCPToolCallRequest,
  MCPToolCallResponse,
  MCPServerTemplate,
} from '../types/mcp'

// MCP 设置存储
const mcpStorage = createSettingsStorage(STORAGE_KEYS.MCP_SETTINGS)

// 响应式状态
export const mcpServers = ref<MCPServerConfig[]>([])
export const mcpServerStatuses = reactive<Map<string, MCPServerStatus>>(new Map())
export const availableTools = ref<Array<MCPTool & { serverId: string; serverName: string }>>([])

// 强制刷新计数器
export const refreshCounter = ref(0)

// 全局设置
export const mcpGlobalSettings = ref({
  enableAutoConnect: true,
  defaultTimeout: 30000,
  maxRetries: 3,
  logLevel: 'info' as 'debug' | 'info' | 'warn' | 'error',
})

/**
 * 预定义的 MCP 服务器模板
 */
export const mcpServerTemplates: MCPServerTemplate[] = [
  {
    id: 'filesystem',
    name: '文件系统工具',
    description: '提供文件读写、目录操作等功能',
    type: 'local',
    command: 'npx',
    args: ['@modelcontextprotocol/server-filesystem', '/path/to/allowed/directory'],
    category: 'system',
    defaultTools: [
      {
        description: '读取文件内容',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: '文件路径' },
          },
          required: ['path'],
        },
      },
    ],
  },
  {
    id: 'git',
    name: 'Git 工具',
    description: '提供 Git 版本控制操作功能',
    type: 'local',
    command: 'npx',
    args: ['@modelcontextprotocol/server-git'],
    category: 'development',
    defaultTools: [
      {
        description: 'Git 状态查询',
        inputSchema: {
          type: 'object',
          properties: {
            repository: { type: 'string', description: '仓库路径' },
          },
        },
      },
    ],
  },
  {
    id: 'webstorm',
    name: 'MCP webstorm',
    description: 'JetBrains WebStorm MCP 代理服务器',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@jetbrains/mcp-proxy'],
    category: 'development',
    defaultTools: [
      {
        description: 'WebStorm 集成工具',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', description: '操作类型' },
          },
          required: ['action'],
        },
      },
    ],
  },
  {
    id: 'memory',
    name: '@cherry/memory',
    description: '基于本地知识图谱的持久化记忆，这使得模型能够在不同对话间记住用户的相关信息',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@cherry/memory'],
    category: 'ai',
    defaultTools: [
      {
        description: '记忆管理',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: '记忆内容' },
            type: { type: 'string', description: '记忆类型' },
          },
          required: ['content'],
        },
      },
    ],
  },
]

/**
 * 加载 MCP 配置
 */
export function loadMCPSettings(): MCPSettings | null {
  try {
    const settings = mcpStorage.load() as MCPSettings | null
    if (settings) {
      mcpServers.value = settings.servers || []
      mcpGlobalSettings.value = { ...mcpGlobalSettings.value, ...settings.globalSettings }
      updateAvailableTools()
      console.log('MCP 配置加载成功')
      return settings
    }
    return null
  } catch (error) {
    console.error('加载 MCP 配置失败:', error)
    return null
  }
}

/**
 * 保存 MCP 配置
 */
export function saveMCPSettings(): boolean {
  try {
    const settings: MCPSettings = {
      servers: mcpServers.value,
      globalSettings: mcpGlobalSettings.value,
      lastUpdated: Date.now(),
    }

    const success = mcpStorage.save(settings)
    if (success) {
      console.log('MCP 配置保存成功')
    }
    return success
  } catch (error) {
    console.error('保存 MCP 配置失败:', error)
    return false
  }
}

/**
 * 添加 MCP 服务器
 */
export function addMCPServer(config: Omit<MCPServerConfig, 'id' | 'createdAt' | 'updatedAt'>): string {
  const id = `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const server: MCPServerConfig = {
    ...config,
    id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  mcpServers.value.push(server)
  updateAvailableTools()
  saveMCPSettings()

  console.log('添加 MCP 服务器:', server.name)
  message.success(`已添加 MCP 服务器: ${server.name}`)

  return id
}

/**
 * 更新 MCP 服务器配置
 */
export function updateMCPServer(id: string, updates: Partial<MCPServerConfig>): boolean {
  const index = mcpServers.value.findIndex((s) => s.id === id)
  if (index === -1) {
    message.error('未找到指定的 MCP 服务器')
    return false
  }

  mcpServers.value[index] = {
    ...mcpServers.value[index],
    ...updates,
    updatedAt: Date.now(),
  }

  updateAvailableTools()
  saveMCPSettings()

  return true
}

/**
 * 删除 MCP 服务器
 */
export function removeMCPServer(id: string): boolean {
  const index = mcpServers.value.findIndex((s) => s.id === id)
  if (index === -1) {
    message.error('未找到指定的 MCP 服务器')
    return false
  }

  const serverName = mcpServers.value[index].name
  mcpServers.value.splice(index, 1)
  mcpServerStatuses.delete(id)

  updateAvailableTools()
  saveMCPSettings()

  console.log('删除 MCP 服务器:', serverName)
  message.success(`已删除 MCP 服务器: ${serverName}`)

  return true
}

/**
 * 切换 MCP 服务器启用状态
 */
export function toggleMCPServer(id: string): boolean {
  const index = mcpServers.value.findIndex((s) => s.id === id)
  if (index === -1) {
    message.error('未找到指定的 MCP 服务器')
    return false
  }

  const server = mcpServers.value[index]
  console.log('切换前 server.enabled:', server.enabled)
  
  // 创建新的数组来触发响应式更新
  const newServers = [...mcpServers.value]
  newServers[index] = {
    ...server,
    enabled: !server.enabled,
    updatedAt: Date.now(),
  }

  // 替换整个数组
  mcpServers.value = newServers

  // 强制触发响应式更新
  refreshCounter.value++

  console.log('切换后 server.enabled:', mcpServers.value[index].enabled)

  updateAvailableTools()
  saveMCPSettings()

  const status = mcpServers.value[index].enabled ? '启用' : '禁用'
  console.log(`${status} MCP 服务器:`, mcpServers.value[index].name)
  message.success(`已${status} MCP 服务器: ${mcpServers.value[index].name}`)

  return true
}

/**
 * 更新可用工具列表
 */
function updateAvailableTools() {
  const tools: Array<MCPTool & { serverId: string; serverName: string }> = []

  mcpServers.value
    .filter((server) => server.enabled)
    .forEach((server) => {
      server.tools.forEach((tool) => {
        tools.push({
          ...tool,
          serverId: server.id,
          serverName: server.name,
        })
      })
    })

  availableTools.value = tools
  console.log('更新可用工具列表，共', tools.length, '个工具')
}

/**
 * 测试 MCP 服务器连接
 */
export async function testMCPServerConnection(id: string): Promise<boolean> {
  const server = mcpServers.value.find((s) => s.id === id)
  if (!server) {
    message.error('未找到指定的 MCP 服务器')
    return false
  }

  try {
    console.log('测试 MCP 服务器连接:', server.name)

    // 更新状态为连接中
    mcpServerStatuses.set(id, {
      id,
      connected: false,
      toolsCount: server.tools.length,
    })

    // 模拟连接测试
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 模拟连接成功
    const success = Math.random() > 0.2 // 80% 成功率

    mcpServerStatuses.set(id, {
      id,
      connected: success,
      lastPing: Date.now(),
      error: success ? undefined : '连接超时',
      toolsCount: server.tools.length,
    })

    if (success) {
      message.success(`MCP 服务器 "${server.name}" 连接成功`)
    } else {
      message.error(`MCP 服务器 "${server.name}" 连接失败`)
    }

    return success
  } catch (error) {
    console.error('测试 MCP 服务器连接失败:', error)

    mcpServerStatuses.set(id, {
      id,
      connected: false,
      error: error instanceof Error ? error.message : '未知错误',
      toolsCount: server.tools.length,
    })

    message.error(`MCP 服务器 "${server.name}" 连接失败`)
    return false
  }
}

/**
 * 调用 MCP 工具
 */
export async function callMCPTool(request: MCPToolCallRequest): Promise<MCPToolCallResponse> {
  const server = mcpServers.value.find((s) => s.id === request.serverId)
  if (!server) {
    return {
      success: false,
      error: '未找到指定的 MCP 服务器',
      metadata: {
        serverId: request.serverId,
        toolName: request.toolName,
      },
    }
  }

  const tool = server.tools.find((t) => t.name === request.toolName)
  if (!tool) {
    return {
      success: false,
      error: '未找到指定的工具',
      metadata: {
        serverId: request.serverId,
        toolName: request.toolName,
      },
    }
  }

  try {
    console.log('调用 MCP 工具:', {
      server: server.name,
      tool: tool.name,
      arguments: request.arguments,
    })

    const startTime = Date.now()

    // 模拟工具调用
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000))

    // 模拟调用结果
    const mockResult = {
      toolName: tool.name,
      arguments: request.arguments,
      result: `模拟执行结果: ${tool.description}`,
      timestamp: Date.now(),
    }

    const executionTime = Date.now() - startTime

    return {
      success: true,
      result: mockResult,
      metadata: {
        executionTime,
        serverId: request.serverId,
        toolName: request.toolName,
      },
    }
  } catch (error) {
    console.error('调用 MCP 工具失败:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      metadata: {
        serverId: request.serverId,
        toolName: request.toolName,
      },
    }
  }
}

/**
 * 获取启用的 MCP 服务器
 */
export function getEnabledMCPServers(): MCPServerConfig[] {
  return mcpServers.value.filter((server) => server.enabled)
}

/**
 * 根据模板创建 MCP 服务器
 */
export function createMCPServerFromTemplate(templateId: string, customConfig?: Partial<MCPServerConfig>): string | null {
  const template = mcpServerTemplates.find((t) => t.id === templateId)
  if (!template) {
    message.error('未找到指定的模板')
    return null
  }

  const tools: MCPTool[] = template.defaultTools.map((toolTemplate, index) => ({
    name: `${template.id}_tool_${index + 1}`,
    ...toolTemplate,
  }))

  const config: Omit<MCPServerConfig, 'id' | 'createdAt' | 'updatedAt'> = {
    name: template.name,
    description: template.description,
    enabled: false,
    type: template.type,
    command: template.command,
    args: template.args,
    url: template.url,
    tools,
    timeout: mcpGlobalSettings.value.defaultTimeout,
    retryCount: mcpGlobalSettings.value.maxRetries,
    color: '#' + Math.floor(Math.random() * 16777215).toString(16),
    ...customConfig,
  }

  return addMCPServer(config)
}

// 初始化时加载配置
loadMCPSettings()
