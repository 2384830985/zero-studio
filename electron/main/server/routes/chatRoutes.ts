import {BrowserWindow, ipcMain} from 'electron'
// import { log } from 'node:console'
import { MCPMessage } from '../types'
import { AIGCService } from '../services/AIGCService'
import {AIMessage, HumanMessage, SystemMessage} from '@langchain/core/messages'
import { generateId, generateMockMCPResponseContent } from '../utils/helpers'
import { EnabledMCPServer } from '../../mcp/StdioMcpServerToFunction'
import {Communication, CommunicationRole} from '../../mcp'
import {ReActService} from '../services/ReActService'

export class ChatRoutes {
  private aigcService: AIGCService
  private win: BrowserWindow
  private communication: Communication

  constructor(
    aigcService: AIGCService,
    win: BrowserWindow,
  ) {
    this.aigcService = aigcService
    this.win = win
    this.communication = new Communication(win)
    this.setupRoutes()
  }

  private setupRoutes() {
    // 发送消息到聊天
    ipcMain.handle('chat-send', this.handleMCPChatSend.bind(this))
    // 发送聊天到 ReAct
    ipcMain.handle('chat-reAct', this.handleMCPChatReactSend.bind(this))
  }

  /**
   * ReAct
   * @param _
   * @param object
   * @private
   */
  private async handleMCPChatReactSend(_, object) {
    const response = JSON.parse(object)
    // oldMessage
    const { content, metadata = {} } = response
    if (!content) {
      return {
        code: 400,
        body: {
          error: 'Content is required',
        },
      }
    }
    const conversationId = generateId()
    // 创建用户消息
    const userMessage: MCPMessage = {
      id: conversationId,
      role: CommunicationRole.USER,
      content: content.trim(),
      timestamp: Date.now(),
      metadata,
    }

    // 广播用户消息
    this.communication.setMessage({
      conversationId: conversationId,
      message: userMessage,
    })

    const reAct = new ReActService(this.win)
    reAct.initializeReActAgent(metadata)

    const stepCallback = (step) => {
      console.log(`[${step.type}] ${step.content}`)
      // 发送完整消息
      this.communication.setMessage({
        conversationId: conversationId,
        message: {
          id: generateId(),
          role: CommunicationRole.ASSISTANT,
          content: step.content,
          timestamp: Date.now(),
          metadata: {
            model: metadata.model,
            stream: true,
          },
          isComplete: true,
        },
      })
    }

    const result = await reAct.reactAgent?.execute(content, stepCallback) as string
    const assistantMessageId = generateId()
    console.log('最终结果:', result)

    // 发送完整消息
    this.communication.setMessage({
      conversationId: conversationId,
      message: {
        id: assistantMessageId,
        role: CommunicationRole.ASSISTANT,
        content: result,
        timestamp: Date.now(),
        metadata: {
          model: metadata.model,
          stream: true,
        },
        isComplete: true,
      },
    })
  }

  /**
   * Chat
   * @param _
   * @param object
   * @private
   */

  private async handleMCPChatSend(_, object) {
    try {
      const response = JSON.parse(object)
      const { content, conversationId, metadata = {}, enabledMCPServers, oldMessage } = response
      if (!content) {
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
        role: CommunicationRole.USER,
        content: content.trim(),
        timestamp: Date.now(),
        metadata,
      }

      // 广播用户消息
      this.communication.setMessage({
        conversationId: convId,
        message: userMessage,
      })

      // 转换消息格式
      const langchainMessages = [...oldMessage, userMessage].map((msg: any) => {
        switch (msg.role) {
        case CommunicationRole.USER:
          return new HumanMessage(msg.content)
        case CommunicationRole.SYSTEM:
          return new SystemMessage(msg.content)
        case CommunicationRole.ASSISTANT:
          return new AIMessage(msg.content)
        default:
          return new HumanMessage(msg.content)
        }
      })

      // 生成 AI 回复
      this.generateMCPResponse(langchainMessages, convId, enabledMCPServers, metadata)

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

  private async generateMCPResponse(userMessage: (HumanMessage | AIMessage)[], conversationId: string, enabledMCPServers: EnabledMCPServer[], metadata: any) {
    const assistantMessageId = generateId()
    let toolCalls: any[] = []
    let toolResults: any[] = []

    try {
      if (metadata && metadata.model) {
        // 获取对话历史，构建完整的消息上下文
        console.log('[Chat Routes] Calling AIGC API for MCP chat...')

        // 定义回调函数来实时发送工具调用信息
        // const onToolCall = (toolCall: any) => {
        //   toolCalls.push(toolCall)
        //   // 实时发送工具调用信息
        //   this.communication.sendStreaming({
        //     conversationId,
        //     messageId: assistantMessageId,
        //     role: CommunicationRole.ASSISTANT,
        //     metadata: {
        //       toolCalls: [toolCall],
        //     },
        //   })
        // }

        // const onToolResult = (toolResult: any) => {
        //   toolResults.push(toolResult)
        //   // 实时发送工具结果信息
        //   this.communication.sendStreaming({
        //     conversationId,
        //     messageId: assistantMessageId,
        //     role: CommunicationRole.ASSISTANT,
        //     metadata: {
        //       toolCalls,
        //       toolResults: [toolResult],
        //     },
        //   })
        // }
        // 调用 AIGC API（可能包含工具调用）
        const response = await this.aigcService.callAIGC(
          userMessage,
          metadata,
          // onToolCall,
          // onToolResult,
        )

        let fullContent = ''
        console.log('response', response)

        // 处理不同类型的响应
        if (typeof response === 'object' && response !== null) {
          // 如果响应包含流式数据
          if (response.stream) {
            for await (const chunk of response.stream) {
              if (chunk.content) {
                fullContent += chunk.content
                this.communication.sendStreaming({
                  conversationId,
                  messageId: assistantMessageId,
                  role: CommunicationRole.ASSISTANT,
                  content: fullContent,
                  metadata: {
                    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                    toolResults: toolResults.length > 0 ? toolResults : undefined,
                  },
                })
              }
            }
          } else if (response.content) {
            // 非流式响应
            fullContent = response.content
          }

          // 更新工具调用信息
          if (response.toolCalls) {
            toolCalls = response.toolCalls
          }
          if (response.toolResults) {
            toolResults = response.toolResults
          }
        } else if (typeof response === 'string') {
          fullContent = response
        }

        if (fullContent) {
          // 创建完整的助手消息，包含工具调用信息
          const assistantMessage: MCPMessage = {
            id: assistantMessageId,
            role: CommunicationRole.ASSISTANT,
            content: fullContent,
            timestamp: Date.now(),
            metadata: {
              model: metadata.model,
              stream: true,
              toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
              toolResults: toolResults.length > 0 ? toolResults : undefined,
            },
          }

          // 发送完整消息
          this.communication.setMessage({
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
      role: CommunicationRole.ASSISTANT,
      content: fullResponse,
      timestamp: Date.now(),
      metadata: {
        model: 'mcp-default',
        stream: false,
      },
    }

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
        this.communication.sendStreaming({
          conversationId,
          messageId: message.id,
          role: CommunicationRole.ASSISTANT,
          content: currentContent,
          timestamp: message.timestamp,
        })
        index++
      } else {
        // 发送完整消息
        this.communication.setMessage({
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
