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
    console.log('handleChatReactSend _', _)
    return this.reActHandler.handleChatReActSend(_, object)
  }

  async handleChatPlanSend(_: any, object: any) {
    console.log('handleChatPlanSend _', _)
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
}
