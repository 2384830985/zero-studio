import { BrowserWindow } from 'electron'
import { ChatHandler } from './ChatHandler'
import { PlanService } from '../../services/PlanService'

export class PlanChatHandler extends ChatHandler {
  private planService: PlanService

  constructor(win: BrowserWindow) {
    super(win)
    this.planService = new PlanService(win)
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

      // 初始化计划代理
      await this.planService.initializePlanAgent(metadata)

      // 检查计划代理是否可用
      if (!this.planService.isPlanAgentAvailable()) {
        return this.createErrorResponse(503, 'PlanAndExecute agent not available')
      }

      console.log(`[MCP Server] Creating plan for goal: ${content}`)

      // 创建执行计划
      const plan = await this.createExecutionPlan(content.trim())
      if (!plan) {
        return this.createErrorResponse(500, 'Failed to create plan')
      }

      // 如果有对话ID，开始执行计划并流式返回结果
      if (conversationId) {
        this.executePlanWithStreaming(plan, conversationId, metadata)
      }

      return this.createSuccessResponse({
        plan: this.formatPlanResponse(plan),
        conversationId,
      })
    } catch (error) {
      console.error('[Plan Chat Handler] Error creating plan:', error)
      return this.createErrorResponse(
        500,
        'Failed to create plan',
        error instanceof Error ? error.message : 'Unknown error',
      )
    }
  }

  /**
   * 创建执行计划
   */
  private async createExecutionPlan(content: string) {
    try {
      return await this.planService.createPlan(content)
    } catch (error) {
      console.error('[Plan Chat Handler] Error creating plan:', error)
      return null
    }
  }

  /**
   * 执行计划并流式返回结果
   */
  private executePlanWithStreaming(plan: any, conversationId: string, metadata: any) {
    try {
      this.planService.executePlanWithStreaming(plan, conversationId, metadata)
    } catch (error) {
      console.error('[Plan Chat Handler] Error executing plan with streaming:', error)
      this.sendErrorMessage(conversationId)
    }
  }

  /**
   * 格式化计划响应
   */
  private formatPlanResponse(plan: any) {
    return {
      id: plan.id,
      goal: plan.goal,
      status: plan.status,
      stepsCount: plan.steps.length,
      createdAt: plan.createdAt,
    }
  }
}
