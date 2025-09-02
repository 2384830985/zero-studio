/**
 * LanceDB 向量数据库 IPC 路由
 * 处理所有与向量数据库相关的 IPC 通信
 */

import { BrowserWindow, ipcMain, dialog } from 'electron'
import fs from 'fs'
import path from 'path'
import { getLanceDBService, VectorDocument, SearchOptions, SearchResult } from '../../services/vector/LanceDBService'
import { getFileProcessorService } from '../../services/file/FileProcessorService'
import type { DocumentContent } from '../../services/file/FileProcessorService'
import { IpcChannel } from '../../../IpcChannel'
import { IIpcRoute } from '../IpcRouteManager'
import {JSON_PARSE} from '../../utils'
import {getDatabaseService} from '../../services/database/DatabaseService'

/**
 * LanceDB 向量数据库 IPC 路由处理器
 */
export class VectorDBIpcRoutes implements IIpcRoute {
  constructor(private _mainWindow: BrowserWindow) {
    // 构造函数参数自动成为私有属性
  }

  /**
   * 注册 LanceDB 相关的 IPC 处理器
   * @param mainWindow 主窗口实例
   */
  register(mainWindow: BrowserWindow): void {
    this._mainWindow = mainWindow

    // ==================== LanceDB 向量数据库 ====================
    // 数据库管理
    /** 初始化 LanceDB 数据库连接 */
    ipcMain.handle(IpcChannel.LANCEDB_INITIALIZE, this.handleInitialize.bind(this))
    /** 获取数据库统计信息 */
    ipcMain.handle(IpcChannel.LANCEDB_GET_DATABASE_STATS, this.handleGetDatabaseStats.bind(this))

    // 表管理
    /** 列出所有数据表 */
    ipcMain.handle(IpcChannel.LANCEDB_LIST_TABLES, this.handleListTables.bind(this))
    /** 获取指定表的详细信息 */
    ipcMain.handle(IpcChannel.LANCEDB_GET_TABLE_INFO, this.handleGetTableInfo.bind(this))
    /** 创建新的数据表 */
    ipcMain.handle(IpcChannel.LANCEDB_CREATE_TABLE, this.handleCreateTable.bind(this))
    /** 删除指定的数据表 */
    ipcMain.handle(IpcChannel.LANCEDB_DELETE_TABLE, this.handleDeleteTable.bind(this))
    /** 创建表的同时批量添加文档 */
    ipcMain.handle(IpcChannel.LANCEDB_CREATE_TABLE_WITH_DOCUMENTS, this.handleCreateTableWithDocuments.bind(this))

    // 文档操作 (CRUD)
    /** 获取表中的所有文档 */
    ipcMain.handle(IpcChannel.LANCEDB_GET_ALL_DOCUMENTS, this.handleGetAllDocuments.bind(this))
    /** 根据 ID 获取特定文档 */
    ipcMain.handle(IpcChannel.LANCEDB_GET_DOCUMENT_BY_ID, this.handleGetDocumentById.bind(this))
    /** 向表中批量添加文档 */
    ipcMain.handle(IpcChannel.LANCEDB_ADD_DOCUMENTS, this.handleAddDocuments.bind(this))
    /** 更新指定文档的内容 */
    ipcMain.handle(IpcChannel.LANCEDB_UPDATE_DOCUMENT, this.handleUpdateDocument.bind(this))
    /** 删除指定的文档 */
    ipcMain.handle(IpcChannel.LANCEDB_DELETE_DOCUMENT, this.handleDeleteDocument.bind(this))

    // 搜索功能
    /** 执行向量相似度搜索 */
    ipcMain.handle(IpcChannel.LANCEDB_SEARCH_DOCUMENTS, this.handleSearchDocuments.bind(this))
    /** 获取搜索建议 */
    ipcMain.handle(IpcChannel.LANCEDB_GET_SEARCH_SUGGESTIONS, this.handleGetSearchSuggestions.bind(this))

    // 文件上传功能
    /** 上传文件并创建知识库表 */
    ipcMain.handle(IpcChannel.LANCEDB_UPLOAD_FILE_CREATE_TABLE, this.handleUploadFileCreateTable.bind(this))

    console.log('[VectorDBIpcRoutes] LanceDB IPC routes registered')
  }

  /**
   * 初始化数据库
   */
  async handleInitialize(): Promise<{ success: boolean, error?: string }> {
    try {
      console.log('[VectorDB IPC] Initializing database')
      const service = getLanceDBService()
      await service.initialize()
      return { success: true }
    } catch (error) {
      console.error('[VectorDB IPC] Failed to initialize database:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 获取所有表
   */
  async handleListTables(): Promise<{ success: boolean, data?: string[], error?: string }> {
    try {
      console.log('[VectorDB IPC] Getting all tables')
      const service = getLanceDBService()
      const tables = await service.listTables()
      return { success: true, data: tables }
    } catch (error) {
      console.error('[VectorDB IPC] Failed to list tables:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 获取表信息
   */
  async handleGetTableInfo(event: any, tableName: string): Promise<{ success: boolean, data?: any, error?: string }> {
    try {
      console.log('[VectorDB IPC] Getting table info:', tableName)
      const service = getLanceDBService()
      const info = await service.getTableInfo(tableName)
      return { success: true, data: info }
    } catch (error) {
      console.error('[VectorDB IPC] Failed to get table info:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 创建表
   */
  async handleCreateTable(event: any, params: { tableName: string, documents: Omit<VectorDocument, 'vector'>[] }): Promise<{ success: boolean, error?: string }> {
    try {
      console.log('[VectorDB IPC] Creating table:', params.tableName)
      const service = getLanceDBService()
      await service.createTable(params.tableName, params.documents)
      return { success: true }
    } catch (error) {
      console.error('[VectorDB IPC] Failed to create table:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 删除表
   */
  async handleDeleteTable(event: any, tableName: string): Promise<{ success: boolean, error?: string }> {
    try {
      console.log('[VectorDB IPC] Deleting table:', tableName)
      const service = getLanceDBService()
      await service.deleteTable(tableName)
      return { success: true }
    } catch (error) {
      console.error('[VectorDB IPC] Failed to delete table:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 获取表中所有文档
   */
  @JSON_PARSE(1)
  async handleGetAllDocuments(_event: any, tableName: string): Promise<{ success: boolean, data?: VectorDocument[], error?: string }> {
    try {
      console.log('[VectorDB IPC] Getting all documents from table:', tableName)
      const service = getLanceDBService()
      console.log('service documents', service)
      const documents = await service.getAllDocuments(tableName)
      return { success: true, data: documents }
    } catch (error) {
      console.error('[VectorDB IPC] Failed to get all documents:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 根据 ID 获取文档
   */
  async handleGetDocumentById(event: any, params: { tableName: string, id: number }): Promise<{ success: boolean, data?: VectorDocument | null, error?: string }> {
    try {
      console.log('[VectorDB IPC] Getting document by ID:', params.id, 'from table:', params.tableName)
      const service = getLanceDBService()
      const document = await service.getDocumentById(params.tableName, params.id)
      return { success: true, data: document }
    } catch (error) {
      console.error('[VectorDB IPC] Failed to get document by ID:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 添加文档到表
   */
  async handleAddDocuments(event: any, params: { tableName: string, documents: Omit<VectorDocument, 'vector'>[] }): Promise<{ success: boolean, error?: string }> {
    try {
      console.log('[VectorDB IPC] Adding documents to table:', params.tableName, 'count:', params.documents.length)
      const service = getLanceDBService()
      await service.addDocuments(params.tableName, params.documents)
      return { success: true }
    } catch (error) {
      console.error('[VectorDB IPC] Failed to add documents:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 更新文档
   */
  async handleUpdateDocument(event: any, params: { tableName: string, id: number, updates: Partial<Omit<VectorDocument, 'id' | 'vector'>> }): Promise<{ success: boolean, error?: string }> {
    try {
      console.log('[VectorDB IPC] Updating document:', params.id, 'in table:', params.tableName)
      const service = getLanceDBService()
      await service.updateDocument(params.tableName, params.id, params.updates)
      return { success: true }
    } catch (error) {
      console.error('[VectorDB IPC] Failed to update document:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 删除文档
   */
  async handleDeleteDocument(_event: any, params: { tableName: string, id: number }): Promise<{ success: boolean, error?: string }> {
    try {
      console.log('[VectorDB IPC] Deleting document:', params.id, 'from table:', params.tableName)
      const service = getLanceDBService()
      await service.deleteDocument(params.tableName, params.id)
      return { success: true }
    } catch (error) {
      console.error('[VectorDB IPC] Failed to delete document:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 搜索文档
   */
  async handleSearchDocuments(_event: any, params: { tableName: string, query: string, options?: SearchOptions }): Promise<{ success: boolean, data?: SearchResult[], error?: string }> {
    try {
      console.log('[VectorDB IPC] Searching documents in table:', params.tableName, 'query:', params.query)
      const service = getLanceDBService()
      const results = await service.searchDocuments(params.tableName, params.query, params.options || {})
      return { success: true, data: results }
    } catch (error) {
      console.error('[VectorDB IPC] Failed to search documents:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 批量操作：创建表并添加文档
   */
  async handleCreateTableWithDocuments(_event: any, params: { tableName: string, documents: Omit<VectorDocument, 'vector'>[] }): Promise<{ success: boolean, error?: string }> {
    try {
      console.log('[VectorDB IPC] Creating table with documents:', params.tableName, 'count:', params.documents.length)
      const service = getLanceDBService()

      // 检查表是否已存在
      const tables = await service.listTables()
      if (tables.includes(params.tableName)) {
        // 如果表已存在，则添加文档
        await service.addDocuments(params.tableName, params.documents)
      } else {
        // 如果表不存在，则创建表
        await service.createTable(params.tableName, params.documents)
      }

      return { success: true }
    } catch (error) {
      console.error('[VectorDB IPC] Failed to create table with documents:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 获取搜索建议（基于现有文档的文本内容）
   */
  async handleGetSearchSuggestions(_event: any, params: { tableName: string, query: string, limit?: number }): Promise<{ success: boolean, data?: string[], error?: string }> {
    try {
      console.log('[VectorDB IPC] Getting search suggestions for table:', params.tableName)
      const service = getLanceDBService()

      // 获取所有文档
      const documents = await service.getAllDocuments(params.tableName)

      // 简单的文本匹配建议（可以后续优化为更智能的建议）
      const suggestions = documents
        .filter(doc => doc.text.toLowerCase().includes(params.query.toLowerCase()))
        .map(doc => doc.text)
        .slice(0, params.limit || 5)

      return { success: true, data: suggestions }
    } catch (error) {
      console.error('[VectorDB IPC] Failed to get search suggestions:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 获取数据库统计信息
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handleGetDatabaseStats(_event: any): Promise<{ success: boolean, data?: any, error?: string }> {
    try {
      console.log('[VectorDB IPC] Getting database statistics')
      const service = getLanceDBService()

      const tables = await service.listTables()
      const stats = {
        totalTables: tables.length,
        tables: [] as any[],
      }

      // 获取每个表的统计信息
      for (const tableName of tables) {
        try {
          const tableInfo = await service.getTableInfo(tableName)
          stats.tables.push(tableInfo)
        } catch (error) {
          console.warn(`Failed to get info for table ${tableName}:`, error)
        }
      }

      return { success: true, data: stats }
    } catch (error) {
      console.error('[VectorDB IPC] Failed to get database stats:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async parseFilePath(filePath: string) {
    try {
      // 获取文件状态
      const stats = await fs.promises.stat(filePath)

      // 解析路径信息
      const parsedPath = path.parse(filePath)

      // 返回结构化信息
      return {
        name: parsedPath.base,          // 文件名（含扩展名）
        size: stats.size,               // 文件大小（字节）
        type: '',                 // 文件类型（MIME类型）
        extension: parsedPath.ext, // 文件扩展名（不含点）
        path: filePath,                  // 文件完整路径
      }
    } catch (error) {
      throw new Error(`获取文件信息失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async getFilePath() {
    return new Promise((resolve) => {
      dialog.showOpenDialog({
        properties: ['openFile', 'openDirectory'],
      }).then(res => {
        const { filePaths } = res
        if (filePaths && filePaths.length) {
          resolve(filePaths[0])
        } else {
          resolve('')
        }
      }).catch(() => {
        resolve('')
      })
    })
  }

  /**
   * 处理文件上传
   * @returns Promise<{ success: boolean, data?: any, error?: string }>
   * @param _event
   * @param articleData
   */
  @JSON_PARSE(1)
  async handleUploadFileCreateTable(
    _event: any,
    articleData: any,
  ): Promise<{ success: boolean, data?: any, error?: string }> {
    try {
      const service = getDatabaseService()
      const prisma = service.getPrismaClient()
      const path = await this.getFilePath() as string
      if (!path) {
        return {
          success: false,
        }
      }
      console.log('path', path)
      const uriObj = await this.parseFilePath(path)

      const fileProcessor = getFileProcessorService()
      uriObj.type = fileProcessor.getMimeType(uriObj.extension)
      const lanceDBService = getLanceDBService()

      console.log('uriObj', uriObj)
      console.log('articleData', articleData)

      // 检查文件类型是否支持
      if (!fileProcessor.isSupportedFileType(uriObj.name)) {
        const supportedTypes = fileProcessor.getSupportedFileTypes()
        return {
          success: false,
          error: `不支持的文件类型。支持的类型: ${supportedTypes.join(', ')}`,
        }
      }
      // 从文件中提取文本内容
      const documentContent: DocumentContent = await fileProcessor.extractTextFromFile(uriObj, articleData.id)

      // 准备文档数据用于创建向量表
      const documents = [
        {
          pid: articleData.id,
          id: documentContent.id,
          text: documentContent.text,
          metadata: documentContent.metadata,
        },
      ]
      console.log('documents', documents)

      // 检查表是否已存在
      const existingTables = await lanceDBService.listTables()
      console.log('existingTables', existingTables)
      if (existingTables.includes(documentContent.documentKey)) {
        // 如果表已存在，添加文档到现有表
        await lanceDBService.addDocuments(documentContent.documentKey, documents)
        console.log(`[VectorDB IPC] Added document to existing table: ${articleData.title}`)
      } else {
        // 如果表不存在，创建新表
        await lanceDBService.createTable(documentContent.documentKey, documents)
        console.log(`[VectorDB IPC] Created new table: ${articleData.title}`)
      }

      console.log('[Database IPC] Updating article:', articleData)
      try {
        if (articleData.articleIds) {
          articleData.articleIds = JSON.parse(articleData.articleIds)
        }
      } catch (e) {
        articleData.articleIds = []
      }
      articleData.articleIds.push({
        documentKey: documentContent.documentKey,
        id: documentContent.id,
        name: documentContent.metadata.fileName,
        type: documentContent.metadata.fileType,
        size: documentContent.metadata.fileSize,
      })

      await prisma.article.update({
        where: { id: articleData.id },
        data: {
          articleIds: JSON.stringify(articleData.articleIds),
          updatedAt: new Date(),
        },
      })

      // 清理临时文件（可选，根据需求决定是否保留）
      // await fileProcessor.deleteFile(fileInfo.path)

      return {
        success: true,
        data: {
          tableName: articleData.title,
          documentCount: 1,
          fileInfo: {
            name: uriObj.name,
            size: uriObj.size,
            type: uriObj.type,
          },
          extractedContent: {
            wordCount: documentContent.metadata.wordCount,
            extractedAt: documentContent.metadata.extractedAt,
          },
        },
      }
    } catch (error) {
      console.error('[VectorDB IPC] Failed to process file upload:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
