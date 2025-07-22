import { StateGraph, END, START } from '@langchain/langgraph'
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { StructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import {McpServer} from '../../../mcp/mcp-server'

// 定义状态接口
interface AgentState {
  messages: BaseMessage[]
  goal: string
  currentThought?: string
  toolCalls: Array<{
    toolName: string
    parameters: Record<string, any>
    result?: any
  }>
  iterations: number
  maxIterations: number
  finalAnswer?: string
  error?: string
  toolDecision?: {
    action: 'tool' | 'answer'
    answer?: string
    tool?: string
    parameters?: Record<string, any>
  }
}

// 定义步骤回调类型
export type StepCallback = (step: {
  type: 'reasoning' | 'tool-call' | 'observation' | 'final-answer'
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

/**
 * 基于 LangGraph 的 ReAct Agent 实现
 */
export class LangGraphReActAgent {
  private llm: ChatOpenAI
  private tools: Map<string, LangGraphTool>
  private config: LangGraphReActConfig
  private stepCallback?: StepCallback

  constructor(config: LangGraphReActConfig) {
    this.config = config
    this.llm = new ChatOpenAI({
      modelName: config.model,
      openAIApiKey: config.apiKey,
      configuration: {
        baseURL: config.baseURL,
      },
      temperature: config.temperature || 0.3,
      maxTokens: config.maxTokens || 1000,
    })

    // 初始化工具映射
    this.tools = new Map()
    config.tools.forEach(tool => {
      this.tools.set(tool.name, tool)
    })
  }

  /**
   * 执行 ReAct 流程
   */
  async execute(goal: string, stepCallback?: StepCallback): Promise<string> {
    this.stepCallback = stepCallback

    // 创建状态图
    const workflow = this.createWorkflow()

    // 初始状态
    const initialState: AgentState = {
      messages: [new HumanMessage(goal)],
      goal,
      toolCalls: [],
      iterations: 0,
      maxIterations: this.config.maxIterations || 10,
    }

    try {
      // 执行工作流
      const finalState = await workflow.invoke(initialState as any)

      if (finalState.error) {
        throw new Error(finalState.error)
      }

      return finalState.finalAnswer || '未能生成最终答案'
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      this.stepCallback?.({
        type: 'final-answer',
        content: `执行失败: ${errorMessage}`,
      })
      throw error
    }
  }

  /**
   * 创建 LangGraph 工作流
   */
  private createWorkflow() {
    const workflow = new StateGraph<AgentState>({
      channels: {
        messages: {
          reducer: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
          default: () => [],
        },
        goal: {
          default: () => '',
        },
        currentThought: {
          default: () => undefined,
        },
        toolCalls: {
          reducer: (x: any[], y: any[]) => x.concat(y),
          default: () => [],
        },
        iterations: {
          default: () => 0,
        },
        maxIterations: {
          default: () => 10,
        },
        finalAnswer: {
          default: () => undefined,
        },
        error: {
          default: () => undefined,
        },
        toolDecision: {
          default: () => undefined,
        },
      },
    })

    // 添加节点
    workflow.addNode('reasoning', this.reasoningNode.bind(this))
    workflow.addNode('tool_decision', this.toolDecisionNode.bind(this))
    workflow.addNode('tool_execution', this.toolExecutionNode.bind(this))
    workflow.addNode('final_answer', this.finalAnswerNode.bind(this))

    // 设置边
    workflow.addEdge(START, 'reasoning')
    workflow.addConditionalEdges(
      'reasoning',
      this.shouldContinue.bind(this),
      {
        continue: 'tool_decision',
        end: 'final_answer',
      },
    )
    workflow.addConditionalEdges(
      'tool_decision',
      this.shouldUseTool.bind(this),
      {
        tool: 'tool_execution',
        answer: 'final_answer',
      },
    )
    workflow.addEdge('tool_execution', 'reasoning')
    workflow.addEdge('final_answer', END)

    return workflow.compile()
  }

  /**
   * 推理节点
   */
  private async reasoningNode(state: AgentState): Promise<Partial<AgentState>> {
    try {
      // 构建推理提示
      const context = this.buildContext(state)
      const prompt = `你是一个 ReAct 代理。请根据以下信息进行推理：

目标: ${state.goal}

当前上下文:
${context}

 可用工具:
${Array.from(this.tools.values()).map(tool =>
    `- ${tool.name}: ${tool.description}`,
  ).join('\n')}

请思考下一步应该做什么。只返回你的思考过程，不要包含其他内容。`

      const response = await this.llm.invoke([new HumanMessage(prompt)])
      const thought = response.content.toString()

      // 触发回调
      this.stepCallback?.({
        type: 'reasoning',
        content: thought,
      })

      return {
        currentThought: thought,
        iterations: state.iterations + 1,
        messages: [...state.messages, response],
      }
    } catch (error) {
      return {
        error: `推理阶段失败: ${error instanceof Error ? error.message : '未知错误'}`,
      }
    }
  }

  /**
   * 工具决策节点
   */
  private async toolDecisionNode(state: AgentState): Promise<Partial<AgentState>> {
    try {
      const prompt = `基于你的思考: "${state.currentThought}"

你需要决定下一步行动。请选择以下选项之一：

1. 使用工具 - 如果需要获取更多信息或执行操作
2. 给出最终答案 - 如果已有足够信息回答问题
`

      // 绑定工具到 LLM
      const llmWithTools = this.llm.bindTools(McpServer.langchainTools)
      const response = await llmWithTools.invoke([new HumanMessage(prompt)])

      return {
        messages: [...state.messages, response],
        toolDecision: {
          action: response.tool_calls?.length ? 'tool' : 'answer',
          answer: response.tool_calls?.length ? '' : response.content,
          tool: response.tool_calls?.[0]?.name,
          parameters: response.tool_calls?.[0]?.args,
        },
      }
    } catch (error) {
      return {
        error: `工具决策失败: ${error instanceof Error ? error.message : '未知错误'}`,
      }
    }
  }

  /**
   * 工具执行节点
   */
  private async toolExecutionNode(state: AgentState): Promise<Partial<AgentState>> {
    try {
      const decision = (state as any).toolDecision
      const tool = this.tools.get(decision.tool)

      if (!tool) {
        return {
          error: `未找到工具: ${decision.tool}`,
        }
      }

      console.log('decision', decision)

      // 触发工具调用回调
      this.stepCallback?.({
        type: 'tool-call',
        content: `调用工具: ${decision.tool}`,
        data: { toolName: decision.tool, parameters: decision.parameters },
      })

      // 执行工具
      const result = await tool.invoke(decision.parameters)

      // 触发观察回调
      this.stepCallback?.({
        type: 'observation',
        content: typeof result === 'string' ? result : JSON.stringify(result),
        data: result,
      })

      const toolCall = {
        toolName: decision.tool,
        parameters: decision.parameters,
        result,
      }

      return {
        toolCalls: [toolCall],
        messages: [...state.messages, new AIMessage(`工具执行结果: ${JSON.stringify(result)}`)],
      }
    } catch (error) {
      return {
        error: `工具执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
      }
    }
  }

  /**
   * 最终答案节点
   */
  private async finalAnswerNode(state: AgentState): Promise<Partial<AgentState>> {
    let finalAnswer: string

    if (state.error) {
      finalAnswer = `执行过程中出现错误: ${state.error}`
    } else if ((state as any).toolDecision?.action === 'answer') {
      finalAnswer = (state as any).toolDecision.answer
    } else {
      // 基于所有信息生成最终答案
      const context = this.buildContext(state)
      const prompt = `基于以下所有信息，请给出最终答案：

目标: ${state.goal}

执行过程:
${context}

请提供一个清晰、完整的最终答案。`

      const response = await this.llm.invoke([new HumanMessage(prompt)])
      finalAnswer = response.content.toString()
    }

    // 触发最终答案回调
    this.stepCallback?.({
      type: 'final-answer',
      content: finalAnswer,
    })

    return {
      finalAnswer,
      messages: [...state.messages, new AIMessage(finalAnswer)],
    }
  }

  /**
   * 判断是否继续推理
   */
  private shouldContinue(state: AgentState): string {
    if (state.error) {
      return 'end'
    }
    if (state.iterations >= state.maxIterations) {
      return 'end'
    }
    return 'continue'
  }

  /**
   * 判断是否使用工具
   */
  private shouldUseTool(state: AgentState): string {
    const decision = (state as any).toolDecision
    if (!decision) {
      return 'answer'
    }
    return decision.action === 'tool' ? 'tool' : 'answer'
  }

  /**
   * 构建上下文信息
   */
  private buildContext(state: AgentState): string {
    let context = ''

    // 添加历史思考
    if (state.currentThought) {
      context += `当前思考: ${state.currentThought}\n`
    }

    // 添加工具调用历史
    if (state.toolCalls.length > 0) {
      context += '\n工具调用历史:\n'
      state.toolCalls.forEach((call, index) => {
        context += `${index + 1}. ${call.toolName}(${JSON.stringify(call.parameters)}) -> ${JSON.stringify(call.result)}\n`
      })
    }

    context += `\n当前迭代: ${state.iterations}/${state.maxIterations}`

    return context
  }
}
