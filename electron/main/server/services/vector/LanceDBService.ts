import * as lancedb from '@lancedb/lancedb'
// import axios from 'axios'
import { Float32, FixedSizeList, Int32, Utf8, Field } from 'apache-arrow'
import path, {dirname} from 'path'
import {fileURLToPath} from 'url'

/**
 * 向量文档接口
 * 定义了存储在向量数据库中的文档结构
 */
export interface VectorDocument {
  id: number // 文档唯一标识符
  text: string // 文档文本内容
  vector?: number[] // 文档的向量表示（可选，会自动生成）
  metadata?: Record<string, any> // 文档元数据（可选）
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * 搜索选项接口
 * 定义了向量搜索的配置参数
 */
export interface SearchOptions {
  limit?: number // 返回结果的最大数量，默认为10
  threshold?: number // 距离阈值，超过此值的结果将被过滤，默认为1.0
  metricType?: 'cosine' | 'euclidean' | 'dot' // 距离度量类型（暂未使用）
}

/**
 * 搜索结果接口
 * 继承自VectorDocument，并添加了搜索相关的字段
 */
export interface SearchResult extends VectorDocument {
  _distance: number // 查询向量与结果向量之间的距离
  similarity?: number // 相似度分数（1 - distance）
}

/**
 * Qwen 嵌入向量生成服务类
 * 负责调用 Qwen3-Embedding API 生成文本的向量表示
 * 支持长文本切割、批量处理和向量平均合并
 */
class QwenEmbeddings {
  private maxTokens: number // 最大 token 数量限制
  private maxBatchSize: number // 每批处理的文本数量
  private maxTextLength: number // 单个文本的最大字符长度

  /**
   * 构造函数
   * @param options - 配置选项
   */
  constructor(
    options: {
      maxTokens?: number // 最大 token 数量，默认 8192
      maxBatchSize?: number // 批处理大小，默认 10
      maxTextLength?: number // 最大文本长度，默认 4000
    } = {},
  ) {
    this.maxTokens = options.maxTokens || 8192 // Qwen3-Embedding 的最大 token 限制
    this.maxBatchSize = options.maxBatchSize || 10 // 每批处理的文本数量
    this.maxTextLength = options.maxTextLength || 4000 // 单个文本的最大字符长度
  }

  /**
   * 切割长文本为较小的块
   */
  /**
   * 切割长文本为较小的块
   * 智能地在句子边界处切割，避免破坏语义完整性
   * @param text - 要切割的文本
   * @param maxLength - 每块的最大长度，默认使用实例配置
   * @returns 切割后的文本块数组
   */
  private splitText(text: string, maxLength: number = this.maxTextLength): string[] {
    if (text.length <= maxLength) {
      return [text]
    }

    const chunks: string[] = []
    let start = 0

    while (start < text.length) {
      let end = start + maxLength

      // 如果不是最后一块，尝试在句号、感叹号、问号处切割
      if (end < text.length) {
        const sentenceEnd = text.lastIndexOf('。', end)
        const exclamationEnd = text.lastIndexOf('！', end)
        const questionEnd = text.lastIndexOf('？', end)
        const periodEnd = text.lastIndexOf('.', end)

        const bestEnd = Math.max(sentenceEnd, exclamationEnd, questionEnd, periodEnd)

        // 如果找到了合适的句子结尾，并且不会导致块太小
        if (bestEnd > start + maxLength * 0.5) {
          end = bestEnd + 1
        }
      }

      chunks.push(text.slice(start, end).trim())
      start = end
    }

    return chunks.filter(chunk => chunk.length > 0)
  }

  /**
   * 批量处理文本，避免超出 API 限制
   * 调用 Qwen3-Embedding API 为一批文本生成向量表示
   * @param texts - 要处理的文本数组
   * @returns Promise<number[][]> - 返回每个文本对应的向量数组
   * @throws Error - 当 API 调用失败时抛出错误
   */
  private async processBatch(texts: string[]): Promise<number[][]> {
    try {
      const response = await fetch('http://localhost:11434/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'nomic-embed-text',
          prompt: texts.toString(),
        }),
      })
      const data = await response.json()
      console.log('datasss', data)
      console.log('texts', texts)
      // 确保返回的是数组格式
      if (Array.isArray(data.embedding)) {
        return [data.embedding]
      } else {
        throw new Error('Invalid embedding response format')
      }
      // const response = await axios.post(
      //   'https://aigc.sankuai.com/v1/openai/native/embeddings',
      //   {
      //     model: 'Qwen3-Embedding-0dot6B',
      //     input: texts,
      //   },
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${this.apiKey}`,
      //     },
      //     timeout: 30000, // 30秒超时
      //   },
      // )
      // return response.data.data.map((item: any) => item.embedding)
    } catch (error) {
      console.error('Batch embedding generation failed:', error)
      throw new Error(`Failed to generate embeddings for batch: ${error}`)
    }
  }

  /**
   * 将多个向量平均合并为一个向量
   * 用于将长文本切割后的多个向量块合并为单一向量表示
   * @param vectors - 要合并的向量数组
   * @returns 平均合并后的向量
   * @throws Error - 当向量数组为空时抛出错误
   */
  private averageVectors(vectors: number[][]): number[] {
    if (vectors.length === 0) {
      throw new Error('Cannot average empty vector array')
    }

    if (vectors.length === 1) {
      return vectors[0]
    }

    const dimension = vectors[0].length
    console.log('dimension', dimension)
    const averaged = new Array(dimension).fill(0)

    // 累加所有向量的对应维度值
    for (const vector of vectors) {
      for (let i = 0; i < dimension; i++) {
        averaged[i] += vector[i]
      }
    }

    // 计算平均值
    for (let i = 0; i < dimension; i++) {
      averaged[i] /= vectors.length
    }

    return averaged
  }

  /**
   * 主要的嵌入方法，支持长文本切割和批量处理
   * 处理流程：1. 切割长文本 -> 2. 批量生成向量 -> 3. 平均合并向量
   * @param texts - 要生成向量的文本数组
   * @returns Promise<number[][]> - 返回每个文本对应的向量数组
   * @throws Error - 当向量生成失败时抛出错误
   */
  async embed(texts: string[]): Promise<number[][]> {
    try {
      const results: number[][] = []

      for (const text of texts) {
        // 1. 切割长文本
        const chunks = this.splitText(text)
        console.log(`Text split into ${chunks.length} chunks`)

        // 2. 批量处理所有块
        const chunkVectors: number[][] = []

        for (let i = 0; i < chunks.length; i += this.maxBatchSize) {
          const batch = chunks.slice(i, i + this.maxBatchSize)
          console.log(`Processing batch ${Math.floor(i / this.maxBatchSize) + 1}/${Math.ceil(chunks.length / this.maxBatchSize)}`)

          const batchVectors = await this.processBatch(batch)
          chunkVectors.push(...batchVectors)

          // 添加延迟以避免 API 限流
          if (i + this.maxBatchSize < chunks.length) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }

        console.log('chunkVectors', chunkVectors)
        // 3. 如果有多个块，将它们的向量平均合并
        const finalVector = this.averageVectors(chunkVectors)
        console.log('finalVector', finalVector)
        results.push(finalVector)
      }

      return results
    } catch (error) {
      console.error('Embedding generation failed:', error)
      throw new Error('Failed to generate embeddings')
    }
  }

  /**
   * 估算文本的 token 数量（粗略估算）
   * 基于字符类型进行估算：中文字符约1.5 tokens，英文单词约1.3 tokens
   * @param text - 要估算的文本
   * @returns 估算的 token 数量
   */
  private estimateTokens(text: string): number {
    // 粗略估算：中文字符约 1.5 tokens，英文单词约 1.3 tokens
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    const otherChars = text.length - chineseChars - englishWords

    return Math.ceil(chineseChars * 1.5 + englishWords * 1.3 + otherChars * 0.5)
  }

  /**
   * 检查文本是否需要切割
   * 根据文本长度和估算的 token 数量判断是否超出限制
   * @param text - 要检查的文本
   * @returns 如果需要切割返回 true，否则返回 false
   */
  needsSplitting(text: string): boolean {
    return text.length > this.maxTextLength || this.estimateTokens(text) > this.maxTokens
  }

  /**
   * 获取配置信息
   * @returns 当前实例的配置参数
   */
  getConfig() {
    return {
      maxTokens: this.maxTokens,
      maxBatchSize: this.maxBatchSize,
      maxTextLength: this.maxTextLength,
    }
  }
}

/**
 * LanceDB 向量数据库服务类
 * 提供向量数据库的完整操作接口，包括表管理、文档增删改查、向量搜索等功能
 * 集成了 QwenEmbeddings 服务，自动处理文本向量化
 */
export class LanceDBService {
  private db: any // LanceDB 数据库连接实例
  private embeddings: QwenEmbeddings // 向量生成服务实例
  private dbPath: string // 数据库存储路径

  /**
   * 构造函数
   * @param apiKey - Qwen API 密钥，默认使用预设值
   */
  constructor(apiKey = '21916759741674831895') {
    this.embeddings = new QwenEmbeddings(apiKey)
    // 将数据库存储在用户数据目录
    const projectRoot = path.join(__dirname, '../../')
    this.dbPath = path.join('/',projectRoot, 'data','lancedb')
    console.log('this.dbPath', this.dbPath)
  }

  /**
   * 初始化数据库连接
   * 必须在使用其他方法前调用此方法
   * @throws Error - 当数据库初始化失败时抛出错误
   */
  async initialize(): Promise<void> {
    try {
      this.db = await lancedb.connect(this.dbPath)
      console.log('LanceDB initialized successfully')
    } catch (error) {
      console.error('Failed to initialize LanceDB:', error)
      throw error
    }
  }

  /**
   * 创建新的向量表
   * 自动为文档生成向量并创建表结构
   * @param tableName - 表名
   * @param documents - 要插入的文档数组（不包含向量字段）
   * @throws Error - 当表创建失败时抛出错误
   */
  async createTable(tableName: string, documents: Omit<VectorDocument, 'vector'>[]): Promise<void> {
    try {
      // 生成向量
      const texts = documents.map(doc => doc.text)
      const vectors = await this.embeddings.embed(texts)

      // 准备数据
      const data = documents.map((doc, i) => ({
        id: doc.id,
        text: doc.text,
        vector: vectors[i],
        metadata: JSON.stringify(doc.metadata || {}),
      }))

      // 获取向量维度
      const vectorDimension = vectors[0].length

      console.log('tableName', tableName)

      // 创建表
      await this.db.createTable(tableName, data, {
        schema: {
          fields: [
            { name: 'id', type: new Int32(), nullable: false },
            { name: 'text', type: new Utf8(), nullable: false },
            { name: 'vector', type: new FixedSizeList(vectorDimension, new Field('item', new Float32(), true)), nullable: true },
            { name: 'metadata', type: new Utf8(), nullable: true },
          ],
        },
      })

      console.log(`Table ${tableName} created successfully`)
    } catch (error) {
      console.error(`Failed to create table ${tableName}:`, error)
      throw error
    }
  }

  /**
   * 获取指定名称的表实例
   * @param tableName - 表名
   * @returns Promise<any> - 返回表实例
   * @throws Error - 当表不存在时抛出错误
   */
  async getTable(tableName: string): Promise<any> {
    try {
      const tableNames = await this.db.tableNames()
      if (!tableNames.includes(tableName)) {
        throw new Error(`Table ${tableName} does not exist`)
      }
      return await this.db.openTable(tableName)
    } catch (error) {
      console.error(`Failed to get table ${tableName}:`, error)
      throw error
    }
  }

  /**
   * 列出数据库中所有表的名称
   * @returns Promise<string[]> - 返回表名数组
   * @throws Error - 当获取表列表失败时抛出错误
   */
  async listTables(): Promise<string[]> {
    try {
      return await this.db.tableNames()
    } catch (error) {
      console.error('Failed to list tables:', error)
      throw error
    }
  }

  /**
   * 向指定表中添加文档
   * 自动为新文档生成向量表示
   * @param tableName - 表名
   * @param documents - 要添加的文档数组（不包含向量字段）
   * @throws Error - 当添加文档失败时抛出错误
   */
  async addDocuments(tableName: string, documents: Omit<VectorDocument, 'vector'>[]): Promise<void> {
    try {
      const table = await this.getTable(tableName)

      // 生成向量
      const texts = documents.map(doc => doc.text)
      const vectors = await this.embeddings.embed(texts)

      // 准备数据
      const data = documents.map((doc, i) => ({
        id: doc.id,
        text: doc.text,
        vector: vectors[i],
        metadata: JSON.stringify(doc.metadata || {}),
      }))

      await table.add(data)
      console.log(`Added ${documents.length} documents to table ${tableName}`)
    } catch (error) {
      console.error(`Failed to add documents to table ${tableName}:`, error)
      throw error
    }
  }

  /**
   * 在指定表中搜索相似文档
   * 根据查询文本生成向量，然后在表中搜索最相似的文档
   * @param tableName - 要搜索的表名
   * @param query - 查询文本
   * @param options - 搜索选项（限制数量、距离阈值等）
   * @returns Promise<SearchResult[]> - 返回搜索结果数组，按相似度排序
   * @throws Error - 当搜索失败时抛出错误
   */
  async searchDocuments(
    tableName: string,
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResult[]> {
    try {
      const table = await this.getTable(tableName)
      const { limit = 10, threshold = 1000.0 } = options

      // 生成查询向量
      const queryVectors = await this.embeddings.embed([query])
      const queryVector = queryVectors[0]

      // 先检查表中是否有数据
      const allDocs = await this.getAllDocuments(tableName)
      console.log('Table document count:', allDocs.length)

      // 执行搜索 - 使用余弦距离
      const results = await table
        .search(queryVector)
        .limit(limit)
        .toArray()

      // 处理结果
      const processedResults: SearchResult[] = results
        .filter((result: any) => {
          console.log(`Filtering result: distance=${result._distance}, threshold=${threshold}`)
          return result._distance <= threshold
        })
        .map((result: any) => ({
          id: result.id,
          text: result.text,
          vector: result.vector,
          metadata: result.metadata ? JSON.parse(result.metadata) : {},
          _distance: result._distance,
          similarity: 1 - result._distance, // 转换为相似度分数
        }))

      console.log(`Processed results count: ${processedResults.length}`)
      return processedResults
    } catch (error) {
      console.error(`Failed to search in table ${tableName}:`, error)
      throw error
    }
  }

  /**
   * 根据 ID 获取指定文档
   * 由于 LanceDB 不直接支持按 ID 查询，需要扫描整个表
   * @param tableName - 表名
   * @param id - 文档 ID
   * @returns Promise<VectorDocument | null> - 返回找到的文档，如果不存在则返回 null
   * @throws Error - 当查询失败时抛出错误
   */
  async getDocumentById(tableName: string, id: number): Promise<VectorDocument | null> {
    try {
      // LanceDB 不直接支持按 ID 查询，需要扫描表
      const results = await this.getAllDocuments(tableName)
      const document = results.find((doc: any) => doc.id === id)

      if (!document) {
        return null
      }

      return {
        id: document.id,
        text: document.text,
        vector: document.vector,
        metadata: typeof document.metadata === 'string' ? JSON.parse(document.metadata) : document.metadata || {},
      }
    } catch (error) {
      console.error(`Failed to get document ${id} from table ${tableName}:`, error)
      throw error
    }
  }

  /**
   * 获取表中的所有文档
   * @param tableName - 表名
   * @returns Promise<VectorDocument[]> - 返回所有文档的数组
   * @throws Error - 当获取失败时抛出错误
   */
  async getAllDocuments(tableName: string): Promise<VectorDocument[]> {
    try {
      const table = await this.getTable(tableName)
      // 使用 scan() 方法来获取所有数据
      const results = await table.query().toArray()

      return results.map((doc: any) => ({
        id: doc.id,
        text: doc.text,
        vector: doc.vector,
        metadata: doc.metadata ? JSON.parse(doc.metadata) : {},
      }))
    } catch (error) {
      console.error(`Failed to get all documents from table ${tableName}:`, error)
      throw error
    }
  }

  /**
   * 更新指定文档
   * 由于 LanceDB 不支持直接更新，需要重建整个表
   * @param tableName - 表名
   * @param id - 要更新的文档 ID
   * @param updates - 要更新的字段（不包含 id 和 vector）
   * @throws Error - 当更新失败时抛出错误
   */
  async updateDocument(tableName: string, id: number, updates: Partial<Omit<VectorDocument, 'id' | 'vector'>>): Promise<void> {
    try {
      // LanceDB 不支持直接更新，需要删除后重新插入
      const allDocs = await this.getAllDocuments(tableName)

      const docIndex = allDocs.findIndex(doc => doc.id === id)
      if (docIndex === -1) {
        throw new Error(`Document with id ${id} not found`)
      }

      // 更新文档
      const updatedDoc = { ...allDocs[docIndex], ...updates }

      // 如果文本发生变化，需要重新生成向量
      if (updates.text && updates.text !== allDocs[docIndex].text) {
        const newVectors = await this.embeddings.embed([updates.text])
        updatedDoc.vector = newVectors[0]
      }

      // 删除原表并重新创建
      await this.db.dropTable(tableName)

      // 更新文档列表
      allDocs[docIndex] = updatedDoc

      // 重新创建表
      const data = allDocs.map(doc => ({
        id: doc.id,
        text: doc.text,
        vector: doc.vector,
        metadata: JSON.stringify(doc.metadata || {}),
      }))

      const vectorDimension = allDocs[0].vector?.length || 1024
      await this.db.createTable(tableName, data, {
        schema: {
          fields: [
            { name: 'id', type: new Int32(), nullable: false },
            { name: 'text', type: new Utf8(), nullable: false },
            { name: 'vector', type: new FixedSizeList(vectorDimension, new Field('item', new Float32(), true)), nullable: true },
            { name: 'metadata', type: new Utf8(), nullable: true },
          ],
        },
      })

      console.log(`Document ${id} updated successfully in table ${tableName}`)
    } catch (error) {
      console.error(`Failed to update document ${id} in table ${tableName}:`, error)
      throw error
    }
  }

  /**
   * 删除指定文档
   * 由于 LanceDB 不支持直接删除，需要重建整个表
   * @param tableName - 表名
   * @param id - 要删除的文档 ID
   * @throws Error - 当删除失败或文档不存在时抛出错误
   */
  async deleteDocument(tableName: string, id: number): Promise<void> {
    try {
      const allDocs = await this.getAllDocuments(tableName)

      const filteredDocs = allDocs.filter(doc => doc.id !== id)

      if (filteredDocs.length === allDocs.length) {
        throw new Error(`Document with id ${id} not found`)
      }

      // 删除原表并重新创建
      await this.db.dropTable(tableName)

      if (filteredDocs.length > 0) {
        // 重新创建表
        const data = filteredDocs.map(doc => ({
          id: doc.id,
          text: doc.text,
          vector: doc.vector,
          metadata: JSON.stringify(doc.metadata || {}),
        }))

        const vectorDimension = filteredDocs[0].vector?.length || 1024
        await this.db.createTable(tableName, data, {
          schema: {
            fields: [
              { name: 'id', type: new Int32(), nullable: false },
              { name: 'text', type: new Utf8(), nullable: false },
              { name: 'vector', type: new FixedSizeList(vectorDimension, new Field('item', new Float32(), true)), nullable: true },
              { name: 'metadata', type: new Utf8(), nullable: true },
            ],
          },
        })
      }

      console.log(`Document ${id} deleted successfully from table ${tableName}`)
    } catch (error) {
      console.error(`Failed to delete document ${id} from table ${tableName}:`, error)
      throw error
    }
  }

  /**
   * 删除指定的表
   * @param tableName - 要删除的表名
   * @throws Error - 当删除失败时抛出错误
   */
  async deleteTable(tableName: string): Promise<void> {
    try {
      await this.db.dropTable(tableName)
      console.log(`Table ${tableName} deleted successfully`)
    } catch (error) {
      console.error(`Failed to delete table ${tableName}:`, error)
      throw error
    }
  }

  /**
   * 获取表的详细信息
   * @param tableName - 表名
   * @returns Promise<{name: string, count: number, schema: any}> - 返回表的基本信息
   * @throws Error - 当获取信息失败时抛出错误
   */
  async getTableInfo(tableName: string): Promise<{ name: string; count: number; schema: any }> {
    try {
      const documents = await this.getAllDocuments(tableName)

      return {
        name: tableName,
        count: documents.length,
        schema: {
          fields: [
            { name: 'id', type: 'Int32' },
            { name: 'text', type: 'Utf8' },
            { name: 'vector', type: 'FixedSizeList' },
            { name: 'metadata', type: 'Utf8' },
          ],
        },
      }
    } catch (error) {
      console.error(`Failed to get table info for ${tableName}:`, error)
      throw error
    }
  }
}

// 单例实例
let lanceDBService: LanceDBService | null = null

/**
 * 获取 LanceDBService 单例实例
 * 使用单例模式确保整个应用中只有一个数据库服务实例
 * @returns LanceDBService 实例
 */
export const getLanceDBService = (): LanceDBService => {
  if (!lanceDBService) {
    lanceDBService = new LanceDBService()
  }
  return lanceDBService
}
