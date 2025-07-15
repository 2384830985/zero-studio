import {BrowserWindow, ipcMain} from 'electron'
// import { log } from 'node:console'
import { MCPMessage } from '../types'
import { ConversationService } from '../services/ConversationService'
import { AIGCService } from '../services/AIGCService'
import { generateId, generateMockMCPResponseContent } from '../utils/helpers'
import { EnabledMCPServer } from '../../mcp/StdioMcpServerToFunction'

export class ChatRoutes {
  private conversationService: ConversationService
  private aigcService: AIGCService
  private win: BrowserWindow

  constructor(
    conversationService: ConversationService,
    aigcService: AIGCService,
    win: BrowserWindow,
  ) {
    this.conversationService = conversationService
    this.aigcService = aigcService
    this.win = win
    this.setupRoutes()
  }

  private setupRoutes() {
    // 发送消息到 聊天
    ipcMain.handle('chat-send', this.handleMCPChatSend.bind(this))
  }

  private async handleMCPChatSend(_, object) {
    try {
      const response = JSON.parse(object)
      const { content, conversationId, metadata = {}, enabledMCPServers } = response
      if (!content || typeof content !== 'string') {
        return {
          code: 400,
          body: {
            error: 'Content is required',
          },
        }
      }

      const convId = conversationId || generateId()

      // 创建用户消息
      const userMessage: MCPMessage = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
        metadata,
      }

      // 保存到对话历史
      this.conversationService.addMessage(convId, userMessage)

      // 广播用户消息
      this.win.webContents.send('message', {
        conversationId: convId,
        message: userMessage,
      })

      // 生成 AI 回复
      this.generateMCPResponse(userMessage, convId, enabledMCPServers, metadata)

      return {
        success: true,
        conversationId: convId,
        messageId: userMessage.id,
      }
    } catch (error) {
      console.error('[Chat Routes] Error sending message:', error)
      return {
        code: 500,
        body: {
          error: 'Failed to send message',
        },
      }
    }
  }

  private async generateMCPResponse(userMessage: MCPMessage, conversationId: string, enabledMCPServers: EnabledMCPServer[], metadata: any) {
    const assistantMessageId = generateId()

    try {
      if (metadata && metadata.model) {
        // 获取对话历史，构建完整的消息上下文
        const conversationHistory = this.conversationService.getConversation(conversationId)
        const messages = conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
        }))

        console.log('[Chat Routes] Calling AIGC API for MCP chat...')

        // 调用 AIGC API（可能包含工具调用）
        const response = await this.aigcService.callAIGC(messages, true, metadata.model, enabledMCPServers, metadata)
        let fullContent = ''
        console.log('response', response)
        if (typeof response !== 'string') {
          if (typeof response?.content === 'string') {
            fullContent = response?.content
          } else {
            for await (const chunk of response) {
              console.log(`${chunk.content}\n---`)
              fullContent += chunk.content
              // 实时广播流式内容
              this.win.webContents.send('streaming', {
                conversationId,
                messageId: assistantMessageId,
                role: 'assistant',
                content: fullContent,
                timestamp: Date.now(),
                isComplete: false,
              })
            }
          }
        } else {
          fullContent = response
        }
        if (fullContent) {
          // 创建完整的助手消息
          const assistantMessage: MCPMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: fullContent,
            timestamp: Date.now(),
            metadata: {
              model: metadata.model,
              stream: true,
            },
          }

          // 保存到对话历史
          this.conversationService.addMessage(conversationId, assistantMessage)
          // 发送完整消息
          this.win.webContents.send('message', {
            conversationId,
            message: {
              ...assistantMessage,
              isComplete: true,
            },
          })
        }
      } else {
        // 回退到模拟响应
        this.generateMockMCPResponse(userMessage, conversationId, assistantMessageId)
      }
    } catch (error) {
      console.error('[Chat Routes] Error in generateMCPResponse:', error)
      // 回退到模拟响应
      this.generateMockMCPResponse(userMessage, conversationId, assistantMessageId)
    }
  }

  private generateMockMCPResponse(userMessage: MCPMessage, conversationId: string, assistantMessageId?: string) {
    const fullResponse = generateMockMCPResponseContent(userMessage.content)

    const assistantMessage: MCPMessage = {
      id: assistantMessageId || generateId(),
      role: 'assistant',
      content: fullResponse,
      timestamp: Date.now(),
      metadata: {
        model: 'mcp-default',
        stream: false,
      },
    }

    // 保存到对话历史
    this.conversationService.addMessage(conversationId, assistantMessage)

    // 模拟流式回复
    this.simulateStreamingResponse(assistantMessage, conversationId)
  }

  private simulateStreamingResponse(message: MCPMessage, conversationId: string) {
    const words = message.content.split('')
    let currentContent = ''
    let index = 0

    const streamInterval = setInterval(() => {
      if (index < words.length) {
        currentContent += words[index]

        // 广播部分内容
        this.win.webContents.send('streaming', {
          conversationId,
          messageId: message.id,
          role: message.role,
          content: currentContent,
          timestamp: message.timestamp,
          isComplete: false,
        })
        index++
      } else {
        // 发送完整消息
        this.win.webContents.send('message', {
          conversationId,
          message: {
            ...message,
            isComplete: true,
          },
        })
        clearInterval(streamInterval)
      }
    }, 30) // 30ms 间隔，更快的打字效果
  }
}
