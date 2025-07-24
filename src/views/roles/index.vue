<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <!-- 页面头部 -->
    <div class="bg-white border-b border-gray-200 px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <h1 class="text-base font-medium text-gray-900 absolute top-3">
            AI 角色管理
          </h1>
        </div>
        <a-button
          type="primary"
          size="small"
          class="flex items-center justify-center"
          @click="showCreateModal = true"
        >
          <template #icon>
            <PlusOutlined class="flex items-center justify-center" />
          </template>
          创建角色
        </a-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="bg-white border-b border-gray-200 px-4 py-3">
      <div class="flex items-center gap-3">
        <a-input-search
          v-model:value="searchKeyword"
          placeholder="搜索角色名称、描述或标签..."
          size="small"
          class="flex-1 max-w-sm"
          @search="handleSearch"
        />
        <a-select
          v-model:value="selectedCategory"
          placeholder="选择分类"
          size="small"
          class="w-28"
          allow-clear
          @change="handleCategoryChange"
        >
          <a-select-option
            v-for="category in categories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.icon }} {{ category.name }}
          </a-select-option>
        </a-select>
      </div>
    </div>

    <!-- 角色列表 -->
    <div class="flex-1 overflow-y-auto p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
        <div
          v-for="role in filteredRoles"
          :key="role.id"
          class="bg-white rounded-md border p-2 hover:shadow-sm transition-all duration-200 cursor-pointer"
          :class="selectedRoleId === role.id
            ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-200'
            : 'border-gray-200 hover:border-gray-300'"
          @click="selectRole(role.id)"
        >
          <!-- 角色头部 -->
          <div class="flex items-center justify-between mb-1">
            <div class="flex items-center gap-1.5">
              <div class="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center text-white font-medium text-xs">
                {{ role.avatar || role.name.charAt(0) }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1">
                  <h3
                    class="text-xs font-medium truncate"
                    :class="selectedRoleId === role.id ? 'text-blue-900' : 'text-gray-900'"
                  >
                    {{ role.name }}
                  </h3>
                </div>
                <span
                  class="text-xs"
                  :class="selectedRoleId === role.id ? 'text-blue-700' : 'text-gray-500'"
                >
                  {{ getCategoryName(role.category) }}
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
                class="text-gray-400 hover:text-gray-600 w-6 h-6 p-0 flex items-center justify-center"
              >
                <template #icon>
                  <MoreOutlined class="text-xs flex items-center justify-center" />
                </template>
              </a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item
                    key="edit"
                    @click="editRole(role)"
                  >
                    <EditOutlined />
                    编辑
                  </a-menu-item>
                  <a-menu-item
                    key="toggle"
                    @click="toggleRoleEnabled(role.id)"
                  >
                    <template #icon>
                      <EyeOutlined v-if="!role.isEnabled" />
                      <EyeInvisibleOutlined v-else />
                    </template>
                    {{ role.isEnabled ? '禁用' : '启用' }}
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item
                    key="delete"
                    danger
                    @click="deleteRole(role.id)"
                  >
                    <DeleteOutlined />
                    删除
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>

          <!-- 角色描述 -->
          <p
            class="text-xs mb-1 line-clamp-1"
            :class="selectedRoleId === role.id ? 'text-blue-700' : 'text-gray-600'"
          >
            {{ role.description }}
          </p>

          <!-- 标签和状态 -->
          <div class="flex items-center justify-between">
            <div class="flex flex-wrap gap-1">
              <span
                v-for="tag in role.tags.slice(0, 2)"
                :key="tag"
                class="text-xs px-1 py-0.5 rounded"
                :class="selectedRoleId === role.id
                  ? 'bg-blue-200 text-blue-800'
                  : 'bg-gray-100 text-gray-600'"
              >
                {{ tag }}
              </span>
              <span
                v-if="role.tags.length > 2"
                class="text-xs px-1 py-0.5 rounded"
                :class="selectedRoleId === role.id
                  ? 'bg-blue-200 text-blue-800'
                  : 'bg-gray-100 text-gray-600'"
              >
                +{{ role.tags.length - 2 }}
              </span>
            </div>
            <div class="flex items-center gap-1">
              <div
                class="w-1.5 h-1.5 rounded-full"
                :class="role.isEnabled ? 'bg-green-500' : 'bg-gray-300'"
              />
              <div
                v-if="selectedRoleId === role.id"
                class="flex items-center gap-1 selected-indicator"
              >
                <div class="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
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
                <span class="text-xs text-blue-600 font-medium">当前</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-if="filteredRoles.length === 0"
        class="text-center py-6"
      >
        <RobotOutlined class="text-2xl text-gray-400 mb-2" />
        <h3 class="text-sm font-medium text-gray-900 mb-1">
          没有找到角色
        </h3>
        <p class="text-xs text-gray-600 mb-3">
          {{ searchKeyword || selectedCategory ? '尝试调整搜索条件' : '开始创建您的第一个自定义角色' }}
        </p>
        <a-button
          v-if="!searchKeyword && !selectedCategory"
          type="primary"
          size="small"
          class="flex items-center justify-center"
          @click="showCreateModal = true"
        >
          创建角色
        </a-button>
      </div>
    </div>

    <!-- 创建/编辑角色模态框 -->
    <RoleEditModal
      v-model:visible="showCreateModal"
      :role="editingRole"
      @save="handleSaveRole"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { message as antMessage, Modal } from 'ant-design-vue'
import {
  PlusOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  RobotOutlined,
} from '@ant-design/icons-vue'
import { useRoleStore } from '@/store'
import type { AIRole } from '@/types/role'
import RoleEditModal from './components/RoleEditModal.vue'

const roleStore = useRoleStore()

// 响应式数据
const showCreateModal = ref(false)
const editingRole = ref<AIRole | null>(null)

// 计算属性
const categories = computed(() => roleStore.categories)
const filteredRoles = computed(() => roleStore.filteredRoles)

const selectedRoleId = computed(() => roleStore.selectedRoleId)
const searchKeyword = computed({
  get: () => roleStore.searchKeyword,
  set: (value: string) => roleStore.setSearchKeyword(value),
})
const selectedCategory = computed({
  get: () => roleStore.selectedCategory,
  set: (value: string) => roleStore.setSelectedCategory(value),
})

// 方法
const getCategoryName = (categoryId: string) => {
  const category = categories.value.find(c => c.id === categoryId)
  return category ? category.name : '未知'
}

const selectRole = (roleId: string) => {
  roleStore.selectRole(roleId)
  antMessage.success('角色已选择')
}

const editRole = (role: AIRole) => {
  editingRole.value = role
  showCreateModal.value = true
}

const deleteRole = (roleId: string) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这个角色吗？此操作不可撤销。',
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk() {
      roleStore.deleteRole(roleId)
      antMessage.success('角色已删除')
    },
  })
}

const toggleRoleEnabled = (roleId: string) => {
  roleStore.toggleRoleEnabled(roleId)
  const role = roleStore.allRoles.find(r => r.id === roleId)
  antMessage.success(`角色已${role?.isEnabled ? '启用' : '禁用'}`)
}

const handleSearch = (value: string) => {
  roleStore.setSearchKeyword(value)
}

const handleCategoryChange = (value: string) => {
  roleStore.setSelectedCategory(value)
}

const handleSaveRole = () => {
  showCreateModal.value = false
  editingRole.value = null
  antMessage.success('角色保存成功')
}

</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 选中状态的动画效果 */
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
