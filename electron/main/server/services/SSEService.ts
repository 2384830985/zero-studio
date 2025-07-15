import { Response } from 'express'

/**
 * SSE (Server-Sent Events) 服务类
 * 负责管理客户端连接和消息广播
 */
export class SSEService {
  private clients: Set<Response> = new Set()

  /**
   * 添加客户端连接
   */
  addClient(client: Response): void {
    this.clients.add(client)
    console.log(`[SSE Service] Client connected. Total: ${this.clients.size}`)
  }

  /**
   * 移除客户端连接
   */
  removeClient(client: Response): void {
    this.clients.delete(client)
    console.log(`[SSE Service] Client disconnected. Total: ${this.clients.size}`)
  }

  /**
   * 获取连接的客户端数量
   */
  getClientCount(): number {
    return this.clients.size
  }

  /**
   * 向单个客户端发送SSE消息
   */
  sendSSEMessage(client: Response, event: string, data: any): void {
    try {
      client.write(`event: ${event}\n`)
      client.write(`data: ${JSON.stringify(data)}\n\n`)
    } catch (error) {
      console.error('[SSE Service] Error sending SSE message:', error)
      this.clients.delete(client)
    }
  }

  /**
   * 向所有客户端广播SSE消息
   */
  broadcastSSEMessage(event: string, data: any): void {
    const deadClients: Response[] = []

    this.clients.forEach(client => {
      try {
        this.sendSSEMessage(client, event, data)
      } catch (error) {
        console.error('[SSE Service] Error broadcasting SSE message:', error)
        deadClients.push(client)
      }
    })

    // 清理断开的连接
    deadClients.forEach(client => {
      this.clients.delete(client)
    })
  }

  /**
   * 设置SSE响应头
   */
  setupSSEHeaders(res: Response): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    })
  }

  /**
   * 关闭所有客户端连接
   */
  closeAllConnections(): void {
    this.clients.forEach(client => {
      try {
        client.end()
      } catch (error) {
        console.error('[SSE Service] Error closing client connection:', error)
      }
    })
    this.clients.clear()
  }
}
