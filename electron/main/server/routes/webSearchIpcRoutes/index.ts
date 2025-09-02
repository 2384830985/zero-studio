/**
 * 网络搜索 IPC 路由
 * 处理所有与网络搜索相关的 IPC 通信
 */

import { BrowserWindow, ipcMain } from 'electron'
import { performWebSearch } from '../../../utils/webSearch'
import { IIpcRoute } from '../IpcRouteManager'

/**
 * 网络搜索 IPC 路由处理器
 */
export class WebSearchIpcRoutes implements IIpcRoute {
  /**
   * 注册网络搜索相关的 IPC 处理器
   * @param _mainWindow 主窗口实例（当前未使用）
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  register(_mainWindow: BrowserWindow): void {
    // ==================== 网络搜索 ====================

    /**
     * 执行网络搜索
     * 支持多种搜索引擎，返回搜索结果
     */
    ipcMain.handle('web-search', async (_, searchParams: { query: string; engine: string }) => {
      try {
        console.log(`[IPC] Performing web search: ${searchParams.query} using ${searchParams.engine}`)

        const searchResult = await performWebSearch(searchParams.query, searchParams.engine)
        console.log(`[IPC] Web search completed for: ${searchParams.query}`)

        return {
          success: true,
          query: searchParams.query,
          engine: searchParams.engine,
          results: searchResult,
        }
      } catch (error) {
        console.error('[IPC] Web search failed:', error)
        throw error
      }
    })

    console.log('[WebSearchIpcRoutes] Web search IPC routes registered')
  }
}
