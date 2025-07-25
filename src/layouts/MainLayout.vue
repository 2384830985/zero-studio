<template>
  <div class="relative h-screen w-screen bg-gray-100">
    <!-- 悬浮左侧边栏 -->
    <div class="fixed left-0 top-0 bottom-0 w-16 bg-white/95 flex flex-col items-center py-4 shadow-2xl z-50 backdrop-blur-xl border border-white/30 transition-all duration-300">
      <!-- 用户头像 -->
      <div class="mb-6">
        <a-avatar
          :size="32"
          style="background-color: #52c41a;"
        >
          <template #icon>
            <UserOutlined />
          </template>
        </a-avatar>
      </div>

      <!-- 导航菜单 -->
      <div class="flex-1 flex flex-col gap-4">
        <div
          class="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer text-gray-600 transition-all duration-300 relative hover:bg-gray-100 hover:text-blue-500 hover:scale-110"
          :class="{
            'bg-blue-50 text-blue-500 scale-110 before:absolute before:left-[-8px] before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-4 before:bg-blue-500 before:rounded': $route.path === '/chat'
          }"
          title="聊天"
          @click="$router.push('/chat')"
        >
          <MessageOutlined />
        </div>
        <div
          class="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer text-gray-600 transition-all duration-300 relative hover:bg-gray-100 hover:text-blue-500 hover:scale-110"
          :class="{
            'bg-blue-50 text-blue-500 scale-110 before:absolute before:left-[-8px] before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-4 before:bg-blue-500 before:rounded': $route.path === '/roles'
          }"
          title="AI 角色"
          @click="$router.push('/roles')"
        >
          <TeamOutlined />
        </div>
        <div
          class="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer text-gray-600 transition-all duration-300 relative hover:bg-gray-100 hover:text-blue-500 hover:scale-110"
          :class="{
            'bg-blue-50 text-blue-500 scale-110 before:absolute before:left-[-8px] before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-4 before:bg-blue-500 before:rounded': $route.path === '/knowledge'
          }"
          title="知识库"
          @click="$router.push('/knowledge')"
        >
          <BookOutlined />
        </div>
        <!--        <div-->
        <!--          class="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer text-gray-600 transition-all duration-300 hover:bg-gray-100 hover:text-blue-500 hover:scale-110"-->
        <!--          title="收藏"-->
        <!--        >-->
        <!--          <StarOutlined />-->
        <!--        </div>-->
        <!--        <div-->
        <!--          class="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer text-gray-600 transition-all duration-300 hover:bg-gray-100 hover:text-blue-500 hover:scale-110"-->
        <!--          title="应用"-->
        <!--        >-->
        <!--          <AppstoreOutlined />-->
        <!--        </div>-->
        <div
          class="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer text-gray-600 transition-all duration-300 relative hover:bg-gray-100 hover:text-blue-500 hover:scale-110"
          :class="{
            'bg-blue-50 text-blue-500 scale-110 before:absolute before:left-[-8px] before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-4 before:bg-blue-500 before:rounded': $route.path === '/translate'
          }"
          title="翻译"
          @click="$router.push('/translate')"
        >
          <TranslationOutlined />
        </div>
        <div
          class="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer text-gray-600 transition-all duration-300 relative hover:bg-gray-100 hover:text-blue-500 hover:scale-110"
          :class="{
            'bg-blue-50 text-blue-500 scale-110 before:absolute before:left-[-8px] before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-4 before:bg-blue-500 before:rounded': $route.path === '/dify'
          }"
          title="Dify AI"
          @click="$router.push('/dify')"
        >
          <RobotOutlined />
        </div>
        <div
          class="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer text-gray-600 transition-all duration-300 relative hover:bg-gray-100 hover:text-blue-500 hover:scale-110"
          :class="{
            'bg-blue-50 text-blue-500 scale-110 before:absolute before:left-[-8px] before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-4 before:bg-blue-500 before:rounded': $route.path.startsWith('/tools')
          }"
          title="开发工具"
          @click="$router.push('/tools')"
        >
          <AppstoreOutlined />
        </div>
        <!--        <div-->
        <!--          class="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer text-gray-600 transition-all duration-300 hover:bg-gray-100 hover:text-blue-500 hover:scale-110"-->
        <!--          title="退出"-->
        <!--        >-->
        <!--          <LogoutOutlined />-->
        <!--        </div>-->
        <div
          class="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer text-gray-600 transition-all duration-300 hover:bg-gray-100 hover:text-blue-500 hover:scale-110"
          title="文件"
        >
          <FolderOutlined />
        </div>
      </div>

      <!-- 底部设置 -->
      <div class="flex flex-col gap-4 mt-6 pt-4 border-t border-gray-100">
        <div class="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer text-gray-600 transition-all duration-300 hover:bg-gray-100 hover:text-blue-500 hover:scale-110">
          <QuestionCircleOutlined />
        </div>
        <!--        <div class="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer text-gray-600 transition-all duration-300 hover:bg-gray-100 hover:text-blue-500 hover:scale-110">-->
        <!--          <BulbOutlined />-->
        <!--        </div>-->
        <div
          class="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer text-gray-600 transition-all duration-300 relative hover:bg-gray-100 hover:text-blue-500 hover:scale-110"
          :class="{
            'bg-blue-50 text-blue-500 scale-110 before:absolute before:left-[-8px] before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-4 before:bg-blue-500 before:rounded': $route.path === '/settings'
          }"
          title="设置"
          @click="$router.push('/settings')"
        >
          <SettingOutlined />
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="w-full h-screen flex flex-col pl-16">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  UserOutlined,
  MessageOutlined,
  TranslationOutlined,
  RobotOutlined,
  TeamOutlined,
  BookOutlined,
  FolderOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  AppstoreOutlined,
} from '@ant-design/icons-vue'
</script>
