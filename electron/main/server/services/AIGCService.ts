import {AIMessage, HumanMessage, ToolMessage} from '@langchain/core/messages'
// import {DynamicTool} from '@langchain/core/tools'
// import {EnabledMCPServer, StdioMcpClientToFunction} from '../../mcp/StdioMcpServerToFunction'
import {McpServer} from '../../mcp/mcp-server'
import {getModel, IMetadata} from '../llm'
import {IMessageMetadata} from '../types'
import {BaseMessage} from '@langchain/core/dist/messages/base'
import {getExhibitionTEXT, getExhibitionTOOLS, IExhibitionCon} from '../utils'

/**
 * AIGC服务类
 * 负责处理AI API调用和工具调用
 */
export class AIGCService {
  /**
   * 使用LangChain处理工具调用
   */
  async handleToolCallingWithLangchain(
    messages: any[],
    metadata: any,
    sendStreaming: (content: string) => void,
  ): Promise<any> {
    try {
      // 创建 实例，使用AIGC 配置
      console.log('[AIGC Service] LangChain configuration:')
      console.log('  - baseURL:', metadata.service.apiUrl)
      console.log('  - model:', metadata.model)
      const llm = getModel(metadata)

      // 绑定工具到 LLM
      const llmWithTools = llm.bindTools(McpServer.langchainTools)
      // console.log('[AIGC Service] 绑定工具到 LLM', llmWithTools)
      console.log('[AIGC Service] McpServer.langchainTools.length', McpServer.langchainTools.length)

      const cardList: IExhibitionCon[] = []

      // 调用 LLM
      const response = await llmWithTools.invoke(messages)

      cardList.push(getExhibitionTEXT((response?.content || '') as string))

      // 先返回数据流
      sendStreaming(response.content as string)

      // 处理工具调用
      if (response.tool_calls && response.tool_calls.length > 0) {
        const toolMessages: ToolMessage[] = []
        const toolCalls: any[] = []
        const toolResults: any[] = []

        for (const toolCall of response.tool_calls) {
          const startTime = Date.now()

          // 记录工具调用信息
          const mcpToolCall = {
            id: toolCall.id || `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: toolCall.name,
            arguments: toolCall.args,
            serverId: 'mcp-server', // 可以从 enabledMCPServers 中获取具体的服务器ID
            serverName: 'MCP Server', // 可以从 enabledMCPServers 中获取具体的服务器名称
          }
          toolCalls.push(mcpToolCall)

          try {
            console.log('toolCall.name', toolCall.name, toolCall.args)
            const toolResult = await McpServer.mcpClient?.callTool(toolCall.name, toolCall.args)
            const executionTime = Date.now() - startTime

            // 记录工具执行结果
            const mcpToolResult = {
              toolCallId: mcpToolCall.id,
              toolName: toolCall.name,
              success: true,
              result: toolResult,
              executionTime,
            }

            cardList.push(getExhibitionTOOLS({
              toolCalls: [mcpToolCall],
              toolResults: [mcpToolResult],
            }))

            toolResults.push(mcpToolResult)

            toolMessages.push(new ToolMessage({
              content: JSON.stringify(toolResult),
              tool_call_id: toolCall.id || 'unknown',
            }))
            console.log('tool call', JSON.stringify(toolResult))
          } catch (error) {
            const executionTime = Date.now() - startTime
            console.error(`[AIGC Service] Error executing tool ${toolCall.name}:`, error)

            // 记录工具执行错误
            const mcpToolResult = {
              toolCallId: mcpToolCall.id,
              toolName: toolCall.name,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              executionTime,
            }
            toolResults.push(mcpToolResult)

            toolMessages.push(new ToolMessage({
              content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              tool_call_id: toolCall.id || 'unknown',
            }))
          }
        }
        const summaryPrompt = `请扮演一个助手，根据对话历史（包括你之前的行为和工具调用结果）来总结并回答用户的问题。请重点注意以下几点：
- 你之前尝试调用工具来获取信息。
- 如果工具调用失败，请向用户解释失败原因，并建议正确的做法。
- 如果工具调用成功，请整合工具返回的信息给出最终回答。

请用清晰、简洁的语言进行总结，并直接给出最终答案。
`
        // 如果有工具调用，需要再次调用 LLM 获取最终回复
        const finalMessages = [
          ...messages,
          new AIMessage({
            content: response.content,
            tool_calls: response.tool_calls,
          }),
          ...toolMessages,
          new HumanMessage(summaryPrompt),
        ]

        // 如果是流式响应，返回流式结果
        const finalStream = await llm.invoke(finalMessages)

        cardList.push(getExhibitionTEXT(finalStream.content as string))

        return {
          content: `${response.content}\n${finalStream.content}`,
          toolCalls,
          toolResults,
          cardList,
        }
      }

      // 没有工具调用，直接返回响应
      if (metadata.setting.streamOutput) {
        const responseStream = await llmWithTools.stream(messages)
        return {
          stream: responseStream,
        }
      } else {
        return {
          content: response.content,
        }
      }
    } catch (error) {
      console.error('[AIGC Service] Error in langchain tool calling:', error)
      return this.callAIGC(messages,metadata, () => undefined)
    }
  }

  /**
   * 调用AIGC API
   */
  async callAIGC(
    messages: BaseMessage[],
    metadata: IMessageMetadata,
    sendStreaming: (content: string) => void,
  ): Promise<any> {
    if (!metadata.model) {
      throw new Error('model 不能为空')
    }
    if (!metadata) {
      throw new Error('metadata 不能为空')
    }
    // 如果有工具调用需求，使用 langchain 进行处理
    if (
      McpServer?.langchainTools?.length > 0
    ) {
      try {
        return await this.handleToolCallingWithLangchain(messages, metadata, sendStreaming)
      } catch (error) {
        console.error('[AIGC Service] Tool calling failed, falling back to direct API call:', error)
        // 继续执行直接API调用
      }
    }

    try {
      if (metadata && metadata.setting && metadata?.setting.streamOutput) {
        const stream = getModel(metadata as IMetadata).stream(
          messages,
        )
        return {
          stream: await stream,
        }
      } else {
        const res = await getModel(metadata as IMetadata).invoke(
          messages,
        )
        return {
          content: res.content,
        }
      }

    } catch (error) {
      console.error('[AIGC Service] Error calling AIGC API:', error)
      throw error
    }
  }
}
