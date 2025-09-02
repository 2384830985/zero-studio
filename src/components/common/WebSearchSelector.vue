<template>
  <div class="web-search-selector">
    <!-- 网络搜索按钮 -->
    <a-dropdown
      :trigger="['click']"
      placement="topLeft"
    >
      <div
        class="w-5 h-5 flex items-center justify-center text-gray-400 cursor-pointer hover:text-blue-500 transition-colors duration-200"
        title="网络搜索"
      >
        <GlobalOutlined
          :style="{ fontSize: '16px', color: selectedEngine !== 'none' ? 'rgb(59 130 246 / var(--tw-bg-opacity, 1))' : '' }"
        />
      </div>

      <template #overlay>
        <a-menu class="search-menu">
          <!-- 搜索引擎选择 -->
          <a-menu-item-group title="选择搜索引擎">
            <a-menu-item
              key="google"
              :class="{ 'ant-menu-item-selected': selectedEngine === 'google' }"
              @click="selectEngine('google')"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-4 h-4 mr-2 flex items-center justify-center">
                    <span class="text-blue-500 font-bold text-sm">G</span>
                  </div>
                  <div>
                    <div class="font-medium">
                      Google
                    </div>
                    <div class="text-xs text-gray-500">
                      全球最大的搜索引擎
                    </div>
                  </div>
                </div>
                <CheckOutlined
                  v-if="selectedEngine === 'google'"
                  class="text-blue-500"
                />
              </div>
            </a-menu-item>

            <a-menu-item
              key="bing"
              :class="{ 'ant-menu-item-selected': selectedEngine === 'bing' }"
              @click="selectEngine('bing')"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-4 h-4 mr-2 flex items-center justify-center">
                    <div class="w-3 h-3 bg-blue-600 rounded-sm flex items-center justify-center">
                      <span class="text-white text-xs font-bold">b</span>
                    </div>
                  </div>
                  <div>
                    <div class="font-medium">
                      Bing
                    </div>
                    <div class="text-xs text-gray-500">
                      微软搜索引擎
                    </div>
                  </div>
                </div>
                <CheckOutlined
                  v-if="selectedEngine === 'bing'"
                  class="text-blue-500"
                />
              </div>
            </a-menu-item>

            <a-menu-item
              key="baidu"
              :class="{ 'ant-menu-item-selected': selectedEngine === 'baidu' }"
              @click="selectEngine('baidu')"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-4 h-4 mr-2 flex items-center justify-center">
                    <div class="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                      <span class="text-white text-xs font-bold">百</span>
                    </div>
                  </div>
                  <div>
                    <div class="font-medium">
                      百度
                    </div>
                    <div class="text-xs text-gray-500">
                      中文搜索引擎
                    </div>
                  </div>
                </div>
                <CheckOutlined
                  v-if="selectedEngine === 'baidu'"
                  class="text-blue-500"
                />
              </div>
            </a-menu-item>

            <a-menu-item
              key="none"
              :class="{ 'ant-menu-item-selected': selectedEngine === 'none' }"
              @click="selectEngine('none')"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-4 h-4 mr-2 flex items-center justify-center">
                    <CloseOutlined class="text-gray-400 text-xs" />
                  </div>
                  <div>
                    <div class="font-medium">
                      不需要
                    </div>
                    <div class="text-xs text-gray-500">
                      不使用网络搜索
                    </div>
                  </div>
                </div>
                <CheckOutlined
                  v-if="selectedEngine === 'none'"
                  class="text-blue-500"
                />
              </div>
            </a-menu-item>
          </a-menu-item-group>
        </a-menu>
      </template>
    </a-dropdown>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {GlobalOutlined, CheckOutlined, CloseOutlined} from '@ant-design/icons-vue'
import { useChatStore } from '@/store'

const chatStore = useChatStore()

const selectedEngine = computed(() => {
  return chatStore.getSearchEngine
})
// 定义搜索引擎类型
export type SearchEngine = 'google' | 'bing' | 'baidu' | 'none'

// 选择搜索引擎
const selectEngine = (engine: SearchEngine) => {
  chatStore.setSearchEngine(engine)
}
</script>

<style scoped>
.web-search-selector {
  display: inline-block;
}

.search-menu {
  min-width: 280px;
}

.search-menu .ant-menu-item {
  padding: 12px 16px;
  height: auto;
}

.search-menu .ant-menu-item-group-title {
  font-weight: 600;
  color: #333;
  padding: 8px 16px 4px 16px;
}

.search-menu .ant-menu-item-selected {
  background-color: #e6f7ff;
  color: #1890ff;
}

.search-menu .ant-menu-item:hover {
  background-color: #f5f5f5;
}

/* 确保菜单项内容不会被截断 */
.search-menu .ant-menu-item > * {
  width: 100%;
}
</style>
