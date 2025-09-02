/**
 * 文件系统 IPC 路由
 * 处理所有与文件系统相关的 IPC 通信
 */

import { BrowserWindow, ipcMain, dialog } from 'electron'
import { promises as fs } from 'fs'
import * as path from 'path'
import { IIpcRoute } from '../IpcRouteManager'

/**
 * 文件系统 IPC 路由处理器
 */
export class FileSystemIpcRoutes implements IIpcRoute {
  /**
   * 注册文件系统相关的 IPC 处理器
   * @param mainWindow 主窗口实例
   */
  register(mainWindow: BrowserWindow): void {
    /**
     * 选择目录
     * 打开系统目录选择对话框
     */
    ipcMain.handle('fs-select-directory', async () => {
      try {
        const result = await dialog.showOpenDialog(mainWindow, {
          properties: ['openDirectory'],
          title: '选择工作目录',
          buttonLabel: '选择',
        })

        return {
          canceled: result.canceled,
          filePaths: result.filePaths,
        }
      } catch (error) {
        console.error('[FileSystem] Select directory error:', error)
        throw error
      }
    })

    /**
     * 检查目录权限
     * 检查指定目录是否具有读写权限
     */
    ipcMain.handle('fs-check-directory-permissions', async (_event, dirPath: string) => {
      try {
        // 检查目录是否存在
        await fs.access(dirPath)

        // 检查读权限
        await fs.access(dirPath, fs.constants.R_OK)

        // 检查写权限
        await fs.access(dirPath, fs.constants.W_OK)

        // 尝试在目录中创建一个临时文件来验证写权限
        const testFilePath = path.join(dirPath, '.permission-test-' + Date.now())
        try {
          await fs.writeFile(testFilePath, 'test')
          await fs.unlink(testFilePath) // 删除测试文件
          return true
        } catch (writeError) {
          console.warn('[FileSystem] Write permission test failed:', writeError)
          return false
        }
      } catch (error) {
        console.error('[FileSystem] Permission check error:', error)
        return false
      }
    })

    /**
     * 设置工作目录
     * 将指定目录设置为当前工作目录
     */
    ipcMain.handle('fs-set-working-directory', async (_event, dirPath: string) => {
      try {
        // 验证目录存在
        const stats = await fs.stat(dirPath)
        if (!stats.isDirectory()) {
          throw new Error('指定的路径不是一个目录')
        }

        // 设置工作目录
        process.chdir(dirPath)

        console.log('[FileSystem] Working directory set to:', dirPath)
        return {
          success: true,
          path: dirPath,
          message: '工作目录设置成功',
        }
      } catch (error: unknown) {
        console.error('[FileSystem] Set working directory error:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        throw new Error(`设置工作目录失败: ${errorMessage}`)
      }
    })

    /**
     * 获取当前工作目录
     * 返回当前的工作目录路径
     */
    ipcMain.handle('fs-get-working-directory', async () => {
      try {
        const cwd = process.cwd()
        return {
          success: true,
          path: cwd,
        }
      } catch (error) {
        console.error('[FileSystem] Get working directory error:', error)
        throw error
      }
    })

    /**
     * 读取目录内容
     * 获取指定目录下的文件和子目录列表
     */
    ipcMain.handle('fs-read-directory', async (_event, dirPath: string) => {
      try {
        const items = await fs.readdir(dirPath, { withFileTypes: true })
        const result: Array<{
          name: string
          path: string
          type: 'directory' | 'file'
          size?: number
          modified: Date
          created: Date
        }> = []

        for (const item of items) {
          const itemPath = path.join(dirPath, item.name)
          const stats = await fs.stat(itemPath)

          result.push({
            name: item.name,
            path: itemPath,
            type: item.isDirectory() ? 'directory' : 'file',
            size: item.isFile() ? stats.size : undefined,
            modified: stats.mtime,
            created: stats.birthtime,
          })
        }

        return result
      } catch (error: unknown) {
        console.error('[FileSystem] Read directory error:', error)
        throw error
      }
    })

    console.log('[FileSystemIpcRoutes] File system IPC routes registered')
  }
}
