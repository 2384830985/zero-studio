import { contextBridge, ipcRenderer } from 'electron';

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 示例：获取应用版本
  getVersion: () => ipcRenderer.invoke('get-version'),

  // 示例：最小化窗口
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),

  // 示例：最大化窗口
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),

  // 示例：关闭窗口
  closeWindow: () => ipcRenderer.invoke('close-window'),
});

// 类型声明
declare global {
  interface Window {
    electronAPI: {
      getVersion: () => Promise<string>;
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
    };
  }
}
