import { defineStore } from 'pinia'
import type { AIRole, RoleCategory } from '@/types/role.ts'
import { BUILT_IN_ROLES, DEFAULT_ROLE_CATEGORIES } from '@/types/role.ts'

interface RoleStoreState {
  roles: Record<string, AIRole>
  categories: RoleCategory[]
  selectedRoleId: string
  searchKeyword: string
  selectedCategory: string
}

export const useRoleStore = defineStore('role', {
  state(): RoleStoreState {
    return {
      roles: {},
      categories: DEFAULT_ROLE_CATEGORIES,
      selectedRoleId: 'default',
      searchKeyword: '',
      selectedCategory: '',
    }
  },

  getters: {
    // 获取所有角色列表
    allRoles: (state) => Object.values(state.roles),

    // 获取启用的角色列表
    enabledRoles: (state) => Object.values(state.roles).filter(role => role.isEnabled),

    // 获取当前选中的角色
    selectedRole: (state) => state.roles[state.selectedRoleId] || null,

    // 根据分类筛选角色
    rolesByCategory: (state) => (categoryId: string) => {
      return Object.values(state.roles).filter(role => role.category === categoryId)
    },

    // 搜索角色
    filteredRoles: (state) => {
      let roles = Object.values(state.roles)

      if (roles.length === 0) {
        roles = BUILT_IN_ROLES
      }

      // 按分类筛选
      if (state.selectedCategory) {
        roles = roles.filter(role => role.category === state.selectedCategory)
      }

      // 按关键词搜索
      if (state.searchKeyword) {
        const keyword = state.searchKeyword.toLowerCase()
        roles = roles.filter(role =>
          role.name.toLowerCase().includes(keyword) ||
          role.description.toLowerCase().includes(keyword) ||
          role.tags.some(tag => tag.toLowerCase().includes(keyword)),
        )
      }

      return roles
    },

    // 获取内置角色
    builtInRoles: (state) => state.roles,

    // 获取自定义角色
    customRoles: (state) => state.roles,
  },

  actions: {
    // 选择角色
    selectRole(roleId: string) {
      if (this.roles[roleId]) {
        this.selectedRoleId = roleId
      }
    },

    // 添加自定义角色
    addRole(role: Omit<AIRole, 'id' | 'createdAt' | 'updatedAt'>) {
      const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const newRole: AIRole = {
        ...role,
        id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      this.roles[id] = newRole
      return id
    },

    // 更新角色
    updateRole(roleId: string, updates: Partial<AIRole>) {
      console.log('this.roles', updates)
      console.log('this.roles', this.roles)
      if (this.roles[roleId]) {
        this.roles[roleId] = {
          ...this.roles[roleId],
          ...updates,
          updatedAt: Date.now(),
        }
      }
    },

    // 删除角色
    deleteRole(roleId: string) {
      if (this.roles[roleId]) {
        delete this.roles[roleId]

        // 如果删除的是当前选中的角色，切换到默认角色
        if (this.selectedRoleId === roleId) {
          this.selectedRoleId = 'default'
        }

      }
    },

    // 切换角色启用状态
    toggleRoleEnabled(roleId: string) {
      if (this.roles[roleId]) {
        this.roles[roleId].isEnabled = !this.roles[roleId].isEnabled
        this.roles[roleId].updatedAt = Date.now()
      }
    },

    // 设置搜索关键词
    setSearchKeyword(keyword: string) {
      this.searchKeyword = keyword
    },

    // 设置选中的分类
    setSelectedCategory(categoryId: string) {
      this.selectedCategory = categoryId
    },
  },
  // 启用持久化
  persist: true,
})
