import express from 'express'
import cors from 'cors'
import { Server } from 'http'
import axios from 'axios'
import { log } from 'node:console'

export interface MCPMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  metadata?: {
    model?: string
    temperature?: number
    maxTokens?: number
    stream?: boolean
  }
}

export interface MCPStreamChunk {
  id: string
  object: 'chat.completion.chunk'
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: string
      content?: string
    }
    finish_reason?: string | null
  }>
}

export interface MCPServerConfig {
  port: number
  enableCors?: boolean
  maxConnections?: number
  streamingEnabled?: boolean
  meituanAIGC?: {
    apiUrl?: string
    appId: string
    defaultModel?: string
  }
}

export class MCPServer {
  private app: express.Application
  private server: Server | null = null
  private port: number
  private clients: Set<any> = new Set()
  private conversations: Map<string, MCPMessage[]> = new Map()
  private config: MCPServerConfig

  constructor(config: MCPServerConfig) {
    this.config = {
      enableCors: true,
      maxConnections: 100,
      streamingEnabled: true,
      ...config,
    }
    this.port = config.port
    this.app = express()
    this.setupMiddleware()
    this.setupRoutes()
  }

  private setupMiddleware() {
    // 启用 CORS
    if (this.config.enableCors) {
      this.app.use(cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      }))
    }

    // 解析 JSON
    this.app.use(express.json({ limit: '10mb' }))
    this.app.use(express.urlencoded({ extended: true }))

    // 请求日志
    this.app.use((req: any, res: any, next: any) => {
      console.log(`[MCP Server] ${req.method} ${req.path}`)
      next()
    })
  }

  private setupRoutes() {
    // 健康检查
    this.app.get('/health', (req: any, res: any) => {
      res.json({
        status: 'healthy',
        timestamp: Date.now(),
        connections: this.clients.size,
        conversations: this.conversations.size,
      })
    })

    // 聊天完成接口 (兼容 OpenAI API)
    this.app.post('/v1/chat/completions', async (req: any, res: any) => {
      try {
        const { messages, stream = false, model = 'mcp-default', ...options } = req.body

        if (!messages || !Array.isArray(messages)) {
          return res.status(400).json({
            error: {
              message: 'Messages array is required',
              type: 'invalid_request_error',
            },
          })
        }

        const conversationId = this.generateId()

        console.log('conversationId', conversationId)

        if (stream) {
          await this.handleStreamingRequest(req, res, messages, model, options, conversationId)
        } else {
          await this.handleNonStreamingRequest(req, res, messages, model, options, conversationId)
        }
      } catch (error) {
        console.error('[MCP Server] Error in chat completions:', error)
        res.status(500).json({
          error: {
            message: 'Internal server error',
            type: 'server_error',
          },
        })
      }
    })

    // MCP 特定的流式聊天接口 - 不带参数
    this.app.get('/mcp/chat/stream', (req: any, res: any) => {
      const conversationId = this.generateId()

      // 设置 SSE 头部
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      })

      // 添加客户端到连接池
      this.clients.add(res)
      console.log(`[MCP Server] SSE client connected. Total: ${this.clients.size}`)

      // 发送连接确认
      this.sendSSEMessage(res, 'connected', {
        conversationId,
        message: 'Connected to MCP chat stream',
        timestamp: Date.now(),
      })

      // 处理客户端断开连接
      req.on('close', () => {
        this.clients.delete(res)
        console.log(`[MCP Server] SSE client disconnected. Total: ${this.clients.size}`)
      })
    })

    // MCP 特定的流式聊天接口 - 带参数
    this.app.get('/mcp/chat/stream/:conversationId', (req: any, res: any) => {
      const conversationId = req.params.conversationId

      // 设置 SSE 头部
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      })

      // 添加客户端到连接池
      this.clients.add(res)
      console.log(`[MCP Server] SSE client connected. Total: ${this.clients.size}`)

      // 发送连接确认
      this.sendSSEMessage(res, 'connected', {
        conversationId,
        message: 'Connected to MCP chat stream',
        timestamp: Date.now(),
      })

      // 发送历史消息
      const history = this.conversations.get(conversationId) || []
      if (history.length > 0) {
        this.sendSSEMessage(res, 'history', {
          conversationId,
          messages: history,
        })
      }

      // 处理客户端断开连接
      req.on('close', () => {
        this.clients.delete(res)
        console.log(`[MCP Server] SSE client disconnected. Total: ${this.clients.size}`)
      })
    })

    // 发送消息到 MCP 聊天
    this.app.post('/mcp/chat/send', async (req: any, res: any) => {
      try {
        const { content, conversationId, metadata = {} } = req.body

        if (!content || typeof content !== 'string') {
          return res.status(400).json({ error: 'Content is required' })
        }

        const convId = conversationId || this.generateId()

        // 创建用户消息
        const userMessage: MCPMessage = {
          id: this.generateId(),
          role: 'user',
          content: content.trim(),
          timestamp: Date.now(),
          metadata,
        }

        // 保存到对话历史
        if (!this.conversations.has(convId)) {
          this.conversations.set(convId, [])
        }
        this.conversations.get(convId)!.push(userMessage)

        // 广播用户消息
        this.broadcastSSEMessage('message', {
          conversationId: convId,
          message: userMessage,
        })

        // 生成 AI 回复
        this.generateMCPResponse(userMessage, convId)

        res.json({
          success: true,
          conversationId: convId,
          messageId: userMessage.id,
        })
      } catch (error) {
        console.error('[MCP Server] Error sending message:', error)
        res.status(500).json({ error: 'Failed to send message' })
      }
    })

    // 获取对话历史
    this.app.get('/mcp/conversations/:conversationId', (req: any, res: any) => {
      const { conversationId } = req.params
      const messages = this.conversations.get(conversationId) || []

      res.json({
        conversationId,
        messages,
        total: messages.length,
      })
    })

    // 清空对话
    this.app.delete('/mcp/conversations/:conversationId', (req: any, res: any) => {
      const { conversationId } = req.params
      this.conversations.delete(conversationId)

      this.broadcastSSEMessage('conversation_cleared', {
        conversationId,
        timestamp: Date.now(),
      })

      res.json({ success: true })
    })

    // 获取所有对话列表
    this.app.get('/mcp/conversations', (req: any, res: any) => {
      const conversations = Array.from(this.conversations.entries()).map(([id, messages]) => ({
        id,
        messageCount: messages.length,
        lastMessage: messages[messages.length - 1],
        createdAt: messages[0]?.timestamp || Date.now(),
      }))

      res.json({ conversations })
    })
  }

  private async handleStreamingRequest(
    req: any,
    res: any,
    messages: any[],
    model: string,
    options: any,
    conversationId: string,
  ) {
    // 设置流式响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })

    const responseId = this.generateId()
    const created = Math.floor(Date.now() / 1000)

    try {
      // 如果配置了美团 AIGC，则调用真实 API
      console.log('this.config.meituanAIGC?.appId', this.config.meituanAIGC?.appId)
      if (this.config.meituanAIGC?.appId) {
        const response = await this.callMeituanAIGC(messages, true, model)
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

              // 处理美团 AIGC API 的响应格式
              // 优先使用标准的 delta.content 格式
              if (data.choices?.[0]?.delta?.content) {
                deltaContent = data.choices[0].delta.content
              }
              // 如果没有 delta.content，则忽略 data.content（避免重复）
              // 因为美团 AIGC API 会同时返回两种格式，我们只需要增量内容

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
              console.error('[MCP Server] Error parsing stream chunk:', parseError)
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
            metadata: { model, ...options },
          }

          if (!this.conversations.has(conversationId)) {
            this.conversations.set(conversationId, [])
          }
          this.conversations.get(conversationId)!.push(assistantMessage)
        })

        response.data.on('error', (error: any) => {
          console.error('[MCP Server] Stream error:', error)
          res.write('data: {\'error\': \'Stream error\'}\n\n')
          res.end()
        })

      } else {
        // 回退到模拟响应
        const fullResponse = this.generateMockResponse(messages[messages.length - 1]?.content || '')
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
              metadata: { model, ...options },
            }

            if (!this.conversations.has(conversationId)) {
              this.conversations.set(conversationId, [])
            }
            this.conversations.get(conversationId)!.push(assistantMessage)
          }
        }, 50)

        // 处理客户端断开连接
        req.on('close', () => {
          clearInterval(streamInterval)
        })
      }
    } catch (error) {
      console.error('[MCP Server] Error in streaming request:', error)
      res.write('data: {\'error\': \'API call failed\'}\n\n')
      res.end()
    }

    // 处理客户端断开连接
    req.on('close', () => {
      // 清理资源
    })
  }

  private async handleNonStreamingRequest(
    req: any,
    res: any,
    messages: any[],
    model: string,
    options: any,
    conversationId: string,
  ) {
    const responseId = this.generateId()
    const created = Math.floor(Date.now() / 1000)
    let responseContent = ''

    try {
      // 如果配置了美团 AIGC，则调用真实 API
      if (this.config.meituanAIGC?.appId) {
        const response = await this.callMeituanAIGC(messages, false, model)
        responseContent = response.data.choices[0].message.content
      } else {
        // 回退到模拟响应
        await new Promise(resolve => setTimeout(resolve, 1000))
        responseContent = this.generateMockResponse(messages[messages.length - 1]?.content || '')
      }
    } catch (error) {
      console.error('[MCP Server] Error in non-streaming request:', error)
      // 回退到模拟响应
      responseContent = this.generateMockResponse(messages[messages.length - 1]?.content || '')
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
        prompt_tokens: this.estimateTokens(messages.map((m: any) => m.content).join(' ')),
        completion_tokens: this.estimateTokens(responseContent),
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
      metadata: { model, ...options },
    }

    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, [])
    }
    this.conversations.get(conversationId)!.push(assistantMessage)

    res.json(response)
  }

  private async generateMCPResponse(userMessage: MCPMessage, conversationId: string) {
    const assistantMessageId = this.generateId()

    try {
      // 如果配置了美团 AIGC，则调用真实 API
      if (this.config.meituanAIGC?.appId) {
        // 获取对话历史，构建完整的消息上下文
        const conversationHistory = this.conversations.get(conversationId) || []
        const messages = conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
        }))

        console.log('[MCP Server] Calling Meituan AIGC API for MCP chat...')

        // 调用美团 AIGC API（流式）
        const response = await this.callMeituanAIGC(messages, true)

        // 处理流式响应
        let fullContent = ''

        response.data.on('data', (chunk: Buffer) => {
          const chunkStr = chunk.toString()
          const lines = chunkStr.split('\n')

          log('[MCP Server] Received chunk:', chunkStr)

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

              log('[MCP Server] Parsed data:', data.choices?.[0]?.delta)
              let deltaContent = ''

              // 处理美团 AIGC API 的响应格式
              // 优先使用标准的 delta.content 格式
              if (data.choices?.[0]?.delta?.content) {
                deltaContent = data.choices[0].delta.content
              }
              log('[MCP Server] Delta content:', deltaContent)
              // 如果没有 delta.content，则忽略 data.content（避免重复）
              // 因为美团 AIGC API 会同时返回两种格式，我们只需要增量内容

              if (deltaContent !== '') {
                fullContent += deltaContent

                // 实时广播流式内容
                this.broadcastSSEMessage('streaming', {
                  conversationId,
                  messageId: assistantMessageId,
                  role: 'assistant',
                  content: fullContent,
                  timestamp: Date.now(),
                  isComplete: false,
                })
              }
            } catch (parseError) {
              console.error('[MCP Server] Error parsing MCP stream chunk:', parseError)
              console.error('Problematic line:', line)
            }
          }
        })

        response.data.on('end', () => {
          // 创建完整的助手消息
          const assistantMessage: MCPMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: fullContent,
            timestamp: Date.now(),
            metadata: {
              model: this.config.meituanAIGC?.defaultModel || 'gpt-3.5-turbo',
              stream: true,
            },
          }

          // 保存到对话历史
          this.conversations.get(conversationId)!.push(assistantMessage)

          // 发送完整消息
          this.broadcastSSEMessage('message', {
            conversationId,
            message: {
              ...assistantMessage,
              isComplete: true,
            },
          })

          console.log('[MCP Server] Meituan AIGC API response completed for MCP chat')
        })

        response.data.on('error', (error: any) => {
          console.error('[MCP Server] Meituan AIGC API stream error in MCP chat:', error)
          // 回退到模拟响应
          this.generateMockMCPResponse(userMessage, conversationId, assistantMessageId)
        })

      } else {
        // 回退到模拟响应
        this.generateMockMCPResponse(userMessage, conversationId, assistantMessageId)
      }
    } catch (error) {
      console.error('[MCP Server] Error in generateMCPResponse:', error)
      // 回退到模拟响应
      this.generateMockMCPResponse(userMessage, conversationId, assistantMessageId)
    }
  }

  private generateMockMCPResponse(userMessage: MCPMessage, conversationId: string, assistantMessageId?: string) {
    const responses = [
      '我理解您的问题。作为 MCP 服务器，我可以为您提供详细的分析...',
      '这是一个很有趣的话题！基于 MCP 协议的处理能力...',
      '感谢您使用 MCP 服务。根据您的输入...',
      '让我通过 MCP 服务器为您详细解释这个问题...',
      '基于 MCP 协议的智能分析，这个问题涉及到几个方面...',
    ]

    const randomResponse = responses[Math.floor(Math.random() * responses.length)]
    const fullResponse = `${randomResponse}\n\n针对您提到的"${userMessage.content}"，我的回答是：${this.generateMockResponse(userMessage.content)}`

    const assistantMessage: MCPMessage = {
      id: assistantMessageId || this.generateId(),
      role: 'assistant',
      content: fullResponse,
      timestamp: Date.now(),
      metadata: {
        model: 'mcp-default',
        stream: false,
      },
    }

    // 保存到对话历史
    this.conversations.get(conversationId)!.push(assistantMessage)

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
        this.broadcastSSEMessage('streaming', {
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
        this.broadcastSSEMessage('message', {
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

  private generateMockResponse(input: string): string {
    const templates = [
      `基于您的输入"${input}"，我认为这是一个需要深入分析的问题。`,
      `关于"${input}"这个话题，我可以从多个角度来为您解答。`,
      `您提到的"${input}"确实很有意思，让我为您详细说明。`,
      `针对"${input}"，我建议我们可以这样来理解和处理。`,
    ]

    const template = templates[Math.floor(Math.random() * templates.length)]
    const additionalContent = [
      '首先，我们需要理解问题的核心所在。',
      '其次，我们可以考虑多种解决方案。',
      '最后，我建议采用渐进式的方法来处理。',
      '希望这个回答对您有所帮助！',
    ].join('\n\n')

    return `${template}\n\n${additionalContent}`
  }

  private sendSSEMessage(client: any, event: string, data: any) {
    try {
      client.write(`event: ${event}\n`)
      client.write(`data: ${JSON.stringify(data)}\n\n`)
    } catch (error) {
      console.error('[MCP Server] Error sending SSE message:', error)
      this.clients.delete(client)
    }
  }

  private broadcastSSEMessage(event: string, data: any) {
    const deadClients: any[] = []

    this.clients.forEach(client => {
      try {
        this.sendSSEMessage(client, event, data)
      } catch (error) {
        console.error('[MCP Server] Error broadcasting SSE message:', error)
        deadClients.push(client)
      }
    })

    // 清理断开的连接
    deadClients.forEach(client => {
      this.clients.delete(client)
    })
  }

  private generateId(): string {
    return `mcp_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`
  }

  private estimateTokens(text: string): number {
    // 简单的 token 估算：大约 4 个字符 = 1 个 token
    return Math.ceil(text.length / 4)
  }

  private async callMeituanAIGC(messages: any[], stream = false, model?: string): Promise<any> {
    if (!this.config.meituanAIGC?.appId) {
      throw new Error('Meituan AIGC configuration is missing')
    }

    const apiUrl = this.config.meituanAIGC.apiUrl || 'https://aigc.sankuai.com/v1/openai/native/chat/completions'
    const requestModel = model || this.config.meituanAIGC.defaultModel || 'gpt-3.5-turbo'

    const requestData = {
      model: requestModel,
      messages,
      stream,
    }

    const headers = {
      'Authorization': `Bearer ${this.config.meituanAIGC.appId}`,
      'Content-Type': 'application/json',
    }

    try {
      const response = await axios.post(apiUrl, requestData, {
        headers,
        responseType: stream ? 'stream' : 'json',
      })

      return response
    } catch (error) {
      console.error('[MCP Server] Error calling Meituan AIGC API:', error)
      throw error
    }
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          console.log(`[MCP Server] Running on http://localhost:${this.port}`)
          console.log(`[MCP Server] Health check: http://localhost:${this.port}/health`)
          console.log(`[MCP Server] Chat completions: http://localhost:${this.port}/v1/chat/completions`)
          console.log(`[MCP Server] MCP Stream: http://localhost:${this.port}/mcp/chat/stream`)
          resolve()
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        // 关闭所有 SSE 连接
        this.clients.forEach(client => {
          try {
            client.end()
          } catch (error) {
            console.error('[MCP Server] Error closing client connection:', error)
          }
        })
        this.clients.clear()

        this.server.close(() => {
          console.log('[MCP Server] Stopped')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  public getStats() {
    return {
      connectedClients: this.clients.size,
      totalConversations: this.conversations.size,
      totalMessages: Array.from(this.conversations.values()).reduce((sum, msgs) => sum + msgs.length, 0),
      port: this.port,
      config: this.config,
    }
  }

  public getConversations() {
    return Array.from(this.conversations.entries()).map(([id, messages]) => ({
      id,
      messages,
      messageCount: messages.length,
      lastActivity: messages[messages.length - 1]?.timestamp || 0,
    }))
  }
}
