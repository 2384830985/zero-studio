/**
 * 开发调试工具 IPC 路由
 * 处理所有与开发调试相关的 IPC 通信
 * 仅在开发环境下启用
 */

import { BrowserWindow, ipcMain } from 'electron'
import { IIpcRoute } from '../IpcRouteManager'

/**
 * 开发调试工具 IPC 路由处理器
 */
export class DebugIpcRoutes implements IIpcRoute {
  private app: Electron.App

  constructor(app: Electron.App) {
    this.app = app
  }

  /**
   * 注册开发调试相关的 IPC 处理器
   * 仅在开发环境下注册
   * @param _mainWindow 主窗口实例（当前未使用）
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  register(_mainWindow: BrowserWindow): void {
    // ==================== 开发调试工具 ====================
    /**
     * 开发环境下的调试辅助工具
     * 仅在开发模式下启用，用于调试和监控
     */
    if (process.env.NODE_ENV === 'development') {
      /**
       * 处理来自渲染进程的调试日志
       * 将渲染进程的日志转发到主进程控制台
       */
      ipcMain.on('debug-log', (_event, ...args) => {
        console.log('[Renderer Debug]:', ...args)
      })

      /**
       * 处理来自渲染进程的错误报告
       * 收集渲染进程的错误信息并在主进程中显示
       */
      ipcMain.on('debug-error', (_event, message, stack) => {
        console.error('[Renderer Error]:', message)
        if (stack) {
          console.error('Stack trace:', stack)
        }
      })

      /**
       * 获取应用信息
       * 返回应用的版本、路径等基本信息
       */
      ipcMain.handle('get-app-info', () => {
        return {
          version: this.app.getVersion(),
          name: this.app.getName(),
          path: this.app.getAppPath(),
          userData: this.app.getPath('userData'),
          temp: this.app.getPath('temp'),
          desktop: this.app.getPath('desktop'),
          documents: this.app.getPath('documents'),
          downloads: this.app.getPath('downloads'),
        }
      })

      /**
       * 获取系统信息
       * 返回操作系统、架构、Node.js 版本等系统信息
       */
      ipcMain.handle('get-system-info', () => {
        return {
          platform: process.platform,
          arch: process.arch,
          versions: process.versions,
          env: process.env.NODE_ENV,
        }
      })

      console.log('[DebugIpcRoutes] Debug IPC routes registered (development mode)')
    } else {
      console.log('[DebugIpcRoutes] Debug routes skipped (production mode)')
    }
  }
}
