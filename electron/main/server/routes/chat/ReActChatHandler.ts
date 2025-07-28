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
  async handleChatReactSend(_, object: string) {
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
      const stepCallback = this.createStepCallback(conversationId, metadata)

      // 执行 ReAct 代理
      const result = await reAct.reactAgent?.execute(content, stepCallback) as string
      console.log('最终结果:', result)

      // 发送最终结果
      this.sendAssistantMessage(result, conversationId, metadata)

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
