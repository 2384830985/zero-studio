<template>
  <div class="p-5 max-w-4xl mx-auto">
    <h2 class="text-2xl font-bold mb-6 text-gray-800">
      Electron API 调试面板
    </h2>

    <div class="mb-8 p-4 border border-gray-300 rounded-lg bg-gray-50">
      <h3 class="mt-0 mb-4 text-lg font-semibold text-gray-800">
        环境信息
      </h3>
      <button 
        class="m-1 px-4 py-2 bg-blue-600 text-white border-none rounded cursor-pointer hover:bg-blue-700 transition-colors"
        @click="getEnvironmentInfo"
      >
        获取环境信息
      </button>
      <pre
        v-if="envInfo"
        class="bg-gray-100 p-3 rounded mt-3 overflow-x-auto text-xs"
      >{{ JSON.stringify(envInfo, null, 2) }}</pre>
    </div>

    <div class="mb-8 p-4 border border-gray-300 rounded-lg bg-gray-50">
      <h3 class="mt-0 mb-4 text-lg font-semibold text-gray-800">
        系统信息
      </h3>
      <button 
        class="m-1 px-4 py-2 bg-blue-600 text-white border-none rounded cursor-pointer hover:bg-blue-700 transition-colors"
        @click="getSystemInfo"
      >
        获取系统信息
      </button>
      <pre
        v-if="systemInfo"
        class="bg-gray-100 p-3 rounded mt-3 overflow-x-auto text-xs"
      >{{ JSON.stringify(systemInfo, null, 2) }}</pre>
    </div>

    <div class="mb-8 p-4 border border-gray-300 rounded-lg bg-gray-50">
      <h3 class="mt-0 mb-4 text-lg font-semibold text-gray-800">
        应用信息
      </h3>
      <button 
        class="m-1 px-4 py-2 bg-blue-600 text-white border-none rounded cursor-pointer hover:bg-blue-700 transition-colors"
        @click="getAppInfo"
      >
        获取应用信息
      </button>
      <pre
        v-if="appInfo"
        class="bg-gray-100 p-3 rounded mt-3 overflow-x-auto text-xs"
      >{{ JSON.stringify(appInfo, null, 2) }}</pre>
    </div>

    <div class="mb-8 p-4 border border-gray-300 rounded-lg bg-gray-50">
      <h3 class="mt-0 mb-4 text-lg font-semibold text-gray-800">
        剪贴板操作
      </h3>
      <input
        v-model="clipboardText"
        placeholder="输入要复制的文本"
        class="m-1 px-2 py-2 border border-gray-300 rounded w-80"
      >
      <button 
        class="m-1 px-4 py-2 bg-blue-600 text-white border-none rounded cursor-pointer hover:bg-blue-700 transition-colors"
        @click="writeToClipboard"
      >
        写入剪贴板
      </button>
      <button 
        class="m-1 px-4 py-2 bg-blue-600 text-white border-none rounded cursor-pointer hover:bg-blue-700 transition-colors"
        @click="readFromClipboard"
      >
        读取剪贴板
      </button>
      <p
        v-if="clipboardContent"
        class="my-3 text-gray-700"
      >
        剪贴板内容: {{ clipboardContent }}
      </p>
    </div>

    <div class="mb-8 p-4 border border-gray-300 rounded-lg bg-gray-50">
      <h3 class="mt-0 mb-4 text-lg font-semibold text-gray-800">
        Shell 操作
      </h3>
      <input
        v-model="urlToOpen"
        placeholder="输入要打开的 URL"
        class="m-1 px-2 py-2 border border-gray-300 rounded w-80"
      >
      <button 
        class="m-1 px-4 py-2 bg-blue-600 text-white border-none rounded cursor-pointer hover:bg-blue-700 transition-colors"
        @click="openExternalUrl"
      >
        打开外部链接
      </button>
    </div>

    <div class="mb-8 p-4 border border-gray-300 rounded-lg bg-gray-50">
      <h3 class="mt-0 mb-4 text-lg font-semibold text-gray-800">
        调试日志
      </h3>
      <button 
        class="m-1 px-4 py-2 bg-blue-600 text-white border-none rounded cursor-pointer hover:bg-blue-700 transition-colors"
        @click="testDebugLog"
      >
        测试调试日志
      </button>
      <button 
        class="m-1 px-4 py-2 bg-blue-600 text-white border-none rounded cursor-pointer hover:bg-blue-700 transition-colors"
        @click="testErrorReport"
      >
        测试错误报告
      </button>
    </div>

    <div class="mb-8 p-4 border border-gray-300 rounded-lg bg-gray-50">
      <h3 class="mt-0 mb-4 text-lg font-semibold text-gray-800">
        IPC 通信测试
      </h3>
      <button 
        class="m-1 px-4 py-2 bg-blue-600 text-white border-none rounded cursor-pointer hover:bg-blue-700 transition-colors"
        @click="testIPC"
      >
        测试 IPC 通信
      </button>
      <p
        v-if="ipcResult"
        class="my-3 text-gray-700"
      >
        IPC 结果: {{ ipcResult }}
      </p>
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
    window.ipcRenderer.on('main-process-message', (_event, message) => {
      ipcResult.value = `收到主进程消息: ${message}`
    })
  }
}
</script>
