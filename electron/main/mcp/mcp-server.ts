import {EnabledMCPServer, StdioMcpClientToFunction} from './StdioMcpServerToFunction'
import { DynamicStructuredTool} from '@langchain/core/tools'
import * as console from 'node:console'

export class McpServer {

  // 将 MCP langchain 工具
  static langchainTools: DynamicStructuredTool[] = []

  static enabledMCPServersObj: { [key: string]: EnabledMCPServer } = {}

  static mcpClient?: StdioMcpClientToFunction

  static async getInitMcpClient(enabledMCPServers: EnabledMCPServer[]) {
    const isShowServer = enabledMCPServers.some(server => !this.enabledMCPServersObj[server.id])
    if (isShowServer || !this.mcpClient) {
      // 初始化 MCP 客户端
      this.mcpClient = await StdioMcpClientToFunction.getInstance(enabledMCPServers)
      await this.mcpClient.fetchAllMcpServerData()
      this.callSettingTool()
      this.enabledMCPServersObj = {}
      enabledMCPServers.forEach(server => {
        this.enabledMCPServersObj[server.id] = server
      })
    }
    return this.mcpClient
  }

  static callSettingTool () {
    if (!this.mcpClient) {return}
    const mcpClient = this.mcpClient
    if (this.mcpClient.allMcpServer?.tools) {
      for (const mcpTool of this.mcpClient.allMcpServer.tools) {
        const dynamicTool = new DynamicStructuredTool({
          schema: mcpTool.inputSchema,
          name: mcpTool.name,
          description: mcpTool.description || `MCP tool: ${mcpTool.name}`,
          func: async (input: string | object) => {
            try {
              // 解析输入参数
              let args = {}
              try {
                if (typeof input === 'string') {
                  args = JSON.parse(input)
                } else {
                  args = input
                }
              } catch {
                // 如果不是 JSON，根据工具类型智能处理参数
              }

              console.log(`[MCP Server] Calling tool ${mcpTool.name} with args:`, args)

              // 调用 MCP 工具
              const result = await mcpClient.callTool(mcpTool.name, args)
              return JSON.stringify(result)
            } catch (error) {
              console.error(`[MCP Server] Error calling tool ${mcpTool.name}:`, error)
              return `Error calling tool: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          },
        })
        this.langchainTools.push(dynamicTool)
      }
    }
  }

}
