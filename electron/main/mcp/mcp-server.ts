import {EnabledMCPServer, StdioMcpClientToFunction} from './StdioMcpServerToFunction'
import {DynamicTool} from '@langchain/core/tools'

export class McpServer {

  enabledMCPServers: EnabledMCPServer[] = []

  // 将 MCP langchain 工具
  langchainTools: DynamicTool[] = []

  mcpClient?: StdioMcpClientToFunction

  constructor(enabledMCPServers: EnabledMCPServer[]) {
    this.enabledMCPServers = enabledMCPServers
  }

  async initMcpClient() {
    // 初始化 MCP 客户端
    this.mcpClient = await StdioMcpClientToFunction.getInstance(this.enabledMCPServers)
    await this.mcpClient.fetchAllMcpServerData()
    this.callSettingTool()
  }

  callSettingTool () {
    if (!this.mcpClient) {return}
    const mcpClient = this.mcpClient
    if (this.mcpClient.allMcpServer?.tools) {
      for (const mcpTool of this.mcpClient.allMcpServer.tools) {
        console.log('mcpTool,', mcpTool)
        const dynamicTool = new DynamicTool({
          name: mcpTool.name,
          schema: mcpTool.inputSchema,
          description: mcpTool.description || `MCP tool: ${mcpTool.name}`,
          func: async (input: string) => {
            try {
              // 解析输入参数
              let args = {}
              try {
                args = JSON.parse(input)
              } catch {
                // 如果不是 JSON，根据工具类型智能处理参数
                args = this.parseToolArguments(mcpTool.name, input)
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
        dynamicTool.schema
        console.log('callSettingTool 5')
        this.langchainTools.push(dynamicTool)
      }
    }
  }

  /**
   * 根据工具名称智能解析参数
   */
  private parseToolArguments(toolName: string, input: string): any {
    // 根据常见的工具名称模式来推断参数结构
    switch (toolName) {
    case 'list_directory':
    case 'read_file':
    case 'write_file':
      return { path: input }

    case 'search':
    case 'grep':
      return { query: input }

    case 'execute':
    case 'run_command':
      return { command: input }

    case 'create_file':
      return { path: input, content: '' }

    default:
      // 对于未知工具，尝试多种常见参数名
      if (input.trim() === '.') {
        // 特殊处理当前目录
        return { path: '.' }
      }

      // 默认尝试常见的参数名
      return {
        input: input,
        path: input,
        query: input,
        content: input,
      }
    }
  }

  getTools () {
    return this.langchainTools
  }

}
