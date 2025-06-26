<template>
  <div class="chat-content-container">
    <!-- 中间聊天列表 -->
    <div class="chat-list">
      <!-- 顶部标签 -->
      <div class="chat-tabs">
        <div class="tab active">
          助手
        </div>
        <div class="tab">
          话题
        </div>
        <div class="tab">
          设置
        </div>
      </div>

      <!-- 聊天项目 -->
      <div class="chat-items">
        <div class="chat-item active">
          <div class="chat-avatar">
            😊
          </div>
          <div class="chat-info">
            <div class="chat-name">
              默认助手
            </div>
          </div>
          <div class="chat-count">
            1
          </div>
        </div>
        
        <div class="add-chat">
          <PlusOutlined />
          <span>添加助手</span>
        </div>
      </div>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="chat-area">
      <!-- 聊天内容 -->
      <div class="chat-content">
        <div class="welcome-message">
          你好，我是默认助手，你可以立刻开始跟我聊天
        </div>
        <!-- Tailwind 测试组件 -->
        <TailwindTest />
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <div class="input-container">
          <a-input
            v-model:value="inputMessage"
            placeholder="在这里输入消息..."
            class="message-input"
            @press-enter="sendMessage"
          />
          <div class="input-actions">
            <PaperClipOutlined class="action-icon" />
            <LinkOutlined class="action-icon" />
            <AudioOutlined class="action-icon" />
            <GlobalOutlined class="action-icon" />
            <FileImageOutlined class="action-icon" />
            <VideoCameraOutlined class="action-icon" />
            <UserOutlined class="action-icon" />
            <ClockCircleOutlined class="action-icon" />
          </div>
        </div>
        <div class="send-area">
          <TranslationOutlined class="translate-icon" />
          <a-button
            type="primary"
            shape="circle"
            @click="sendMessage"
          >
            <template #icon>
              <ArrowUpOutlined />
            </template>
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  PlusOutlined,
  PaperClipOutlined,
  LinkOutlined,
  AudioOutlined,
  GlobalOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  UserOutlined,
  ClockCircleOutlined,
  TranslationOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons-vue'
import TailwindTest from './TailwindTest.vue'

const inputMessage = ref('')

const sendMessage = () => {
  if (inputMessage.value.trim()) {
    console.log('发送消息:', inputMessage.value)
    inputMessage.value = ''
  }
}
</script>

<style scoped>
.chat-content-container {
  display: flex;
  height: 100%;
  width: 100%;
  background-color: #f5f5f5;
}

/* 中间聊天列表 */
.chat-list {
  width: 280px;
  min-width: 280px; /* 确保最小宽度 */
  background-color: #ffffff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止内容溢出 */
}

.chat-tabs {
  display: flex;
  padding: 16px 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.tab {
  padding: 8px 16px;
  cursor: pointer;
  color: #666;
  border-radius: 6px;
  transition: all 0.2s;
}

.tab.active {
  background-color: #f0f0f0;
  color: #1890ff;
}

.chat-items {
  flex: 1;
  padding: 16px;
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.chat-item:hover {
  background-color: #f8f8f8;
}

.chat-item.active {
  background-color: #e6f7ff;
}

.chat-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 16px;
}

.chat-info {
  flex: 1;
}

.chat-name {
  font-size: 14px;
  color: #333;
}

.chat-count {
  width: 20px;
  height: 20px;
  background-color: #ff4d4f;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.add-chat {
  display: flex;
  align-items: center;
  padding: 12px;
  color: #666;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.add-chat:hover {
  background-color: #f8f8f8;
}

.add-chat span {
  margin-left: 8px;
  font-size: 14px;
}

/* 右侧聊天区域 */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  min-width: 0; /* 允许收缩 */
  overflow: hidden; /* 防止溢出 */
}

.chat-content {
  flex: 1;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-message {
  color: #666;
  font-size: 16px;
  text-align: center;
}

/* 输入区域 */
.input-area {
  padding: 16px 24px 16px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0; /* 防止输入区域被压缩 */
}

.input-container {
  background-color: #f8f8f8;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.message-input {
  border: none;
  background: transparent;
  box-shadow: none;
  padding: 0;
  font-size: 14px;
}

.message-input:focus {
  box-shadow: none;
}

.input-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.action-icon {
  color: #999;
  cursor: pointer;
  font-size: 16px;
  transition: color 0.2s;
}

.action-icon:hover {
  color: #1890ff;
}

.send-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.translate-icon {
  color: #999;
  cursor: pointer;
  font-size: 16px;
}

.translate-icon:hover {
  color: #1890ff;
}
</style>
