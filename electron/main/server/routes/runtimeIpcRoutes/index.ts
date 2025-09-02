/**
 * 执行环境管理 IPC 路由
 * 处理所有与运行时环境管理相关的 IPC 通信
 */

import { BrowserWindow, ipcMain, shell } from 'electron'
import { getBinaryPath, isBinaryExists, runInstallScript } from '../../../utils/process'
import cp from 'child_process'
import fs from 'node:fs'
import { IIpcRoute } from '../IpcRouteManager'

/**
 * 执行环境管理 IPC 路由处理器
 */
export class RuntimeIpcRoutes implements IIpcRoute {
  /**
   * 注册执行环境管理相关的 IPC 处理器
   * @param _mainWindow 主窗口实例（当前未使用）
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  register(_mainWindow: BrowserWindow): void {
    // ==================== 执行环境管理 ====================

    /**
     * 运行安装脚本
     * 用于安装各种运行时环境（如 Node.js、Python、Bun 等）
     */
    ipcMain.handle('run-install-script', async (_, scriptName: string) => {
      try {
        console.log(`[IPC] Running install script: ${scriptName}`)
        await runInstallScript(scriptName)
        console.log(`[IPC] Install script completed: ${scriptName}`)
        return { success: true }
      } catch (error) {
        console.error(`[IPC] Install script failed: ${scriptName}`, error)
        throw error
      }
    })

    /**
     * 检查二进制文件是否存在
     * 用于验证运行时环境是否已正确安装
     */
    ipcMain.handle('check-binary-exists', async (_, binaryName: string) => {
      try {
        const exists = await isBinaryExists(binaryName)
        console.log(`[IPC] Binary ${binaryName} exists: ${exists}`)
        return exists
      } catch (error) {
        console.error(`[IPC] Error checking binary ${binaryName}:`, error)
        return false
      }
    })

    /**
     * 获取二进制文件版本
     * 支持获取 bun、uv 等工具的版本信息
     */
    ipcMain.handle('get-binary-version', async (_, binaryName: string) => {
      try {
        const binaryPath = await getBinaryPath(binaryName)
        let version = 'unknown'

        if (binaryName === 'bun') {
          const result = cp.spawnSync(binaryPath, ['--version'], { encoding: 'utf8' })
          version = result.stdout?.trim()
        } else if (binaryName === 'uv') {
          const result = cp.spawnSync(binaryPath, ['--version'], { encoding: 'utf8' })
          version = result.stdout?.trim().replace('uv ', '')
        }

        console.log(`[IPC] Binary ${binaryName} version: ${version}`)
        return version
      } catch (error) {
        console.error(`[IPC] Error getting version for ${binaryName}:`, error)
        return 'unknown'
      }
    })

    /**
     * 设置默认运行时
     * 允许用户选择默认的 JavaScript/Python 运行时
     */
    ipcMain.handle('set-default-runtime', async (_, runtime: string) => {
      try {
        console.log(`[IPC] Setting default runtime to: ${runtime}`)
        // 这里可以保存到配置文件或环境变量中
        // 暂时只是记录日志
        return { success: true, runtime }
      } catch (error) {
        console.error('[IPC] Error setting default runtime:', error)
        throw error
      }
    })

    /**
     * 打开 bin 目录
     * 在文件管理器中打开二进制文件存储目录
     */
    ipcMain.handle('open-bin-directory', async () => {
      try {
        const binDir = await getBinaryPath()
        console.log(`[IPC] Opening bin directory: ${binDir}`)

        // 确保目录存在
        if (!fs.existsSync(binDir)) {
          fs.mkdirSync(binDir, { recursive: true })
        }

        await shell.openPath(binDir)
        return { success: true }
      } catch (error) {
        console.error('[IPC] Error opening bin directory:', error)
        throw error
      }
    })

    console.log('[RuntimeIpcRoutes] Runtime management IPC routes registered')
  }
}
