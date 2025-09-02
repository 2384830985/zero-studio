/**
 * IPC (Inter-Process Communication) 主处理器
 * 负责注册和管理主进程与渲染进程之间的所有通信通道
 *
 * 重构后的架构：
 * - 使用路由管理器统一管理所有 IPC 路由
 * - 将不同功能模块拆分到独立的路由文件中
 * - 提高代码的可维护性和可扩展性
 *
 * 功能模块：
 * - 聊天系统 (Chat System)
 * - MCP 服务器连接 (MCP Server Connection)
 * - LanceDB 向量数据库 (Vector Database)
 * - 执行环境管理 (Runtime Environment)
 * - 网络搜索 (Web Search)
 * - 窗口管理 (Window Management)
 * - 开发调试工具 (Development Tools)
 */

import { BrowserWindow } from 'electron'
import { AIGCService } from './server/services/AIGCService'
import { IpcRouteManager } from './server/routes/IpcRouteManager'
import { ChatIpcRoutes } from './server/routes/chatIpcRoutes'
import { McpIpcRoutes } from './server/routes/mcpIpcRoutes'
import { VectorDBIpcRoutes } from './server/routes/vectorDBIpcRoutes'
import { RuntimeIpcRoutes } from './server/routes/runtimeIpcRoutes'
import { WebSearchIpcRoutes } from './server/routes/webSearchIpcRoutes'
import { WindowIpcRoutes } from './server/routes/windowIpcRoutes'
import { DebugIpcRoutes } from './server/routes/debugIpcRoutes'
import { DatabaseIpcRoutes } from './server/routes/databaseIpcRoutes'
import { FileSystemIpcRoutes } from './server/routes/fileSystemIpcRoutes'

// ==================== 服务实例 ====================
/** AIGC 服务实例 - 用于 AI 生成内容 */
const aigcService = new AIGCService()

/**
 * 注册所有 IPC 处理器
 * @param mainWindow 主窗口实例
 * @param app Electron 应用实例
 */
export function registerIpc(mainWindow: BrowserWindow, app: Electron.App) {
  // ==================== 初始化路由管理器 ====================
  const routeManager = new IpcRouteManager(mainWindow)

  // ==================== 注册各功能模块路由 ====================

  // 聊天系统路由
  const chatRoutes = new ChatIpcRoutes(aigcService)
  routeManager.addRoute(chatRoutes)

  // MCP 连接路由
  const mcpRoutes = new McpIpcRoutes()
  routeManager.addRoute(mcpRoutes)

  // LanceDB 向量数据库路由
  const vectorDBRoutes = new VectorDBIpcRoutes(mainWindow)
  routeManager.addRoute(vectorDBRoutes)

  // 执行环境管理路由
  const runtimeRoutes = new RuntimeIpcRoutes()
  routeManager.addRoute(runtimeRoutes)

  // 网络搜索路由
  const webSearchRoutes = new WebSearchIpcRoutes()
  routeManager.addRoute(webSearchRoutes)

  // 窗口管理路由
  const windowRoutes = new WindowIpcRoutes()
  routeManager.addRoute(windowRoutes)

  // 开发调试工具路由
  const debugRoutes = new DebugIpcRoutes(app)
  routeManager.addRoute(debugRoutes)

  // 数据库路由
  const databaseRoutes = new DatabaseIpcRoutes()
  routeManager.addRoute(databaseRoutes)

  // 文件系统路由
  const fileSystemRoutes = new FileSystemIpcRoutes()
  routeManager.addRoute(fileSystemRoutes)

  // ==================== 注册所有路由 ====================
  routeManager.registerAll()

  console.log('[IPC] All IPC routes registered successfully')

  // ==================== 清理函数 ====================
  /**
   * 清理所有 IPC 路由
   * 在应用关闭时调用
   */
  const cleanup = () => {
    routeManager.cleanup()
    console.log('[IPC] All IPC routes cleaned up')
  }

  // 监听应用关闭事件
  app.on('before-quit', cleanup)
  app.on('window-all-closed', cleanup)

  return { cleanup }
}
