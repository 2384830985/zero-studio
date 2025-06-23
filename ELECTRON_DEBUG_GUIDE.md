# Electron API 调试指南

## 概述

现在你可以使用 `yarn dev` 命令来启动应用并调试 Electron API。这个配置包含了以下功能：

## 启动应用

```bash
yarn dev
```

这个命令会：
1. 编译 Electron 主进程和预加载脚本
2. 启动 Vite 开发服务器
3. 启动 Electron 应用并加载开发服务器的内容
4. 自动打开开发者工具

## 可用的 Electron API

### 1. 基础 IPC 通信
```javascript
// 发送消息到主进程
window.ipcRenderer.send('channel-name', data)

// 监听主进程消息
window.ipcRenderer.on('channel-name', (event, data) => {
  console.log('收到消息:', data)
})

// 调用主进程方法并等待返回
const result = await window.ipcRenderer.invoke('method-name', params)
```

### 2. Shell API
```javascript
// 打开外部链接
await window.electronAPI.shell.openExternal('https://example.com')

// 打开文件或文件夹
await window.electronAPI.shell.openPath('/path/to/file')

// 在文件管理器中显示文件
window.electronAPI.shell.showItemInFolder('/path/to/file')

// 移动文件到回收站
await window.electronAPI.shell.trashItem('/path/to/file')
```

### 3. 剪贴板 API
```javascript
// 读取文本
const text = window.electronAPI.clipboard.readText()

// 写入文本
window.electronAPI.clipboard.writeText('Hello World')

// 读取 HTML
const html = window.electronAPI.clipboard.readHTML()

// 写入 HTML
window.electronAPI.clipboard.writeHTML('<p>Hello World</p>')

// 清空剪贴板
window.electronAPI.clipboard.clear()
```

### 4. 开发调试助手
```javascript
// 获取环境信息
const env = window.electronAPI.dev.getEnvironment()
console.log(env)

// 调试日志（会同时输出到渲染进程和主进程控制台）
window.electronAPI.dev.log('调试信息', { data: 'some data' })

// 错误报告
window.electronAPI.dev.reportError(new Error('测试错误'))
```

### 5. 系统和应用信息
```javascript
// 获取系统信息
const systemInfo = await window.ipcRenderer.invoke('get-system-info')

// 获取应用信息
const appInfo = await window.ipcRenderer.invoke('get-app-info')
```

## 调试面板

应用中包含了一个可视化的调试面板，你可以：

1. 点击"显示调试器"按钮来打开调试面板
2. 测试各种 Electron API 功能
3. 查看环境信息、系统信息和应用信息
4. 测试剪贴板操作
5. 测试 Shell 操作
6. 测试 IPC 通信

## 开发者工具

在开发模式下，应用会自动打开 Chrome 开发者工具，你可以：

- 在 Console 中直接调用 `window.electronAPI` 和 `window.ipcRenderer`
- 使用 Network 面板查看网络请求
- 使用 Elements 面板检查 DOM
- 使用 Sources 面板设置断点调试

## 主进程调试

主进程的日志会输出到启动应用的终端中。你可以：

- 查看主进程的 console.log 输出
- 查看来自渲染进程的调试日志
- 查看错误报告和堆栈跟踪

## 类型支持

项目已经配置了完整的 TypeScript 类型支持，你可以：

- 获得 Electron API 的智能提示
- 享受类型检查和错误提示
- 使用 IDE 的自动完成功能

## 注意事项

1. 这些 API 只在 Electron 环境中可用，在浏览器中会是 `undefined`
2. 调试功能只在开发环境中启用
3. 生产环境中应该移除或禁用调试相关的代码
4. 某些 API 可能需要特定的权限或配置

## 故障排除

如果遇到问题：

1. 确保使用 `yarn dev` 而不是 `yarn electron:dev`
2. 检查终端输出是否有错误信息
3. 确保 Node.js 版本符合要求（>=22.12.0）
4. 尝试删除 `node_modules` 和 `dist-electron` 文件夹后重新安装依赖

```bash
rm -rf node_modules dist-electron
yarn install
yarn dev
