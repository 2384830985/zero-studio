/**
 * 窗口管理 IPC 路由
 * 处理所有与窗口管理相关的 IPC 通信
 */

import { BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { IIpcRoute } from '../IpcRouteManager'

// 路径配置
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const preload = path.join(__dirname, '../../../../preload/index.mjs')
const APP_ROOT = path.join(__dirname, '../../../../..')
const RENDERER_DIST = path.join(APP_ROOT, 'dist')
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
const indexHtml = path.join(RENDERER_DIST, 'index.html')

/**
 * 窗口管理 IPC 路由处理器
 */
export class WindowIpcRoutes implements IIpcRoute {
  /**
   * 注册窗口管理相关的 IPC 处理器
   * @param _mainWindow 主窗口实例（当前未使用）
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  register(_mainWindow: BrowserWindow): void {
    // ==================== 窗口管理 ====================

    /**
     * 创建新窗口
     * 用于打开子窗口或弹出窗口
     */
    ipcMain.handle('open-win', (_, arg) => {
      const childWindow = new BrowserWindow({
        webPreferences: {
          preload,
          nodeIntegration: true,
          contextIsolation: false,
        },
      })

      if (VITE_DEV_SERVER_URL) {
        childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
      } else {
        childWindow.loadFile(indexHtml, { hash: arg })
      }
    })

    console.log('[WindowIpcRoutes] Window management IPC routes registered')
  }
}
