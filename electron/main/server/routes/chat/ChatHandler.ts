import { BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'
import {BaseMessage} from '@langchain/core/messages'
import {AIMessage, HumanMessage, SystemMessage} from '@langchain/core/messages'

import { IMessageMetadata, MCPMessage } from '../../types'
import { Communication, CommunicationRole } from '../../../mcp'
import { generateId } from '../../utils/helpers'

export abstract class ChatHandler {
  protected win: BrowserWindow
  protected communication: Communication
  protected isInterrupted = false

  constructor(win: BrowserWindow) {
    this.win = win
    this.communication = new Communication(win)
  }

  /**
   * 广播用户消息
   */
  protected broadcastUserMessage(
    content: string,
    conversationId: string,
    metadata: IMessageMetadata = {},
  ): MCPMessage {
    const userMessage: MCPMessage = {
      id: generateId(),
      role: CommunicationRole.USER,
      content: content.trim(),
      timestamp: Date.now(),
      metadata,
    }

    this.communication.setMessage({
      conversationId,
      message: userMessage,
    })

    return userMessage
  }

  /**
   * 发送助手消息
   */
  protected sendAssistantMessage(
    content: string,
    conversationId: string,
    metadata: IMessageMetadata = {},
    additionalData?: any,
  ): void {
    this.communication.setMessage({
      conversationId,
      message: {
        id: generateId(),
        role: CommunicationRole.ASSISTANT,
        content,
        contentLimited: additionalData?.contentLimited,
        timestamp: Date.now(),
        metadata: {
          ...metadata,
          ...additionalData?.metadata,
        },
      },
    })
  }

  /**
   * 发送流式消息
   */
  protected sendStreamingMessage(
    content: string,
    conversationId: string,
    metadata: IMessageMetadata = {},
  ): void {
    this.communication.sendStreaming({
      conversationId,
      message: {
        id: generateId(),
        role: CommunicationRole.ASSISTANT,
        content,
        metadata,
      },
    })
  }

  /**
   * 发送错误消息
   */
  protected sendErrorMessage(conversationId: string): void {
    this.sendAssistantMessage(
      '请求出现错误，请重新尝试或者联系开发同学',
      conversationId,
      { model: 'default' },
    )
  }

  /**
   * 验证请求内容
   */
  protected validateContent(content: any): { isValid: boolean; error?: string } {
    if (!content) {
      return { isValid: false, error: 'Content is required' }
    }
    if (typeof content !== 'string') {
      return { isValid: false, error: 'Content must be a string' }
    }
    return { isValid: true }
  }

  /**
   * 创建错误响应
   */
  protected createErrorResponse(code: number, error: string, details?: string) {
    return {
      code,
      data: {
        error,
        ...(details && { details }),
      },
    }
  }

  /**
   * 创建成功响应
   */
  protected createSuccessResponse(data: any) {
    return {
      success: true,
      ...data,
    }
  }

  getPathDirectories (currentDir: string): { files: string[]; directories: string[] } | undefined {
    try {
      // 读取当前目录下的所有文件和文件夹（一级）
      const items = fs.readdirSync(currentDir)

      // 分类文件和文件夹
      const result = {
        files: [] as string[],
        directories: [] as string[],
      }

      items.forEach(item => {
        const fullPath = path.join(currentDir, item)
        const isDirectory = fs.statSync(fullPath).isDirectory()

        if (isDirectory) {
          result.directories.push(item)
        } else {
          result.files.push(item)
        }
      })

      console.log('当前目录内容:', result)
      return result
    } catch (err) {
      console.error('读取目录出错:', err)
      return undefined
    }
  }

  /**
   * 转换消息格式为 Langchain 格式
   */
  protected convertToLangchainMessages(messages: MCPMessage[]): BaseMessage[] {
    return messages.map((msg: MCPMessage) => {
      switch (msg.role) {
      case CommunicationRole.USER:
        return new HumanMessage(msg.content)
      case CommunicationRole.SYSTEM: {
        const currentPath = process.cwd()
        const pathStructure = this.getPathDirectories(currentPath)

        return new SystemMessage(`
         ${msg.content}
         =====
         当前的工作路径
         path: ${currentPath}
         =====
         当前目录结构:
         文件夹: ${pathStructure?.directories && pathStructure.directories.length > 0 ? pathStructure.directories.join(', ') : '无'}
         文件: ${pathStructure?.files && pathStructure.files.length > 0 ? pathStructure.files.join(', ') : '无'}
         =====
        `)
      }
      case CommunicationRole.ASSISTANT:
        return new AIMessage(msg.content)
      default:
        return new HumanMessage(msg.content)
      }
    })
  }

  /**
   * 处理 AIGC 响应内容
   */
  protected async processAIGCResponseContent(
    response: any,
    conversationId: string,
    metadata: IMessageMetadata,
  ): Promise<string> {
    let fullContent = ''

    // 处理不同类型的响应
    if (typeof response === 'object' && response !== null) {
      // 如果响应包含流式数据
      if (response.stream) {
        fullContent = await this.processStreamResponse(response.stream, conversationId, metadata)
      } else if (response.content) {
        // 非流式响应
        fullContent = response.content
      }
    } else if (typeof response === 'string') {
      fullContent = response
    }

    return fullContent
  }

  /**
   * 处理流式响应
   */
  protected async processStreamResponse(
    stream: any,
    conversationId: string,
    metadata: IMessageMetadata,
  ): Promise<string> {
    let fullContent = ''

    for await (const chunk of stream) {
      if (chunk.content || chunk.output) {
        if (chunk.content) {
          fullContent += chunk.content
        } else if (chunk.output) {
          fullContent += chunk.output
        }
        this.communication.sendStreaming({
          conversationId,
          messageId: generateId(),
          role: CommunicationRole.ASSISTANT,
          content: fullContent,
          metadata,
        })
      }
    }

    return fullContent
  }

  /**
   * 发送最终消息
   */
  protected sendFinalMessage(
    content: string,
    response: any,
    conversationId: string,
    metadata: IMessageMetadata,
  ) {
    const additionalData = {
      contentLimited: {
        cardList: response?.cardList?.length > 0 ? response?.cardList : [],
      },
      metadata: {
        model: metadata.model,
        toolCalls: response?.toolCalls?.length > 0 ? response?.toolCalls : undefined,
        toolResults: response?.toolResults?.length > 0 ? response?.toolResults : undefined,
      },
    }

    this.sendAssistantMessage(content, conversationId, metadata, additionalData)
  }

  /**
   * 中断当前操作
   */
  async interrupt(): Promise<void> {
    console.log(`[${this.constructor.name}] 收到中断请求`)
    this.isInterrupted = true
  }

  /**
   * 重置中断状态
   */
  protected resetInterruptState(): void {
    this.isInterrupted = false
  }

  /**
   * 检查是否被中断
   */
  protected checkInterrupted(): void {
    if (this.isInterrupted) {
      throw new Error('Operation was interrupted')
    }
  }
}
