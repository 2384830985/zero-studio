import { ipcMain } from 'electron'
import { McpServer } from '../../mcp/mcp-server'

export class MCPServerRoutes {

  constructor() {
    //
    ipcMain.handle('connect-mcp', this.handleConnectMCPSend.bind(this))
  }

  private async handleConnectMCPSend (_, object) {
    try {
      const response = JSON.parse(object)
      const { enabledMCPServers } = response

      console.log('[AIGC Service] Using langchain for tool calling')
      const mcpServer = new McpServer(enabledMCPServers)
      await mcpServer.initMcpClient()

      // 检查是否有可用的工具
      if (!mcpServer.langchainTools || mcpServer.langchainTools.length === 0) {
        console.log('[AIGC Service] No MCP tools available, falling back to direct API call')
      }

      return {
        success: true,
        tools: mcpServer?.langchainTools || [],
      }
    } catch (error) {
      console.error('[Mcp server Routes] Error sending message:', error)
      return {
        code: 500,
        body: {
          error: 'Failed to send message',
        },
      }
    }
  }
}
