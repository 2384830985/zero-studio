import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import { log } from 'node:console'
// import { SSEServer } from './sse-server'

console.log('🚀 Electron Main Process Starting...')
console.log('Process arguments:', process.argv)
console.log('Environment variables at startup:', {
  NODE_ENV: process.env.NODE_ENV,
  ELECTRON: process.env.ELECTRON,
  VITE_DEV_SERVER_URL: process.env.VITE_DEV_SERVER_URL,
})

// ES 模块中获取 __dirname 的正确方式
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) {app.disableHardwareAcceleration()}

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') {app.setAppUserModelId(app.getName())}

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
let sseServer: | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

async function createWindow() {
  // 调试信息：打印所有相关环境变量
  console.log('=== Electron Main Process Debug Info ===')
  console.log('NODE_ENV:', process.env.NODE_ENV)
  console.log('ELECTRON:', process.env.ELECTRON)
  console.log('VITE_DEV_SERVER_URL:', process.env.VITE_DEV_SERVER_URL)
  console.log('VITE_DEV_SERVER_URL (exported):', VITE_DEV_SERVER_URL)
  console.log('APP_ROOT:', process.env.APP_ROOT)
  console.log('VITE_PUBLIC:', process.env.VITE_PUBLIC)
  console.log('========================================')

  win = new BrowserWindow({
    title: 'Main window',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      devTools: true,
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) { // #298
    log('VITE_DEV_SERVER_URL: ', VITE_DEV_SERVER_URL)

    // 添加错误处理和重试机制
    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error(`Failed to load URL: ${validatedURL}`)
      console.error(`Error code: ${errorCode}, Description: ${errorDescription}`)

      // 如果是开发服务器连接失败，尝试重新加载
      if (validatedURL === VITE_DEV_SERVER_URL) {
        console.log('Retrying to load development server...')
        setTimeout(() => {
          win?.loadURL(VITE_DEV_SERVER_URL)
        }, 2000) // 2秒后重试
      }
    })

    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    log('NO VITE_DEV_SERVER_URL: ', VITE_DEV_SERVER_URL)
    log('Environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      ELECTRON: process.env.ELECTRON,
      VITE_DEV_SERVER_URL: process.env.VITE_DEV_SERVER_URL,
    })
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) {shell.openExternal(url)}
    return { action: 'deny' }
  })
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}
console.log('📱 Registering app.whenReady() callback...')
app.whenReady().then(() => {
  console.log('✅ Electron app is ready! Creating window...')
  createWindow()
})

// app.whenReady().then(async () => {
//   await createWindow()
//
//   // 启动 SSE 服务器
//   try {
//     // sseServer = new SSEServer(3001)
//     // await sseServer.start()
//     console.log('SSE Server started successfully')
//     console.log('SSE Server started successfully')
//     console.log('SSE Server started successfully')
//     console.log('SSE Server started successfully')
//   } catch (error) {
//     console.error('Failed to start SSE Server:', error)
//   }
// })

app.on('window-all-closed', async () => {
  win = null

  // 停止 SSE 服务器
  if (sseServer) {
    try {
      // await sseServer.stop()
      console.log('SSE Server stopped')
    } catch (error) {
      console.error('Error stopping SSE Server:', error)
    }
    sseServer = null
  }

  if (process.platform !== 'darwin') {app.quit()}
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) {win.restore()}
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

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

  // SSE 服务器相关的 IPC 处理器
  ipcMain.handle('get-sse-server-stats', () => {
    if (sseServer) {
      // return sseServer.getStats()
    }
    return null
  })
}
