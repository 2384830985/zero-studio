import { BrowserWindow } from 'electron'
import { ChatHandler } from './ChatHandler'
import { PlanAgent } from '../../services/plan-agent'
import { IMetadata} from '../../llm'
import {ResponseBuilder} from '../../services'

export class PlanChatHandler extends ChatHandler {
  private planAgent: PlanAgent
  private responseBuilder = new ResponseBuilder()

  constructor(win: BrowserWindow) {
    super(win)
    this.planAgent = new PlanAgent(win)
  }

  /**
   * 处理计划聊天发送
   */
  async handleChatPlanSend(_: any, object: string) {
    try {
      console.log('handleChatPlanSend _', _)
      const { content, conversationId, metadata = {} } = JSON.parse(object)

      // 验证内容
      const validation = this.validateContent(content)
      if (!validation.isValid) {
        return this.createErrorResponse(400, validation.error!)
      }

      console.log(`[MCP Server] Creating plan for goal: ${content}`)

      // 广播用户消息
      this.broadcastUserMessage(content, conversationId || 'plan-execution', metadata)

      this.planAgent.initPlanAgent(metadata as IMetadata)
      const config = { recursionLimit: 50 }
      const inputs = {
        input: content,
      }

      this.sendStreamingMessage('', conversationId, metadata)

      this.involve(inputs, config).then(async (response) => {
        // 处理响应
        const fullContent = await this.processAIGCResponseContent(response, conversationId, metadata)
        // 发送完整消息
        if (fullContent) {
          this.sendFinalMessage(fullContent, response, conversationId, metadata)
        }
      })

      return this.createSuccessResponse({ conversationId })
    } catch (error) {
      console.error('[Plan Chat Handler] Error creating plan:', error)
      return this.createErrorResponse(
        500,
        'Failed to create plan',
        error instanceof Error ? error.message : 'Unknown error',
      )
    }
  }

  async involve(inputs, config) {
    try {
      // 获取异步迭代器
      const asyncIterator = (await this.planAgent.workFlow.stream(inputs, config))[Symbol.asyncIterator]()
      // 手动迭代
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value: event, done } = await asyncIterator.next()
        if (done) {break} // 迭代结束

        console.log('-------', JSON.stringify(event))
        if (event.replan?.response) {
          console.log('this.planAgent.memory', JSON.stringify(this.planAgent.memory, null , 2))
          return this.responseBuilder.buildToolCallResponse(
            event.replan?.response,
            '',
            [],
            [],
            this.planAgent.memory,
          )
        }
      }
    } catch (error) {
      console.error('迭代过程中出错:', error)
    }
  }

  /**
   * 格式化计划响应
   */
  private formatPlanResponse(plan: any[]): any {
    return {
      steps: plan.map((step, index) => ({
        id: step.id,
        order: index + 1,
        title: step.title,
        description: step.description,
        action: step.action,
        dependencies: step.dependencies,
        status: step.status,
        result: step.result,
      })),
      totalSteps: plan.length,
      completedSteps: plan.filter(step => step.status === 'completed').length,
      failedSteps: plan.filter(step => step.status === 'failed').length,
    }
  }
}
