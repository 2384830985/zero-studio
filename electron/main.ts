import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';

const isDev = process.env.NODE_ENV === 'development';

function createWindow(): void {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../dist-electron/preload.js')
    },
    show: false,
    titleBarStyle: 'default'
  });

  // 开发环境加载本地服务，生产环境加载打包后的文件
  if (isDev) {
    console.log('jinjinjin')
    win.loadURL('http://localhost:5173');
    // 打开开发者工具
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 窗口准备好后显示
  win.once('ready-to-show', () => {
    win.show();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 安全性：防止新窗口创建
app.on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});
