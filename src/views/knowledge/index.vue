<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <!-- 页面头部 -->
    <div class="bg-white border-b border-gray-200 px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <h1 class="text-base font-medium text-gray-900 absolute top-3">
            知识库管理
          </h1>
        </div>
        <div class="flex items-center gap-2">
          <a-button
            type="primary"
            size="small"
            class="flex items-center justify-center"
            @click="showCreateModal = true"
          >
            <template #icon>
              <PlusOutlined class="flex items-center justify-center" />
            </template>
            创建知识库
          </a-button>
        </div>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <!--    <div class="bg-white border-b border-gray-200 px-4 py-3">-->
    <!--      <div class="flex items-center gap-3">-->
    <!--        <a-input-search-->
    <!--          v-model:value="searchKeyword"-->
    <!--          placeholder="搜索知识库名称或描述..."-->
    <!--          size="small"-->
    <!--          class="flex-1 max-w-sm"-->
    <!--          @search="handleSearch"-->
    <!--        />-->
    <!--      </div>-->
    <!--    </div>-->

    <!-- 知识库列表 -->
    <div class="flex-1 overflow-y-auto p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        <div
          v-for="kb in articles"
          :key="kb.id"
          class="group bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:shadow-gray-100 transition-all duration-300 cursor-pointer relative overflow-hidden"
          :class="selectedKbId === kb.id
            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md shadow-blue-100 ring-1 ring-blue-200'
            : 'hover:border-gray-300 hover:-translate-y-0.5'"
          @click="selectKnowledgeBase(kb)"
        >
          <!-- 背景装饰 -->
          <div class="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full -translate-y-8 translate-x-8" />

          <!-- 知识库头部 -->
          <div class="flex items-start justify-between mb-3 relative z-10">
            <div class="flex items-center gap-2.5 flex-1 min-w-0">
              <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                <BookOutlined class="text-sm" />
              </div>
              <div class="min-w-0 flex-1">
                <h3
                  class="text-sm font-semibold truncate mb-0.5 leading-tight"
                  :class="selectedKbId === kb.id ? 'text-blue-900' : 'text-gray-900'"
                >
                  {{ kb.title }}
                </h3>
                <span
                  class="text-xs font-medium px-1.5 py-0.5 rounded-full"
                  :class="selectedKbId === kb.id
                    ? 'text-blue-700 bg-blue-100'
                    : 'text-gray-600 bg-gray-100'"
                >
                  {{ kb.articleIds.length }} 个文档
                </span>
              </div>
            </div>
            <a-dropdown
              :trigger="['click']"
              @click.stop
            >
              <a-button
                type="text"
                size="small"
                class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 w-7 h-7 p-0 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200"
              >
                <template #icon>
                  <MoreOutlined class="text-sm" />
                </template>
              </a-button>
              <template #overlay>
                <a-menu class="rounded-lg shadow-lg border-0">
                  <a-menu-item
                    key="edit"
                    class="rounded-md mx-1 my-1"
                    @click="editKnowledgeBase(kb)"
                  >
                    <EditOutlined />
                    编辑
                  </a-menu-item>
                  <a-menu-item
                    key="manage"
                    class="rounded-md mx-1 my-1"
                    @click="manageDocuments(kb)"
                  >
                    <FileTextOutlined />
                    管理文档
                  </a-menu-item>
                  <a-menu-divider class="mx-1" />
                  <a-menu-item
                    key="delete"
                    danger
                    class="rounded-md mx-1 my-1"
                    @click="confirmDeleteKb(kb)"
                  >
                    <DeleteOutlined />
                    删除
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>

          <!-- 知识库描述 -->
          <div class="mb-3 relative z-10">
            <p
              class="text-xs leading-relaxed line-clamp-2 min-h-[2.5rem]"
              :class="selectedKbId === kb.id ? 'text-blue-700' : 'text-gray-600'"
            >
              {{ kb.introduction || '暂无描述，点击编辑添加知识库描述信息...' }}
            </p>
          </div>

          <!-- 状态和时间 -->
          <div class="flex items-center justify-between pt-3 border-t border-gray-100 relative z-10">
            <div class="flex items-center gap-1.5">
              <div
                class="w-1.5 h-1.5 rounded-full"
                :class="kb.status === 'active' ? 'bg-green-500' : 'bg-gray-400'"
              />
              <span
                class="text-xs font-medium"
                :class="selectedKbId === kb.id ? 'text-blue-600' : 'text-gray-500'"
              >
                {{ formatTime(kb.updatedAt) }}
              </span>
            </div>
            <div
              v-if="selectedKbId === kb.id"
              class="flex items-center gap-1.5 selected-indicator"
            >
              <div class="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                <svg
                  class="w-2 h-2 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <span class="text-xs text-blue-600 font-semibold">当前</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-if="articles.length === 0"
        class="text-center py-6"
      >
        <BookOutlined class="text-2xl text-gray-400 mb-2" />
        <h3 class="text-sm font-medium text-gray-900 mb-1">
          没有找到知识库
        </h3>
        <p class="text-xs text-gray-600 mb-3">
          {{ searchKeyword ? '尝试调整搜索条件' : '开始创建您的第一个知识库' }}
        </p>
        <a-button
          v-if="!searchKeyword"
          type="primary"
          size="small"
          class="flex items-center justify-center"
          @click="showCreateModal = true"
        >
          创建知识库
        </a-button>
      </div>
    </div>

    <!-- 创建/编辑知识库模态框 -->
    <a-modal
      v-model:open="showCreateModal"
      :title="editingKb ? '编辑知识库' : '创建知识库'"
      @ok="handleCreateOrUpdate"
      @cancel="resetForm"
    >
      <a-form
        :model="kbForm"
        layout="vertical"
      >
        <a-form-item
          label="知识库名称"
          required
        >
          <a-input
            v-model:value="kbForm.title"
            placeholder="请输入知识库名称"
          />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea
            v-model:value="kbForm.introduction"
            placeholder="请输入知识库描述"
            :rows="3"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-switch
            v-model:checked="kbForm.status"
            checked-children="启用"
            :checked-value="1"
            :un-checked-value="0"
            un-checked-children="禁用"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 文档管理模态框 -->
    <a-modal
      v-model:open="showDocumentModal"
      title="文档管理"
      width="800px"
      :footer="null"
    >
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <h4 class="font-medium">
            {{ selectedKb?.title }} - 文档列表
          </h4>
          <a-button
            type="primary"
            size="small"
            @click="handleChange"
          >
            <template #icon>
              <UploadOutlined />
            </template>
            上传文档
          </a-button>
        </div>

        <a-table
          :columns="documentColumns"
          :data-source="documents"
          size="small"
          :pagination="false"
        >
          <template #bodyCell="{ column }">
            <template v-if="column.key === 'action'">
              <a-space>
                <a-button
                  type="link"
                  size="small"
                >
                  预览
                </a-button>
                <a-button
                  type="link"
                  size="small"
                  danger
                >
                  删除
                </a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  PlusOutlined,
  BookOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  UploadOutlined,
} from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'
// import type { UploadChangeParam, UploadProps, Upload } from 'ant-design-vue'
import type { KnowledgeBase, Document } from '@/types/knowledge'
import {
  ipcLancedbListTablesApi,
  ipcLancedbCreateTablesApi,
} from '@/api/knowledge'
// 导入文章管理 API
import {
  createArticle,
  listArticles,
  updateArticle,
  deleteArticle,
} from '@/api/database/index'

const showCreateModal = ref(false)
const showDocumentModal = ref(false)
const editingKb = ref<KnowledgeBase | null>(null)
const selectedKb = ref<KnowledgeBase | null>(null)
const selectedKbId = ref<number>()
const documents = ref<Document[]>([])
const searchKeyword = ref('')

// 文章管理相关数据
const articles = ref<any[]>([])

/**
 * 处理文件上传
 */
const handleChange = async () => {
  // 调用文件上传 API
  selectedKb.value && await ipcLancedbCreateTablesApi(selectedKb.value)
  loadArticles()
}

// 表单数据
const kbForm = reactive<Partial<KnowledgeBase>>({
  title: '',
  introduction: '',
  articleIds: [],
  status: 0,
})

// 文档表格列定义
const documentColumns = [
  {
    title: '文档名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
  },
  {
    title: '大小',
    dataIndex: 'size',
    key: 'size',
  },
  {
    title: '操作',
    key: 'action',
  },
]

// 格式化时间
const formatTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return new Date(timestamp).toLocaleDateString('zh-CN')
  }
}

// 选择知识库
const selectKnowledgeBase = (kb: KnowledgeBase) => {
  selectedKbId.value = kb.id
  message.success(`已选择知识库: ${kb.title}`)
}

// 编辑知识库
const editKnowledgeBase = (kb: KnowledgeBase) => {
  editingKb.value = kb
  kbForm.title = kb.title
  kbForm.introduction = kb.introduction
  kbForm.articleIds = kb.articleIds
  kbForm.status = kb.status
  showCreateModal.value = true
}

// 确认删除知识库
const confirmDeleteKb = (kb: KnowledgeBase) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除知识库"${kb?.title}"吗？此操作不可撤销。`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk() {
      deleteKnowledgeBase(kb.id)
    },
  })
}

// 删除知识库
const deleteKnowledgeBase = async (kbId: number) => {
  try {
    await deleteArticle(kbId)
    loadArticles()
    message.success('知识库删除成功')
  } catch (error) {
    console.error('删除知识库失败:', error)
    message.error('删除知识库失败')
  }
}

// 管理文档
const manageDocuments = async (kb: KnowledgeBase) => {
  selectedKb.value = kb
  try {
    showDocumentModal.value = true
    documents.value = kb.articleIds
  } catch (error) {
    console.error('加载文档列表失败:', error)
    message.error('加载文档列表失败')
  }
}

// 创建或更新知识库
const handleCreateOrUpdate = async () => {
  if (!kbForm.title.trim()) {
    message.error('请输入知识库名称')
    return
  }

  try {
    if (editingKb.value) {
      // 创建
      const updatedKb = await updateArticle({
        title: kbForm.title,
        introduction: kbForm.introduction,
        status: Number(kbForm.status),
        articleIds: JSON.stringify(kbForm.articleIds || []),
        id: Number(editingKb.value.id),
      })
      if (updatedKb.success) {
        message.success('知识库更新成功')
        await loadArticles() // 重新加载文章列表
        console.log('创建的文章:', updatedKb.data)
      } else {
        message.error('创建文章失败: ' + updatedKb.error)
      }
    } else {
      // 创建
      const result = await createArticle({
        title: kbForm.title,
        introduction: kbForm.introduction,
        status: Number(kbForm.status),
        articleIds: JSON.stringify([]),
      })
      if (result.success) {
        message.success('文章创建成功')
        await loadArticles() // 重新加载文章列表
        console.log('创建的文章:', result.data)
      } else {
        message.error('创建文章失败: ' + result.error)
      }
    }
    resetForm()
  } catch (error) {
    console.error('保存知识库失败:', error)
    message.error('保存知识库失败')
  }
}

// 重置表单
const resetForm = () => {
  showCreateModal.value = false
  editingKb.value = null
  kbForm.title = ''
  kbForm.articleIds = []
  kbForm.introduction = ''
  kbForm.status = 0
}

// ==================== 文章管理功能 ====================

// 加载文章列表
const loadArticles = async () => {
  try {
    const result = await listArticles()
    if (result.success) {
      articles.value = result?.data?.map(item => {
        try {
          item.articleIds = JSON.parse(item.articleIds)
        } catch (e) {
          item.articleIds = []
        }
        return item
      }) || []
      console.log('文章列表加载成功:', articles.value)
    } else {
      message.error('加载文章列表失败: ' + result.error)
    }
  } catch (error) {
    console.error('加载文章列表失败:', error)
    message.error('加载文章列表失败')
  }
}

// 组件挂载时加载数据
onMounted(async () => {
  const data = await ipcLancedbListTablesApi()
  console.log('ipcLancedbListTablesApi data', data)
  // 加载文章列表
  await loadArticles()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 选中状态的动画效果 */
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* 选中指示器的动画 */
.selected-indicator {
  animation: fadeInScale 0.2s ease-out;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 修复按钮图标居中问题 */
:deep(.ant-btn) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.ant-btn .ant-btn-icon) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.ant-btn .anticon) {
  display: flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}
</style>
