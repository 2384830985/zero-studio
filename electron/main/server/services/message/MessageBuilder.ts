import {AIMessage, HumanMessage, ToolMessage} from '@langchain/core/messages'
import {BaseMessage} from '@langchain/core/messages'

/**
 * 消息构建器
 * 负责构建各种类型的消息
 */
export class MessageBuilder {
  /**
   * 构建最终消息
   */
  buildFinalMessages(
    originalMessages: any[],
    response: any,
    toolMessages: ToolMessage[],
  ): BaseMessage[] {
    const summaryPrompt = `请扮演一个助手，根据对话历史（包括你之前的行为和工具调用结果）来总结并回答用户的问题。请重点注意以下几点：
- 你之前尝试调用工具来获取信息。
- 如果工具调用失败，请向用户解释失败原因，并建议正确的做法。
- 如果工具调用成功，请整合工具返回的信息给出最终回答。

请用清晰、简洁的语言进行总结，并直接给出最终答案。
`

    return [
      ...originalMessages,
      new AIMessage({
        content: response.content,
        tool_calls: response.tool_calls,
      }),
      ...toolMessages,
      new HumanMessage(summaryPrompt),
    ]
  }
}
