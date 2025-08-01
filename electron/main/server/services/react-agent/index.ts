import { ChatOpenAI } from '@langchain/openai'
import { StructuredTool, tool } from '@langchain/core/tools'
import { z } from 'zod'
import { AgentExecutor, createReactAgent } from 'langchain/agents'
import { PromptTemplate } from '@langchain/core/prompts'
import { BaseCallbackHandler } from '@langchain/core/callbacks/base'

import { McpServer } from '../../../mcp/mcp-server'
import { getExhibitionTEXT, getExhibitionTOOLS, IExhibitionCon } from '../../utils'
import {ResponseBuilder} from '../response/ResponseBuilder'
import {BaseMessage} from '@langchain/core/dist/messages/base'
import {DynamicStructuredTool} from '@langchain/core/dist/tools'


// 定义步骤回调类型
export type StepCallback = (step: {
  type: 'reasoning' | 'tool-call' | 'observation' | 'final-answer' | 'error'
  content: string
  data?: any
}) => void

// 工具接口
export interface LangGraphTool extends StructuredTool {
  name: string
  description: string
  schema: z.ZodSchema
}

// LangGraph ReAct Agent 配置
export interface LangGraphReActConfig {
  model: string
  apiKey: string
  baseURL: string
  temperature?: number
  maxTokens?: number
  maxIterations?: number
  tools: LangGraphTool[]
}

// 优化的执行追踪器
class ExecutionTracer extends BaseCallbackHandler {
  name = 'ExecutionTracer'
  private stepCallback?: StepCallback

  constructor(stepCallback?: StepCallback) {
    super()
    this.stepCallback = stepCallback
  }

  async handleAgentAction(action: any) {
    const message = `调用工具: ${action.tool}`
    console.log(`[决策] ${message}`, `输入: ${JSON.stringify(action.toolInput)}`)

    this.stepCallback?.({
      type: 'tool-call',
      content: message,
      data: { tool: action.tool, input: action.toolInput },
    })
  }

  async handleToolEnd(output: string) {
    console.log(`[结果] 工具返回: ${output}`)

    this.stepCallback?.({
      type: 'observation',
      content: this.truncateOutput(output),
      data: { fullOutput: output },
    })
  }

  async handleAgentEnd(output: any) {
    console.log(`[完成] 最终答案: ${output.output}`)
  }

  async handleLLMStart() {
    console.log('[推理] 开始思考...')

    this.stepCallback?.({
      type: 'reasoning',
      content: '正在分析问题并制定行动计划...',
    })
  }

  private truncateOutput(output: string, maxLength = 200): string {
    if (output.length <= maxLength) {
      return output
    }
    return output.substring(0, maxLength) + '...'
  }
}

// 简化的自定义回调处理器
class CustomCallbackHandler extends BaseCallbackHandler {
  name = 'CustomCallbackHandler'

  async handleChainError(error: Error) {
    console.error(`[链错误] ${error.message}`)
  }

  async handleToolError(error: Error) {
    console.error(`[工具错误] ${error.message}`)
  }
}

/**
 * 基于 LangChain 的 ReAct Agent 实现
 * 优化版本，提供更好的错误处理和性能
 */
export class LangGraphReActAgent {
  private llm: ChatOpenAI
  private tools: Map<string, LangGraphTool>
  private config: LangGraphReActConfig
  private stepCallback?: StepCallback
  private isInitialized = false
  private responseBuilder = new ResponseBuilder()

  constructor(config: LangGraphReActConfig) {
    this.tools = new Map()
    this.config = config
    this.llm = new ChatOpenAI({
      modelName: this.config.model,
      openAIApiKey: this.config.apiKey,
      configuration: {
        baseURL: this.config.baseURL,
      },
      temperature: this.config.temperature ?? 0.0, // 设置为0以获得最大一致性
      maxTokens: this.config.maxTokens ?? 3000, // 减少 token 数，加快响应
      timeout: 45000, // 增加到45秒超时
      streaming: false, // 禁用流式输出，避免流式处理中断
    })
    this.validateConfig(config)
    this.initializeTools()
  }

  /**
   * 验证配置参数
   */
  private validateConfig(config: LangGraphReActConfig): void {
    if (!config.model) {
      throw new Error('Model is required')
    }
    if (!config.apiKey) {
      throw new Error('API key is required')
    }
    if (!config.baseURL) {
      throw new Error('Base URL is required')
    }
    if (!config.tools || config.tools.length === 0) {
      console.warn('[ReAct Agent] No tools provided, agent will have limited functionality')
    }
  }

  /**
   * 初始化工具映射
   */
  private initializeTools(): void {
    this.config.tools.forEach(tool => {
      this.tools.set(tool.name, tool)
    })
  }

  /**
   * 执行 ReAct 流程
   */
  async execute(input: string, message: BaseMessage[], stepCallback?: StepCallback): Promise<any> {
    if (!input?.trim()) {
      throw new Error('Input cannot be empty')
    }

    this.stepCallback = stepCallback

    try {
      // 确保 agent 已初始化
      if (!this.isInitialized) {
        await this.initializeAgent()
      }

      const {
        executor,
        callbacks,
      } = await this.createReActAgent(message)

      // 执行推理，添加超时保护
      const result = await Promise.race([
        executor.invoke(
          { input: input.trim() },
          {
            callbacks,
          },
        ),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Agent execution timeout')), 50000), // 50秒超时
        ),
      ])

      // 处理结果
      const finalResult = this.processResult(result)

      this.stepCallback?.({
        type: 'final-answer',
        content: finalResult.output || '执行完成',
        data: finalResult,
      })
      return this.responseBuilder.buildToolCallResponse(
        finalResult.output,
        '',
        [],
        [],
        finalResult.cardList,
      )
    } catch (error) {
      return this.handleExecutionError(error)
    }
  }

  /**
   * 初始化 Agent（延迟初始化）
   */
  private async initializeAgent(): Promise<void> {
    try {
      // 验证工具可用性
      await this.validateTools()
      this.isInitialized = true
    } catch (error) {
      console.error('[ReAct Agent] Agent initialization failed:', error)
      throw error
    }
  }

  /**
   * 验证工具可用性
   */
  private async validateTools(): Promise<void> {
    if (!McpServer.langchainTools || McpServer.langchainTools.length === 0) {
      console.warn('[ReAct Agent] No MCP tools available')
      return
    }

    console.log(
      `[ReAct Agent] ${McpServer.langchainTools.length} tools available:`,
      McpServer.langchainTools.map(t => t.name).join(', '),
    )
  }

  /**
   * 处理执行结果
   */
  private processResult(result: any): any {
    const output = result.output || '未能生成回答'
    const intermediateSteps = result.intermediateSteps || []

    // 构建 cardList
    const cardList: IExhibitionCon[] = []

    console.log('intermediateSteps', intermediateSteps)

    // 添加工具调用信息到 cardList
    if (intermediateSteps.length > 0) {
      intermediateSteps.forEach((step: any, index: number) => {
        const toolCalls: any[] = []
        const toolResults: any[] = []
        if (step.action && step.action.tool !== '_Exception') {
          // 工具调用信息
          toolCalls.push({
            id: `tool_${index}_${Date.now()}`,
            name: step.action.tool,
            arguments: step.action.toolInput,
            serverId: 'react-agent',
            serverName: 'ReAct Agent',
          })

          // 工具执行结果
          if (step.observation) {
            toolResults.push({
              toolCallId: `tool_${index}_${Date.now()}`,
              toolName: step.action.tool,
              success: true,
              result: step.observation,
              executionTime: 0, // ReAct Agent 没有提供执行时间
            })
          }
          cardList.push(getExhibitionTOOLS({
            toolCalls,
            toolResults,
            content: step.action.log,
          }))
        }
      })
    }

    // 添加文本内容卡片
    cardList.push(getExhibitionTEXT(output))

    return {
      output,
      content: output,
      intermediateSteps,
      success: true,
      cardList, // 添加 cardList 用于前端展示
    }
  }

  /**
   * 创建 ReAct Agent
   */
  private async createReActAgent(message: BaseMessage[]) {
    // 创建工具包装器
    const { tools, toolsPrompt } = this.createToolWrappers()

    // 创建优化的 prompt 模板
    const prompt: PromptTemplate = this.createPromptTemplate(message, toolsPrompt)

    // 创建 agent
    const agent = await createReactAgent({
      llm: this.llm,
      tools,
      prompt,
    })

    // 创建回调处理器
    const callbacks = [
      new ExecutionTracer(this.stepCallback),
      new CustomCallbackHandler(),
    ]

    // 创建执行器
    const executor = AgentExecutor.fromAgentAndTools({
      agent,
      tools,
      returnIntermediateSteps: true,
      maxIterations: this.config.maxIterations ?? 5, // 减少迭代次数，避免过多重试
      handleParsingErrors: this.createParsingErrorHandler(),
      verbose: process.env.NODE_ENV === 'development', // 只在开发环境启用详细日志
    })

    return { executor, callbacks }
  }

  /**
   * 创建工具包装器
   */
  private createToolWrappers(): { tools: DynamicStructuredTool<any>[]; toolsPrompt: string } {
    let toolsPrompt = ''

    const tools = McpServer.langchainTools.map(toolItem => {
    // # Tool_Name: Addition
    // # Tool_Description: useful when to add two numbers
    // # Tool_Input: {{"a": integer, "b": integer}}
      let input = JSON.stringify(toolItem?.schema?.properties || '}')

      input = input.replace(/\{/g, '{{')
      input = input.replace(/}/g, '}}')

      toolsPrompt += `
        # Tool_Name: ${toolItem.name}
        # Tool_Description: ${toolItem.description}
        # Tool_Input: ${input || '无输入参数'}
      `
      return tool(
        async (input: string | object) => {
          return this.executeToolSafely(toolItem.name, input)
        },
        {
          name: toolItem.name,
          description: toolItem.description,
        },
      )
    })

    return {
      tools,
      toolsPrompt,
    }
  }

  /**
   * 安全执行工具
   */
  private async executeToolSafely(toolName: string, input: string | object): Promise<any> {
    try {
      console.log(`[工具执行] ${toolName}:`, input)

      // 解析输入参数
      const args = this.parseToolInput(input)

      // 获取工具实例
      const toolInstance = this.tools.get(toolName)
      if (!toolInstance) {
        return `错误: 未找到工具 "${toolName}"`
      }

      // 执行工具
      const result = await Promise.race([
        toolInstance.invoke(args),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Tool execution timeout')), 15000),
        ),
      ])

      console.log(`[工具结果] ${toolName}:`, result)
      return result

    } catch (error) {
      const errorMsg = `工具 "${toolName}" 执行失败: ${error instanceof Error ? error.message : '未知错误'}`
      console.error(`[工具错误] ${errorMsg}`)
      return errorMsg
    }
  }

  /**
   * 解析工具输入
   */
  private parseToolInput(input: string | object): any {
    if (typeof input === 'object') {
      return input
    }

    try {
      return JSON.parse(input)
    } catch {
      // 如果不是 JSON，尝试作为简单字符串处理
      return { input }
    }
  }

  /**
   * 格式化历史消息
   */
  private formatHistoryMessages(messages: BaseMessage[]): string {
    if (!messages || messages.length === 0) {
      return ''
    }

    const formattedMessages = messages.map(msg => {
      const role = msg._getType() === 'human' ? 'User' : 'Assistant'
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
      return `${role}: ${content}`
    }).join('\n')

    return formattedMessages.trim() ? `\n历史对话记录：\n${formattedMessages}\n` : ''
  }

  /**
   * 创建优化的 Prompt 模板
   */
  private createPromptTemplate(message: BaseMessage[], tools: string): PromptTemplate {
    const historyContext = this.formatHistoryMessages(message)
    console.log('historyContext', historyContext)
    // console.log('historyContext', historyContext)
    // console.log('historyContext======')
    return new PromptTemplate({
      inputVariables: ['tools', 'tool_names', 'agent_scratchpad', 'input'],
      template: `你是一个智能助手，能够使用工具来帮助回答问题。请严格按照 ReAct 格式进行推理。

可用工具：
${tools}

工具名称：{tool_names}

格式要求：
每次回复必须严格遵循以下两种格式之一：

格式A（使用工具）：
Thought: [你的思考过程]
Action: [工具名称，必须是 {tool_names} 中的一个]
Action Input: [JSON格式的工具输入参数]

格式B（给出最终答案）：
Thought: [你的思考过程]
Final Answer: [对用户问题的完整回答]

【严格禁止】：
- 绝对不要在同一回复中同时包含 "Action:" 和 "Final Answer:"
- 不要预测或编造 "Observation:" 的内容
- 不要在 Action 后继续输出其他内容
- 不要在 Final Answer 后继续输出其他内容

【决策规则】：
- 如果需要获取更多信息或执行操作，使用格式A
- 如果已有足够信息回答问题，使用格式B
- 每次只能选择一种格式
- 在回答时请参考历史对话记录中的上下文信息

Question: {input}
{agent_scratchpad}`,
    })
  }

  /**
   * 创建解析错误处理器
   */
  private createParsingErrorHandler() {
    return (error: Error) => {
      console.error('[ReAct Agent] 解析错误:', error.message)

      this.stepCallback?.({
        type: 'error',
        content: '输出格式解析失败，正在重试...',
        data: { error: error.message },
      })

      // 根据错误类型提供更具体的指导
      if (error.message.includes('both a final answer and a parse-able action')) {
        return `严重格式错误：你在同一个回复中同时包含了 Action 和 Final Answer！

请严格遵循以下规则：
1. 如果需要使用工具，只输出：Thought + Action + Action Input
2. 如果要给出答案，只输出：Thought + Final Answer
3. 绝对不要在同一回复中混合使用这两种格式

请重新组织你的回答，只选择其中一种格式。`
      }

      return `输出格式有误，请严格按照 ReAct 格式重新组织回答。

错误详情: ${error.message}

请确保：
- 每次回复只包含一种格式（要么是工具调用，要么是最终答案）
- 不要预测 Observation 的内容
- 严格按照 Thought -> Action -> Action Input 或 Thought -> Final Answer 的格式`
    }
  }

  /**
   * 获取 Agent 状态
   */
  getStatus(): { initialized: boolean; toolCount: number; model: string } {
    return {
      initialized: this.isInitialized,
      toolCount: this.tools.size,
      model: this.config.model,
    }
  }

  /**
   * 重置 Agent 状态
   */
  reset(): void {
    this.isInitialized = false
    this.stepCallback = undefined
  }

  /**
   * 处理执行错误
   */
  private handleExecutionError(error: any): any {
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    console.error('[ReAct Agent] Execution failed:', errorMessage)

    // 根据错误类型提供不同的处理
    let userMessage = ''
    if (errorMessage.includes('AbortError') || errorMessage.includes('timeout')) {
      userMessage = '请求超时，请稍后重试或简化您的问题'
    } else if (errorMessage.includes('Agent execution timeout')) {
      userMessage = '执行超时，请尝试将问题分解为更简单的步骤'
    } else {
      userMessage = `执行过程中遇到了问题: ${errorMessage}`
    }

    this.stepCallback?.({
      type: 'error',
      content: userMessage,
      data: { error: errorMessage },
    })

    return {
      output: `抱歉，${userMessage}`,
      content: `抱歉，${userMessage}`,
      intermediateSteps: [],
      success: false,
      error: errorMessage,
    }
  }
}
