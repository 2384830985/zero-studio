import { Router, Request, Response } from 'express'
// import { log } from 'node:console'
import { MCPMessage, MCPStreamChunk } from '../types'
import { ConversationService } from '../services/ConversationService'
import { SSEService } from '../services/SSEService'
import { AIGCService } from '../services/AIGCService'
import { generateId, estimateTokens, generateMockResponse, generateMockMCPResponseContent } from '../utils/helpers'
import { EnabledMCPServer } from '../../mcp/StdioMcpServerToFunction'

export class ChatRoutes {
  private router: Router
  private conversationService: ConversationService
  private sseService: SSEService
  private aigcService: AIGCService

  constructor(
    conversationService: ConversationService,
    sseService: SSEService,
    aigcService: AIGCService,
  ) {
    this.router = Router()
    this.conversationService = conversationService
    this.sseService = sseService
    this.aigcService = aigcService
    this.setupRoutes()
  }

  private setupRoutes() {
    // 聊天完成接口 (兼容 OpenAI API)
    this.router.post('/v1/chat/completions', (req, res) => this.handleChatCompletions(req, res))

    // MCP 特定的流式聊天接口 - 不带参数
    this.router.get('/mcp/chat/stream', (req, res) => this.handleMCPStreamWithoutId(req, res))

    // MCP 特定的流式聊天接口 - 带参数
    this.router.get('/mcp/chat/stream/:conversationId', (req, res) => this.handleMCPStreamWithId(req, res))

    // 发送消息到 MCP 聊天
    this.router.post('/mcp/chat/send', (req, res) => this.handleMCPChatSend(req, res))

    // 获取对话历史
    this.router.get('/mcp/conversations/:conversationId', (req, res) => this.getConversationHistory(req, res))

    // 清空对话
    this.router.delete('/mcp/conversations/:conversationId', (req, res) => this.clearConversation(req, res))

    // 获取所有对话列表
    this.router.get('/mcp/conversations', (req, res) => this.getAllConversations(req, res))
  }

  private async handleChatCompletions(req: Request, res: Response) {
    try {
      const { messages, stream = false, metadata = {}, enabledMCPServers } = req.body

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({
          error: {
            message: 'Messages array is required',
            type: 'invalid_request_error',
          },
        })
      }

      const conversationId = generateId()
      console.log('conversationId', conversationId)

      if (stream) {
        await this.handleStreamingRequest(req, res, messages, metadata.model, metadata, conversationId, enabledMCPServers)
      } else {
        await this.handleNonStreamingRequest(req, res, messages, metadata.model, metadata, conversationId, enabledMCPServers)
      }
    } catch (error) {
      console.error('[Chat Routes] Error in chat completions:', error)
      res.status(500).json({
        error: {
          message: 'Internal server error',
          type: 'server_error',
        },
      })
    }
  }

  private handleMCPStreamWithoutId(req: Request, res: Response) {
    const conversationId = generateId()

    this.sseService.setupSSEHeaders(res)
    this.sseService.addClient(res)

    // 发送连接确认
    this.sseService.sendSSEMessage(res, 'connected', {
      conversationId,
      message: 'Connected to MCP chat stream',
      timestamp: Date.now(),
    })

    // 处理客户端断开连接
    req.on('close', () => {
      this.sseService.removeClient(res)
    })
  }

  private handleMCPStreamWithId(req: Request, res: Response) {
    const conversationId = req.params.conversationId

    this.sseService.setupSSEHeaders(res)
    this.sseService.addClient(res)

    // 发送连接确认
    this.sseService.sendSSEMessage(res, 'connected', {
      conversationId,
      message: 'Connected to MCP chat stream',
      timestamp: Date.now(),
    })

    // 发送历史消息
    const history = this.conversationService.getConversation(conversationId)
    if (history.length > 0) {
      this.sseService.sendSSEMessage(res, 'history', {
        conversationId,
        messages: history,
      })
    }

    // 处理客户端断开连接
    req.on('close', () => {
      this.sseService.removeClient(res)
    })
  }

  private async handleMCPChatSend(req: Request, res: Response) {
    try {
      const { content, conversationId, metadata = {}, enabledMCPServers } = req.body

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: 'Content is required' })
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
      this.sseService.broadcastSSEMessage('message', {
        conversationId: convId,
        message: userMessage,
      })

      // 生成 AI 回复
      this.generateMCPResponse(userMessage, convId, enabledMCPServers, metadata)

      res.json({
        success: true,
        conversationId: convId,
        messageId: userMessage.id,
      })
    } catch (error) {
      console.error('[Chat Routes] Error sending message:', error)
      res.status(500).json({ error: 'Failed to send message' })
    }
  }

  private getConversationHistory(req: Request, res: Response) {
    const { conversationId } = req.params
    const details = this.conversationService.getConversationDetails(conversationId)
    res.json(details)
  }

  private clearConversation(req: Request, res: Response) {
    const { conversationId } = req.params
    this.conversationService.deleteConversation(conversationId)

    this.sseService.broadcastSSEMessage('conversation_cleared', {
      conversationId,
      timestamp: Date.now(),
    })

    res.json({ success: true })
  }

  private getAllConversations(req: Request, res: Response) {
    const conversations = this.conversationService.getAllConversationSummaries()
    res.json({ conversations })
  }

  private async handleStreamingRequest(
    req: Request,
    res: Response,
    messages: any[],
    model: string,
    metadata: any,
    conversationId: string,
    enabledMCPServers: EnabledMCPServer[],
  ) {
    // 设置流式响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })

    const responseId = generateId()
    const created = Math.floor(Date.now() / 1000)

    try {
      if (model) {
        const response = await this.aigcService.callAIGC(messages, true, model, enabledMCPServers, metadata)
        let fullContent = ''

        response.data.on('data', (chunk: Buffer) => {
          const chunkStr = chunk.toString()
          const lines = chunkStr.split('\n')

          for (const line of lines) {
            if (!line.trim()) {
              continue // 跳过空行
            }

            try {
              let jsonStr = ''
              let data: any = null

              // 查找第一个 { 的位置，从那里开始截取 JSON
              const jsonStart = line.indexOf('{')
              if (jsonStart !== -1) {
                jsonStr = line.substring(jsonStart)
                // 尝试解析 JSON
                if (jsonStr.startsWith('{') && jsonStr.includes('}')) {
                  data = JSON.parse(jsonStr)
                }
              }

              if (!data) {
                continue // 如果没有找到有效的 JSON，跳过这行
              }

              let deltaContent = ''

              console.log('111111', data)

              // 优先使用标准的 delta.content 格式
              if (data.choices?.[0]?.delta?.content) {
                deltaContent = data.choices[0].delta.content
              }

              if (deltaContent) {
                fullContent += deltaContent

                // 转换为标准格式并发送
                const standardChunk: MCPStreamChunk = {
                  id: responseId,
                  object: 'chat.completion.chunk',
                  created,
                  model,
                  choices: [{
                    index: 0,
                    delta: {
                      content: deltaContent,
                    },
                    finish_reason: data.choices?.[0]?.finish_reason || (data.lastOne ? 'stop' : null),
                  }],
                }

                res.write(`data: ${JSON.stringify(standardChunk)}\n\n`)
              }
            } catch (parseError) {
              console.error('[Chat Routes] Error parsing stream chunk:', parseError)
              console.error('Problematic line:', line)
            }
          }
        })

        response.data.on('end', () => {
          // 发送结束标记
          const finalChunk: MCPStreamChunk = {
            id: responseId,
            object: 'chat.completion.chunk',
            created,
            model,
            choices: [{
              index: 0,
              delta: {},
              finish_reason: 'stop',
            }],
          }

          res.write(`data: ${JSON.stringify(finalChunk)}\n\n`)
          res.write('data: [DONE]\n\n')
          res.end()

          // 保存完整消息到对话历史
          const assistantMessage: MCPMessage = {
            id: responseId,
            role: 'assistant',
            content: fullContent,
            timestamp: Date.now(),
            metadata: { model },
          }

          this.conversationService.addMessage(conversationId, assistantMessage)
        })

        response.data.on('error', (error: any) => {
          console.error('[Chat Routes] Stream error:', error)
          res.write('data: {\'error\': \'Stream error\'}\n\n')
          res.end()
        })

      } else {
        // 回退到模拟响应
        const fullResponse = generateMockResponse(messages[messages.length - 1]?.content || '')
        const words = fullResponse.split('')
        let index = 0

        const streamInterval = setInterval(() => {
          if (index < words.length) {
            const chunk: MCPStreamChunk = {
              id: responseId,
              object: 'chat.completion.chunk',
              created,
              model,
              choices: [{
                index: 0,
                delta: {
                  content: words[index],
                },
                finish_reason: null,
              }],
            }

            res.write(`data: ${JSON.stringify(chunk)}\n\n`)
            index++
          } else {
            // 发送结束标记
            const finalChunk: MCPStreamChunk = {
              id: responseId,
              object: 'chat.completion.chunk',
              created,
              model,
              choices: [{
                index: 0,
                delta: {},
                finish_reason: 'stop',
              }],
            }

            res.write(`data: ${JSON.stringify(finalChunk)}\n\n`)
            res.write('data: [DONE]\n\n')
            res.end()
            clearInterval(streamInterval)

            // 保存完整消息到对话历史
            const assistantMessage: MCPMessage = {
              id: responseId,
              role: 'assistant',
              content: fullResponse,
              timestamp: Date.now(),
              metadata,
            }

            this.conversationService.addMessage(conversationId, assistantMessage)
          }
        }, 50)

        // 处理客户端断开连接
        req.on('close', () => {
          clearInterval(streamInterval)
        })
      }
    } catch (error) {
      console.error('[Chat Routes] Error in streaming request:', error)
      res.write('data: {\'error\': \'API call failed\'}\n\n')
      res.end()
    }

    // 处理客户端断开连接
    req.on('close', () => {
      // 清理资源
    })
  }

  private async handleNonStreamingRequest(
    _req: Request,
    res: Response,
    messages: any[],
    model: string,
    metadata: any,
    conversationId: string,
    enabledMCPServers: EnabledMCPServer[],
  ) {
    const responseId = generateId()
    const created = Math.floor(Date.now() / 1000)
    let responseContent = ''

    try {
      if (model) {
        const response = await this.aigcService.callAIGC(messages, false, model, enabledMCPServers, null)
        responseContent = response.data.choices[0].message.content
      } else {
        // 回退到模拟响应
        await new Promise(resolve => setTimeout(resolve, 1000))
        responseContent = generateMockResponse(messages[messages.length - 1]?.content || '')
      }
    } catch (error) {
      console.error('[Chat Routes] Error in non-streaming request:', error)
      // 回退到模拟响应
      responseContent = generateMockResponse(messages[messages.length - 1]?.content || '')
    }

    const response = {
      id: responseId,
      object: 'chat.completion',
      created,
      model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: responseContent,
        },
        finish_reason: 'stop',
      }],
      usage: {
        prompt_tokens: estimateTokens(messages.map((m: any) => m.content).join(' ')),
        completion_tokens: estimateTokens(responseContent),
        total_tokens: 0,
      },
    }

    response.usage.total_tokens = response.usage.prompt_tokens + response.usage.completion_tokens

    // 保存到对话历史
    const assistantMessage: MCPMessage = {
      id: responseId,
      role: 'assistant',
      content: responseContent,
      timestamp: Date.now(),
      metadata,
    }

    this.conversationService.addMessage(conversationId, assistantMessage)

    res.json(response)
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
          if (response?.content) {
            fullContent = response?.content
          } else {
            for await (const chunk of response) {
              console.log(`${chunk.content}\n---`)
              fullContent += chunk.content
              // 实时广播流式内容
              this.sseService.broadcastSSEMessage('streaming', {
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
          this.sseService.broadcastSSEMessage('message', {
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

  // 新增方法：将普通响应内容模拟成流式输出
  private simulateStreamingFromContent(content: string, conversationId: string, assistantMessageId: string) {
    const words = content.split('')
    let currentContent = ''
    let index = 0

    const streamInterval = setInterval(() => {
      if (index < words.length) {
        currentContent += words[index]

        // 实时广播流式内容
        this.sseService.broadcastSSEMessage('streaming', {
          conversationId,
          messageId: assistantMessageId,
          role: 'assistant',
          content: currentContent,
          timestamp: Date.now(),
          isComplete: false,
        })

        index++
      } else {
        // 创建完整的助手消息
        const assistantMessage: MCPMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: content,
          timestamp: Date.now(),
          metadata: {
            model: 'default',
            stream: false,
          },
        }

        // 保存到对话历史
        this.conversationService.addMessage(conversationId, assistantMessage)

        // 发送完整消息
        this.sseService.broadcastSSEMessage('message', {
          conversationId,
          message: {
            ...assistantMessage,
            isComplete: true,
          },
        })

        console.log('[Chat Routes] Tool calling response completed for MCP chat')
        clearInterval(streamInterval)
      }
    }, 30) // 30ms 间隔，快速打字效果
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
        this.sseService.broadcastSSEMessage('streaming', {
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
        this.sseService.broadcastSSEMessage('message', {
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

  getRouter(): Router {
    return this.router
  }
}
