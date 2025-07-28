import {McpServer} from '../../../mcp/mcp-server'
import {getModel} from '../../llm'
import {getExhibitionTEXT, IExhibitionCon} from '../../utils'
import {ToolCallHandler} from '../tool-call/ToolCallHandler'
import {MessageBuilder} from '../message/MessageBuilder'
import {ResponseBuilder} from '../response/ResponseBuilder'

/**
 * LangChain工具调用处理器
 * 负责处理基于LangChain的工具调用流程
 */
export class LangChainToolCallProcessor {
  private toolCallHandler = new ToolCallHandler()
  private messageBuilder = new MessageBuilder()
  private responseBuilder = new ResponseBuilder()

  /**
   * 处理LangChain工具调用流程
   */
  async process(
    messages: any[],
    metadata: any,
    sendStreaming: (content: string) => void,
  ): Promise<any> {
    console.log('[AIGC Service] LangChain configuration:')
    console.log('  - baseURL:', metadata.service.apiUrl)
    console.log('  - model:', metadata.model)

    const llm = getModel(metadata)
    const llmWithTools = llm.bindTools(McpServer.langchainTools)

    console.log('[AIGC Service] McpServer.langchainTools.length', McpServer.langchainTools.length)

    const cardList: IExhibitionCon[] = []

    // 调用 LLM
    const response = await llmWithTools.invoke(messages)
    cardList.push(getExhibitionTEXT(String(response?.content || '')))

    // 先返回数据流
    sendStreaming(String(response.content))

    // 处理工具调用
    if (response.tool_calls && response.tool_calls.length > 0) {
      const toolCallResult = await this.toolCallHandler.handleMultipleToolCalls(response.tool_calls)
      cardList.push(...toolCallResult.cardList)

      // 构建最终消息并获取回复
      const finalMessages = this.messageBuilder.buildFinalMessages(
        messages,
        response,
        toolCallResult.toolMessages,
      )

      const finalStream = await llm.invoke(finalMessages)
      cardList.push(getExhibitionTEXT(String(finalStream.content)))

      return this.responseBuilder.buildToolCallResponse(
        String(response.content),
        String(finalStream.content),
        toolCallResult.toolCalls,
        toolCallResult.toolResults,
        cardList,
      )
    }

    // 没有工具调用的情况
    if (metadata.setting.streamOutput) {
      const responseStream = await llmWithTools.stream(messages)
      return this.responseBuilder.buildStreamResponse(responseStream)
    } else {
      return this.responseBuilder.buildNormalResponse(String(response.content))
    }
  }
}
