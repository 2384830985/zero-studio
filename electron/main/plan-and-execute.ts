import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'
export interface PlanStep {
  id: string
  description: string
  status: 'pending' | 'executing' | 'completed' | 'failed'
  result?: string
  error?: string
  timestamp: number
  subtasks?: PlanStep[] // 子任务列表
  needsSubtasks?: boolean // 是否需要分解为子任务
}

export interface ExecutionPlan {
  id: string
  goal: string
  steps: PlanStep[]
  status: 'planning' | 'executing' | 'completed' | 'failed'
  createdAt: number
  completedAt?: number
}

export interface PlanAndExecuteConfig {
  apiKey?: string
  baseURL?: string
  model?: string
  temperature?: number
  maxTokens?: number
  plannerPrompt?: string
  executorPrompt?: string
  replannerPrompt?: string
  subtaskDecomposerPrompt?: string // 子任务分解器提示词
  decompositionJudgePrompt?: string // 子任务分解判断器提示词
  enableReplanning?: boolean
  replanThreshold?: number // 失败步骤数阈值，超过此数量触发重规划
  enableSubtaskDecomposition?: boolean // 是否启用子任务分解
  maxSubtaskDepth?: number // 最大子任务深度
  useAIJudgment?: boolean // 是否使用 AI 判断是否需要分解
}

export class PlanAndExecuteAgent {
  private llm: ChatOpenAI
  private config: Required<PlanAndExecuteConfig>
  private plannerChain!: RunnableSequence
  private executorChain!: RunnableSequence
  private replannerChain!: RunnableSequence
  private subtaskDecomposerChain!: RunnableSequence
  private decompositionJudgeChain!: RunnableSequence

  constructor(config: PlanAndExecuteConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.OPENAI_API_KEY || '',
      baseURL: config.baseURL || 'https://api.openai.com/v1',
      model: config.model || 'gpt-3.5-turbo',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens || 2000,
      plannerPrompt: config.plannerPrompt || this.getDefaultPlannerPrompt(),
      executorPrompt: config.executorPrompt || this.getDefaultExecutorPrompt(),
      replannerPrompt: config.replannerPrompt || this.getDefaultReplannerPrompt(),
      subtaskDecomposerPrompt: config.subtaskDecomposerPrompt || this.getDefaultSubtaskDecomposerPrompt(),
      decompositionJudgePrompt: config.decompositionJudgePrompt || this.getDefaultDecompositionJudgePrompt(),
      enableReplanning: config.enableReplanning ?? true,
      replanThreshold: config.replanThreshold ?? 2,
      enableSubtaskDecomposition: config.enableSubtaskDecomposition ?? true,
      maxSubtaskDepth: config.maxSubtaskDepth ?? 3,
      useAIJudgment: config.useAIJudgment ?? true,
    }

    this.llm = new ChatOpenAI({
      openAIApiKey: this.config.apiKey,
      configuration: {
        baseURL: this.config.baseURL,
      },
      modelName: this.config.model,
      maxTokens: this.config.maxTokens,
      streaming: true,
    })

    this.setupChains()
  }

  private setupChains() {
    // 规划链
    const plannerPrompt = PromptTemplate.fromTemplate(this.config.plannerPrompt)
    this.plannerChain = RunnableSequence.from([
      plannerPrompt,
      this.llm,
      new StringOutputParser(),
    ])

    // 执行链
    const executorPrompt = PromptTemplate.fromTemplate(this.config.executorPrompt)
    this.executorChain = RunnableSequence.from([
      executorPrompt,
      this.llm,
      new StringOutputParser(),
    ])

    // 重规划链
    const replannerPrompt = PromptTemplate.fromTemplate(this.config.replannerPrompt)
    this.replannerChain = RunnableSequence.from([
      replannerPrompt,
      this.llm,
      new StringOutputParser(),
    ])

    // 子任务分解器链
    const subtaskDecomposerPrompt = PromptTemplate.fromTemplate(this.config.subtaskDecomposerPrompt)
    this.subtaskDecomposerChain = RunnableSequence.from([
      subtaskDecomposerPrompt,
      this.llm,
      new StringOutputParser(),
    ])

    // 分解判断器链
    const decompositionJudgePrompt = PromptTemplate.fromTemplate(this.config.decompositionJudgePrompt)
    this.decompositionJudgeChain = RunnableSequence.from([
      decompositionJudgePrompt,
      this.llm,
      new StringOutputParser(),
    ])
  }

  private getDefaultPlannerPrompt(): string {
    return `你是一个智能规划助手。给定一个目标，你需要将其分解为具体的、可执行的步骤。

目标: {goal}

请将这个目标分解为详细的执行步骤。每个步骤应该：
1. 具体明确，可以独立执行
2. 按逻辑顺序排列
3. 包含必要的细节和上下文

请以以下格式返回步骤列表：
步骤1: [具体描述]
步骤2: [具体描述]
步骤3: [具体描述]
...

步骤列表:`
  }

  private getDefaultExecutorPrompt(): string {
    return `你是一个智能执行助手。你需要执行给定的步骤，并提供详细的结果。

当前步骤: {step}
目标上下文: {goal}
之前步骤的结果: {previousResults}

请执行这个步骤并提供详细的结果。如果这个步骤需要特定的工具或资源，请说明如何获取或使用它们。

在提供执行结果后，请评估这个步骤的复杂度：
- 如果这个步骤过于复杂，涉及多个不同的操作或技术，需要进一步分解为更小的子任务，请在结果末尾添加：[需要分解]
- 如果这个步骤已经足够具体和简单，可以直接执行，请在结果末尾添加：[无需分解]

执行结果:`
  }

  private getDefaultReplannerPrompt(): string {
    return `你是一个智能重规划助手。基于当前的执行情况和遇到的问题，你需要重新调整执行计划。

原始目标: {goal}
原始计划: {originalPlan}
已完成的步骤: {completedSteps}
失败的步骤: {failedSteps}
当前问题: {currentIssues}

请基于以上信息重新制定执行计划。新计划应该：
1. 考虑已完成步骤的结果
2. 避免之前失败的问题
3. 调整策略以更好地实现目标
4. 保持步骤的逻辑性和可执行性

请以以下格式返回新的步骤列表：
步骤1: [具体描述]
步骤2: [具体描述]
步骤3: [具体描述]
...

重新规划的步骤列表:`
  }

  private getDefaultSubtaskDecomposerPrompt(): string {
    return `你是一个智能子任务分解助手。当一个步骤过于复杂或执行失败时，你需要将其分解为更小的、更具体的子任务。

当前步骤: {step}
目标上下文: {goal}
执行结果: {executionResult}
失败原因: {failureReason}
之前步骤的结果: {previousResults}

请分析这个步骤是否需要分解为子任务。如果需要，请将其分解为具体的、可执行的子任务。

判断标准：
1. 步骤描述过于宽泛或复杂
2. 执行失败且可以通过分解解决
3. 涉及多个不同的操作或技术

如果需要分解，请以以下格式返回子任务列表：
子任务1: [具体描述]
子任务2: [具体描述]
子任务3: [具体描述]
...

如果不需要分解，请返回：
不需要分解

分析结果:`
  }

  private getDefaultDecompositionJudgePrompt(): string {
    return `你是一个智能分解判断助手。你需要分析执行结果，判断当前步骤是否需要进一步分解为子任务。

当前步骤: {step}
目标上下文: {goal}
执行结果: {executionResult}
之前步骤的结果: {previousResults}

请仔细分析执行结果，判断这个步骤是否需要分解为更小的子任务。

判断标准：
1. 执行结果是否过于宽泛或抽象，缺乏具体的操作指导
2. 是否涉及多个不同领域或技术栈的操作
3. 是否包含多个独立的子步骤或阶段
4. 执行结果的复杂度是否超出了单一步骤的范围
5. 是否需要更详细的分步指导才能实际执行

如果需要分解，请返回：需要分解
如果不需要分解，请返回：无需分解

判断结果:`
  }

  /**
   * 创建执行计划
   */
  async createPlan(goal: string): Promise<ExecutionPlan> {
    const planId = this.generateId()

    try {
      console.log(`[PlanAndExecute] Creating plan for goal start: ${goal}`)

      const planResult = await this.plannerChain.invoke({ goal })

      console.log(`[PlanAndExecute] Creating plan for goal end: ${goal}`)
      const steps = this.parsePlanSteps(planResult)

      const plan: ExecutionPlan = {
        id: planId,
        goal,
        steps,
        status: 'planning',
        createdAt: Date.now(),
      }

      console.log(`[PlanAndExecute] Plan created with ${steps.length} steps`)
      return plan
    } catch (error) {
      console.error('[PlanAndExecute] Error creating plan:', error)
      throw new Error(`Failed to create plan: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }  /**
   * 执行计划
   */
  async executePlan(plan: ExecutionPlan, onStepUpdate?: (step: PlanStep) => void): Promise<ExecutionPlan> {
    const updatedPlan: ExecutionPlan = { ...plan, status: 'executing' }
    const previousResults: string[] = []
    let failedStepsCount = 0

    try {
      console.log(`[PlanAndExecute] Starting execution of plan: ${plan.id}`)

      for (let i = 0; i < updatedPlan.steps.length; i++) {
        const step = updatedPlan.steps[i]

        // 更新步骤状态为执行中
        step.status = 'executing'
        step.timestamp = Date.now()
        onStepUpdate?.(step)

        try {
          console.log(`[PlanAndExecute] Executing step ${i + 1}: ${step.description}`)

          // 如果步骤有子任务，则执行子任务
          if (step.subtasks && step.subtasks.length > 0) {
            const subtaskResults = await this.executeSubtasks(step, plan.goal, previousResults.join('\n\n'), onStepUpdate)

            // 更新步骤状态为完成
            step.status = 'completed'
            step.result = `子任务执行完成：\n${subtaskResults.join('\n')}`
            step.timestamp = Date.now()
            previousResults.push(`步骤${i + 1}结果: ${step.result}`)
          } else {
            // 执行单个步骤
            const result = await this.executorChain.invoke({
              step: step.description,
              goal: plan.goal,
              previousResults: previousResults.join('\n\n'),
            })

            // 检查是否需要分解为子任务
            if (this.config.enableSubtaskDecomposition && await this.shouldDecomposeStep(result, step, plan.goal, previousResults.join('\n\n'))) {
              const subtasks = await this.decomposeStepIntoSubtasks(step, plan.goal, result, '', previousResults.join('\n\n'))

              if (subtasks && subtasks.length > 0) {
                step.subtasks = subtasks
                step.needsSubtasks = true
                console.log(`[PlanAndExecute] Step ${i + 1} decomposed into ${subtasks.length} subtasks`)

                // 执行子任务
                const subtaskResults = await this.executeSubtasks(step, plan.goal, previousResults.join('\n\n'), onStepUpdate)
                step.result = `子任务执行完成：\n${subtaskResults.join('\n')}`
              } else {
                step.result = result
              }
            } else {
              step.result = result
            }

            // 更新步骤状态为完成
            step.status = 'completed'
            step.timestamp = Date.now()
            previousResults.push(`步骤${i + 1}结果: ${step.result}`)
          }

          onStepUpdate?.(step)
          console.log(`[PlanAndExecute] Step ${i + 1} completed`)
        } catch (error) {
          // 更新步骤状态为失败
          step.status = 'failed'
          step.error = error instanceof Error ? error.message : 'Unknown error'
          step.timestamp = Date.now()
          failedStepsCount++

          onStepUpdate?.(step)
          console.error(`[PlanAndExecute] Step ${i + 1} failed:`, error)

          // 检查是否需要重规划
          if (this.config.enableReplanning && failedStepsCount >= this.config.replanThreshold) {
            console.log(`[PlanAndExecute] Triggering replanning due to ${failedStepsCount} failed steps`)

            try {
              const replanResult = await this.replanSteps(updatedPlan, i)
              if (replanResult) {
                // 用新的步骤替换剩余的步骤
                updatedPlan.steps = [
                  ...updatedPlan.steps.slice(0, i + 1), // 保留已执行的步骤（包括失败的）
                  ...replanResult, // 新的重规划步骤
                ]
                console.log(`[PlanAndExecute] Plan replanned with ${replanResult.length} new steps`)
                failedStepsCount = 0 // 重置失败计数
                continue // 继续执行新的步骤
              }
            } catch (replanError) {
              console.error('[PlanAndExecute] Replanning failed:', replanError)
            }
          }

          // 如果没有重规划或重规划失败，继续执行下一步
          // 可以选择停止执行或继续，这里选择继续
          continue
        }
      }

      // 检查最终状态
      const completedSteps = updatedPlan.steps.filter(s => s.status === 'completed').length
      const totalSteps = updatedPlan.steps.length

      if (completedSteps === totalSteps) {
        updatedPlan.status = 'completed'
      } else if (completedSteps > 0) {
        updatedPlan.status = 'completed' // 部分完成也算完成
      } else {
        updatedPlan.status = 'failed'
      }

      updatedPlan.completedAt = Date.now()
      console.log(`[PlanAndExecute] Plan execution finished: ${plan.id}, completed ${completedSteps}/${totalSteps} steps`)

      return updatedPlan
    } catch (error) {
      console.error('[PlanAndExecute] Error executing plan:', error)
      updatedPlan.status = 'failed'
      return updatedPlan
    }
  }

  /**
   * 一步执行：创建计划并执行
   */
  async planAndExecute(goal: string, onStepUpdate?: (step: PlanStep) => void): Promise<ExecutionPlan> {
    const plan = await this.createPlan(goal)
    return await this.executePlan(plan, onStepUpdate)
  }

  /**
   * 解析计划步骤
   */
  private parsePlanSteps(planText: string): PlanStep[] {
    const lines = planText.split('\n').filter(line => line.trim())
    const steps: PlanStep[] = []

    for (const line of lines) {
      const match = line.match(/^步骤\d+:\s*(.+)$/)
      if (match) {
        steps.push({
          id: this.generateId(),
          description: match[1].trim(),
          status: 'pending',
          timestamp: Date.now(),
        })
      }
    }

    // 如果没有匹配到标准格式，尝试其他格式
    if (steps.length === 0) {
      const fallbackLines = lines.filter(line =>
        line.includes('步骤') ||
        line.match(/^\d+\./) ||
        line.match(/^-\s+/) ||
        line.match(/^\*\s+/),
      )

      for (const line of fallbackLines) {
        const cleaned = line.replace(/^(步骤\d+[:：]?|\d+\.|-\s+|\*\s+)/, '').trim()
        if (cleaned) {
          steps.push({
            id: this.generateId(),
            description: cleaned,
            status: 'pending',
            timestamp: Date.now(),
          })
        }
      }
    }

    return steps
  }

  /**
   * 重新规划步骤
   */
  private async replanSteps(plan: ExecutionPlan, currentStepIndex: number): Promise<PlanStep[] | null> {
    try {
      const completedSteps = plan.steps.slice(0, currentStepIndex + 1).filter(s => s.status === 'completed')
      const failedSteps = plan.steps.slice(0, currentStepIndex + 1).filter(s => s.status === 'failed')
      const completedStepsText = completedSteps.map((step, index) =>
        `步骤${index + 1}: ${step.description} - 结果: ${step.result || '已完成'}`,
      ).join('\n')

      const failedStepsText = failedSteps.map((step, index) =>
        `步骤${index + 1}: ${step.description} - 错误: ${step.error || '执行失败'}`,
      ).join('\n')

      const originalPlanText = plan.steps.map((step, index) =>
        `步骤${index + 1}: ${step.description}`,
      ).join('\n')

      const currentIssues = failedSteps.map(step => step.error).join('; ')

      console.log(`[PlanAndExecute] Replanning with ${completedSteps.length} completed and ${failedSteps.length} failed steps`)

      const replanResult = await this.replannerChain.invoke({
        goal: plan.goal,
        originalPlan: originalPlanText,
        completedSteps: completedStepsText || '无已完成步骤',
        failedSteps: failedStepsText || '无失败步骤',
        currentIssues: currentIssues || '无具体问题描述',
      })

      const newSteps = this.parsePlanSteps(replanResult)

      if (newSteps.length > 0) {
        console.log(`[PlanAndExecute] Replanning generated ${newSteps.length} new steps`)
        return newSteps
      } else {
        console.warn('[PlanAndExecute] Replanning did not generate any new steps')
        return null
      }
    } catch (error) {
      console.error('[PlanAndExecute] Error in replanning:', error)
      return null
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `plan_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<PlanAndExecuteConfig>) {
    this.config = { ...this.config, ...newConfig }

    // 重新初始化 LLM
    this.llm = new ChatOpenAI({
      openAIApiKey: this.config.apiKey,
      configuration: {
        baseURL: this.config.baseURL,
      },
      modelName: this.config.model,
      maxTokens: this.config.maxTokens,
    })

    // 重新设置链
    this.setupChains()
  }

  /**
   * 获取当前配置
   */
  getConfig(): PlanAndExecuteConfig {
    return { ...this.config }
  }

  /**
   * 判断步骤是否需要分解为子任务
   */
  private async shouldDecomposeStep(
    executionResult: string,
    step: PlanStep,
    goal: string,
    previousResults: string,
  ): Promise<boolean> {
    // 首先检查执行结果中是否有明确的标记
    if (executionResult.includes('[需要分解]')) {
      console.log('[PlanAndExecute] Step marked for decomposition by executor')
      return true
    }

    if (executionResult.includes('[无需分解]')) {
      console.log('[PlanAndExecute] Step marked as no decomposition needed by executor')
      return false
    }

    // 如果启用了 AI 判断，使用 LLM 来判断
    if (this.config.useAIJudgment) {
      try {
        console.log('[PlanAndExecute] Using AI judgment for decomposition decision')

        const judgeResult = await this.decompositionJudgeChain.invoke({
          step: step.description,
          goal,
          executionResult,
          previousResults,
        })

        const needsDecomposition = judgeResult.includes('需要分解')
        console.log(`[PlanAndExecute] AI judgment result: ${needsDecomposition ? '需要分解' : '无需分解'}`)
        return needsDecomposition
      } catch (error) {
        console.error('[PlanAndExecute] Error in AI judgment, falling back to heuristic:', error)
        // 如果 AI 判断失败，回退到启发式判断
        return this.heuristicDecompositionJudgment(executionResult)
      }
    }

    // 回退到启发式判断
    return this.heuristicDecompositionJudgment(executionResult)
  }

  /**
   * 启发式分解判断（作为备用方案）
   */
  private heuristicDecompositionJudgment(executionResult: string): boolean {
    // 改进的启发式判断逻辑
    const complexityIndicators = [
      '复杂', '困难', '需要多个步骤', '分步骤', '分阶段',
      '首先', '然后', '接下来', '最后', '同时',
      '包括', '涉及', '需要考虑', '需要准备',
      '多个方面', '多种方法', '不同的', '各种',
      '详细步骤', '具体操作', '分别', '逐一',
    ]

    const structureIndicators = [
      /\d+[.、]\s*[^。]{10,}/g, // 编号列表且内容较长
      /第[一二三四五六七八九十]+[步阶段]/g, // 步骤序号
      /步骤[一二三四五六七八九十\d]+/g, // 步骤描述
    ]

    // 检查复杂性指示词
    const hasComplexityIndicators = complexityIndicators.some(indicator =>
      executionResult.includes(indicator),
    )

    // 检查结构化内容
    const hasStructuredContent = structureIndicators.some(pattern =>
      (executionResult.match(pattern) || []).length >= 2,
    )

    // 检查长度（降低阈值，更保守）
    const isTooLong = executionResult.length > 300

    // 检查是否包含多个独立的操作
    const hasMultipleOperations = (executionResult.match(/[，。；]/g) || []).length >= 5

    console.log(`[PlanAndExecute] Heuristic judgment - Complexity: ${hasComplexityIndicators}, Structure: ${hasStructuredContent}, Length: ${isTooLong}, Operations: ${hasMultipleOperations}`)

    return hasComplexityIndicators || hasStructuredContent || (isTooLong && hasMultipleOperations)
  }

  /**
   * 将步骤分解为子任务
   */
  private async decomposeStepIntoSubtasks(
    step: PlanStep,
    goal: string,
    executionResult: string,
    failureReason: string,
    previousResults: string,
  ): Promise<PlanStep[] | null> {
    try {
      console.log(`[PlanAndExecute] Decomposing step: ${step.description}`)

      const decompositionResult = await this.subtaskDecomposerChain.invoke({
        step: step.description,
        goal,
        executionResult,
        failureReason,
        previousResults,
      })

      if (decompositionResult.includes('不需要分解')) {
        console.log('[PlanAndExecute] Step does not need decomposition')
        return null
      }

      const subtasks = this.parseSubtasks(decompositionResult)

      if (subtasks.length > 0) {
        console.log('[PlanAndExecute] Step decomposed into ${subtasks.length} subtasks')
        return subtasks
      } else {
        console.warn('[PlanAndExecute] Failed to parse subtasks from decomposition result')
        return null
      }
    } catch (error) {
      console.error('[PlanAndExecute] Error decomposing step:', error)
      return null
    }
  }

  /**
   * 解析子任务
   */
  private parseSubtasks(decompositionText: string): PlanStep[] {
    const lines = decompositionText.split('\n').filter(line => line.trim())
    const subtasks: PlanStep[] = []

    for (const line of lines) {
      const match = line.match(/^子任务\d+:\s*(.+)$/)
      if (match) {
        subtasks.push({
          id: this.generateId(),
          description: match[1].trim(),
          status: 'pending',
          timestamp: Date.now(),
        })
      }
    }

    // 如果没有匹配到标准格式，尝试其他格式
    if (subtasks.length === 0) {
      const fallbackLines = lines.filter(line =>
        line.includes('子任务') ||
        line.match(/^\d+\./) ||
        line.match(/^-\s+/) ||
        line.match(/^\*\s+/),
      )

      for (const line of fallbackLines) {
        const cleaned = line.replace(/^(子任务\d+[:：]?|\d+\.|-\s+|\*\s+)/, '').trim()
        if (cleaned) {
          subtasks.push({
            id: this.generateId(),
            description: cleaned,
            status: 'pending',
            timestamp: Date.now(),
          })
        }
      }
    }

    return subtasks
  }

  /**
   * 执行子任务
   */
  private async executeSubtasks(
    parentStep: PlanStep,
    goal: string,
    previousResults: string,
    onStepUpdate?: (step: PlanStep) => void,
  ): Promise<string[]> {
    const results: string[] = []

    if (!parentStep.subtasks) {
      return results
    }

    console.log(`[PlanAndExecute] Executing ${parentStep.subtasks.length} subtasks for step: ${parentStep.description}`)

    for (let i = 0; i < parentStep.subtasks.length; i++) {
      const subtask = parentStep.subtasks[i]

      // 更新子任务状态为执行中
      subtask.status = 'executing'
      subtask.timestamp = Date.now()
      onStepUpdate?.(subtask)

      try {
        console.log(`[PlanAndExecute] Executing subtask ${i + 1}: ${subtask.description}`)

        const subtaskResult = await this.executorChain.invoke({
          step: subtask.description,
          goal,
          previousResults: `${previousResults}\n\n父任务: ${parentStep.description}\n已完成子任务: ${results.join('; ')}`,
        })

        // 更新子任务状态为完成
        subtask.status = 'completed'
        subtask.result = subtaskResult
        subtask.timestamp = Date.now()
        results.push(`子任务${i + 1}: ${subtaskResult}`)

        onStepUpdate?.(subtask)
        console.log(`[PlanAndExecute] Subtask ${i + 1} completed`)
      } catch (error) {
        // 更新子任务状态为失败
        subtask.status = 'failed'
        subtask.error = error instanceof Error ? error.message : 'Unknown error'
        subtask.timestamp = Date.now()

        onStepUpdate?.(subtask)
        console.error(`[PlanAndExecute] Subtask ${i + 1} failed:`, error)

        // 子任务失败时，可以选择继续执行其他子任务或停止
        // 这里选择继续执行
        results.push(`子任务${i + 1}: 执行失败 - ${subtask.error}`)
      }
    }

    return results
  }
}

/**
 * 创建 PlanAndExecute 代理实例
 */
export function createPlanAndExecuteAgent(config?: PlanAndExecuteConfig): PlanAndExecuteAgent {
  return new PlanAndExecuteAgent(config)
}
