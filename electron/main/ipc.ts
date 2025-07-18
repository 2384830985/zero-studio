import {BrowserWindow, ipcMain, shell} from 'electron'
import {getBinaryPath, isBinaryExists, runInstallScript} from './utils/process'
import {execSync} from 'child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { performWebSearch } from './utils/webSearch'
// import { BigServer } from './server'

// 在 ES 模块中正确获取 __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const preload = path.join(__dirname, '../preload/index.mjs')

// 避免循环依赖，直接定义路径
const APP_ROOT = path.join(__dirname, '../..')
const RENDERER_DIST = path.join(APP_ROOT, 'dist')
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
const indexHtml = path.join(RENDERER_DIST, 'index.html')

export function registerIpc(mainWindow: BrowserWindow, app: Electron.App) {

  // New window example arg: new windows url
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

  // 执行环境管理相关的 IPC 处理程序

  // 运行安装脚本
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

  // 检查二进制文件是否存在
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

  // 获取二进制文件版本
  ipcMain.handle('get-binary-version', async (_, binaryName: string) => {
    try {
      const binaryPath = await getBinaryPath(binaryName)
      let version = 'unknown'

      if (binaryName === 'bun') {
        const output = execSync(`'${binaryPath}' --version`, { encoding: 'utf8' })
        version = output.trim()
      } else if (binaryName === 'uv') {
        const output = execSync(`'${binaryPath}' --version`, { encoding: 'utf8' })
        version = output.trim().replace('uv ', '')
      }

      console.log(`[IPC] Binary ${binaryName} version: ${version}`)
      return version
    } catch (error) {
      console.error(`[IPC] Error getting version for ${binaryName}:`, error)
      return 'unknown'
    }
  })

  // 设置默认运行时
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

  // 打开 bin 目录
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

  // 网络搜索相关的 IPC 处理器
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

  // --------- Debug helpers for development ---------
  if (process.env.NODE_ENV === 'development') {
    // 处理来自渲染进程的调试日志
    ipcMain.on('debug-log', (_event, ...args) => {
      console.log('[Renderer Debug]:', ...args)
    })

    // 处理来自渲染进程的错误报告
    ipcMain.on('debug-error', (_event, message, stack) => {
      console.error('[Renderer Error]:', message)
      if (stack) {
        console.error('Stack trace:', stack)
      }
    })

    // 添加一些有用的调试 IPC 处理器
    ipcMain.handle('get-app-info', () => {
      return {
        version: app.getVersion(),
        name: app.getName(),
        path: app.getAppPath(),
        userData: app.getPath('userData'),
        temp: app.getPath('temp'),
        desktop: app.getPath('desktop'),
        documents: app.getPath('documents'),
        downloads: app.getPath('downloads'),
      }
    })

    ipcMain.handle('get-system-info', () => {
      return {
        platform: process.platform,
        arch: process.arch,
        versions: process.versions,
        env: process.env.NODE_ENV,
      }
    })

    // // MCP 服务器相关的 IPC 处理器
    // ipcMain.handle('get-mcp-server-stats', () => {
    //   if (bigServer) {
    //     return bigServer.getStats()
    //   }
    //   return null
    // })
    //
    // ipcMain.handle('get-mcp-conversations', () => {
    //   if (bigServer) {
    //     return bigServer.getConversations()
    //   }
    //   return []
    // })
  }

}
