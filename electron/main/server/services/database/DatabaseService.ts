/**
 * 数据库服务
 * 集成 Prisma ORM 和 electron-sqlite
 * 提供统一的数据库操作接口
 */

import { PrismaClient } from '@prisma/client'
import path, { dirname } from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { app } from 'electron'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * 数据库服务类
 * 负责管理 SQLite 数据库连接和 Prisma 客户端
 */
export class DatabaseService {
  private prisma: PrismaClient | null = null
  private dbPath: string
  private isInitialized = false

  constructor() {
    // 获取数据库文件路径
    this.dbPath = this.getDatabasePath()
  }

  /**
   * 获取数据库文件路径
   * 在开发环境和生产环境中使用不同的路径
   */
  private getDatabasePath(): string {
    const isDev = process.env.NODE_ENV === 'development'

    if (isDev) {
      // 开发环境：使用项目根目录下的 prisma/data 文件夹
      // 从 dist-electron 目录向上两级到达项目根目录
      const projectRoot = path.join(__dirname, '../../')
      console.log('projectRoot1', projectRoot)
      console.log('projectRoot2', path.join(projectRoot, 'prisma', 'data', 'dev.db'))
      return path.join(projectRoot, 'prisma', 'data', 'dev.db')
    } else {
      // 生产环境：使用用户数据目录
      const userDataPath = app.getPath('userData')
      return path.join(userDataPath, 'database', 'app.db')
    }
  }

  /**
   * 初始化数据库服务
   * 创建数据库文件夹和连接
   */
  async initialize(): Promise<void> {
    try {
      console.log('[DatabaseService] Initializing database service...')

      // 确保数据库目录存在
      const dbDir = path.dirname(this.dbPath)
      console.log('111111', dbDir)
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true })
        console.log(`[DatabaseService] Created database directory: ${dbDir}`)
      }
      console.log('222222', this.dbPath)

      // 创建 Prisma 客户端
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: `file:${this.dbPath}`,
          },
        },
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      })
      // 连接数据库
      await this.prisma.$connect()
      console.log(`[DatabaseService] Connected to database: ${this.dbPath}`)
      await this.runMigrations()
      // 运行数据库迁移（在生产环境中）
      if (process.env.NODE_ENV !== 'development') {
        await this.runMigrations()
      }

      this.isInitialized = true
      console.log('[DatabaseService] Database service initialized successfully')
    } catch (error) {
      console.error('[DatabaseService] Failed to initialize database service:', error)
      throw error
    }
  }

  /**
   * 运行数据库迁移
   * 在生产环境中自动应用数据库结构变更
   */
  private async runMigrations(): Promise<void> {
    try {
      console.log('[DatabaseService] Running database migrations...')
      // 在生产环境中，我们需要使用 prisma migrate deploy
      // 这里暂时使用 $executeRaw 来创建基本表结构
      await this.createTablesIfNotExists()
      console.log('[DatabaseService] Database migrations completed')
    } catch (error) {
      console.error('[DatabaseService] Failed to run migrations:', error)
      throw error
    }
  }

  /**
   * 创建表结构（如果不存在）
   * 用于生产环境的数据库初始化
   */
  private async createTablesIfNotExists(): Promise<void> {
    if (!this.prisma) {
      throw new Error('Database not initialized')
    }

    console.log('[DatabaseService] Checking and creating tables if not exists...')

    const tables = [
      {
        name: 'users',
        sql: `CREATE TABLE IF NOT EXISTS "users" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "email" TEXT NOT NULL UNIQUE,
          "name" TEXT,
          "avatar" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      },
      {
        name: 'projects',
        sql: `CREATE TABLE IF NOT EXISTS "projects" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "status" TEXT NOT NULL DEFAULT 'active',
          "color" TEXT,
          "userId" INTEGER NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
        )`,
      },
      {
        name: 'notes',
        sql: `CREATE TABLE IF NOT EXISTS "notes" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "title" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "tags" TEXT,
          "userId" INTEGER NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
        )`,
      },
      {
        name: 'article',
        sql: `CREATE TABLE IF NOT EXISTS "article" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "title" TEXT NOT NULL,
          "introduction" TEXT NOT NULL,
          "status" INTEGER,
          "articleIds" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      },
    ]

    // 首先检查哪些表已经存在
    const existingTables = await this.prisma.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'
    `

    const existingTableNames = new Set(existingTables.map(table => table.name))
    console.log('[DatabaseService] Existing tables:', Array.from(existingTableNames))

    // 逐个检查并创建表
    for (const table of tables) {
      if (existingTableNames.has(table.name)) {
        console.log(`[DatabaseService] Table "${table.name}" already exists, skipping creation`)
      } else {
        console.log(`[DatabaseService] Creating table "${table.name}"...`)
        try {
          await this.prisma.$executeRawUnsafe(table.sql)
          console.log(`[DatabaseService] Table "${table.name}" created successfully`)
        } catch (error) {
          console.error(`[DatabaseService] Failed to create table "${table.name}":`, error)
          throw error
        }
      }
    }

    console.log('[DatabaseService] Table creation check completed')
  }

  /**
   * 获取 Prisma 客户端实例
   */
  getPrismaClient(): PrismaClient {
    if (!this.prisma || !this.isInitialized) {
      throw new Error('Database service not initialized. Call initialize() first.')
    }
    return this.prisma
  }

  /**
   * 检查数据库连接状态
   */
  async checkConnection(): Promise<boolean> {
    try {
      if (!this.prisma) {
        return false
      }
      await this.prisma.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      console.error('[DatabaseService] Database connection check failed:', error)
      return false
    }
  }

  /**
   * 获取数据库统计信息
   */
  async getDatabaseStats(): Promise<{
    users: number
    projects: number
    note: number
  }> {
    if (!this.prisma) {
      throw new Error('Database not initialized')
    }

    const [users, projects, note] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.project.count(),
      this.prisma.note.count(),
    ])

    return { users, projects, note }
  }

  /**
   * 关闭数据库连接
   */
  async disconnect(): Promise<void> {
    try {
      if (this.prisma) {
        await this.prisma.$disconnect()
        this.prisma = null
        this.isInitialized = false
        console.log('[DatabaseService] Database disconnected')
      }
    } catch (error) {
      console.error('[DatabaseService] Error disconnecting from database:', error)
    }
  }

  /**
   * 重置数据库（仅开发环境）
   * 删除所有数据并重新创建表结构
   */
  async resetDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Database reset is not allowed in production')
    }

    if (!this.prisma) {
      throw new Error('Database not initialized')
    }

    console.log('[DatabaseService] Resetting database...')

    // 删除所有数据
    await this.prisma.note.deleteMany()
    await this.prisma.project.deleteMany()
    await this.prisma.user.deleteMany()

    console.log('[DatabaseService] Database reset completed')
  }

  /**
   * 备份数据库
   */
  async backupDatabase(backupPath?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const defaultBackupPath = path.join(
      path.dirname(this.dbPath),
      `backup_${timestamp}.db`,
    )
    const finalBackupPath = backupPath || defaultBackupPath

    try {
      // 复制数据库文件
      fs.copyFileSync(this.dbPath, finalBackupPath)
      console.log(`[DatabaseService] Database backed up to: ${finalBackupPath}`)
      return finalBackupPath
    } catch (error) {
      console.error('[DatabaseService] Failed to backup database:', error)
      throw error
    }
  }
}

// 单例实例
let databaseService: DatabaseService | null = null

/**
 * 获取数据库服务单例实例
 */
export const getDatabaseService = (): DatabaseService => {
  if (!databaseService) {
    databaseService = new DatabaseService()
  }
  return databaseService
}
