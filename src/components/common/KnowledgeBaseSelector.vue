<template>
  <a-dropdown
    :trigger="['click']"
    placement="topLeft"
  >
    <div
      class="w-5 h-5 flex items-center justify-center text-gray-400 cursor-pointer hover:text-blue-500 transition-colors duration-200"
      :class="{ 'text-blue-500': selectedKnowledgeBase }"
      title="选择知识库"
    >
      <BookOutlined style="font-size: 16px;" />
    </div>
    <template #overlay>
      <div class="bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-[280px]">
        <div class="px-3 py-2 border-b border-gray-100">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-900">选择知识库</span>
            <a-button
              type="link"
              size="small"
              @click="goToKnowledgeManage"
            >
              管理
            </a-button>
          </div>
        </div>

        <div class="max-h-64 overflow-y-auto">
          <!-- 无知识库选项 -->
          <div
            class="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer rounded"
            :class="{ 'bg-blue-50 text-blue-600': !selectedKnowledgeBase }"
            @click="selectKnowledgeBase(null)"
          >
            <div class="w-6 h-6 bg-gray-100 rounded flex items-center justify-center mr-3">
              <CloseOutlined class="text-xs text-gray-500" />
            </div>
            <div class="flex-1">
              <div class="text-sm font-medium">
                不使用知识库
              </div>
              <div class="text-xs text-gray-500">
                使用默认AI对话
              </div>
            </div>
            <CheckOutlined
              v-if="!selectedKnowledgeBase"
              class="text-blue-500 text-sm"
            />
          </div>

          <!-- 知识库列表 -->
          <div
            v-for="kb in knowledgeBases"
            :key="kb.id"
            class="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer rounded"
            :class="{ 'bg-blue-50 text-blue-600': selectedKnowledgeBase?.id === kb.id }"
            @click="selectKnowledgeBase(kb)"
          >
            <div class="w-6 h-6 bg-blue-100 rounded flex items-center justify-center mr-3">
              <BookOutlined class="text-xs text-blue-600" />
            </div>
            <div class="flex-1">
              <div class="text-sm font-medium">
                {{ kb.name }}
              </div>
              <div class="text-xs text-gray-500">
                {{ kb.documentCount }} 个文档
              </div>
            </div>
            <div class="flex items-center">
              <a-tag
                v-if="kb.status === 'active'"
                color="green"
                size="small"
                class="mr-2"
              >
                启用
              </a-tag>
              <CheckOutlined
                v-if="selectedKnowledgeBase?.id === kb.id"
                class="text-blue-500 text-sm"
              />
            </div>
          </div>

          <!-- 空状态 -->
          <div
            v-if="knowledgeBases.length === 0"
            class="px-3 py-6 text-center"
          >
            <BookOutlined class="text-2xl text-gray-300 mb-2" />
            <div class="text-sm text-gray-500 mb-3">
              还没有知识库
            </div>
            <a-button
              type="primary"
              size="small"
              @click="goToKnowledgeManage"
            >
              创建知识库
            </a-button>
          </div>
        </div>
      </div>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  BookOutlined,
  CloseOutlined,
  CheckOutlined,
} from '@ant-design/icons-vue'
import { knowledgeApi } from '@/api/knowledge'
import type { KnowledgeBase } from '@/types/knowledge'

// Props 和 Emits
const emit = defineEmits<{
  'knowledge-base-changed': [kb: KnowledgeBase | null]
}>()

// 响应式数据
const router = useRouter()
const knowledgeBases = ref<KnowledgeBase[]>([])
const selectedKnowledgeBase = ref<KnowledgeBase | null>(null)

// 加载知识库列表
const loadKnowledgeBases = async () => {
  try {
    // 只加载启用的知识库
    knowledgeBases.value = await knowledgeApi.getKnowledgeBases({ status: 'active' })
  } catch (error) {
    console.error('加载知识库列表失败:', error)
  }
}

// 选择知识库
const selectKnowledgeBase = (kb: KnowledgeBase | null) => {
  selectedKnowledgeBase.value = kb
  emit('knowledge-base-changed', kb)
}

// 跳转到知识库管理页面
const goToKnowledgeManage = () => {
  router.push('/knowledge')
}

// 组件挂载时加载数据
onMounted(() => {
  loadKnowledgeBases()
})

// 暴露选中的知识库
defineExpose({
  selectedKnowledgeBase,
})
</script>

<style scoped>
/* 自定义滚动条 */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
