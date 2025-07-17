import { defineStore } from 'pinia'
import { message } from 'ant-design-vue'
import {ConnectMCPApi} from '@/api/chatApi.ts'

// MCP 工具定义
export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: string
    properties: Record<string, any>
    required?: string[]
  }
}

// MCP 服务器配置
export interface MCPServerConfig {
  id: string
  name: string
  description: string
  enabled: boolean

  // 连接配置
  type: 'local' | 'remote' | 'stdio'

  // 本地服务器配置
  command?: string
  args?: string[]
  env?: Record<string, string>
  cwd?: string

  // 远程服务器配置
  url?: string
  headers?: Record<string, string>

  // 认证配置
  auth?: {
    type: 'bearer' | 'basic' | 'apikey'
    token?: string
    username?: string
    password?: string
    apiKey?: string
  }

  // 工具配置
  tools: MCPTool[]

  // 其他配置
  timeout?: number
  retryCount?: number
  color?: string

  // 元数据
  createdAt: number
  updatedAt: number
}

// 预定义的MCP服务器模板
export interface MCPServerTemplate {
  id: string
  name: string
  description: string
  type: MCPServerConfig['type']
  command?: string
  args?: string[]
  url?: string
  defaultTools: Omit<MCPTool, 'name'>[]
  category: 'development' | 'productivity' | 'ai' | 'system' | 'custom'
}

// 响应式状态
interface IModelServiceStore {
  mcpServers: MCPServerConfig[]
  mcpGlobalSettings: {
    enableAutoConnect: boolean;
    defaultTimeout: number
    maxRetries: number
    logLevel: string,
  }
}

export const useMCPServiceStore = defineStore('MCPService', {
  state(): IModelServiceStore {
    return {
      mcpServers: [],
      mcpGlobalSettings: {
        enableAutoConnect: true,
        defaultTimeout: 30000,
        maxRetries: 3,
        logLevel: 'info' as 'debug' | 'info' | 'warn' | 'error',
      },
    }
  },
  getters: {
    /**
     * 获取启用的 MCP 服务器
     */
    enabledMCPServers(state){
      return state.mcpServers.filter((server) => server.enabled)
    },
  },
  actions: {
    /**
     * 添加 MCP 服务器
     */
    addMCPServers(config: Omit<MCPServerConfig, 'id' | 'createdAt' | 'updatedAt'>) {
      const id = `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const server: MCPServerConfig = {
        ...config,
        id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      this.mcpServers.push(server)
      this.updateAvailableTools()

      console.log('添加 MCP 服务器:', server.name)
      message.success(`已添加 MCP 服务器: ${server.name}`)

      return id
    },
    /**
     * 切换 MCP 服务器启用状态
     */
    toggleMCPServer(id: string) {
      const index = this.mcpServers.findIndex((s) => s.id === id)
      if (index === -1) {
        message.error('未找到指定的 MCP 服务器')
        return false
      }

      const server = this.mcpServers[index]
      console.log('切换前 server.enabled:', server.enabled)

      // 创建新的数组来触发响应式更新
      const newServers = [...this.mcpServers]
      newServers[index] = {
        ...server,
        enabled: !server.enabled,
        updatedAt: Date.now(),
      }

      // 替换整个数组
      this.mcpServers = newServers

      console.log('切换后 server.enabled:', this.mcpServers[index].enabled)

      this.updateAvailableTools()

      const status = this.mcpServers[index].enabled ? '启用' : '禁用'
      console.log(`${status} MCP 服务器:`, this.mcpServers[index].name)
      message.success(`已${status} MCP 服务器: ${this.mcpServers[index].name}`)

      return true
    },
    /**
     * 删除 MCP 服务器
     */
    removeMCPServer (id: string){
      const index = this.mcpServers.findIndex((s) => s.id === id)
      if (index === -1) {
        message.error('未找到指定的 MCP 服务器')
        return false
      }

      const serverName = this.mcpServers[index].name
      this.mcpServers.splice(index, 1)

      this.updateAvailableTools()

      console.log('删除 MCP 服务器:', serverName)
      message.success(`已删除 MCP 服务器: ${serverName}`)

      return true
    },
    /**
     * 更新 MCP 服务器配置
     */
    updateMCPServer(id: string, updates: Partial<MCPServerConfig>) {
      const index = this.mcpServers.findIndex((s) => s.id === id)
      if (index === -1) {
        message.error('未找到指定的 MCP 服务器')
        return false
      }

      this.mcpServers[index] = {
        ...this.mcpServers[index],
        ...updates,
        updatedAt: Date.now(),
      }

      this.updateAvailableTools()

      return true
    },

    async initMcpServer(selectedMCPServers: string[]) {
      const selectedMCPServersObj: { [key: string]: boolean } = {}
      selectedMCPServers.forEach(item => {
        selectedMCPServersObj[item] = true
      })
      const enabledMCPServers: any[] = []
      this.enabledMCPServers.forEach(server => {
        if (selectedMCPServersObj[server.id]) {
          enabledMCPServers.push({
            ...server,
          })
        }
      })
      if (!enabledMCPServers.length) {
        return
      }
      // 通过 IPC 调用获取实际的工具信息
      const response = await ConnectMCPApi({ enabledMCPServers })
      this.setTools(response)
      return true
    },

    setTools (response: any) {
      if (response.success && response.tools) {
        // 从 clientTools 中提取工具信息
        Object.keys(response.tools).forEach(key => {
          const serverTools = response.tools[key]
          if (Array.isArray(serverTools)) {
            serverTools.forEach((tool: any) => {
              // 更新服务器配置中的工具列表
              const serverIndex = this.mcpServers.findIndex(s => s.id === key)
              if (serverIndex !== -1) {
                this.mcpServers[serverIndex].tools = this.mcpServers[serverIndex]?.tools || []
                const isTools = this.mcpServers[serverIndex].tools.some(tool => tool.name === tool.name)
                if (!isTools) {
                  this.mcpServers[serverIndex].tools.push({
                    name: tool.name,
                    description: tool.description || `MCP tool: ${tool.name}`,
                    inputSchema: tool.inputSchema || {
                      type: 'object',
                      properties: {},
                      required: [],
                    },
                  })
                }
              }
            })
          }
        })
        return true
      }
    },

    /**
     * 获取 MCP 服务器的实际工具信息
     */
    async fetchMCPServerTools(id: string) {
      const server = this.mcpServers.find((s) => s.id === id)
      if (!server || !server.enabled) {
        return []
      }

      try {
        // 通过 IPC 调用获取实际的工具信息
        const response = await ConnectMCPApi({ enabledMCPServers: [{
          id: server.id,
          name: server.name,
          description: server.description,
          enabled: server.enabled,
          type: server.type,
          command: server.command,
          args: server.args,
          env: server.env,
        }]})

        console.log('response', response)

        this.setTools(response)

        return server.tools || []
      } catch (error) {
        console.error('获取 MCP 服务器工具失败:', error)
        return server.tools || []
      }
    },
    /**
     * 测试 MCP 服务器连接并获取工具信息
     */
    async testMCPServerConnection(id: string) {
      const server = this.mcpServers.find((s) => s.id === id)
      if (!server) {
        message.error('未找到指定的 MCP 服务器')
        return false
      }
      try {
        console.log('测试 MCP 服务器连接:', server.name)

        // 获取实际的工具信息
        const tools = await this.fetchMCPServerTools(id)
        const success = tools.length > 0 || server.enabled

        if (success) {
          message.success(`MCP 服务器 "${server.name}" 连接成功，发现 ${tools.length} 个工具`)
        } else {
          message.error(`MCP 服务器 "${server.name}" 连接失败`)
        }

        return success
      } catch (error) {
        console.error('测试 MCP 服务器连接失败:', error)
        message.error(`MCP 服务器 "${server.name}" 连接失败`)
        return false
      }
    },
    /**
     * 同步 mcp tools
     */
    updateAvailableTools() {
      const tools: Array<MCPTool & { serverId: string; serverName: string }> = []

      this.mcpServers
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

      console.log('更新可用工具列表，共', tools.length, '个工具')
    },
  },
  // 这是按照插件的文档，在实例上启用了该插件，这个选项是插件特有的
  persist: true,
})
