import { McpServer } from '../../mcp/mcp-server'

export class MCPServerTools {
  static async handleConnectMCPSend (_, object) {
    try {
      const response = JSON.parse(object)
      const { enabledMCPServers } = response

      console.log('[AIGC Service] Using langchain for tool calling', enabledMCPServers)
      const mcpClient = await McpServer.getInitMcpClient(enabledMCPServers)

      // 检查是否有可用的工具
      if (!McpServer.langchainTools || McpServer.langchainTools.length === 0) {
        console.log('[AIGC Service] No MCP tools available, falling back to direct API call')
      }

      return {
        success: true,
        tools: mcpClient.clientTools,
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
