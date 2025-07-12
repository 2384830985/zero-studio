import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

import { createPinia } from 'pinia' // 导入 Pinia
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate' // 导入 Pinia 插件

const pinia = createPinia() // 初始化 Pinia
pinia.use(piniaPluginPersistedstate) // 激活 Pinia 插件

const app = createApp(App)
app.use(router)
app.use(Antd)
app.use(pinia)

app.mount('#app')
