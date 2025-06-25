import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../components/Layout.vue'
import ChatContent from '../components/ChatContent.vue'
import TranslateContent from '../components/TranslateContent.vue'

const routes = [
  {
    path: '/',
    redirect: '/chat',
  },
  {
    path: '/',
    component: Layout,
    children: [
      {
        path: 'chat',
        name: 'Chat',
        component: ChatContent,
      },
      {
        path: 'translate',
        name: 'Translate',
        component: TranslateContent,
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
