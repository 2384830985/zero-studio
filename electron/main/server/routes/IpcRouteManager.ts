/**
 * IPC 路由管理器
 * 统一管理所有 IPC 路由的注册和配置
 */

import { BrowserWindow, ipcMain } from 'electron'
import { IpcChannel } from '../../IpcChannel'

/**
 * IPC 路由接口
 * 定义了所有 IPC 路由处理器应该实现的接口
 */
export interface IIpcRoute {
  /**
   * 注册路由处理器
   * @param mainWindow 主窗口实例
   */
  register(mainWindow: BrowserWindow): void
}

/**
 * IPC 路由管理器
 * 负责注册和管理所有 IPC 路由
 */
export class IpcRouteManager {
  private routes: IIpcRoute[] = []
  private mainWindow: BrowserWindow

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
  }

  /**
   * 添加路由
   * @param route IPC 路由实例
   */
  addRoute(route: IIpcRoute): void {
    this.routes.push(route)
  }

  /**
   * 注册所有路由
   */
  registerAll(): void {
    this.routes.forEach(route => {
      route.register(this.mainWindow)
    })
  }

  /**
   * 清理所有路由
   */
  cleanup(): void {
    // 移除所有已注册的处理器
    Object.values(IpcChannel).forEach(channel => {
      ipcMain.removeAllListeners(channel)
    })
    this.routes = []
  }
}
