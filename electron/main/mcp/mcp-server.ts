import {EnabledMCPServer, StdioMcpClientToFunction} from '../llm/StdioMcpServerToFunction'
import {DynamicTool} from '@langchain/core/tools'

export class McpServer {

  enabledMCPServers: EnabledMCPServer[] = []

  // 将 MCP langchain 工具
  langchainTools: DynamicTool[] = []

  mcpClient?: StdioMcpClientToFunction

  constructor(enabledMCPServers = []) {
    this.enabledMCPServers = enabledMCPServers
    this.initMcpClient(enabledMCPServers)
  }

  async initMcpClient(enabledMCPServers: EnabledMCPServer[]) {
    // 初始化 MCP 客户端
    this.mcpClient = await StdioMcpClientToFunction.getInstance(enabledMCPServers)
    await this.mcpClient.fetchAllMcpServerData()
    this.callSettingTool()
  }

  callSettingTool () {

    if (!this.mcpClient) {return}

    const mcpClient = this.mcpClient

    if (this.mcpClient.allMcpServer?.tools) {
      for (const mcpTool of this.mcpClient.allMcpServer.tools) {
        const dynamicTool = new DynamicTool({
          name: mcpTool.name,
          description: mcpTool.description || `MCP tool: ${mcpTool.name}`,
          async func (input: string) {
            try {
              // 解析输入参数
              let args = {}
              try {
                args = JSON.parse(input)
              } catch {
                // 如果不是 JSON，直接作为字符串参数
                args = { input }
              }

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

  getTools () {
    return this.langchainTools
  }

}
