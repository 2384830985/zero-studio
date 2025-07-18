<template>
  <div class="sidebar-container">
    <!-- 标签页头部 -->
    <div class="tabs-header">
      <div class="tabs-wrapper">
        <div
          v-for="tab in tabs"
          :key="tab.key"
          :class="[
            'tab-item',
            { 'tab-active': activeTab === tab.key }
          ]"
          @click="activeTab = tab.key"
        >
          <component
            :is="tab.icon"
            class="tab-icon"
          />
          <span class="tab-label">{{ tab.label }}</span>
        </div>
      </div>
    </div>

    <!-- 标签页内容 -->
    <div class="tabs-content">
      <!-- 聊天标签页 -->
      <div
        v-if="activeTab === 'assistant'"
        class="chat-tab"
      >
        <!-- 新建对话按钮 -->
        <div class="new-chat-section">
          <button
            class="new-chat-btn"
            @click="$emit('startNewConversation')"
          >
            <PlusOutlined class="new-chat-icon" />
            <span>新对话</span>
          </button>
        </div>

        <!-- 对话列表 -->
        <div class="conversations-container">
          <div class="conversations-list">
            <div
              v-for="conv in conversations"
              :key="conv.id"
              :class="[
                'conversation-item',
                { 'conversation-active': currentConversationId === conv.id }
              ]"
              @click="$emit('switchConversation', conv.id)"
            >
              <div class="conversation-content">
                <div class="conversation-main">
                  <div class="conversation-title">
                    {{ conv.title || `对话 ${conv?.id?.slice(-8)}` }}
                  </div>
                  <div class="conversation-meta">
                    <span class="message-count">{{ conv.messageCount }} 条消息</span>
                    <span class="conversation-time">{{ formatTime(conv.lastActivity) }}</span>
                  </div>
                </div>

                <!-- 删除按钮 -->
                <div class="conversation-actions">
                  <button
                    class="delete-btn"
                    @click.stop="$emit('deleteConversation', conv.id)"
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div
              v-if="conversations.length === 0"
              class="empty-state"
            >
              <div class="empty-icon">
                💬
              </div>
              <div class="empty-text">
                暂无对话
              </div>
              <div class="empty-hint">
                点击上方按钮开始新对话
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 设置标签页 -->
      <div
        v-else-if="activeTab === 'settings'"
        class="settings-tab"
      >
        <ChatSettings />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PlusOutlined, DeleteOutlined, MessageOutlined, SettingOutlined } from '@ant-design/icons-vue'
import type { MCPConversation } from '../chat.type'
import ChatSettings from './ChatSettings.vue'

interface Props {
  conversations: MCPConversation[]
  currentConversationId: string
}

defineProps<Props>()

defineEmits<{
  startNewConversation: []
  switchConversation: [conversationId: string]
  deleteConversation: [conversationId: string]
}>()

// 标签页数据
const tabs = [
  { key: 'assistant', label: '聊天', icon: MessageOutlined },
  { key: 'settings', label: '设置', icon: SettingOutlined },
]

const activeTab = ref('assistant')

// 格式化时间
const formatTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) { // 24小时内
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    })
  }
}
</script>

<style scoped>
.sidebar-container {
  width: 280px;
  height: 100%;
  background: #fafafa;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}

/* 标签页头部 */
.tabs-header {
  padding: 12px 16px 0;
  background: #fafafa;
}

.tabs-wrapper {
  display: flex;
  background: #f1f3f4;
  border-radius: 8px;
  padding: 2px;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
}

.tab-item:hover {
  color: #374151;
  background: rgba(255, 255, 255, 0.5);
}

.tab-active {
  color: #1f2937 !important;
  background: #ffffff !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tab-icon {
  font-size: 14px;
}

.tab-label {
  font-size: 13px;
}

/* 标签页内容 */
.tabs-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 新建对话按钮 */
.new-chat-section {
  padding: 16px;
}

.new-chat-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.new-chat-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.new-chat-btn:active {
  transform: translateY(0);
}

.new-chat-icon {
  font-size: 16px;
}

/* 对话列表容器 */
.conversations-container {
  flex: 1;
  overflow: hidden;
  padding: 0 16px 16px;
}

.conversations-list {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  margin-right: -4px;
}

/* 对话项 */
.conversation-item {
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;
  border: 1px solid transparent;
}

.conversation-item:hover {
  border-color: #e5e7eb;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.conversation-active {
  background: #f0f9ff !important;
  border-color: #bfdbfe !important;
  box-shadow: 0 1px 3px rgba(59, 130, 246, 0.1) !important;
}

.conversation-content {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  gap: 8px;
}

.conversation-main {
  flex: 1;
  min-width: 0;
}

.conversation-title {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}

.message-count {
  flex-shrink: 0;
}

.conversation-time {
  flex-shrink: 0;
}

.conversation-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.conversation-item:hover .conversation-actions {
  opacity: 1;
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background: #fef2f2;
  color: #ef4444;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 4px;
}

.empty-hint {
  font-size: 12px;
  color: #9ca3af;
}

/* 设置标签页 */
.settings-tab {
  flex: 1;
  overflow-y: auto;
}

/* 自定义滚动条 */
.conversations-list::-webkit-scrollbar {
  width: 4px;
}

.conversations-list::-webkit-scrollbar-track {
  background: transparent;
}

.conversations-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.conversations-list::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.settings-tab::-webkit-scrollbar {
  width: 4px;
}

.settings-tab::-webkit-scrollbar-track {
  background: transparent;
}

.settings-tab::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.settings-tab::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar-container {
    width: 100%;
    max-width: 320px;
  }

  .conversation-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
}
</style>
