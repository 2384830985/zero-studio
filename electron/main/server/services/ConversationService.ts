import { MCPMessage, ConversationSummary } from '../types'

/**
 * 对话管理服务类
 * 负责管理对话历史和消息存储
 */
export class ConversationService {
  private conversations: Map<string, MCPMessage[]> = new Map()

  /**
   * 获取对话历史
   */
  getConversation(conversationId: string): MCPMessage[] {
    return this.conversations.get(conversationId) || []
  }

  /**
   * 添加消息到对话
   */
  addMessage(conversationId: string, message: MCPMessage): void {
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, [])
    }
    this.conversations.get(conversationId)!.push(message)
  }

  /**
   * 删除对话
   */
  deleteConversation(conversationId: string): boolean {
    return this.conversations.delete(conversationId)
  }

  /**
   * 获取所有对话的摘要信息
   */
  getAllConversationSummaries(): ConversationSummary[] {
    return Array.from(this.conversations.entries()).map(([id, messages]) => ({
      id,
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1],
      createdAt: messages[0]?.timestamp || Date.now(),
    }))
  }

  /**
   * 获取对话总数
   */
  getConversationCount(): number {
    return this.conversations.size
  }

  /**
   * 获取总消息数
   */
  getTotalMessageCount(): number {
    return Array.from(this.conversations.values()).reduce((sum, msgs) => sum + msgs.length, 0)
  }

  /**
   * 检查对话是否存在
   */
  hasConversation(conversationId: string): boolean {
    return this.conversations.has(conversationId)
  }

  /**
   * 清空所有对话
   */
  clearAllConversations(): void {
    this.conversations.clear()
  }

  /**
   * 获取对话的详细信息
   */
  getConversationDetails(conversationId: string) {
    const messages = this.conversations.get(conversationId) || []
    return {
      conversationId,
      messages,
      total: messages.length,
    }
  }
}
