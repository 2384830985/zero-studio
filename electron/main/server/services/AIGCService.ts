import {McpServer} from '../../mcp/mcp-server'
import {getModel, IMetadata} from '../llm'
import {IMessageMetadata} from '../types'
import {BaseMessage, SystemMessage} from '@langchain/core/messages'
import {LangChainToolCallProcessor} from './langchain/LangChainToolCallProcessor'
import {InputValidator} from './validation/InputValidator'
import {ResponseBuilder} from './response/ResponseBuilder'
import {getLanceDBService} from './vector/LanceDBService'
import {getSearchEngineService} from './search/SearchEngineService'

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
    // 存在知识库则添加知识库上下文
    if (metadata?.knowledgeBase?.articleIds?.length) {
      const service = getLanceDBService()
      const conList: string[] = []
      for (let i = 0; i < metadata.knowledgeBase?.articleIds.length; i++) {
        const documents = await service.searchDocuments(
          metadata.knowledgeBase?.articleIds?.[i].documentKey,
          messages[messages.length - 1].text,
        )
        if (documents?.[0]?.text) {
          conList.push(documents?.[0]?.text)
        }
      }
      messages[0] = new SystemMessage(`
        ${messages[0].text}
        ====
        【可用的上下文】
        ${conList.map((text, index) => `
        ${index + 1}. ${text}\n
        `)}
        ====
      `)
      console.log('conList', conList.toString())
    }
    // 存在搜索引擎则添加搜索引擎的相关数据
    if (metadata?.searchEngine && metadata?.searchEngine !== 'none') {
      const searchService = getSearchEngineService()
      const query = messages[messages.length - 1].text

      try {
        const searchResults = await searchService.search(
          query,
          metadata.searchEngine as 'google' | 'bing' | 'baidu',
          5, // 限制搜索结果数量
        )

        if (searchResults.length > 0) {
          const searchContext = searchResults.map((result, index) => `
            ${index + 1}. 标题: ${result.title}
            链接: ${result.url}
            摘要: ${result.snippet}
            内容: ${result.content || ''}
          `).join('\n')
          // 添加搜索结果到消息列表
          messages[0] = new SystemMessage(`
            ${messages[0].text}
            ====
            【搜索引擎结果】
            ${searchContext}
            ====
          `)
          console.log('searchContext', searchContext)
        }
      } catch (error) {
        console.error('[AIGC Service] Search engine error:', error)
        // 搜索失败不影响正常流程，继续执行
      }
    }

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
