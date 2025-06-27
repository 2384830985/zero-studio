import express from 'express'
import cors from 'cors'
import { Server } from 'http'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export class SSEServer {
  private app: express.Application
  private server: Server | null = null
  private port: number
  private clients: Set<any> = new Set()
  private messages: ChatMessage[] = []

  constructor(port = 3001) {
    this.port = port
    this.app = express()
    this.setupMiddleware()
    this.setupRoutes()
  }

  private setupMiddleware() {
    this.app.use(cors({
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    }))
    this.app.use(express.json())
  }

  private setupRoutes() {
    // SSE 连接端点
    this.app.get('/chat/stream', (req: any, res: any) => {
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
      console.log(`SSE client connected. Total clients: ${this.clients.size}`)

      // 发送连接确认
      this.sendToClient(res, 'connected', { message: 'Connected to chat stream' })

      // 发送历史消息
      if (this.messages.length > 0) {
        this.sendToClient(res, 'history', { messages: this.messages })
      }

      // 处理客户端断开连接
      req.on('close', () => {
        this.clients.delete(res)
        console.log(`SSE client disconnected. Total clients: ${this.clients.size}`)
      })
    })

    // 发送消息端点
    this.app.post('/chat/send', (req: any, res: any) => {
      const { content } = req.body
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: 'Content is required' })
      }

      // 创建用户消息
      const userMessage: ChatMessage = {
        id: this.generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      }

      // 保存用户消息
      this.messages.push(userMessage)

      // 广播用户消息
      this.broadcastMessage('message', userMessage)

      // 模拟 AI 回复（这里可以集成真实的 AI 服务）
      setTimeout(() => {
        this.simulateAIResponse(userMessage)
      }, 1000)

      res.json({ success: true, messageId: userMessage.id })
    })

    // 获取消息历史
    this.app.get('/chat/history', (req: any, res: any) => {
      res.json({ messages: this.messages })
    })

    // 清空聊天记录
    this.app.delete('/chat/clear', (req: any, res: any) => {
      this.messages = []
      this.broadcastMessage('cleared', { message: 'Chat history cleared' })
      res.json({ success: true })
    })
  }

  private sendToClient(client: any, event: string, data: any) {
    try {
      client.write(`event: ${event}\n`)
      client.write(`data: ${JSON.stringify(data)}\n\n`)
    } catch (error) {
      console.error('Error sending to client:', error)
      this.clients.delete(client)
    }
  }

  private broadcastMessage(event: string, data: any) {
    const deadClients: any[] = []
    
    this.clients.forEach(client => {
      try {
        this.sendToClient(client, event, data)
      } catch (error) {
        console.error('Error broadcasting to client:', error)
        deadClients.push(client)
      }
    })

    // 清理断开的连接
    deadClients.forEach(client => {
      this.clients.delete(client)
    })
  }

  private simulateAIResponse(userMessage: ChatMessage) {
    // 模拟 AI 思考时间
    const responses = [
      '我理解你的问题。让我来帮你分析一下...',
      '这是一个很有趣的话题！根据我的理解...',
      '感谢你的提问。基于你提到的内容...',
      '让我为你详细解释一下这个问题...',
      '这个问题涉及到几个方面，我来逐一说明...',
    ]

    const randomResponse = responses[Math.floor(Math.random() * responses.length)]
    const aiMessage: ChatMessage = {
      id: this.generateId(),
      role: 'assistant',
      content: `${randomResponse}\n\n针对你说的"${userMessage.content}"，我的回答是：这是一个模拟的 AI 回复。在实际应用中，这里可以集成真实的 AI 服务，比如 OpenAI GPT、Claude 或其他语言模型。`,
      timestamp: Date.now(),
    }

    // 保存 AI 消息
    this.messages.push(aiMessage)

    // 模拟流式回复
    this.simulateStreamingResponse(aiMessage)
  }

  private simulateStreamingResponse(message: ChatMessage) {
    const words = message.content.split('')
    let currentContent = ''
    let index = 0

    const streamInterval = setInterval(() => {
      if (index < words.length) {
        currentContent += words[index]
        
        // 广播部分内容
        this.broadcastMessage('streaming', {
          id: message.id,
          role: message.role,
          content: currentContent,
          timestamp: message.timestamp,
          isComplete: false,
        })
        
        index++
      } else {
        // 发送完整消息
        this.broadcastMessage('message', {
          ...message,
          isComplete: true,
        })
        clearInterval(streamInterval)
      }
    }, 50) // 每50ms发送一个字符，模拟打字效果
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          console.log(`SSE Server running on http://localhost:${this.port}`)
          resolve()
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        // 关闭所有 SSE 连接
        this.clients.forEach(client => {
          try {
            client.end()
          } catch (error) {
            console.error('Error closing client connection:', error)
          }
        })
        this.clients.clear()

        this.server.close(() => {
          console.log('SSE Server stopped')
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
      totalMessages: this.messages.length,
      port: this.port,
    }
  }
}
