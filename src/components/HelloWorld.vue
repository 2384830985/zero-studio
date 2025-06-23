<script setup lang="ts">
import { ref } from 'vue'

// TypeScript 接口定义 props
interface Props {
  msg: string
}

// 使用 TypeScript 定义 props
defineProps<Props>()

// TypeScript 类型注解
const count = ref<number>(0)

// 示例函数：演示 TypeScript 类型
const incrementCount = (): void => {
  count.value++
}

// 示例：异步函数
const resetCount = async (): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300))
  count.value = 0
}
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button
      type="button"
      @click="incrementCount"
    >
      count is {{ count }}
    </button>
    <button
      type="button"
      class="reset-btn"
      @click="resetCount"
    >
      Reset
    </button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test TypeScript HMR
    </p>
  </div>

  <p>
    Check out
    <a
      href="https://vuejs.org/guide/quick-start.html#local"
      target="_blank"
    >create-vue</a>, the official Vue + Vite starter
  </p>
  <p>
    Learn more about IDE Support for Vue in the
    <a
      href="https://vuejs.org/guide/scaling-up/tooling.html#ide-support"
      target="_blank"
    >Vue Docs Scaling up Guide</a>.
  </p>
  <p class="read-the-docs">
    Click on the Vite and Vue logos to learn more
  </p>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.reset-btn {
  background-color: #f56565;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.reset-btn:hover {
  background-color: #e53e3e;
}

.read-the-docs {
  color: #888;
}
</style>
