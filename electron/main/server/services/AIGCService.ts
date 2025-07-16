import {log} from 'node:console'
import {ChatOpenAI} from '@langchain/openai'
import {AIMessage, HumanMessage, ToolMessage} from '@langchain/core/messages'
// import {DynamicTool} from '@langchain/core/tools'
// import {EnabledMCPServer, StdioMcpClientToFunction} from '../../mcp/StdioMcpServerToFunction'
import {EnabledMCPServer} from '../../mcp/StdioMcpServerToFunction'
import {McpServer} from '../../mcp/mcp-server'
import {CommunicationRole} from '../../mcp'

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
    stream: boolean,
    model: string,
    enabledMCPServers: EnabledMCPServer[],
    metadata: any,
    onToolCall?: (toolCall: any) => void,
    onToolResult?: (toolResult: any) => void,
  ): Promise<any> {
    try {
      console.log('[AIGC Service] Using langchain for tool calling')
      const mcpServer = new McpServer(enabledMCPServers)
      await mcpServer.initMcpClient()

      // 检查是否有可用的工具
      if (!mcpServer.langchainTools || mcpServer.langchainTools.length === 0) {
        console.log('[AIGC Service] No MCP tools available, falling back to direct API call')
        return this.callAIGC(messages, stream, model, [], metadata)
      }

      // 创建 ChatOpenAI 实例，使用AIGC 配置
      console.log('[AIGC Service] LangChain configuration:')
      console.log('  - baseURL:', metadata.service.apiUrl)
      console.log('  - model:', model)

      const llm = new ChatOpenAI({
        openAIApiKey: metadata.service.apiKey,
        configuration: {
          baseURL: metadata.service.apiUrl,
        },
        model, // 使用映射后的模型名称
        temperature: 0.7,
        maxTokens: 2000,
        streaming: stream,
      })

      // 绑定工具到 LLM
      const llmWithTools = llm.bindTools(mcpServer.langchainTools)

      log('[AIGC Service] 绑定工具到 LLM', llmWithTools)
      log('[AIGC Service] 创建代理', llmWithTools)

      // 转换消息格式
      const langchainMessages = messages.map((msg: any) => {
        switch (msg.role) {
        case CommunicationRole.USER:
          return new HumanMessage(msg.content)
        case CommunicationRole.ASSISTANT:
          return new AIMessage(msg.content)
        default:
          return new HumanMessage(msg.content)
        }
      })

      // 调用 LLM
      const response = await llmWithTools.invoke(langchainMessages)

      console.log('llm', response.content)

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

          // 实时发送工具调用信息
          if (onToolCall) {
            onToolCall(mcpToolCall)
          }

          try {
            const toolResult = await mcpServer?.mcpClient?.callTool(toolCall.name, toolCall.args)
            const executionTime = Date.now() - startTime

            // 记录工具执行结果
            const mcpToolResult = {
              toolCallId: mcpToolCall.id,
              toolName: toolCall.name,
              success: true,
              result: toolResult,
              executionTime,
            }
            toolResults.push(mcpToolResult)

            // 实时发送工具结果信息
            if (onToolResult) {
              onToolResult(mcpToolResult)
            }

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

            // 实时发送工具错误信息
            if (onToolResult) {
              onToolResult(mcpToolResult)
            }

            toolMessages.push(new ToolMessage({
              content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              tool_call_id: toolCall.id || 'unknown',
            }))
          }
        }

        // 如果有工具调用，需要再次调用 LLM 获取最终回复
        const finalMessages = [...langchainMessages, response, ...toolMessages]
        console.log('finalMessages', finalMessages)
        console.log('stream', stream)

        // 如果是流式响应，返回流式结果
        if (stream) {
          const finalStream = await llmWithTools.invoke(finalMessages)
          return {
            content: `${response.content}\n${finalStream.content}`,
            toolCalls,
            toolResults,
          }
        } else {
          // 转换为标准格式返回，包含工具调用信息
          const finalResponse = await llmWithTools.invoke(finalMessages)
          return {
            content: finalResponse.content,
            toolCalls,
            toolResults,
          }
        }
      }

      console.log('1112312312312')

      // 没有工具调用，直接返回响应
      if (stream) {
        const responseStream = await llmWithTools.stream(langchainMessages)
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
      console.log('[AIGC Service] Falling back to direct API call due to langchain error')
      return this.callAIGC(messages, stream, model, [], null)
    }
  }

  /**
   * 调用AIGC API
   */
  async callAIGC(
    messages: any[],
    stream = false,
    model: string,
    enabledMCPServers: EnabledMCPServer[],
    metadata: any,
  ): Promise<any> {
    if (!model) {
      throw new Error('model 不能为空')
    }
    if (!metadata) {
      throw new Error('metadata 不能为空')
    }
    // 如果有工具调用需求，使用 langchain 进行处理
    if (enabledMCPServers && enabledMCPServers.length > 0) {
      try {
        return await this.handleToolCallingWithLangchain(messages, stream, model, enabledMCPServers, metadata)
      } catch (error) {
        console.error('[AIGC Service] Tool calling failed, falling back to direct API call:', error)
        // 继续执行直接API调用
      }
    }

    try {
      const stream = new ChatOpenAI({
        openAIApiKey: metadata.service.apiKey,
        configuration: {
          baseURL: metadata.service.apiUrl,
        },
        model: model, // 使用映射后的模型名称
        temperature: 0.7,
        maxTokens: 2000,
      }).stream(
        messages,
      )
      return {
        stream: await stream,
      }
    } catch (error) {
      console.error('[AIGC Service] Error calling AIGC API:', error)
      throw error
    }
  }
}
