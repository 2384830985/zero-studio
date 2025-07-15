import { app, BrowserWindow, shell } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { log } from 'node:console'
import { BigServer } from './server'
// import { runInstallScript, isBinaryExists, getBinaryPath } from './utils/process'
// import { execSync } from 'child_process'
import { registerIpc } from './ipc'
import dotenv from 'dotenv'

// 加载环境变量文件（根据环境选择不同文件）
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isLocalEnvironment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV

// 根据环境选择不同的配置文件
const envFileName = isLocalEnvironment ? '.env.local' : '.env.pro'
const envPath = path.join(__dirname, '../..', envFileName)

if (isLocalEnvironment) {
  console.log('🏠 Local environment detected, loading .env.local file...')
} else {
  console.log('🏭 Production environment detected, loading .env.pro file...')
}

// 检查环境变量文件是否存在
if (fs.existsSync(envPath)) {
  const result = dotenv.config({ path: envPath })
  console.log(`✅ Successfully loaded ${envFileName} file`)
  if (result.error) {
    console.error(`❌ Error loading ${envFileName}:`, result.error.message)
  } else if (result.parsed) {
    console.log(`📝 Loaded ${Object.keys(result.parsed).length} environment variables`)
  }
} else {
  console.log(`⚠️  ${envFileName} file not found, using system environment variables only`)
}

console.log('🚀 Electron Main Process Starting...')
console.log('📄 Loaded environment variables from:', envPath)
console.log('Environment variables at startup:', {
  NODE_ENV: process.env.NODE_ENV,
  ELECTRON: process.env.ELECTRON,
  VITE_DEV_SERVER_URL: process.env.VITE_DEV_SERVER_URL,
  MCP_SERVER_PORT: process.env.MCP_SERVER_PORT || 'not set',
})

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
let bigServer: BigServer | null = null
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
    title: 'Big Brother Studio',
    icon: path.join(process.env.VITE_PUBLIC, 'app-icon.png'),
    width: 1200,
    height: 800,
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

  registerIpc(win, app)
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}
console.log('📱 Registering app.whenReady() callback...')
app.whenReady().then(async () => {
  console.log('✅ Electron app is ready! Creating window...')
  await createWindow()

  // 启动 MCP 服务器
  try {
    bigServer = new BigServer({
      port: parseInt(process.env.MCP_SERVER_PORT || '3002'),
      enableCors: true,
      streamingEnabled: true,
    }, win as BrowserWindow)
    await bigServer.start()
    console.log('✅ MCP Server started successfully')
  } catch (error) {
    console.error('❌ Failed to start MCP Server:', error)
  }
})

app.on('window-all-closed', async () => {
  win = null

  // 停止 MCP 服务器
  if (bigServer) {
    try {
      await bigServer.stop()
      console.log('✅ Server stopped')
    } catch (error) {
      console.error('❌ Error stopping Server:', error)
    }
    bigServer = null
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
