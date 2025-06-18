<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
import { ref, onMounted } from 'vue'

// TypeScript 示例：定义响应式数据
const appTitle = ref<string>('Big Brother Studio')
const isElectron = ref<boolean>(false)

// 检查是否在 Electron 环境中运行
onMounted(() => {
  isElectron.value = !!(window as any).electronAPI
})
</script>

<template>
  <div>
    <h1>{{ appTitle }}</h1>
    <p v-if="isElectron" class="electron-status">✅ 运行在 Electron 环境中</p>
    <p v-else class="electron-status">🌐 运行在浏览器环境中</p>

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
</style>
