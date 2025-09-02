import { app, BrowserWindow, shell, protocol } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { log } from 'node:console'
import { registerIpc } from './ipc'
import { getDatabaseService } from './server/services/database/DatabaseService'
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
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: '缝合怪',
    icon: path.join(process.env.VITE_PUBLIC, 'app-icon.png'),
    width: 1200,
    height: 800,
    webPreferences: {
      devTools: true,
      preload,
      webSecurity: false, // 在生产环境中允许加载本地资源
      allowRunningInsecureContent: true,
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
      console.log('event', event, errorCode, errorDescription)
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
    log('Loading index.html from:', indexHtml)
    log('RENDERER_DIST:', RENDERER_DIST)

    // 确保使用正确的路径
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
    console.log('✅ Page finished loading')
  })

  // 添加错误监听
  win.webContents.on('did-fail-load', (_, errorCode, errorDescription, validatedURL) => {
    console.error('❌ Page failed to load:', {
      errorCode,
      errorDescription,
      validatedURL,
    })
  })

  // 监听控制台消息
  win.webContents.on('console-message', (_, level, message, line, sourceId) => {
    console.log(`Console [${level}]: ${message} (${sourceId}:${line})`)
  })

  // 监听 DOM 准备完成
  win.webContents.on('dom-ready', () => {
    console.log('✅ DOM is ready')
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) {shell.openExternal(url)}
    return { action: 'deny' }
  })

  registerIpc(win, app)

  // 初始化数据库服务
  try {
    const databaseService = getDatabaseService()
    await databaseService.initialize()
    console.log('✅ Database service initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize database service:', error)
  }
}
// 注册自定义协议以处理本地文件
app.whenReady().then(async () => {
  // 注册 file 协议处理器
  protocol.registerFileProtocol('file', (request, callback) => {
    const pathname = decodeURI(request.url.replace('file:///', ''))
    callback(pathname)
  })

  console.log('✅ Electron app is ready! Creating window...')
  await createWindow()
})

app.on('window-all-closed', async () => {
  win = null
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
