/**
 * 数据库 IPC 路由
 * 提供数据库操作的 IPC 接口
 * 包括用户、项目、任务、笔记等数据的 CRUD 操作
 */

import { ipcMain } from 'electron'
import { IpcChannel } from '../../../IpcChannel'
import { getDatabaseService } from '../../services/database/DatabaseService'
import { IIpcRoute } from '../IpcRouteManager'
import { JSON_PARSE } from '../../utils'

/**
 * 数据库 IPC 路由处理器
 */
export class DatabaseIpcRoutes implements IIpcRoute {

  /**
   * 注册数据库相关的 IPC 处理器
   */
  register(): void {
    // ==================== 数据库管理 ====================
    /** 初始化数据库 */
    ipcMain.handle(IpcChannel.DATABASE_INITIALIZE, this.handleInitialize.bind(this))
    /** 检查数据库连接 */
    ipcMain.handle(IpcChannel.DATABASE_CHECK_CONNECTION, this.handleCheckConnection.bind(this))
    /** 获取数据库统计信息 */
    ipcMain.handle(IpcChannel.DATABASE_GET_STATS, this.handleGetStats.bind(this))
    /** 重置数据库 */
    ipcMain.handle(IpcChannel.DATABASE_RESET, this.handleReset.bind(this))
    /** 备份数据库 */
    ipcMain.handle(IpcChannel.DATABASE_BACKUP, this.handleBackup.bind(this))

    // ==================== 用户管理 ====================
    /** 创建用户 */
    ipcMain.handle(IpcChannel.USER_CREATE, this.handleCreateUser.bind(this))
    /** 获取用户列表 */
    ipcMain.handle(IpcChannel.USER_LIST, this.handleListUsers.bind(this))
    /** 根据ID获取用户 */
    ipcMain.handle(IpcChannel.USER_GET_BY_ID, this.handleGetUserById.bind(this))
    /** 更新用户 */
    ipcMain.handle(IpcChannel.USER_UPDATE, this.handleUpdateUser.bind(this))
    /** 删除用户 */
    ipcMain.handle(IpcChannel.USER_DELETE, this.handleDeleteUser.bind(this))

    // ==================== 项目管理 ====================
    /** 创建项目 */
    ipcMain.handle(IpcChannel.PROJECT_CREATE, this.handleCreateProject.bind(this))
    /** 获取项目列表 */
    ipcMain.handle(IpcChannel.PROJECT_LIST, this.handleListProjects.bind(this))
    /** 根据ID获取项目 */
    ipcMain.handle(IpcChannel.PROJECT_GET_BY_ID, this.handleGetProjectById.bind(this))
    /** 更新项目 */
    ipcMain.handle(IpcChannel.PROJECT_UPDATE, this.handleUpdateProject.bind(this))
    /** 删除项目 */
    ipcMain.handle(IpcChannel.PROJECT_DELETE, this.handleDeleteProject.bind(this))

    // ==================== 笔记管理 ====================
    /** 创建笔记 */
    ipcMain.handle(IpcChannel.NOTE_CREATE, this.handleCreateNote.bind(this))
    /** 获取笔记列表 */
    ipcMain.handle(IpcChannel.NOTE_LIST, this.handleListNotes.bind(this))
    /** 根据ID获取笔记 */
    ipcMain.handle(IpcChannel.NOTE_GET_BY_ID, this.handleGetNoteById.bind(this))
    /** 更新笔记 */
    ipcMain.handle(IpcChannel.NOTE_UPDATE, this.handleUpdateNote.bind(this))
    /** 删除笔记 */
    ipcMain.handle(IpcChannel.NOTE_DELETE, this.handleDeleteNote.bind(this))

    // ==================== 文章管理 ====================
    /** 创建文章 */
    ipcMain.handle(IpcChannel.ARTICLE_CREATE, this.handleCreateArticle.bind(this))
    /** 获取文章列表 */
    ipcMain.handle(IpcChannel.ARTICLE_LIST, this.handleListArticles.bind(this))
    /** 根据ID获取文章 */
    ipcMain.handle(IpcChannel.ARTICLE_GET_BY_ID, this.handleGetArticleById.bind(this))
    /** 更新文章 */
    ipcMain.handle(IpcChannel.ARTICLE_UPDATE, this.handleUpdateArticle.bind(this))
    /** 删除文章 */
    ipcMain.handle(IpcChannel.ARTICLE_DELETE, this.handleDeleteArticle.bind(this))

    console.log('[DatabaseIpcRoutes] Database IPC routes registered')
  }

  /**
   * 清理 IPC 处理器
   */
  cleanup(): void {
    // 移除所有数据库相关的 IPC 处理器
    const channels = [
      IpcChannel.DATABASE_INITIALIZE,
      IpcChannel.DATABASE_CHECK_CONNECTION,
      IpcChannel.DATABASE_GET_STATS,
      IpcChannel.DATABASE_RESET,
      IpcChannel.DATABASE_BACKUP,
      IpcChannel.USER_CREATE,
      IpcChannel.USER_LIST,
      IpcChannel.USER_GET_BY_ID,
      IpcChannel.USER_UPDATE,
      IpcChannel.USER_DELETE,
      IpcChannel.PROJECT_CREATE,
      IpcChannel.PROJECT_LIST,
      IpcChannel.PROJECT_GET_BY_ID,
      IpcChannel.PROJECT_UPDATE,
      IpcChannel.PROJECT_DELETE,
      IpcChannel.TASK_CREATE,
      IpcChannel.TASK_LIST,
      IpcChannel.TASK_GET_BY_ID,
      IpcChannel.TASK_UPDATE,
      IpcChannel.TASK_DELETE,
      IpcChannel.NOTE_CREATE,
      IpcChannel.NOTE_LIST,
      IpcChannel.NOTE_GET_BY_ID,
      IpcChannel.NOTE_UPDATE,
      IpcChannel.NOTE_DELETE,
      IpcChannel.SETTING_GET,
      IpcChannel.SETTING_SET,
      IpcChannel.SETTING_LIST,
      IpcChannel.ARTICLE_CREATE,
      IpcChannel.ARTICLE_LIST,
      IpcChannel.ARTICLE_GET_BY_ID,
      IpcChannel.ARTICLE_UPDATE,
      IpcChannel.ARTICLE_DELETE,
    ]

    channels.forEach(channel => {
      ipcMain.removeAllListeners(channel)
    })

    console.log('[DatabaseIpcRoutes] Database IPC routes cleaned up')
  }

  // ==================== 数据库管理处理器 ====================

  /**
   * 初始化数据库
   */
  async handleInitialize(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[Database IPC] Initializing database')
      const service = getDatabaseService()
      await service.initialize()
      return { success: true }
    } catch (error) {
      console.error('[Database IPC] Failed to initialize database:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 检查数据库连接
   */
  async handleCheckConnection(): Promise<{ success: boolean; connected: boolean; error?: string }> {
    try {
      console.log('[Database IPC] Checking database connection')
      const service = getDatabaseService()
      const connected = await service.checkConnection()
      return { success: true, connected }
    } catch (error) {
      console.error('[Database IPC] Failed to check database connection:', error)
      return { success: false, connected: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 获取数据库统计信息
   */
  async handleGetStats(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('[Database IPC] Getting database stats')
      const service = getDatabaseService()
      const stats = await service.getDatabaseStats()
      return { success: true, data: stats }
    } catch (error) {
      console.error('[Database IPC] Failed to get database stats:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 重置数据库
   */
  async handleReset(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[Database IPC] Resetting database')
      const service = getDatabaseService()
      await service.resetDatabase()
      return { success: true }
    } catch (error) {
      console.error('[Database IPC] Failed to reset database:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 备份数据库
   */
  async handleBackup(_event: any, backupPath?: string): Promise<{ success: boolean; backupPath?: string; error?: string }> {
    try {
      console.log('[Database IPC] Backing up database')
      const service = getDatabaseService()
      const finalBackupPath = await service.backupDatabase(backupPath)
      return { success: true, backupPath: finalBackupPath }
    } catch (error) {
      console.error('[Database IPC] Failed to backup database:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // ==================== 用户管理处理器 ====================

  /**
   * 创建用户
   */
  @JSON_PARSE(1)
  async handleCreateUser(_event: any, userData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('[Database IPC] Creating user:', userData)
      const service = getDatabaseService()
      const prisma = service.getPrismaClient()
      // console.log('[Database IPC] Creating user prisma:', prisma)
      // console.log('[Database IPC] Creating user prisma user:', prisma.user)
      const user = await prisma.user.create({
        data: userData, // 装饰器已经解析了 JSON，不需要再次解析
      })
      return { success: true, data: user }
    } catch (error) {
      console.error('[Database IPC] Failed to create user:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 获取用户列表
   */
  @JSON_PARSE(1)
  async handleListUsers(_event: any, options?: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('[Database IPC] Listing users')
      const service = getDatabaseService()
      console.log('options222', options)
      const prisma = service.getPrismaClient()
      const users = await prisma.user.findMany({
        ...options,
      })
      return { success: true, data: users }
    } catch (error) {
      console.error('[Database IPC] Failed to list users:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 根据ID获取用户
   */
  async handleGetUserById(_event: any, id: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('[Database IPC] Getting user by ID:', id)
      const service = getDatabaseService()
      const prisma = service.getPrismaClient()
      const user = await prisma.user.findUnique({
        where: { id },
      })
      return { success: true, data: user }
    } catch (error) {
      console.error('[Database IPC] Failed to get user by ID:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 更新用户
   */
  @JSON_PARSE(2)
  async handleUpdateUser(_event: any, id: number, userData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('[Database IPC] Updating user:', id, userData)
      const service = getDatabaseService()
      const prisma = service.getPrismaClient()
      const user = await prisma.user.update({
        where: { id },
        data: userData,
      })
      return { success: true, data: user }
    } catch (error) {
      console.error('[Database IPC] Failed to update user:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 删除用户
   */
  async handleDeleteUser(_event: any, id: number): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[Database IPC] Deleting user:', id)
      const service = getDatabaseService()
      const prisma = service.getPrismaClient()
      await prisma.user.delete({
        where: { id },
      })
      return { success: true }
    } catch (error) {
      console.error('[Database IPC] Failed to delete user:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // ==================== 项目管理处理器 ====================

  /**
   * 创建项目
   */
  @JSON_PARSE(1)
  async handleCreateProject(_event: any, projectData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('[Database IPC] Creating project:', projectData)
      const service = getDatabaseService()
      const prisma = service.getPrismaClient()
      const project = await prisma.project.create({
        data: projectData,
      })
      return { success: true, data: project }
    } catch (error) {
      console.error('[Database IPC] Failed to create project:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 获取项目列表
   */
  @JSON_PARSE(1)
  async handleListProjects(_event: any, options?: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const service = getDatabaseService()
      const prisma = service.getPrismaClient()
      const projects = await prisma.project.findMany({
        ...options,
      })
      return { success: true, data: projects }
    } catch (error) {
      console.error('[Database IPC] Failed to list projects:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 根据ID获取项目
   */
  async handleGetProjectById(_event: any, id: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('[Database IPC] Getting project by ID:', id)
      const service = getDatabaseService()
      const prisma = service.getPrismaClient()
      const project = await prisma.project.findUnique({
        where: { id },
      })
      return { success: true, data: project }
    } catch (error) {
      console.error('[Database IPC] Failed to get project by ID:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 更新项目
   */
  @JSON_PARSE(2)
  async handleUpdateProject(_event: any, id: number, projectData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('[Database IPC] Updating project:', id, projectData)
      const service = getDatabaseService()
      const prisma = service.getPrismaClient()
      const project = await prisma.project.update({
        where: { id },
        data: projectData,
      })
      return { success: true, data: project }
    } catch (error) {
      console.error('[Database IPC] Failed to update project:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 删除项目
   */
  async handleDeleteProject(_event: any, id: number): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[Database IPC] Deleting project:', id)
      const service = getDatabaseService()
      const prisma = service.getPrismaClient()
      await prisma.project.delete({
        where: { id },
      })
      return { success: true }
    } catch (error) {
      console.error('[Database IPC] Failed to delete project:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // ==================== 笔记管理处理器 ====================

  /**
   * 创建笔记
   */
  @JSON_PARSE(1)
  async handleCreateNote(_event: any, noteData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('[Database IPC] Creating note:', noteData)
      const service = getDatabaseService()
      const prisma = service.getPrismaClient()
      const note = await prisma.note.create({
        data: noteData,
      })
      return { success: true, data: note }
    } catch (error) {
      console.error('[Database IPC] Failed to create note:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 创建文章
   */
  @JSON_PARSE(1)
  async handleCreateArticle(_event: any, articleData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('[Database IPC] Creating article:', articleData)
      const service = getDatabaseService()
      const prisma = service.getPrismaClient()
      const article = await prisma.article.create({
        data: articleData,
      })
      return { success: true, data: article }
    } catch (error) {
      console.error('[Database IPC] Failed to create article:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 获取笔记列表
   */
  @JSON_PARSE(1)
  async handleListNotes(_event: any, options?: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // 打印日志，显示正在列出笔记
      console.log('[Database IPC] Listing notes', options)

      // 获取数据库服务
      const service = getDatabaseService()

      // 获取 Prisma 客户端
      const prisma = service.getPrismaClient()

      // 查询笔记数据，包括用户信息
      const notes = await prisma.note.findMany({
        ...options,
      })

      // 返回成功信息和笔记数据
      return { success: true, data: notes }
    } catch (error) {
      // 捕获异常，打印错误日志
      console.error('[Database IPC] Failed to list notes:', error)

      // 返回失败信息和错误信息
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 根据ID获取笔记
   */
  async handleGetNoteById(_event: any, id: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('[Database IPC] Getting note by ID:', id)
      const service = getDatabaseService()
      const prisma = service.getPrismaClient()
      const note = await prisma.note.findUnique({
        where: { id },
      })
      return { success: true, data: note }
    } catch (error) {
      console.error('[Database IPC] Failed to get note by ID:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 更新笔记
   */
  @JSON_PARSE(2)
  async handleUpdateNote(_event: any, id: number, noteData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('[Database IPC] Updating note:', id, noteData)
      const service = getDatabaseService()
      const prisma = service.getPrismaClient()
      const note = await prisma.note.update({
        where: { id },
        data: noteData,
      })
      return { success: true, data: note }
    } catch (error) {
      console.error('[Database IPC] Failed to update note:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 删除笔记
   */
  async handleDeleteNote(_event: any, id: number): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[Database IPC] Deleting note:', id)
      const service = getDatabaseService()
      const prisma = service.getPrismaClient()
      await prisma.note.delete({
        where: { id },
      })
      return { success: true }
    } catch (error) {
      console.error('[Database IPC] Failed to delete note:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // ==================== 文章管理处理器 ====================

  /**
   * 获取文章列表
   */
  @JSON_PARSE(1)
  async handleListArticles(_event: any, options?: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('[Database IPC] Listing articles', options)
      const service = getDatabaseService()
      const prisma = service.getPrismaClient()
      const articles = await prisma.article.findMany({
        where: {
          ...options,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      return { success: true, data: articles }
    } catch (error) {
      console.error('[Database IPC] Failed to list articles:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 根据ID获取文章
   */
  async handleGetArticleById(_event: any, id: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('[Database IPC] Getting article by ID:', id)
      const service = getDatabaseService()
      const prisma = service.getPrismaClient()
      const article = await prisma.article.findUnique({
        where: { id },
      })
      return { success: true, data: article }
    } catch (error) {
      console.error('[Database IPC] Failed to get article by ID:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 更新文章
   */
  @JSON_PARSE(1)
  async handleUpdateArticle(_event: any, articleData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('[Database IPC] Updating article:', articleData)
      const service = getDatabaseService()
      const prisma = service.getPrismaClient()
      const article = await prisma.article.update({
        where: { id: articleData.id },
        data: {
          ...articleData,
          updatedAt: new Date(),
        },
      })
      return { success: true, data: article }
    } catch (error) {
      console.error('[Database IPC] Failed to update article:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 删除文章
   */
  async handleDeleteArticle(_event: any, id: number): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[Database IPC] Deleting article:', id)
      const service = getDatabaseService()
      const prisma = service.getPrismaClient()
      await prisma.article.delete({
        where: { id: Number(id) },
      })
      return { success: true }
    } catch (error) {
      console.error('[Database IPC] Failed to delete article:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}
