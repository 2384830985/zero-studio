<template>
  <div class="flex h-screen bg-gray-100 font-sans">
    <!-- 左侧边栏 -->
    <div class="w-16 bg-white flex flex-col items-center py-4 border-r border-gray-200">
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
          class="w-8 h-8 flex items-center justify-center rounded-md cursor-pointer text-gray-600 transition-all hover:bg-gray-100 hover:text-blue-500"
          @click="$router.push('/chat')"
        >
          <MessageOutlined />
        </div>
        <div class="w-8 h-8 flex items-center justify-center rounded-md cursor-pointer text-gray-600 transition-all hover:bg-gray-100 hover:text-blue-500">
          <StarOutlined />
        </div>
        <div class="w-8 h-8 flex items-center justify-center rounded-md cursor-pointer text-gray-600 transition-all hover:bg-gray-100 hover:text-blue-500">
          <AppstoreOutlined />
        </div>
        <div
          class="w-8 h-8 flex items-center justify-center rounded-md cursor-pointer text-gray-600 transition-all hover:bg-gray-100 hover:text-blue-500"
          @click="$router.push('/translate')"
        >
          <TranslationOutlined />
        </div>
        <div class="w-8 h-8 flex items-center justify-center rounded-md cursor-pointer text-gray-600 transition-all hover:bg-gray-100 hover:text-blue-500">
          <AppstoreOutlined />
        </div>
        <div class="w-8 h-8 flex items-center justify-center rounded-md cursor-pointer text-gray-600 transition-all hover:bg-gray-100 hover:text-blue-500">
          <LogoutOutlined />
        </div>
        <div class="w-8 h-8 flex items-center justify-center rounded-md cursor-pointer text-gray-600 transition-all hover:bg-gray-100 hover:text-blue-500">
          <FolderOutlined />
        </div>
      </div>

      <!-- 底部设置 -->
      <div class="flex flex-col gap-4">
        <div class="w-8 h-8 flex items-center justify-center rounded-md cursor-pointer text-gray-600 transition-all hover:bg-gray-100 hover:text-blue-500">
          <QuestionCircleOutlined />
        </div>
        <div class="w-8 h-8 flex items-center justify-center rounded-md cursor-pointer text-gray-600 transition-all hover:bg-gray-100 hover:text-blue-500">
          <BulbOutlined />
        </div>
        <div class="w-8 h-8 flex items-center justify-center rounded-md cursor-pointer text-gray-600 transition-all hover:bg-gray-100 hover:text-blue-500">
          <SettingOutlined />
        </div>
      </div>
    </div>

    <!-- 中间聊天列表 -->
    <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
      <!-- 顶部标签 -->
      <div class="flex px-4 pt-4 border-b border-gray-100">
        <div class="px-4 py-2 cursor-pointer text-gray-600 rounded-md transition-all bg-gray-100 text-blue-500">
          助手
        </div>
        <div class="px-4 py-2 cursor-pointer text-gray-600 rounded-md transition-all hover:bg-gray-100">
          话题
        </div>
        <div class="px-4 py-2 cursor-pointer text-gray-600 rounded-md transition-all hover:bg-gray-100">
          设置
        </div>
      </div>

      <!-- 聊天项目 -->
      <div class="flex-1 p-4">
        <div class="flex items-center p-3 rounded-lg cursor-pointer mb-2 transition-all bg-blue-50">
          <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-base">
            😊
          </div>
          <div class="flex-1">
            <div class="text-sm text-gray-800">
              默认助手
            </div>
          </div>
          <div class="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
            1
          </div>
        </div>
        
        <div class="flex items-center p-3 text-gray-600 cursor-pointer rounded-lg transition-all hover:bg-gray-50">
          <PlusOutlined />
          <span class="ml-2 text-sm">添加助手</span>
        </div>
      </div>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="flex-1 flex flex-col bg-white">
      <!-- 聊天内容 -->
      <div class="flex-1 p-6 flex items-center justify-center">
        <div class="text-gray-600 text-base text-center">
          你好，我是默认助手，你可以立刻开始跟我聊天
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="px-6 py-6 border-t border-gray-100">
        <div class="bg-gray-50 rounded-xl p-3 mb-3">
          <a-input
            v-model:value="inputMessage"
            placeholder="在这里输入消息..."
            class="!border-none !bg-transparent !shadow-none !p-0 text-sm"
            @press-enter="sendMessage"
          />
          <div class="flex gap-3 mt-2">
            <PaperClipOutlined class="text-gray-400 cursor-pointer text-base transition-colors hover:text-blue-500" />
            <LinkOutlined class="text-gray-400 cursor-pointer text-base transition-colors hover:text-blue-500" />
            <AudioOutlined class="text-gray-400 cursor-pointer text-base transition-colors hover:text-blue-500" />
            <GlobalOutlined class="text-gray-400 cursor-pointer text-base transition-colors hover:text-blue-500" />
            <FileImageOutlined class="text-gray-400 cursor-pointer text-base transition-colors hover:text-blue-500" />
            <VideoCameraOutlined class="text-gray-400 cursor-pointer text-base transition-colors hover:text-blue-500" />
            <UserOutlined class="text-gray-400 cursor-pointer text-base transition-colors hover:text-blue-500" />
            <ClockCircleOutlined class="text-gray-400 cursor-pointer text-base transition-colors hover:text-blue-500" />
          </div>
        </div>
        <div class="flex justify-between items-center">
          <TranslationOutlined class="text-gray-400 cursor-pointer text-base hover:text-blue-500" />
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
  PlusOutlined,
  PaperClipOutlined,
  LinkOutlined,
  AudioOutlined,
  GlobalOutlined,
  FileImageOutlined,
  VideoCameraOutlined,

  ClockCircleOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons-vue'

const inputMessage = ref('')

const sendMessage = () => {
  if (inputMessage.value.trim()) {
    console.log('发送消息:', inputMessage.value)
    inputMessage.value = ''
  }
}
</script>
