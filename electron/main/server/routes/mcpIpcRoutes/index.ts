/**
 * MCP (Model Context Protocol) 连接 IPC 路由
 * 处理所有与 MCP 服务器连接相关的 IPC 通信
 */

import { BrowserWindow, ipcMain } from 'electron'
import { IpcChannel } from '../../../IpcChannel'
import { MCPServerTools } from '../MCPServerTools'
import { IIpcRoute } from '../IpcRouteManager'

/**
 * MCP 连接 IPC 路由处理器
 */
export class McpIpcRoutes implements IIpcRoute {
  /**
   * 注册 MCP 相关的 IPC 处理器
   * @param _mainWindow 主窗口实例（当前未使用）
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  register(_mainWindow: BrowserWindow): void {
    // ==================== MCP 服务器连接 ====================
    /** 连接 MCP (Model Context Protocol) 服务器 */
    ipcMain.handle(IpcChannel.CONNECT_MCP, MCPServerTools.handleConnectMCPSend)

    console.log('[McpIpcRoutes] MCP IPC routes registered')
  }
}
