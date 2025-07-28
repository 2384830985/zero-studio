import {IMessageMetadata} from '../../types'

/**
 * 输入验证器
 * 负责验证各种输入参数
 */
export class InputValidator {
  /**
   * 验证调用AIGC的输入参数
   */
  validateAIGCInput(metadata: IMessageMetadata): void {
    if (!metadata.model) {
      throw new Error('model 不能为空')
    }
    if (!metadata) {
      throw new Error('metadata 不能为空')
    }
  }

  /**
   * 验证消息列表
   */
  validateMessages(messages: any[]): void {
    if (!messages || !Array.isArray(messages)) {
      throw new Error('messages 必须是数组')
    }
    if (messages.length === 0) {
      throw new Error('messages 不能为空')
    }
  }

  /**
   * 验证流式回调函数
   */
  validateStreamingCallback(sendStreaming: (content: string) => void): void {
    if (typeof sendStreaming !== 'function') {
      throw new Error('sendStreaming 必须是函数')
    }
  }
}
