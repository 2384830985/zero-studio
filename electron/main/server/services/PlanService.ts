import { PlanAndExecuteAgent, ExecutionPlan, PlanStep } from '../../plan-and-execute'
import { MCPMessage } from '../types'
import { ConversationService } from './ConversationService'
import { generateId } from '../utils/helpers'
import {BrowserWindow} from 'electron'

/**
 * 计划执行服务类
 * 负责管理计划的创建、执行和状态跟踪
 */
export class PlanService {
  private planAgent: PlanAndExecuteAgent | null = null
  private executionPlans: Map<string, ExecutionPlan> = new Map()
  private conversationService: ConversationService
  private win: BrowserWindow

  constructor(conversationService: ConversationService, win: BrowserWindow) {
    this.conversationService = conversationService
    this.win = win
  }

  /**
   * 初始化计划代理
   */
  async initializePlanAgent(metadata: any): Promise<void> {
    try {
      // 使用默认的 OpenAI 代理（需要配置 API Key）
      this.planAgent = new PlanAndExecuteAgent({
        model: metadata.model,
        apiKey: metadata.service.apiKey,
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        temperature: 0.7,
        maxTokens: 2000,
        enableReplanning: true,
        enableSubtaskDecomposition: true,
      })
    } catch (error) {
      console.error('[Plan Service] Failed to initialize PlanAndExecute agent:', error)
      this.planAgent = null
    }
  }

  /**
   * 创建执行计划
   */
  async createPlan(content: string): Promise<ExecutionPlan | null> {
    if (!this.planAgent) {
      throw new Error('PlanAndExecute agent not available')
    }

    console.log(`[Plan Service] Creating plan for goal: ${content}`)
    const plan = await this.planAgent.createPlan(content.trim())
    this.executionPlans.set(plan.id, plan)
    return plan
  }

  /**
   * 执行计划
   */
  async executePlan(planId: string): Promise<ExecutionPlan | null> {
    const plan = this.executionPlans.get(planId)
    if (!plan) {
      throw new Error('Plan not found')
    }

    if (!this.planAgent) {
      throw new Error('PlanAndExecute agent not available')
    }

    console.log(`[Plan Service] Executing plan: ${planId}`)
    const executedPlan = await this.planAgent.executePlan(plan)
    this.executionPlans.set(planId, executedPlan)
    return executedPlan
  }

  /**
   * 流式执行计划
   */
  async executePlanWithStreaming(
    plan: ExecutionPlan,
    conversationId: string,
    metadata: any = {},
  ): Promise<void> {
    if (!this.planAgent) {
      console.error('[Plan Service] PlanAndExecute agent not available')
      return
    }

    try {
      console.log(`[Plan Service] Starting streaming execution of plan: ${plan.id}`)

      // 创建助手消息用于显示计划执行过程
      const assistantMessageId = generateId()
      let currentContent = `🎯 **执行计划**: ${plan.goal}\n\n📋 **计划步骤**:\n`

      // 显示初始计划
      plan.steps.forEach((step, index) => {
        currentContent += `${index + 1}. ${step.description}\n`
      })
      currentContent += '\n🚀 **开始执行**...\n\n'

      // 广播初始计划消息
      this.win.webContents.send('streaming', {
        conversationId,
        messageId: assistantMessageId,
        role: 'assistant',
        content: currentContent,
        timestamp: Date.now(),
      })

      // 执行计划，监听步骤更新
      const executedPlan = await this.planAgent.executePlan(plan, (step: PlanStep) => {
        // 更新步骤状态的显示
        let stepContent = ''

        if (step.status === 'executing') {
          stepContent = `⏳ **正在执行**: ${step.description}\n`
        } else if (step.status === 'completed') {
          stepContent = `✅ **已完成**: ${step.description}\n`
          if (step.result) {
            stepContent += `   📝 结果: ${step.result}\n`
          }
          if (step.subtasks && step.subtasks.length > 0) {
            stepContent += `   📂 子任务 (${step.subtasks.length}个):\n`
            step.subtasks.forEach((subtask, idx) => {
              const statusIcon = subtask.status === 'completed' ? '✅' :
                subtask.status === 'failed' ? '❌' :
                  subtask.status === 'executing' ? '⏳' : '⏸️'
              stepContent += `      ${idx + 1}. ${statusIcon} ${subtask.description}\n`
              if (subtask.result && subtask.status === 'completed') {
                stepContent += `         💡 ${subtask.result}\n`
              }
            })
          }
        } else if (step.status === 'failed') {
          stepContent = `❌ **执行失败**: ${step.description}\n`
          if (step.error) {
            stepContent += `   ⚠️ 错误: ${step.error}\n`
          }
        }

        currentContent += stepContent + '\n'

        // 广播步骤更新
        this.win.webContents.send('streaming', {
          conversationId,
          messageId: assistantMessageId,
          role: 'assistant',
          content: currentContent,
          timestamp: Date.now(),
        })
      })

      // 更新保存的计划
      this.executionPlans.set(plan.id, executedPlan)

      // 添加执行总结
      const completedSteps = executedPlan.steps.filter(s => s.status === 'completed').length
      const totalSteps = executedPlan.steps.length
      const failedSteps = executedPlan.steps.filter(s => s.status === 'failed').length

      currentContent += '\n📊 **执行总结**:\n'
      currentContent += `- 总步骤: ${totalSteps}\n`
      currentContent += `- 已完成: ${completedSteps}\n`
      if (failedSteps > 0) {
        currentContent += `- 失败: ${failedSteps}\n`
      }
      currentContent += `- 状态: ${executedPlan.status === 'completed' ? '✅ 完成' :
        executedPlan.status === 'failed' ? '❌ 失败' : '⏸️ 部分完成'}\n`

      // 发送最终消息
      const finalMessage: MCPMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: currentContent,
        timestamp: Date.now(),
        metadata: {
          ...metadata,
          planId: plan.id,
          executionSummary: {
            totalSteps,
            completedSteps,
            failedSteps,
            status: executedPlan.status,
          },
        },
      }

      // 保存到对话历史
      this.conversationService.addMessage(conversationId, finalMessage)

      // 广播最终消息
      this.win.webContents.send('message', {
        conversationId,
        message: finalMessage,
      })

      console.log(`[Plan Service] Plan execution completed: ${plan.id}`)
    } catch (error) {
      console.error('[Plan Service] Error in streaming plan execution:', error)

      // 发送错误消息
      const errorMessage: MCPMessage = {
        id: generateId(),
        role: 'assistant',
        content: `❌ **计划执行失败**: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: Date.now(),
        metadata: { ...metadata, planId: plan.id, error: true },
      }

      // 保存到对话历史
      this.conversationService.addMessage(conversationId, errorMessage)

      // 广播错误消息
      this.win.webContents.send('message', {
        conversationId,
        message: errorMessage,
      })
    }
  }

  /**
   * 获取计划详情
   */
  getPlan(planId: string): ExecutionPlan | undefined {
    return this.executionPlans.get(planId)
  }

  /**
   * 获取所有计划列表
   */
  getAllPlans() {
    return Array.from(this.executionPlans.values()).map(plan => ({
      id: plan.id,
      goal: plan.goal,
      status: plan.status,
      stepsCount: plan.steps.length,
      completedSteps: plan.steps.filter(s => s.status === 'completed').length,
      createdAt: plan.createdAt,
      completedAt: plan.completedAt,
    }))
  }

  /**
   * 删除计划
   */
  deletePlan(planId: string): boolean {
    return this.executionPlans.delete(planId)
  }

  /**
   * 获取计划代理配置
   */
  getConfig() {
    if (!this.planAgent) {
      throw new Error('PlanAndExecute agent not available')
    }
    return this.planAgent.getConfig()
  }

  /**
   * 更新计划代理配置
   */
  updateConfig(newConfig: any): void {
    if (!this.planAgent) {
      throw new Error('PlanAndExecute agent not available')
    }
    this.planAgent.updateConfig(newConfig)
    console.log('[Plan Service] Plan agent config updated')
  }

  /**
   * 检查计划代理是否可用
   */
  isPlanAgentAvailable(): boolean {
    return this.planAgent !== null
  }
}
