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
  async handleChatReactSend(_, object) {
    return this.reActHandler.handleChatReactSend(_, object)
  }

  async handleChatPlanSend(_, object) {
    return this.planHandler.handleChatPlanSend(_, object)
  }

  /**
   * Chat
   * @param _
   * @param object
   * @private
   */
  async handleChatSend(_, object) {
    return this.standardHandler.handleChatSend(_, object)
  }
}
