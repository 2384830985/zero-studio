<template>
  <div class="electron-debugger">
    <h2>Electron API 调试面板</h2>

    <div class="debug-section">
      <h3>环境信息</h3>
      <button @click="getEnvironmentInfo">获取环境信息</button>
      <pre v-if="envInfo">{{ JSON.stringify(envInfo, null, 2) }}</pre>
    </div>

    <div class="debug-section">
      <h3>系统信息</h3>
      <button @click="getSystemInfo">获取系统信息</button>
      <pre v-if="systemInfo">{{ JSON.stringify(systemInfo, null, 2) }}</pre>
    </div>

    <div class="debug-section">
      <h3>应用信息</h3>
      <button @click="getAppInfo">获取应用信息</button>
      <pre v-if="appInfo">{{ JSON.stringify(appInfo, null, 2) }}</pre>
    </div>

    <div class="debug-section">
      <h3>剪贴板操作</h3>
      <input v-model="clipboardText" placeholder="输入要复制的文本" />
      <button @click="writeToClipboard">写入剪贴板</button>
      <button @click="readFromClipboard">读取剪贴板</button>
      <p v-if="clipboardContent">剪贴板内容: {{ clipboardContent }}</p>
    </div>

    <div class="debug-section">
      <h3>Shell 操作</h3>
      <input v-model="urlToOpen" placeholder="输入要打开的 URL" />
      <button @click="openExternalUrl">打开外部链接</button>
    </div>

    <div class="debug-section">
      <h3>调试日志</h3>
      <button @click="testDebugLog">测试调试日志</button>
      <button @click="testErrorReport">测试错误报告</button>
    </div>

    <div class="debug-section">
      <h3>IPC 通信测试</h3>
      <button @click="testIPC">测试 IPC 通信</button>
      <p v-if="ipcResult">IPC 结果: {{ ipcResult }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const envInfo = ref<any>(null)
const systemInfo = ref<any>(null)
const appInfo = ref<any>(null)
const clipboardText = ref('')
const clipboardContent = ref('')
const urlToOpen = ref('https://www.electronjs.org')
const ipcResult = ref('')

// 获取环境信息
const getEnvironmentInfo = () => {
  if (window.electronAPI) {
    envInfo.value = window.electronAPI.dev.getEnvironment()
  } else {
    console.warn('Electron API 不可用')
  }
}

// 获取系统信息
const getSystemInfo = async () => {
  if (window.ipcRenderer) {
    try {
      systemInfo.value = await window.ipcRenderer.invoke('get-system-info')
    } catch (error) {
      console.error('获取系统信息失败:', error)
    }
  }
}

// 获取应用信息
const getAppInfo = async () => {
  if (window.ipcRenderer) {
    try {
      appInfo.value = await window.ipcRenderer.invoke('get-app-info')
    } catch (error) {
      console.error('获取应用信息失败:', error)
    }
  }
}

// 写入剪贴板
const writeToClipboard = () => {
  if (window.electronAPI && clipboardText.value) {
    window.electronAPI.clipboard.writeText(clipboardText.value)
    console.log('已写入剪贴板:', clipboardText.value)
  }
}

// 读取剪贴板
const readFromClipboard = () => {
  if (window.electronAPI) {
    clipboardContent.value = window.electronAPI.clipboard.readText()
  }
}

// 打开外部链接
const openExternalUrl = async () => {
  if (window.electronAPI && urlToOpen.value) {
    try {
      await window.electronAPI.shell.openExternal(urlToOpen.value)
      console.log('已打开外部链接:', urlToOpen.value)
    } catch (error) {
      console.error('打开链接失败:', error)
    }
  }
}

// 测试调试日志
const testDebugLog = () => {
  if (window.electronAPI) {
    window.electronAPI.dev.log('这是一条测试调试日志', { timestamp: new Date().toISOString() })
  }
}

// 测试错误报告
const testErrorReport = () => {
  if (window.electronAPI) {
    const testError = new Error('这是一个测试错误')
    window.electronAPI.dev.reportError(testError)
  }
}

// 测试 IPC 通信
const testIPC = () => {
  if (window.ipcRenderer) {
    // 发送消息到主进程
    window.ipcRenderer.send('main-process-message', '来自渲染进程的消息')

    // 监听主进程的回复
    window.ipcRenderer.on('main-process-message', (event, message) => {
      ipcResult.value = `收到主进程消息: ${message}`
    })
  }
}
</script>

<style scoped>
.electron-debugger {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.debug-section {
  margin-bottom: 30px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.debug-section h3 {
  margin-top: 0;
  color: #333;
}

button {
  margin: 5px;
  padding: 8px 16px;
  background-color: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #005a9e;
}

input {
  margin: 5px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 300px;
}

pre {
  background-color: #f0f0f0;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}

p {
  margin: 10px 0;
}
</style>
