import { BrowserWindow } from 'electron'
import { BaseMessage } from '@langchain/core/messages'

import { ChatHandler } from './ChatHandler'
import { AIGCService } from '../../services'
import { IMessageMetadata } from '../../types'

export class StandardChatHandler extends ChatHandler {
  private aigcService: AIGCService

  constructor(win: BrowserWindow, aigcService: AIGCService) {
    super(win)
    this.aigcService = aigcService
  }

  /**
   * 处理标准聊天发送
   */
  async handleChatSend(_: any, object: string) {
    try {
      console.log('handleChatSend _', _)
      const response = JSON.parse(object)
      const { content, conversationId, metadata = {}, oldMessage } = response

      // 验证内容
      const validation = this.validateContent(content)
      if (!validation.isValid) {
        return this.createErrorResponse(400, validation.error!)
      }

      // 创建并广播用户消息
      const userMessage = this.broadcastUserMessage(content, conversationId, metadata)

      // 转换消息格式
      const langchainMessages = this.convertToLangchainMessages([...oldMessage, userMessage])

      // 生成 AI 回复
      this.generateMCPResponse(langchainMessages, conversationId, metadata)

      return this.createSuccessResponse({
        conversationId,
        messageId: userMessage.id,
      })
    } catch (error) {
      console.error('[Standard Chat Handler] Error sending message:', error)
      return this.createErrorResponse(500, 'Failed to send message')
    }
  }

  /**
   * 生成 MCP 响应
   */
  private async generateMCPResponse(
    userMessage: BaseMessage[],
    conversationId: string,
    metadata: IMessageMetadata,
  ) {
    try {
      if (metadata && metadata.model) {
        await this.processAIGCResponse(userMessage, conversationId, metadata)
      } else {
        // 回退到模拟响应
        this.sendErrorMessage(conversationId)
      }
    } catch (error) {
      console.error('[Standard Chat Handler] Error in generateMCPResponse:', error)
      // 回退到模拟响应
      this.sendErrorMessage(conversationId)
    }
  }

  /**
   * 处理 AIGC 响应
   */
  private async processAIGCResponse(
    userMessage: BaseMessage[],
    conversationId: string,
    metadata: IMessageMetadata,
  ) {
    console.log('[Standard Chat Handler] Calling AIGC API for MCP chat...')

    // 创建流式发送函数
    const sendStreaming = (content: string) => {
      this.sendStreamingMessage(content, conversationId, metadata)
    }

    // 调用 AIGC API
    const response = await this.aigcService.callAIGC(userMessage, metadata, sendStreaming)

    // 处理响应
    const fullContent = await this.processAIGCResponseContent(response, conversationId, metadata)

    // 发送完整消息
    if (fullContent) {
      this.sendFinalMessage(fullContent, response, conversationId, metadata)
    }
  }
}
