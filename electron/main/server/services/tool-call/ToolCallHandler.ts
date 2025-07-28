import {ToolMessage} from '@langchain/core/messages'
import {McpServer} from '../../../mcp/mcp-server'
import {getExhibitionTOOLS, IExhibitionCon} from '../../utils'

/**
 * 工具调用处理器
 * 负责处理单个和批量工具调用
 */
export class ToolCallHandler {
  /**
   * 处理单个工具调用
   */
  async handleSingleToolCall(toolCall: any): Promise<{
    toolCall: any
    toolResult: any
    toolMessage: ToolMessage
  }> {
    const startTime = Date.now()

    const mcpToolCall = {
      id: toolCall.id || `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: toolCall.name,
      arguments: toolCall.args,
      serverId: 'mcp-server',
      serverName: 'MCP Server',
    }

    try {
      console.log('toolCall.name', toolCall.name, toolCall.args)
      const toolResult = await McpServer.mcpClient?.callTool(toolCall.name, toolCall.args)
      const executionTime = Date.now() - startTime

      const mcpToolResult = {
        toolCallId: mcpToolCall.id,
        toolName: toolCall.name,
        success: true,
        result: toolResult,
        executionTime,
      }

      const toolMessage = new ToolMessage({
        content: JSON.stringify(toolResult),
        tool_call_id: toolCall.id || 'unknown',
      })

      console.log('tool call', JSON.stringify(toolResult))

      return {
        toolCall: mcpToolCall,
        toolResult: mcpToolResult,
        toolMessage,
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      console.error(`[AIGC Service] Error executing tool ${toolCall.name}:`, error)

      const mcpToolResult = {
        toolCallId: mcpToolCall.id,
        toolName: toolCall.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
      }

      const toolMessage = new ToolMessage({
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tool_call_id: toolCall.id || 'unknown',
      })

      return {
        toolCall: mcpToolCall,
        toolResult: mcpToolResult,
        toolMessage,
      }
    }
  }

  /**
   * 批量处理工具调用
   */
  async handleMultipleToolCalls(toolCalls: any[]): Promise<{
    toolCalls: any[]
    toolResults: any[]
    toolMessages: ToolMessage[]
    cardList: IExhibitionCon[]
  }> {
    const allToolCalls: any[] = []
    const allToolResults: any[] = []
    const allToolMessages: ToolMessage[] = []
    const cardList: IExhibitionCon[] = []

    for (const toolCall of toolCalls) {
      const result = await this.handleSingleToolCall(toolCall)

      allToolCalls.push(result.toolCall)
      allToolResults.push(result.toolResult)
      allToolMessages.push(result.toolMessage)

      // 为每个工具调用创建展示卡片
      cardList.push(getExhibitionTOOLS({
        toolCalls: [result.toolCall],
        toolResults: [result.toolResult],
      }))
    }

    return {
      toolCalls: allToolCalls,
      toolResults: allToolResults,
      toolMessages: allToolMessages,
      cardList,
    }
  }
}
