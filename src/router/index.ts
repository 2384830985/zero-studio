import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import ChatView from '../views/chat/index.vue'
import TranslateView from '../views/translate/index.vue'
import SettingsView from '../views/settings/SettingsView.vue'
import DifyView from '../views/dify/index.vue'
import RoleManagement from '../views/roles/index.vue'
import KnowledgeView from '../views/knowledge/index.vue'
import JsonConverter from '../views/tools/JsonConverter.vue'
import ToolsIndex from '../views/tools/index.vue'

// 设置页面的子组件
import ModelServiceSettings from '../views/settings/ModelServiceSettings.vue'
import MCPSettings from '../views/settings/MCPSettings.vue'
import ToolSettings from '../views/settings/ToolSettings.vue'
import DisplaySettings from '../views/settings/DisplaySettings.vue'
import ZoomSettings from '../views/settings/ZoomSettings.vue'
import TopicSettings from '../views/settings/TopicSettings.vue'
import AssistantSettings from '../views/settings/AssistantSettings.vue'

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
        path: 'roles',
        name: 'Roles',
        component: RoleManagement,
      },
      {
        path: 'knowledge',
        name: 'Knowledge',
        component: KnowledgeView,
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
        path: 'tools',
        name: 'Tools',
        component: ToolsIndex,
      },
      {
        path: 'tools/json-converter',
        name: 'JsonConverter',
        component: JsonConverter,
      },
      {
        path: 'settings',
        name: 'Settings',
        component: SettingsView,
        redirect: '/settings/model',
        children: [
          {
            path: 'model',
            name: 'ModelSettings',
            component: ModelServiceSettings,
          },
          {
            path: 'mcp',
            name: 'MCPSettings',
            component: MCPSettings,
          },
          {
            path: 'tool',
            name: 'ToolSettings',
            component: ToolSettings,
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
          {
            path: 'about',
            name: 'AboutSettings',
            component: () => import('../views/settings/AboutSettings.vue'),
          },
        ],
      },
    ],
  },
]

const router = createRouter({
  history: process.env.NODE_ENV === 'production' || window.location.protocol === 'file:'
    ? createWebHashHistory()
    : createWebHistory(),
  routes,
})

export default router
