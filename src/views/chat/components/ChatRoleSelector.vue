<template>
  <a-dropdown
    :trigger="['click']"
    placement="bottomLeft"
  >
    <a-button
      size="small"
      class="flex items-center gap-1.5"
    >
      <div class="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center text-white text-xs font-medium">
        {{ selectedRole?.avatar || selectedRole?.name?.charAt(0) || '?' }}
      </div>
      <span class="text-xs">{{ selectedRole?.name || '选择角色' }}</span>
      <DownOutlined class="text-xs" />
    </a-button>

    <template #overlay>
      <div class="bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-72 max-h-80 overflow-y-auto">
        <!-- 搜索框 -->
        <div class="p-2 border-b border-gray-100">
          <a-input
            v-model:value="searchKeyword"
            placeholder="搜索角色..."
            size="small"
            allow-clear
          >
            <template #prefix>
              <SearchOutlined class="text-gray-400" />
            </template>
          </a-input>
        </div>

        <!-- 分类标签 -->
        <div class="p-2 border-b border-gray-100">
          <div class="flex flex-wrap gap-1">
            <a-tag
              :color="selectedCategory === '' ? 'blue' : 'default'"
              class="cursor-pointer"
              @click="setSelectedCategory('')"
            >
              全部
            </a-tag>
            <a-tag
              v-for="category in categories"
              :key="category.id"
              :color="selectedCategory === category.id ? 'blue' : 'default'"
              class="cursor-pointer"
              @click="setSelectedCategory(category.id)"
            >
              {{ category.icon }} {{ category.name }}
            </a-tag>
          </div>
        </div>

        <!-- 角色列表 -->
        <div class="max-h-48 overflow-y-auto">
          <div
            v-for="role in filteredRoles"
            :key="role.id"
            class="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer rounded-md transition-colors"
            :class="{ 'bg-blue-50 border-l-2 border-blue-500': selectedRoleId === role.id }"
            @click="selectRole(role.id)"
          >
            <!-- 角色头像 -->
            <div class="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-medium text-xs">
              {{ role.avatar || role.name.charAt(0) }}
            </div>

            <!-- 角色信息 -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5">
                <h4 class="font-medium text-gray-900 text-xs truncate">
                  {{ role.name }}
                </h4>
                <span
                  v-if="role.isBuiltIn"
                  class="text-xs px-1 py-0.5 bg-blue-100 text-blue-600 rounded text-xs"
                >
                  内置
                </span>
                <div
                  v-if="!role.isEnabled"
                  class="w-1.5 h-1.5 bg-gray-300 rounded-full"
                  title="已禁用"
                />
              </div>
              <p class="text-xs text-gray-600 truncate mt-0.5">
                {{ role.description }}
              </p>
              <div class="flex flex-wrap gap-1 mt-0.5">
                <span
                  v-for="tag in role.tags.slice(0, 2)"
                  :key="tag"
                  class="text-xs px-1 py-0.5 bg-gray-100 text-gray-600 rounded"
                >
                  {{ tag }}
                </span>
              </div>
            </div>

            <!-- 选中指示器 -->
            <div
              v-if="selectedRoleId === role.id"
              class="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center"
            >
              <CheckOutlined class="text-white text-xs" />
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div
          v-if="filteredRoles.length === 0"
          class="text-center py-8 text-gray-500"
        >
          <RobotOutlined class="text-2xl mb-2" />
          <p class="text-sm">
            没有找到匹配的角色
          </p>
        </div>

        <!-- 底部操作 -->
        <div class="border-t border-gray-100 p-2 mt-2">
          <a-button
            type="link"
            size="small"
            class="w-full text-left"
            @click="goToRoleManagement"
          >
            <SettingOutlined />
            管理角色
          </a-button>
        </div>
      </div>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  DownOutlined,
  SearchOutlined,
  CheckOutlined,
  RobotOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue'
import { useRoleStore } from '@/store'

const router = useRouter()
const roleStore = useRoleStore()

// 响应式数据
const searchKeyword = ref('')
const selectedCategory = ref('')

// 计算属性
const selectedRole = computed(() => roleStore.selectedRole)
const selectedRoleId = computed(() => roleStore.selectedRoleId)
const categories = computed(() => roleStore.categories)

// 过滤角色列表
const filteredRoles = computed(() => {
  let roles = roleStore.enabledRoles

  // 按分类筛选
  if (selectedCategory.value) {
    roles = roles.filter(role => role.category === selectedCategory.value)
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    roles = roles.filter(role =>
      role.name.toLowerCase().includes(keyword) ||
      role.description.toLowerCase().includes(keyword) ||
      role.tags.some(tag => tag.toLowerCase().includes(keyword)),
    )
  }

  return roles
})

// 方法
const selectRole = (roleId: string) => {
  roleStore.selectRole(roleId)
}

const setSelectedCategory = (categoryId: string) => {
  selectedCategory.value = categoryId
}

const goToRoleManagement = () => {
  router.push('/roles')
}

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
