import {McpServer} from '../../mcp/mcp-server'
import {getModel, IMetadata} from '../llm'
import {IMessageMetadata} from '../types'
import {BaseMessage} from '@langchain/core/dist/messages/base'
import {LangChainToolCallProcessor} from './langchain/LangChainToolCallProcessor'
import {InputValidator} from './validation/InputValidator'
import {ResponseBuilder} from './response/ResponseBuilder'

/**
 * AIGC服务类
 * 负责处理AI API调用和工具调用
 */
export class AIGCService {
  private langChainProcessor = new LangChainToolCallProcessor()
  private inputValidator = new InputValidator()
  private responseBuilder = new ResponseBuilder()

  /**
   * 使用LangChain处理工具调用
   * @deprecated 使用 langChainProcessor.process 替代
   */
  async handleToolCallingWithLangchain(
    messages: any[],
    metadata: any,
    sendStreaming: (content: string) => void,
  ): Promise<any> {
    try {
      return await this.langChainProcessor.process(messages, metadata, sendStreaming)
    } catch (error) {
      console.error('[AIGC Service] Error in langchain tool calling:', error)
      return this.callAIGC(messages, metadata, () => undefined)
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
    this.inputValidator.validateAIGCInput(metadata)

    // 如果有工具调用需求，使用 langchain 进行处理
    if (McpServer?.langchainTools?.length > 0) {
      try {
        return await this.langChainProcessor.process(messages, metadata, sendStreaming)
      } catch (error) {
        console.error('[AIGC Service] Tool calling failed, falling back to direct API call:', error)
        // 继续执行直接API调用
      }
    }

    try {
      const model = getModel(metadata as IMetadata)

      if (metadata?.setting?.streamOutput) {
        const stream = await model.stream(messages)
        return this.responseBuilder.buildStreamResponse(stream)
      } else {
        const res = await model.invoke(messages)
        return this.responseBuilder.buildNormalResponse(String(res.content))
      }
    } catch (error) {
      console.error('[AIGC Service] Error calling AIGC API:', error)
      throw error
    }
  }
}
