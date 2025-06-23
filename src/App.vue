<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
import ElectronDebugger from './components/ElectronDebugger.vue'
import { ref, onMounted } from 'vue'

// TypeScript 示例：定义响应式数据
const appTitle = ref<string>('Big Brother Studio')
const isElectron = ref<boolean>(false)
const showDebugger = ref<boolean>(false)

// 检查是否在 Electron 环境中运行
onMounted(() => {
  isElectron.value = !!(window as any).electronAPI
  console.log('electronAPI', window.electronAPI)
  console.log('electronAPI', window.electronAPI)
  console.log('electronAPI', window.electronAPI)
  console.log('electronAPI', window.electronAPI)
  // 在开发环境中默认显示调试器
  showDebugger.value = import.meta.env.DEV && isElectron.value
})
</script>

<template>
  <div>
    <h1>{{ appTitle }}</h1>
    <p v-if="isElectron" class="electron-status">✅ 运行在 Electron 环境中</p>
    <p v-else class="electron-status">🌐 运行在浏览器环境中</p>

    <!-- 调试器切换按钮 -->
    <div v-if="isElectron" class="debug-controls">
      <button @click="showDebugger = !showDebugger" class="debug-toggle">
        {{ showDebugger ? '隐藏调试器' : '显示调试器' }}
      </button>
    </div>

    <!-- Electron 调试器 -->
    <ElectronDebugger v-if="showDebugger" />

    <div class="logos">
      <a href="https://vite.dev" target="_blank">
        <img src="/vite.svg" class="logo" alt="Vite logo" />
      </a>
      <a href="https://vuejs.org/" target="_blank">
        <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
      </a>
      <a href="https://www.electronjs.org/" target="_blank">
        <img src="https://www.electronjs.org/assets/img/logo.svg" class="logo electron" alt="Electron logo" />
      </a>
    </div>

    <HelloWorld msg="Vue 3 + TypeScript + Electron" />
  </div>
</template>

<style scoped>
h1 {
  color: #42b883;
  margin-bottom: 1rem;
}

.electron-status {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 2rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background-color: #f0f0f0;
  display: inline-block;
}

.logos {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}

.logo.electron:hover {
  filter: drop-shadow(0 0 2em #9feaf9aa);
}

.debug-controls {
  margin: 1rem 0;
}

.debug-toggle {
  padding: 0.5rem 1rem;
  background-color: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.debug-toggle:hover {
  background-color: #005a9e;
}
</style>
