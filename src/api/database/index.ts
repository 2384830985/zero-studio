/**
 * 数据库 API 接口
 * 提供前端与数据库服务的通信接口
 */

import { ipcRenderer } from '@/api/ipcApi'
import { IpcChannel } from '../../../electron/main/IpcChannel'

// ==================== 数据库管理 API ====================

/**
 * 初始化数据库
 */
export const initializeDatabase = async () => {
  return ipcRenderer(IpcChannel.DATABASE_INITIALIZE)
}

/**
 * 检查数据库连接
 */
export const checkDatabaseConnection = async () => {
  return ipcRenderer(IpcChannel.DATABASE_CHECK_CONNECTION)
}

/**
 * 获取数据库统计信息
 */
export const getDatabaseStats = async () => {
  return ipcRenderer(IpcChannel.DATABASE_GET_STATS)
}

/**
 * 重置数据库
 */
export const resetDatabase = async () => {
  return ipcRenderer(IpcChannel.DATABASE_RESET)
}

/**
 * 备份数据库
 */
export const backupDatabase = async (backupPath?: string) => {
  return ipcRenderer(IpcChannel.DATABASE_BACKUP, backupPath)
}

// ==================== 用户管理 API ====================

/**
 * 创建用户
 */
export const createUser = async (userData: {
  email: string
  name?: string
  avatar?: string
}) => {
  console.log('11111', userData)
  return ipcRenderer(IpcChannel.USER_CREATE, userData)
}

/**
 * 获取用户列表
 */
export const listUsers = async (options?: any) => {
  return ipcRenderer(IpcChannel.USER_LIST, options)
}

/**
 * 根据ID获取用户
 */
export const getUserById = async (id: number) => {
  return ipcRenderer(IpcChannel.USER_GET_BY_ID, id)
}

/**
 * 更新用户
 */
export const updateUser = async (id: number, userData: {
  email?: string
  name?: string
  avatar?: string
}) => {
  return ipcRenderer(IpcChannel.USER_UPDATE, id, userData)
}

/**
 * 删除用户
 */
export const deleteUser = async (id: number) => {
  return ipcRenderer(IpcChannel.USER_DELETE, id)
}

// ==================== 项目管理 API ====================

/**
 * 创建项目
 */
export const createProject = async (projectData: {
  name: string
  description?: string
  status?: string
  color?: string
  userId: number
}) => {
  return ipcRenderer(IpcChannel.PROJECT_CREATE, projectData)
}

/**
 * 获取项目列表
 */
export const listProjects = async (options?: any) => {
  return ipcRenderer(IpcChannel.PROJECT_LIST, options)
}

/**
 * 根据ID获取项目
 */
export const getProjectById = async (id: number) => {
  return ipcRenderer(IpcChannel.PROJECT_GET_BY_ID, id)
}

/**
 * 更新项目
 */
export const updateProject = async (id: number, projectData: {
  name?: string
  description?: string
  status?: string
  color?: string
}) => {
  return ipcRenderer(IpcChannel.PROJECT_UPDATE, id, projectData)
}

/**
 * 删除项目
 */
export const deleteProject = async (id: number) => {
  return ipcRenderer(IpcChannel.PROJECT_DELETE, id)
}

// ==================== 任务管理 API ====================

/**
 * 创建任务
 */
export const createTask = async (taskData: {
  title: string
  description?: string
  status?: string
  priority?: string
  dueDate?: Date
  userId: number
  projectId?: number
}) => {
  return ipcRenderer(IpcChannel.TASK_CREATE, taskData)
}

/**
 * 获取任务列表
 */
export const listTasks = async (options?: any) => {
  return ipcRenderer(IpcChannel.TASK_LIST, options)
}

/**
 * 根据ID获取任务
 */
export const getTaskById = async (id: number) => {
  return ipcRenderer(IpcChannel.TASK_GET_BY_ID, id)
}

/**
 * 更新任务
 */
export const updateTask = async (id: number, taskData: {
  title?: string
  description?: string
  status?: string
  priority?: string
  dueDate?: Date
  completedAt?: Date
  projectId?: number
}) => {
  return ipcRenderer(IpcChannel.TASK_UPDATE, id, taskData)
}

/**
 * 删除任务
 */
export const deleteTask = async (id: number) => {
  return ipcRenderer(IpcChannel.TASK_DELETE, id)
}

// ==================== 笔记管理 API ====================

/**
 * 创建笔记
 */
export const createNote = async (noteData: {
  title: string
  content: string
  tags?: string
  userId: number
}) => {
  return ipcRenderer(IpcChannel.NOTE_CREATE, noteData)
}

/**
 * 获取笔记列表
 */
export const listNotes = async (options?: any) => {
  return ipcRenderer(IpcChannel.NOTE_LIST, options)
}

/**
 * 根据ID获取笔记
 */
export const getNoteById = async (id: number) => {
  return ipcRenderer(IpcChannel.NOTE_GET_BY_ID, id)
}

/**
 * 更新笔记
 */
export const updateNote = async (id: number, noteData: {
  title?: string
  content?: string
  tags?: string
}) => {
  return ipcRenderer(IpcChannel.NOTE_UPDATE, id, noteData)
}

/**
 * 删除笔记
 */
export const deleteNote = async (id: number) => {
  return ipcRenderer(IpcChannel.NOTE_DELETE, id)
}

// ==================== 设置管理 API ====================

/**
 * 获取设置
 */
export const getSetting = async (key: string) => {
  return ipcRenderer(IpcChannel.SETTING_GET, key)
}

/**
 * 设置值
 */
export const setSetting = async (key: string, value: string) => {
  return ipcRenderer(IpcChannel.SETTING_SET, key, value)
}

/**
 * 获取所有设置
 */
export const listSettings = async () => {
  return ipcRenderer(IpcChannel.SETTING_LIST)
}

// ==================== 文章管理 API ====================

/**
 * 创建文章
 */
export const createArticle = async (articleData: {
  title?: string
  introduction?: string
  status?: number
  articleIds?: string
}) => {
  return ipcRenderer(IpcChannel.ARTICLE_CREATE, articleData)
}

/**
 * 获取文章列表
 */
export const listArticles = async (options?: any) => {
  return ipcRenderer(IpcChannel.ARTICLE_LIST, options)
}

/**
 * 根据ID获取文章
 */
export const getArticleById = async (id: number) => {
  return ipcRenderer(IpcChannel.ARTICLE_GET_BY_ID, id)
}

/**
 * 更新文章
 */
export const updateArticle = async (articleData: {
  title?: string
  introduction?: string
  status?: number
  id: number
  articleIds?: string
}) => {
  return ipcRenderer(IpcChannel.ARTICLE_UPDATE, articleData)
}

/**
 * 删除文章
 */
export const deleteArticle = async (id: number) => {
  return ipcRenderer(IpcChannel.ARTICLE_DELETE, id)
}
