<template>
  <div class="layout-container">
    <!-- 悬浮左侧边栏 -->
    <div class="floating-sidebar">
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
          title="聊天"
          @click="$router.push('/chat')"
        >
          <MessageOutlined />
        </div>
        <div
          class="nav-item"
          title="收藏"
        >
          <StarOutlined />
        </div>
        <div
          class="nav-item"
          title="应用"
        >
          <AppstoreOutlined />
        </div>
        <div
          class="nav-item"
          :class="{ active: $route.path === '/translate' }"
          title="翻译"
          @click="$router.push('/translate')"
        >
          <TranslationOutlined />
        </div>
        <div
          class="nav-item"
          title="工具"
        >
          <AppstoreOutlined />
        </div>
        <div
          class="nav-item"
          title="退出"
        >
          <LogoutOutlined />
        </div>
        <div
          class="nav-item"
          title="文件"
        >
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
  position: relative;
  height: 100vh;
  width: 100vw;
  background-color: #f5f5f5;
}

/* 悬浮左侧边栏 */
.floating-sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 60px;
  background-color: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
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
  border-radius: 8px;
  cursor: pointer;
  color: #666;
  transition: all 0.3s ease;
  position: relative;
}

.nav-item:hover {
  background-color: #f0f0f0;
  color: #1890ff;
  transform: scale(1.1);
}

.nav-item.active {
  background-color: #e6f7ff;
  color: #1890ff;
  transform: scale(1.1);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 16px;
  background-color: #1890ff;
  border-radius: 2px;
}

.bottom-nav {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.main-content {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding-left: 60px; /* 60px sidebar width + 16px left margin + 16px right spacing */
}
</style>
