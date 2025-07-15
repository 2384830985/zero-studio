import {log} from 'node:console'
import {ChatOpenAI} from '@langchain/openai'
import {AIMessage, HumanMessage, ToolMessage} from '@langchain/core/messages'
// import {DynamicTool} from '@langchain/core/tools'
// import {EnabledMCPServer, StdioMcpClientToFunction} from '../../mcp/StdioMcpServerToFunction'
import {EnabledMCPServer} from '../../mcp/StdioMcpServerToFunction'
import {McpServer} from '../../mcp/mcp-server'

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
        streaming: true,
      })

      // 绑定工具到 LLM
      const llmWithTools = llm.bindTools(mcpServer.langchainTools)

      log('[AIGC Service] 绑定工具到 LLM', llmWithTools)
      log('[AIGC Service] 创建代理', llmWithTools)

      // 转换消息格式
      const langchainMessages = messages.map((msg: any) => {
        switch (msg.role) {
        case 'user':
          return new HumanMessage(msg.content)
        case 'assistant':
          return new AIMessage(msg.content)
        default:
          return new HumanMessage(msg.content)
        }
      })

      // 调用 LLM
      const response = await llmWithTools.invoke(langchainMessages)

      console.log('llm', response)

      // 处理工具调用
      if (response.tool_calls && response.tool_calls.length > 0) {
        const toolMessages: ToolMessage[] = []

        for (const toolCall of response.tool_calls) {
          try {
            const toolResult = await mcpServer?.mcpClient?.callTool(toolCall.name, toolCall.args)
            toolMessages.push(new ToolMessage({
              content: JSON.stringify(toolResult),
              tool_call_id: toolCall.id || 'unknown',
            }))
            console.log('tool call', JSON.stringify(toolResult))
          } catch (error) {
            console.error(`[AIGC Service] Error executing tool ${toolCall.name}:`, error)
            toolMessages.push(new ToolMessage({
              content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              tool_call_id: toolCall.id || 'unknown',
            }))
          }
        }

        // 如果有工具调用，需要再次调用 LLM 获取最终回复
        const finalMessages = [...langchainMessages, response, ...toolMessages]
        // 转换为标准格式返回
        return await llmWithTools.invoke(finalMessages)
      }

      // 没有工具调用，直接返回响应
      return response.content
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
      return new ChatOpenAI({
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
    } catch (error) {
      console.error('[AIGC Service] Error calling AIGC API:', error)
      throw error
    }
  }
}
