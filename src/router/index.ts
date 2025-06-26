import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import ChatView from '../views/chat/ChatView.vue'
import TranslateView from '../views/translate/TranslateView.vue'

const routes = [
  {
    path: '/',
    redirect: '/chat',
  },
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: 'chat',
        name: 'Chat',
        component: ChatView,
      },
      {
        path: 'translate',
        name: 'Translate',
        component: TranslateView,
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
