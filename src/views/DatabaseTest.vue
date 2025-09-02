<template>
  <div class="database-test">
    <h1>数据库测试页面</h1>

    <!-- 数据库状态 -->
    <div class="status-section">
      <h2>数据库状态</h2>
      <div class="status-info">
        <p>
          连接状态: <span :class="connectionStatus ? 'connected' : 'disconnected'">
            {{ connectionStatus ? '已连接' : '未连接' }}
          </span>
        </p>
        <button @click="checkConnection">
          检查连接
        </button>
        <button @click="initDatabase">
          初始化数据库
        </button>
      </div>
    </div>

    <!-- 数据库统计 -->
    <div
      v-if="stats"
      class="stats-section"
    >
      <h2>数据库统计</h2>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">用户数量:</span>
          <span class="stat-value">{{ stats.users }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">项目数量:</span>
          <span class="stat-value">{{ stats.projects }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">任务数量:</span>
          <span class="stat-value">{{ stats.tasks }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">笔记数量:</span>
          <span class="stat-value">{{ stats.notes }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">设置数量:</span>
          <span class="stat-value">{{ stats.settings }}</span>
        </div>
      </div>
      <button @click="refreshStats">
        刷新统计
      </button>
    </div>

    <!-- 用户管理测试 -->
    <div class="user-section">
      <h2>用户管理测试</h2>
      <div class="form-group">
        <input
          v-model="newUser.email"
          placeholder="邮箱"
        >
        <input
          v-model="newUser.name"
          placeholder="姓名"
        >
        <button @click="createTestUser">
          创建用户
        </button>
      </div>
      <div
        v-if="users.length > 0"
        class="user-list"
      >
        <h3>用户列表</h3>
        <div
          v-for="user in users"
          :key="user.id"
          class="user-item"
        >
          <span>{{ user.name }} ({{ user.email }})</span>
          <button @click="deleteTestUser(user.id)">
            删除
          </button>
        </div>
      </div>
      <button @click="loadUsers">
        加载用户
      </button>
    </div>

    <!-- 项目管理测试 -->
    <div class="project-section">
      <h2>项目管理测试</h2>
      <div
        v-if="users.length > 0"
        class="form-group"
      >
        <input
          v-model="newProject.name"
          placeholder="项目名称"
        >
        <input
          v-model="newProject.description"
          placeholder="项目描述"
        >
        <select v-model="newProject.userId">
          <option value="">
            选择用户
          </option>
          <option
            v-for="user in users"
            :key="user.id"
            :value="user.id"
          >
            {{ user.name }}
          </option>
        </select>
        <button @click="createTestProject">
          创建项目
        </button>
      </div>
      <div
        v-if="projects.length > 0"
        class="project-list"
      >
        <h3>项目列表</h3>
        <div
          v-for="project in projects"
          :key="project.id"
          class="project-item"
        >
          <span>{{ project.name }} - {{ project.description }}</span>
          <button @click="deleteTestProject(project.id)">
            删除
          </button>
        </div>
      </div>
      <button @click="loadProjects">
        加载项目
      </button>
    </div>

    <!-- 操作日志 -->
    <div class="log-section">
      <h2>操作日志</h2>
      <div class="log-container">
        <div
          v-for="(log, index) in logs"
          :key="index"
          class="log-item"
          :class="log.type"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
      <button @click="clearLogs">
        清空日志
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  initializeDatabase,
  checkDatabaseConnection,
  getDatabaseStats,
  createUser,
  listUsers,
  deleteUser,
  createProject,
  listProjects,
  deleteProject,
} from '@/api/database'

// 响应式数据
const connectionStatus = ref(false)
const stats = ref<any>(null)
const users = ref<any[]>([])
const projects = ref<any[]>([])
const logs = ref<any[]>([])

// 表单数据
const newUser = ref({
  email: '',
  name: '',
})

const newProject = ref({
  name: '',
  description: '',
  userId: '',
})

// 添加日志
const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
  logs.value.unshift({
    time: new Date().toLocaleTimeString(),
    message,
    type,
  })

  // 限制日志数量
  if (logs.value.length > 50) {
    logs.value = logs.value.slice(0, 50)
  }
}

// 检查数据库连接
const checkConnection = async () => {
  try {
    const result = await checkDatabaseConnection()
    if (result.success) {
      connectionStatus.value = result.connected
      addLog(`数据库连接状态: ${result.connected ? '已连接' : '未连接'}`, 'success')
    } else {
      addLog(`检查连接失败: ${result.error}`, 'error')
    }
  } catch (error: any) {
    addLog(`检查连接异常: ${error.message}`, 'error')
  }
}

// 初始化数据库
const initDatabase = async () => {
  try {
    addLog('正在初始化数据库...', 'info')
    const result = await initializeDatabase()
    if (result.success) {
      addLog('数据库初始化成功', 'success')
      await checkConnection()
      await refreshStats()
    } else {
      addLog(`数据库初始化失败: ${result.error}`, 'error')
    }
  } catch (error: any) {
    addLog(`数据库初始化异常: ${error.message}`, 'error')
  }
}

// 刷新统计信息
const refreshStats = async () => {
  try {
    const result = await getDatabaseStats()
    if (result.success) {
      stats.value = result.data
      addLog('统计信息已刷新', 'success')
    } else {
      addLog(`获取统计信息失败: ${result.error}`, 'error')
    }
  } catch (error: any) {
    addLog(`获取统计信息异常: ${error.message}`, 'error')
  }
}

// 创建测试用户
const createTestUser = async () => {
  if (!newUser.value.email || !newUser.value.name) {
    addLog('请填写邮箱和姓名', 'error')
    return
  }

  try {
    const result = await createUser(newUser.value)
    if (result.success) {
      addLog(`用户创建成功: ${result.data.name}`, 'success')
      newUser.value = { email: '', name: '' }
      await loadUsers()
      await refreshStats()
    } else {
      addLog(`用户创建失败: ${result.error}`, 'error')
    }
  } catch (error: any) {
    addLog(`用户创建异常: ${error.message}`, 'error')
  }
}

// 加载用户列表
const loadUsers = async () => {
  try {
    const result = await listUsers()
    if (result.success) {
      users.value = result.data
      addLog(`加载了 ${result.data.length} 个用户`, 'success')
    } else {
      addLog(`加载用户失败: ${result.error}`, 'error')
    }
  } catch (error: any) {
    addLog(`加载用户异常: ${error.message}`, 'error')
  }
}

// 删除测试用户
const deleteTestUser = async (id: number) => {
  try {
    const result = await deleteUser(id)
    if (result.success) {
      addLog('用户删除成功', 'success')
      await loadUsers()
      await refreshStats()
    } else {
      addLog(`用户删除失败: ${result.error}`, 'error')
    }
  } catch (error: any) {
    addLog(`用户删除异常: ${error.message}`, 'error')
  }
}

// 创建测试项目
const createTestProject = async () => {
  if (!newProject.value.name || !newProject.value.userId) {
    addLog('请填写项目名称和选择用户', 'error')
    return
  }

  try {
    const result = await createProject({
      ...newProject.value,
      userId: parseInt(newProject.value.userId),
    })
    if (result.success) {
      addLog(`项目创建成功: ${result.data.name}`, 'success')
      newProject.value = { name: '', description: '', userId: '' }
      await loadProjects()
      await refreshStats()
    } else {
      addLog(`项目创建失败: ${result.error}`, 'error')
    }
  } catch (error: any) {
    addLog(`项目创建异常: ${error.message}`, 'error')
  }
}

// 加载项目列表
const loadProjects = async () => {
  try {
    const result = await listProjects()
    if (result.success) {
      projects.value = result.data
      addLog(`加载了 ${result.data.length} 个项目`, 'success')
    } else {
      addLog(`加载项目失败: ${result.error}`, 'error')
    }
  } catch (error: any) {
    addLog(`加载项目异常: ${error.message}`, 'error')
  }
}

// 删除测试项目
const deleteTestProject = async (id: number) => {
  try {
    const result = await deleteProject(id)
    if (result.success) {
      addLog('项目删除成功', 'success')
      await loadProjects()
      await refreshStats()
    } else {
      addLog(`项目删除失败: ${result.error}`, 'error')
    }
  } catch (error: any) {
    addLog(`项目删除异常: ${error.message}`, 'error')
  }
}

// 清空日志
const clearLogs = () => {
  logs.value = []
}

// 组件挂载时初始化
onMounted(async () => {
  addLog('数据库测试页面已加载', 'info')
  await checkConnection()
  await refreshStats()
  await loadUsers()
  await loadProjects()
})
</script>

<style scoped>
.database-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.database-test h1 {
  color: #333;
  margin-bottom: 30px;
}

.database-test h2 {
  color: #666;
  margin: 20px 0 10px 0;
  border-bottom: 2px solid #eee;
  padding-bottom: 5px;
}

.status-section, .stats-section, .user-section, .project-section, .log-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.connected {
  color: #52c41a;
  font-weight: bold;
}

.disconnected {
  color: #ff4d4f;
  font-weight: bold;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid #eee;
}

.stat-label {
  font-weight: bold;
  color: #666;
}

.stat-value {
  color: #1890ff;
  font-weight: bold;
}

.form-group {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.form-group input, .form-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 150px;
}

.user-list, .project-list {
  margin-top: 15px;
}

.user-item, .project-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  margin-bottom: 5px;
  background: white;
  border-radius: 4px;
  border: 1px solid #eee;
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
}

.log-item {
  display: flex;
  gap: 10px;
  padding: 5px 0;
  border-bottom: 1px solid #f0f0f0;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: #999;
  font-size: 12px;
  min-width: 80px;
}

.log-message {
  flex: 1;
}

.log-item.success .log-message {
  color: #52c41a;
}

.log-item.error .log-message {
  color: #ff4d4f;
}

.log-item.info .log-message {
  color: #1890ff;
}

button {
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background: #40a9ff;
}

button:active {
  background: #096dd9;
}
</style>
