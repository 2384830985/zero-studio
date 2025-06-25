<template>
  <div class="layout-container">
    <!-- 左侧边栏 -->
    <div class="sidebar">
      <!-- 用户头像 -->
      <div class="user-avatar">
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
      <div class="nav-menu">
        <div 
          class="nav-item" 
          :class="{ active: $route.path === '/chat' }"
          @click="$router.push('/chat')"
        >
          <MessageOutlined />
        </div>
        <div class="nav-item">
          <StarOutlined />
        </div>
        <div class="nav-item">
          <AppstoreOutlined />
        </div>
        <div 
          class="nav-item" 
          :class="{ active: $route.path === '/translate' }"
          @click="$router.push('/translate')"
        >
          <TranslationOutlined />
        </div>
        <div class="nav-item">
          <AppstoreOutlined />
        </div>
        <div class="nav-item">
          <LogoutOutlined />
        </div>
        <div class="nav-item">
          <FolderOutlined />
        </div>
      </div>

      <!-- 底部设置 -->
      <div class="bottom-nav">
        <div class="nav-item">
          <QuestionCircleOutlined />
        </div>
        <div class="nav-item">
          <BulbOutlined />
        </div>
        <div class="nav-item">
          <SettingOutlined />
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  UserOutlined,
  MessageOutlined,
  StarOutlined,
  AppstoreOutlined,
  TranslationOutlined,
  LogoutOutlined,
  FolderOutlined,
  QuestionCircleOutlined,
  BulbOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue'
</script>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 左侧边栏 */
.sidebar {
  width: 60px;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
  border-right: 1px solid #e8e8e8;
}

.user-avatar {
  margin-bottom: 24px;
}

.nav-menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.nav-item {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.nav-item:hover {
  background-color: #f0f0f0;
  color: #1890ff;
}

.nav-item.active {
  background-color: #e6f7ff;
  color: #1890ff;
}

.bottom-nav {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
