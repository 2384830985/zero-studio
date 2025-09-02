/**
 * 聊天系统 IPC 路由
 * 处理所有与聊天相关的 IPC 通信
 */

import { BrowserWindow, ipcMain } from 'electron'
import { IpcChannel } from '../../../IpcChannel'
import { Chat } from '../chat'
import { AIGCService } from '../../services/AIGCService'
import { IIpcRoute } from '../IpcRouteManager'

/**
 * 聊天系统 IPC 路由处理器
 */
export class ChatIpcRoutes implements IIpcRoute {
  private chat!: Chat
  private aigcService: AIGCService

  constructor(aigcService: AIGCService) {
    this.aigcService = aigcService
  }

  /**
   * 注册聊天相关的 IPC 处理器
   * @param mainWindow 主窗口实例
   */
  register(mainWindow: BrowserWindow): void {
    // 初始化聊天服务
    this.chat = new Chat(mainWindow, this.aigcService)

    // ==================== 聊天系统 ====================
    /** 发送聊天消息 */
    ipcMain.handle(IpcChannel.CHAT_SEND, this.chat.handleChatSend.bind(this.chat))

    /** ReAct 模式聊天 - 推理和行动循环 */
    ipcMain.handle(IpcChannel.CHAT_REACT, this.chat.handleChatReactSend.bind(this.chat))

    /** 计划模式聊天 - 制定和执行计划 */
    ipcMain.handle(IpcChannel.CHAT_PLAN, this.chat.handleChatPlanSend.bind(this.chat))

    /** 优化 prompt */
    ipcMain.handle(IpcChannel.OPTIMIZATION_PROMPT, this.chat.handleOptimizationPrompt.bind(this.chat))

    /** 中断请求 */
    ipcMain.handle(IpcChannel.INTERRUPT_REQUEST, this.chat.handleInterruptRequest.bind(this.chat))

    console.log('[ChatIpcRoutes] Chat IPC routes registered')
  }
}
