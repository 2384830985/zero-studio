export interface DifyConfig {
  endpoint: string
  apiKey: string
  appId?: string
}

export interface DifyApp {
  id: string
  name: string
  description: string
  type: string
  status: string
  updated_at: string
}

export interface ChatMessage {
  inputs?: Record<string, any>
  query: string
  response_mode: 'blocking' | 'streaming'
  conversation_id?: string
  user: string
}

export interface ChatResponse {
  answer: string
  conversation_id: string
  message_id: string
  created_at: number
}

export class DifyClient {
  private config: DifyConfig

  constructor(config: DifyConfig) {
    this.config = config
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<DifyConfig>) {
    this.config = { ...this.config, ...config }
  }

  /**
   * 发送聊天消息
   */
  async sendChatMessage(message: ChatMessage): Promise<ChatResponse> {
    const response = await fetch(`${this.config.endpoint}/chat-messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * 获取对话历史
   */
  async getConversationMessages(conversationId: string, limit = 20): Promise<any> {
    const response = await fetch(
      `${this.config.endpoint}/messages?conversation_id=${conversationId}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      },
    )

    if (!response.ok) {
      throw new Error(`获取对话历史失败: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * 获取应用信息
   */
  async getAppInfo(): Promise<any> {
    const response = await fetch(`${this.config.endpoint}/parameters`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`获取应用信息失败: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * 检查连接状态
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.getAppInfo()
      return true
    } catch {
      return false
    }
  }

  /**
   * 流式聊天（WebSocket 或 SSE）
   */
  async sendStreamingMessage(
    message: ChatMessage,
    onMessage: (data: any) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void,
  ): Promise<void> {
    try {
      const response = await fetch(`${this.config.endpoint}/chat-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          ...message,
          response_mode: 'streaming',
        }),
      })

      if (!response.ok) {
        throw new Error(`流式请求失败: ${response.status} ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法获取响应流')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              onMessage(data)
            } catch (e) {
              console.warn('解析流数据失败:', e)
            }
          }
        }
      }

      onComplete?.()
    } catch (error) {
      onError?.(error as Error)
    }
  }



  /**
   * 执行步骤并支持子任务处理
   */
  private async executeStepWithSubTasks(
    step: PlanStep,
    originalQuestion: string,
    previousResults: string[],
    onStepStart?: (step: PlanStep, plan: ExecutionPlan) => void,
    onStepComplete?: (step: PlanStep, plan: ExecutionPlan) => void,
    plan?: ExecutionPlan,
  ): Promise<string> {
    const maxRetries = 3
    const subTaskResults: string[] = []

    // 构建步骤执行的上下文
    const context = previousResults.length > 0
      ? `\n\n之前步骤的结果：\n${previousResults.map((result, idx) => `步骤${idx + 1}结果：${result}`).join('\n')}`
      : ''

    let currentAttempt = 0
    let lastError: string | null = null

    while (currentAttempt < maxRetries) {
      try {
        // 构建当前尝试的提示词
        const attemptContext = currentAttempt > 0
          ? `\n\n之前的尝试遇到了问题：${lastError}\n${subTaskResults.length > 0 ? `子任务结果：\n${subTaskResults.join('\n')}` : ''}`
          : ''

        const stepPrompt = `
原始问题：${originalQuestion}

当前要执行的步骤：${step.description}
${context}${attemptContext}

请执行这个步骤并提供详细的结果。如果遇到问题，请说明具体问题。只返回执行结果，不要重复问题或步骤描述。
`

        const stepResponse = await this.sendChatMessage({
          query: stepPrompt,
          response_mode: 'blocking',
          user: 'plan_executor',
        })

        // 检查响应是否表明遇到了问题
        const hasIssue = this.detectIssueInResponse(stepResponse.answer)

        if (!hasIssue || currentAttempt === maxRetries - 1) {
          // 如果没有问题或已达到最大重试次数，返回结果
          return stepResponse.answer
        }

        // 如果检测到问题，创建子任务来解决
        lastError = stepResponse.answer
        const subTaskResult = await this.createAndExecuteSubTask(
          step,
          stepResponse.answer,
          originalQuestion,
          context,
          onStepStart,
          onStepComplete,
          plan,
        )

        subTaskResults.push(subTaskResult)
        currentAttempt++

      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error)
        currentAttempt++

        if (currentAttempt >= maxRetries) {
          throw error
        }
      }
    }

    // 如果所有尝试都失败了，返回最后的错误信息
    throw new Error(`步骤执行失败，已尝试${maxRetries}次：${lastError}`)
  }

  /**
   * 检测响应中是否包含问题或错误
   */
  private detectIssueInResponse(response: string): boolean {
    const issueKeywords = [
      '错误', '失败', '无法', '不能', '问题', '异常',
      'error', 'fail', 'cannot', 'unable', 'issue', 'problem',
      '需要更多信息', '不确定', '不清楚', '缺少',
    ]

    const lowerResponse = response.toLowerCase()
    return issueKeywords.some(keyword =>
      lowerResponse.includes(keyword.toLowerCase()),
    )
  }

  /**
   * 创建并执行子任务来解决问题
   */
  private async createAndExecuteSubTask(
    parentStep: PlanStep,
    issueDescription: string,
    originalQuestion: string,
    context: string,
    onStepStart?: (step: PlanStep, plan: ExecutionPlan) => void,
    onStepComplete?: (step: PlanStep, plan: ExecutionPlan) => void,
    plan?: ExecutionPlan,
  ): Promise<string> {
    // 创建子任务步骤
    const subTaskId = `${parentStep.id}_subtask_${Date.now()}`
    const subTask: PlanStep = {
      id: subTaskId,
      description: `解决问题：${issueDescription.substring(0, 100)}...`,
      status: 'executing',
      startTime: Date.now(),
    }

    // 通知子任务开始
    onStepStart?.(subTask, plan!)

    try {
      const subTaskPrompt = `
原始问题：${originalQuestion}
主要步骤：${parentStep.description}
${context}

遇到的具体问题：
${issueDescription}

请分析这个问题并提供解决方案。如果需要额外信息，请说明需要什么信息。如果可以直接解决，请提供解决步骤和结果。
`

      const subTaskResponse = await this.sendChatMessage({
        query: subTaskPrompt,
        response_mode: 'blocking',
        user: 'subtask_executor',
      })

      subTask.result = subTaskResponse.answer
      subTask.status = 'completed'
      subTask.endTime = Date.now()

      // 通知子任务完成
      onStepComplete?.(subTask, plan!)

      return subTaskResponse.answer

    } catch (error) {
      subTask.error = error instanceof Error ? error.message : String(error)
      subTask.status = 'failed'
      subTask.endTime = Date.now()

      // 通知子任务完成（失败）
      onStepComplete?.(subTask, plan!)

      throw error
    }
  }

  /**
   * Plan-and-Execute 问答
   */
  async planAndExecute(
    question: string,
    options: PlanAndExecuteOptions = {},
  ): Promise<ExecutionPlan> {
    const {
      maxSteps = 5,
      onPlanGenerated,
      onStepStart,
      onStepComplete,
      onComplete,
      onError,
    } = options

    const planId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const plan: ExecutionPlan = {
      id: planId,
      question,
      steps: [],
      status: 'planning',
      createdAt: Date.now(),
    }

    try {
      // 第一步：生成执行计划
      const planningPrompt = `
请为以下问题制定一个详细的执行计划，将复杂问题分解为多个可执行的步骤：

问题：${question}

请按以下格式返回计划（JSON格式）：
{
  "steps": [
    {
      "id": "step_1",
      "description": "步骤1的详细描述"
    },
    {
      "id": "step_2",
      "description": "步骤2的详细描述"
    }
  ]
}

要求：
1. 每个步骤应该是具体可执行的
2. 步骤之间应该有逻辑关系
3. 最多${maxSteps}个步骤
4. 只返回JSON，不要其他内容
`

      const planResponse = await this.sendChatMessage({
        query: planningPrompt,
        response_mode: 'blocking',
        user: 'plan_executor',
      })

      // 解析计划
      let planData
      try {
        const jsonMatch = planResponse.answer.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          planData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('无法解析计划JSON')
        }
      } catch (parseError) {
        throw new Error(`计划解析失败: ${parseError}`)
      }

      // 初始化步骤
      plan.steps = planData.steps.map((step: any) => ({
        id: step.id,
        description: step.description,
        status: 'pending' as const,
      }))

      plan.status = 'executing'
      onPlanGenerated?.(plan)

      // 执行每个步骤
      const stepResults: string[] = []

      for (let i = 0; i < plan.steps.length; i++) {
        const step = plan.steps[i]
        step.status = 'executing'
        step.startTime = Date.now()

        onStepStart?.(step, plan)

        try {
          // 执行当前步骤，支持子任务处理
          const stepResult = await this.executeStepWithSubTasks(
            step,
            question,
            stepResults,
            onStepStart,
            onStepComplete,
            plan,
          )

          step.result = stepResult
          step.status = 'completed'
          step.endTime = Date.now()

          stepResults.push(stepResult)
          onStepComplete?.(step, plan)

        } catch (stepError) {
          step.error = stepError instanceof Error ? stepError.message : String(stepError)
          step.status = 'failed'
          step.endTime = Date.now()

          onStepComplete?.(step, plan)
          throw new Error(`步骤 "${step.description}" 执行失败: ${step.error}`)
        }
      }

      // 生成最终答案
      const finalPrompt = `
原始问题：${question}

执行步骤及结果：
${plan.steps.map((step, idx) => `
步骤${idx + 1}：${step.description}
结果：${step.result}
`).join('\n')}

请基于以上步骤的执行结果，为原始问题提供一个完整、准确的最终答案。
`

      const finalResponse = await this.sendChatMessage({
        query: finalPrompt,
        response_mode: 'blocking',
        user: 'plan_executor',
      })

      plan.finalAnswer = finalResponse.answer
      plan.status = 'completed'
      plan.completedAt = Date.now()

      onComplete?.(plan)
      return plan

    } catch (error) {
      plan.status = 'failed'
      plan.completedAt = Date.now()

      const errorObj = error instanceof Error ? error : new Error(String(error))
      onError?.(errorObj, plan)
      throw errorObj
    }
  }

  /**
   * 流式 Plan-and-Execute
   */
  async planAndExecuteStreaming(
    question: string,
    options: PlanAndExecuteOptions = {},
  ): Promise<void> {
    const {
      maxSteps = 5,
      onPlanGenerated,
      onStepStart,
      onStepComplete,
      onComplete,
      onError,
    } = options

    const planId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const plan: ExecutionPlan = {
      id: planId,
      question,
      steps: [],
      status: 'planning',
      createdAt: Date.now(),
    }

    try {
      // 生成计划（使用阻塞模式确保完整性）
      const planningPrompt = `
请为以下问题制定一个详细的执行计划：

问题：${question}

请按JSON格式返回计划，最多${maxSteps}个步骤。
`

      const planResponse = await this.sendChatMessage({
        query: planningPrompt,
        response_mode: 'blocking',
        user: 'plan_executor',
      })

      // 解析并初始化计划
      const jsonMatch = planResponse.answer.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const planData = JSON.parse(jsonMatch[0])
        plan.steps = planData.steps.map((step: any) => ({
          id: step.id,
          description: step.description,
          status: 'pending' as const,
        }))
      }

      plan.status = 'executing'
      onPlanGenerated?.(plan)

      // 流式执行步骤
      for (const step of plan.steps) {
        step.status = 'executing'
        step.startTime = Date.now()
        onStepStart?.(step, plan)

        let stepResult = ''

        await this.sendStreamingMessage(
          {
            query: `执行步骤：${step.description}`,
            response_mode: 'streaming',
            user: 'plan_executor',
          },
          (data) => {
            if (data.answer) {
              stepResult += data.answer
            }
          },
          (error) => {
            step.error = error.message
            step.status = 'failed'
            step.endTime = Date.now()
            onStepComplete?.(step, plan)
          },
          () => {
            step.result = stepResult
            step.status = 'completed'
            step.endTime = Date.now()
            onStepComplete?.(step, plan)
          },
        )
      }

      plan.status = 'completed'
      plan.completedAt = Date.now()
      onComplete?.(plan)

    } catch (error) {
      plan.status = 'failed'
      plan.completedAt = Date.now()
      const errorObj = error instanceof Error ? error : new Error(String(error))
      onError?.(errorObj, plan)
    }
  }
}

/**
 * 创建 Dify 客户端实例
 */
export function createDifyClient(config: DifyConfig): DifyClient {
  return new DifyClient(config)
}

/**
 * 从本地存储加载配置
 */
export function loadDifyConfig(): DifyConfig | null {
  try {
    const saved = localStorage.getItem('dify-config')
    if (saved) {
      const config = JSON.parse(saved)
      return {
        endpoint: config.apiEndpoint || '',
        apiKey: config.apiKey || '',
        appId: config.appId || '',
      }
    }
  } catch (error) {
    console.error('加载 Dify 配置失败:', error)
  }
  return null
}

/**
 * 保存配置到本地存储
 */
export function saveDifyConfig(config: DifyConfig): void {
  try {
    const configToSave = {
      url: config.endpoint.replace('/v1', ''),
      apiEndpoint: config.endpoint,
      apiKey: config.apiKey,
      appId: config.appId || '',
    }
    localStorage.setItem('dify-config', JSON.stringify(configToSave))
  } catch (error) {
    console.error('保存 Dify 配置失败:', error)
  }
}

// Plan-and-Execute 相关接口
export interface PlanStep {
  id: string
  description: string
  status: 'pending' | 'executing' | 'completed' | 'failed'
  result?: string
  error?: string
  startTime?: number
  endTime?: number
}

export interface ExecutionPlan {
  id: string
  question: string
  steps: PlanStep[]
  status: 'planning' | 'executing' | 'completed' | 'failed'
  finalAnswer?: string
  createdAt: number
  completedAt?: number
}

export interface PlanAndExecuteOptions {
  maxSteps?: number
  timeout?: number
  onPlanGenerated?: (plan: ExecutionPlan) => void
  onStepStart?: (step: PlanStep, plan: ExecutionPlan) => void
  onStepComplete?: (step: PlanStep, plan: ExecutionPlan) => void
  onComplete?: (plan: ExecutionPlan) => void
  onError?: (error: Error, plan?: ExecutionPlan) => void
}
