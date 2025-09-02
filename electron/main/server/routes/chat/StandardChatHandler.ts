import { BrowserWindow } from 'electron'
import {BaseMessage, HumanMessage} from '@langchain/core/messages'

import { ChatHandler } from './ChatHandler'
import { AIGCService } from '../../services'
import { IMessageMetadata } from '../../types'
import {getModel, IMetadata} from '../../llm'

export class StandardChatHandler extends ChatHandler {
  private aigcService: AIGCService
  private currentAIGCRequest: Promise<any> | null = null

  constructor(win: BrowserWindow, aigcService: AIGCService) {
    super(win)
    this.aigcService = aigcService
  }

  /**
   * 优化 prompt
   * @param _
   * @param object
   */
  async handleOptimizationPrompt(_: any, object: string) {
    console.log('handleOptimizationPrompt _', _)
    const request = JSON.parse(object)
    const { content, metadata } = request
    const model = getModel(metadata as IMetadata)
    const prompt = `
    你是一名资深的Prompt工程师，擅长优化和精炼大型语言模型的提示词。请根据以下核心原则，对用户提供的原始Prompt进行深度分析和优化：

    **原始Prompt：**
    ${content}

    **优化要求：**
    1.  **角色设定**：为原始Prompt添加或明确一个最合适的专业角色（例如：资深软件架构师、经验丰富的市场营销总监、历史学教授等）。
    2.  **任务具体化**：将模糊的任务指令转化为清晰、具体、可执行的目标。避免歧义。
    3.  **上下文补充**：判断并补充必要的背景信息、知识边界或约束条件（如时间、地域、数据范围等）。
    4.  **输出格式化**：明确指定输出的格式（如Markdown、JSON、表格、代码块、报告体等）、长度（如字数限制）、风格（如学术型、通俗易懂、正式、幽默等）和必要要素（如需要包含案例、数据来源、步骤等）。
    5.  **优化思考**：简要说明你做了哪些优化以及为什么这些优化能提升效果（最多3点）。
    6.  **最终输出**：请直接输出优化后的新Prompt，不要包含其他解释。

    **请开始分析并优化。**
    `
    const messages = [new HumanMessage(prompt)]

    return await model.invoke(messages)
  }

  /**
   * 处理标准聊天发送
   */
  async handleChatSend(_: any, object: string) {
    try {
      // 重置中断状态
      this.resetInterruptState()

      console.log('handleChatSend _', _)
      const request = JSON.parse(object)
      const { content, conversationId, metadata = {}, oldMessage } = request

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

  /**
   * 重写中断处理方法
   */
  protected async onInterrupt(): Promise<void> {
    console.log('[StandardChatHandler] 执行中断清理')

    // 如果有正在进行的 AIGC 请求，尝试中断它
    if (this.currentAIGCRequest) {
      try {
        // 这里可以添加具体的 AIGC 请求中断逻辑
        // 例如：如果 AIGC 服务支持中断，可以调用相应的中断方法
        console.log('[StandardChatHandler] 中断 AIGC 请求')
      } catch (error) {
        console.error('[StandardChatHandler] 中断 AIGC 请求失败:', error)
      }
    }
  }
}
