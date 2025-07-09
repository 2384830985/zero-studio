import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import ChatView from '../views/chat/ChatView.vue'
import TranslateView from '../views/translate/TranslateView.vue'
import SettingsView from '../views/settings/SettingsView.vue'
import ModelServiceSettings from '../views/settings/ModelServiceSettings.vue'
import DisplaySettings from '../views/settings/DisplaySettings.vue'
import ZoomSettings from '../views/settings/ZoomSettings.vue'
import TopicSettings from '../views/settings/TopicSettings.vue'
import AssistantSettings from '../views/settings/AssistantSettings.vue'
import DifyView from '../views/dify/DifyView.vue'

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
      {
        path: 'dify',
        name: 'Dify',
        component: DifyView,
      },
      {
        path: 'settings',
        component: SettingsView,
        redirect: '/settings/model',
        children: [
          {
            path: 'model',
            name: 'ModelServiceSettings',
            component: ModelServiceSettings,
          },
          {
            path: 'display',
            name: 'DisplaySettings',
            component: DisplaySettings,
          },
          {
            path: 'zoom',
            name: 'ZoomSettings',
            component: ZoomSettings,
          },
          {
            path: 'topic',
            name: 'TopicSettings',
            component: TopicSettings,
          },
          {
            path: 'assistant',
            name: 'AssistantSettings',
            component: AssistantSettings,
          },
        ],
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
