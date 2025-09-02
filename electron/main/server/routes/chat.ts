import { BrowserWindow } from 'electron'
import { AIGCService } from '../services/AIGCService'
import { ReActChatHandler } from './chat/ReActChatHandler'
import { PlanChatHandler } from './chat/PlanChatHandler'
import { StandardChatHandler } from './chat/StandardChatHandler'

export class Chat {
  private reActHandler: ReActChatHandler
  private planHandler: PlanChatHandler
  private standardHandler: StandardChatHandler

  constructor(
    win: BrowserWindow,
    aigcService: AIGCService,
  ) {
    this.reActHandler = new ReActChatHandler(win)
    this.planHandler = new PlanChatHandler(win)
    this.standardHandler = new StandardChatHandler(win, aigcService)
  }

  /**
   * ReAct
   * @param _
   * @param object
   * @private
   */
  async handleChatReactSend(_: any, object: any) {
    return this.reActHandler.handleChatReActSend(_, object)
  }

  /**
   * 计划模式
   * @param _
   * @param object
   */
  async handleChatPlanSend(_: any, object: any) {
    return this.planHandler.handleChatPlanSend(_, object)
  }

  /**
   * Chat
   * @param _
   * @param object
   * @private
   */
  async handleChatSend(_: any, object: any) {
    return this.standardHandler.handleChatSend(_, object)
  }

  /**
   * 优化 prompt
   * @param _
   * @param object
   * @private
   */
  async handleOptimizationPrompt(_: any, object: any) {
    return this.standardHandler.handleOptimizationPrompt(_, object)
  }

  /**
   * 中断请求
   * @private
   */
  async handleInterruptRequest() {
    console.log('[Chat] 收到中断请求')

    // 中断所有正在进行的聊天处理器
    try {
      await Promise.all([
        this.reActHandler.interrupt(),
        this.planHandler.interrupt(),
        this.standardHandler.interrupt(),
      ])

      console.log('[Chat] 所有聊天处理器已中断')
      return { success: true, message: '中断成功' }
    } catch (error: any) {
      console.error('[Chat] 中断请求失败:', error)
      return { success: false, message: '中断失败', error: error?.message || '未知错误' }
    }
  }
}
