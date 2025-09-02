import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

/**
 * 文件信息接口
 * 定义了文件的基本信息结构
 */
export interface FileInfo {
  name: string // 文件名
  size: number // 文件大小（字节）
  type: string // 文件类型（MIME类型）
  extension: string // 文件扩展名
  path: string // 文件路径
}

/**
 * 生成随机12位 a-z 字符串
 */
function generateRandomString12(): string {
  const length = 12
  let result = ''
  const characters = 'abcdefghijklmnopqrstuvwxyz'

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    result += characters.charAt(randomIndex)
  }

  return result
}

/**
 * 文档内容接口
 * 定义了从文件中提取的文档内容结构
 */
export interface DocumentContent {
  id: number // 文档ID
  text: string // 文档文本内容
  documentKey: string // key
  metadata: {
    fileName: string // 原始文件名
    fileSize: number // 文件大小
    fileType: string // 文件类型
    extractedAt: number // 提取时间戳
    pageCount?: number // 页数（如果适用）
    wordCount?: number // 字数
  }
}

/**
 * 文件处理服务类
 * 负责处理各种类型的文件上传和内容提取
 * 支持的文件类型：TXT、PDF、DOC、DOCX、MD等
 */
export class FileProcessorService {
  private uploadDir: string // 文件上传目录

  /**
   * 构造函数
   * 初始化上传目录路径
   */
  constructor() {
    // 将上传的文件存储在用户数据目录下的 uploads 文件夹
    this.uploadDir = path.join(app.getPath('userData'), 'uploads')
    this.ensureUploadDir()
  }

  /**
   * 确保上传目录存在
   * 如果目录不存在则创建
   */
  private ensureUploadDir(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true })
      console.log(`Created upload directory: ${this.uploadDir}`)
    }
  }

  /**
   * 保存上传的文件到本地
   * @param fileBuffer - 文件的二进制数据
   * @param fileName - 文件名
   * @returns Promise<FileInfo> - 返回保存后的文件信息
   */
  async saveFile(fileBuffer: Buffer, fileName: string): Promise<FileInfo> {
    try {
      // 生成唯一的文件名以避免冲突
      const timestamp = Date.now()
      const extension = path.extname(fileName)
      const baseName = path.basename(fileName, extension)
      const uniqueFileName = `${baseName}_${timestamp}${extension}`
      const filePath = path.join(this.uploadDir, uniqueFileName)

      // 写入文件
      await fs.promises.writeFile(filePath, fileBuffer)

      // 获取文件统计信息
      const stats = await fs.promises.stat(filePath)

      const fileInfo: FileInfo = {
        name: uniqueFileName,
        size: stats.size,
        type: this.getMimeType(extension),
        extension: extension.toLowerCase(),
        path: filePath,
      }

      console.log(`File saved successfully: ${filePath}`)
      return fileInfo
    } catch (error) {
      console.error('Failed to save file:', error)
      throw new Error(`Failed to save file: ${error}`)
    }
  }

  /**
   * 根据文件扩展名获取 MIME 类型
   * @param extension - 文件扩展名
   * @returns MIME 类型字符串
   */
  getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.rtf': 'application/rtf',
      '.html': 'text/html',
      '.htm': 'text/html',
      '.json': 'application/json',
      '.xml': 'application/xml',
    }
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream'
  }

  /**
   * 从文件中提取文本内容
   * @param fileInfo - 文件信息
   * @returns Promise<DocumentContent> - 返回提取的文档内容
   */
  async extractTextFromFile(fileInfo: FileInfo): Promise<DocumentContent> {
    try {
      let text = ''
      let pageCount: number | undefined

      switch (fileInfo.extension) {
      case '.txt':
      case '.md':
      case '.json':
      case '.xml':
      case '.html':
      case '.htm':
        text = await this.extractTextFromPlainFile(fileInfo.path)
        break
      case '.pdf':
        // 注意：这里需要安装 pdf-parse 库
        text = await this.extractTextFromPDF(fileInfo.path)
        break
      case '.doc':
      case '.docx':
        // 注意：这里需要安装 mammoth 库来处理 Word 文档
        text = await this.extractTextFromWord(fileInfo.path)
        break
      default:
        throw new Error(`Unsupported file type: ${fileInfo.extension}`)
      }

      // 计算字数
      const wordCount = this.countWords(text)

      const documentContent: DocumentContent = {
        id: Date.now(), // 使用时间戳作为临时ID
        documentKey: `${generateRandomString12()}-${generateRandomString12()}`, // 使用时间戳作为临时ID
        text: text.trim(),
        metadata: {
          fileName: fileInfo.name,
          fileSize: fileInfo.size,
          fileType: fileInfo.type,
          extractedAt: Date.now(),
          pageCount,
          wordCount,
        },
      }

      console.log(`Text extracted successfully from ${fileInfo.name}, word count: ${wordCount}`)
      return documentContent
    } catch (error) {
      console.error(`Failed to extract text from file ${fileInfo.name}:`, error)
      throw new Error(`Failed to extract text from file: ${error}`)
    }
  }

  /**
   * 从纯文本文件中提取内容
   * @param filePath - 文件路径
   * @returns Promise<string> - 返回文件内容
   */
  private async extractTextFromPlainFile(filePath: string): Promise<string> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8')
      return content
    } catch (error) {
      throw new Error(`Failed to read plain text file: ${error}`)
    }
  }

  /**
   * 从 PDF 文件中提取文本
   * @param filePath - PDF 文件路径
   * @returns Promise<string> - 返回提取的文本内容
   */
  private async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      // 这里需要安装 pdf-parse 库
      // npm install pdf-parse
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require('pdf-parse')
      const dataBuffer = await fs.promises.readFile(filePath)
      const data = await pdfParse(dataBuffer)
      return data.text
    } catch (error) {
      // 如果 pdf-parse 库未安装，返回错误信息
      console.warn('pdf-parse library not found, cannot extract PDF text')
      throw new Error('PDF text extraction not supported. Please install pdf-parse library.')
    }
  }

  /**
   * 从 Word 文档中提取文本
   * @param filePath - Word 文档路径
   * @returns Promise<string> - 返回提取的文本内容
   */
  private async extractTextFromWord(filePath: string): Promise<string> {
    try {
      // 这里需要安装 mammoth 库
      // npm install mammoth
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mammoth = require('mammoth')
      const result = await mammoth.extractRawText({ path: filePath })
      return result.value
    } catch (error) {
      // 如果 mammoth 库未安装，返回错误信息
      console.warn('mammoth library not found, cannot extract Word document text')
      throw new Error('Word document text extraction not supported. Please install mammoth library.')
    }
  }

  /**
   * 计算文本中的字数
   * @param text - 要计算的文本
   * @returns 字数统计
   */
  private countWords(text: string): number {
    // 移除多余的空白字符并分割单词
    const words = text.trim().split(/\s+/).filter(word => word.length > 0)
    return words.length
  }

  /**
   * 删除上传的文件
   * @param filePath - 要删除的文件路径
   * @returns Promise<void>
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath)
        console.log(`File deleted successfully: ${filePath}`)
      }
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error)
      throw new Error(`Failed to delete file: ${error}`)
    }
  }

  /**
   * 获取支持的文件类型列表
   * @returns 支持的文件扩展名数组
   */
  getSupportedFileTypes(): string[] {
    return ['.txt', '.md', '.pdf', '.doc', '.docx', '.rtf', '.html', '.htm', '.json', '.xml']
  }

  /**
   * 检查文件类型是否受支持
   * @param fileName - 文件名
   * @returns 是否支持该文件类型
   */
  isSupportedFileType(fileName: string): boolean {
    const extension = path.extname(fileName).toLowerCase()
    return this.getSupportedFileTypes().includes(extension)
  }

  /**
   * 获取上传目录路径
   * @returns 上传目录的绝对路径
   */
  getUploadDir(): string {
    return this.uploadDir
  }
}

// 单例实例
let fileProcessorService: FileProcessorService | null = null

/**
 * 获取 FileProcessorService 单例实例
 * 使用单例模式确保整个应用中只有一个文件处理服务实例
 * @returns FileProcessorService 实例
 */
export const getFileProcessorService = (): FileProcessorService => {
  if (!fileProcessorService) {
    fileProcessorService = new FileProcessorService()
  }
  return fileProcessorService
}
