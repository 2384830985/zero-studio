import { BrowserWindow } from 'electron'
import { ChatHandler } from './ChatHandler'
import { ReActService } from '../../services/ReActService'
import { CommunicationRole } from '../../../mcp'
import { generateId } from '../../utils/helpers'

export class ReActChatHandler extends ChatHandler {
  constructor(win: BrowserWindow) {
    super(win)
  }

  /**
   * 处理 ReAct 聊天发送
   */
  async handleChatReActSend(_, object: string) {
    try {
      const req = JSON.parse(object)
      const { content, metadata = {}, conversationId = '' } = req

      // 验证内容
      const validation = this.validateContent(content)
      if (!validation.isValid) {
        return this.createErrorResponse(400, validation.error!)
      }

      // 广播用户消息
      this.broadcastUserMessage(content, conversationId, metadata)

      // 初始化 ReAct 服务
      const reAct = new ReActService(this.win)
      reAct.initializeReActAgent(metadata)

      // 创建步骤回调
      const stepCallback = (type: string, content) => {
        if (type === 'stream') {
          this.processStreamResponse(content, conversationId, metadata)
        } else {
          this.sendAssistantMessage(content, conversationId, metadata)
        }
      }

      // 执行 ReAct 代理
      const response = await reAct.reactAgent?.execute(content, stepCallback) as Promise<any>

      // 处理响应
      this.processAIGCResponseContent(response, conversationId, metadata).then(fullContent => {
        console.log('fullContent', fullContent)
        this.sendFinalMessage(fullContent, response, conversationId, metadata)
      })

      return this.createSuccessResponse({ conversationId })
    } catch (error) {
      console.error('[ReAct Chat Handler] Error:', error)
      return this.createErrorResponse(500, 'Failed to process ReAct request')
    }
  }

  /**
   * 创建步骤回调函数
   */
  private createStepCallback(conversationId: string, metadata: any) {
    return (step: any) => {
      console.log(`[${step.type}] ${step.content}`)

      // 发送步骤消息
      this.communication.setMessage({
        content: '',
        conversationId: conversationId,
        message: {
          id: generateId(),
          role: CommunicationRole.ASSISTANT,
          content: step.content,
          metadata,
        },
      })
    }
  }
}
