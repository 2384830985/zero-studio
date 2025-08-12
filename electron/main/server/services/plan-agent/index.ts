import {BrowserWindow, ipcMain} from 'electron'
import { Annotation } from '@langchain/langgraph'
import {HumanMessage, SystemMessage} from '@langchain/core/messages'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { z } from 'zod'
import { JsonOutputToolsParser } from '@langchain/core/output_parsers/openai_tools'
import { tool } from '@langchain/core/tools'
import { END, START, StateGraph } from '@langchain/langgraph'
import { RunnableConfig } from '@langchain/core/runnables'
import { DynamicStructuredTool } from '@langchain/core/tools'

import {Communication} from '../../../mcp'
import {getModel, IMetadata} from '../../llm'
import {ToolsHandler} from '../../routes/chat/ToolsHandler'
import {getExhibitionTEXT, getExhibitionTOOLS, IExhibitionCon} from '../../utils'
import {IpcChannel} from '../../../IpcChannel'

// 定义当前状态
const PlanExecuteState = Annotation.Root({
  input: Annotation<string>({
    reducer: (x, y) => y ?? x ?? '',
  }),
  plan: Annotation<string[]>({
    reducer: (x, y) => y ?? x ?? [],
  }),
  pastSteps: Annotation<[string, string][]>({
    reducer: (x, y) => x.concat(y),
  }),
  response: Annotation<string>({
    reducer: (x, y) => y ?? x,
  }),
})

export class PlanAgent extends ToolsHandler {
  private llm
  private communication: Communication
  public workFlow
  private replanner
  private agentExecutor
  private planObject
  public memory: IExhibitionCon[] = []
  private userInteractionTools: DynamicStructuredTool[] = []
  private pendingUserInputs = new Map<string, (response: string) => void>() // 管理待处理的用户输入请求

  constructor(win: BrowserWindow) {
    super()
    this.communication = new Communication(win)

    this.planObject = z.object({
      steps: z
        .array(z.string())
        .describe('different steps to follow, should be in sorted order'),
    })

    // 初始化用户交互工具
    this.initUserInteractionTools()

    // 初始化持久的用户输入监听器
    this.initUserInputListener()
  }

  /**
   * 初始化持久的用户输入监听器
   */
  private initUserInputListener() {
    // 只在构造函数中注册一次监听器
    ipcMain.handle(IpcChannel.USER_INPUT_RESPONSE, (event: any, data: any) => {
      try {
        console.log('收到用户输入响应:', data)
        const responseData = typeof data === 'string' ? JSON.parse(data) : data
        const { requestId, content } = responseData

        // 查找对应的请求处理器
        const resolver = this.pendingUserInputs.get(requestId)
        if (resolver) {
          // 移除已处理的请求
          this.pendingUserInputs.delete(requestId)
          // 解析 Promise
          resolver(content)
          return content // 返回给前端
        } else {
          console.warn(`未找到对应的用户输入请求: ${requestId}`)
          return '请求已过期或不存在'
        }
      } catch (error) {
        console.error('[用户输入处理错误]', error)
        return '处理用户输入时发生错误'
      }
    })
  }

  initPlanAgent (metadata: IMetadata) {
    this.initToolWrappers()
    this.initAgent(metadata)
    this.initRePlan()
    this.initWorkflow()
  }

  /**
   * 初始化用户交互工具
   */
  private initUserInteractionTools() {

    // 通用用户输入工具
    const userInputTool = new DynamicStructuredTool({
      name: 'get_user_input',
      description: '当你需要获取用户的任何输入信息时使用此工具，需要什么信息的时候使用此工具，一次只能使用一个当前的工具。',
      schema: z.object({
        prompt: z.string().describe('向用户请求信息的提示文本'),
      }),
      func: async ({ prompt }) => {
        // 添加提示到 memory 中
        this.memory.push(getExhibitionTEXT(`[请求用户输入]:  提示 - ${prompt}`))

        // 在实际应用中，这里应该通过 communication 向前端发送请求
        // 并等待用户响应，这里简化为直接返回一个模拟响应
        const response = await this.requestUserInput(prompt)
        return response
      },
    })

    // 将工具添加到工具列表中
    this.userInteractionTools = [
      userInputTool,
    ]
  }

  /**
   * 请求用户输入
   * @param prompt 提示文本
   * @returns 用户输入的响应
   */
  private async requestUserInput(prompt: string): Promise<string> {
    console.log(`[向用户请求输入] 提示: ${prompt}`)

    // 创建一个唯一的请求ID
    const requestId = `user_input_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // 创建一个Promise，在用户响应时解析
    const userResponsePromise = new Promise<string>((resolve) => {
      // 将解析器存储到 Map 中
      this.pendingUserInputs.set(requestId, resolve)

      // 设置超时（可选，防止无限等待）
      setTimeout(() => {
        // 检查请求是否还在等待中
        if (this.pendingUserInputs.has(requestId)) {
          this.pendingUserInputs.delete(requestId)
          const fallbackResponse = '用户未提供的信息（超时）'
          resolve(fallbackResponse)
        }
      }, 60000) // 60秒超时
    })

    // 向前端发送请求
    this.communication.sendUserInputRequest({
      requestId,
      prompt,
    })

    // 等待用户响应
    const response = await userResponsePromise

    // 添加用户响应到 memory 中
    this.memory.push(getExhibitionTEXT(`[用户响应]: ${response}`))

    return response
  }

  initAgent(metadata: IMetadata){
    this.llm = getModel(metadata as IMetadata)
    // 合并标准工具和用户交互工具
    const allTools = [...this.tools, ...this.userInteractionTools]
    this.agentExecutor = createReactAgent({
      llm: this.llm,
      tools: allTools,
    })
  }

  initRePlan () {
    if (!this.llm) {
      return
    }
    const responseObject = z.object({
      response: z.string().describe('Response to user.'),
    })

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const responseTool = tool(() => {}, {
      name: 'response',
      description: `
    Provide your final, complete response to the user. Use this tool when:
    - You have gathered all necessary information
    - Analysis or planning is complete
    - You're ready to deliver a comprehensive answer
  `,
      schema: responseObject,
    })

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const planTool = tool(() => {}, {
      name: 'plan',
      description: 'This tool is used to plan the steps to follow.',
      schema: this.planObject,
    })

    const plannerPrompt = ChatPromptTemplate.fromTemplate(
      `针对给定的目标，制定或更新一个分步计划。

      **重要原则**：
      - 优先保持原计划的连续性和稳定性
      - 仅在必要时进行最小化调整
      - 避免推翻已验证有效的步骤

      **目标**：
      {input}

      **当前计划状态**：
      原始计划：{plan}
      已完成步骤：{pastSteps}

      **更新规则**：
      1. **计划完成检查**：如果所有关键步骤已完成，直接使用 "response" 功能返回最终结果
      2. **步骤延续**：优先执行原计划中的下一个步骤，除非：
         - 发现明显的逻辑错误
         - 缺少关键信息导致无法继续
         - 目标需求发生重大变化
      3. **最小化修改**：如需调整，仅修改必要的部分，保持其他步骤不变
      4. **渐进式推进**：专注于下一个具体可执行的步骤，避免重新规划整个流程

      **输出要求**：
      - 如果计划可以继续：列出下一个待执行步骤
      - 如果需要微调：说明调整原因并提供修正后的步骤
      - 如果已完成：直接返回最终结果，不要重新规划
`,
    )

    const parser = new JsonOutputToolsParser()
    this.replanner = plannerPrompt
      .pipe(
        this.llm.bindTools([
          planTool,
          responseTool,
        ]),
      )
      .pipe(parser)
  }

  async executeStep(
    state: typeof PlanExecuteState.State,
    config?: RunnableConfig,
  ): Promise<Partial<typeof PlanExecuteState.State>> {
    const task = state.plan[0]
    const input = {
      messages: [new HumanMessage(task)],
    }
    // 添加当前步骤到 memory（在开始执行前）
    this.memory.push(getExhibitionTEXT(`[开始执行步骤]: ${task}`))
    console.log('[开始执行步骤]', task)
    const { messages } = await this.agentExecutor.invoke(input, config)

    console.log('[执行结果]', JSON.stringify(messages, null, 2))

    messages.forEach((message, index) => {
      // tool 结果不进行操作
      if (message?.tool_call_id) {
        return
      }
      const toolCalls: any[] = []
      const toolResults: any[] = []
      if (message?.additional_kwargs) {
        const tools = message?.additional_kwargs?.tool_calls?.[0] || {}
        console.log('tools.name', tools)
        if (tools?.function?.name) {
          toolCalls.push({
            id: `tool_${index}_${Date.now()}`,
            name: tools.function.name,
            arguments: tools.function.arguments,
            serverId: 'plan-agent',
            serverName: 'plan Agent',
          })
        }
        if (messages?.[index + 1]?.tool_call_id === tools?.id) {
          toolResults.push({
            toolCallId: `tool_${index}_${Date.now()}`,
            toolName: tools?.function?.name,
            success: true,
            result: messages?.[index + 1]?.content,
            executionTime: 0, // ReAct Agent 没有提供执行时间
          })
        }
      }
      this.memory.push(
        toolCalls.length ?
          getExhibitionTOOLS({
            toolCalls,
            toolResults,
            content: message?.content,
          })
          : getExhibitionTEXT(message?.content),
      )
    })

    console.log('this.memory', JSON.stringify(this.memory, null ,2))

    return {
      pastSteps: [[task, messages[messages.length - 1].content.toString()]],
      plan: state.plan.slice(1),
    }
  }

  async planStep(
    state: typeof PlanExecuteState.State,
  ): Promise<Partial<typeof PlanExecuteState.State>> {
    // 添加计划开始说明
    this.memory.push(getExhibitionTEXT(`[开始制定计划]: ${state.input}`))
    const response = await this.llm.invoke([
      new SystemMessage(`针对给定目标，制定一个简单的分步计划。
该计划应包含各个任务。请勿添加多余的步骤。
最后一步的结果必须是最终答案。
确保每个步骤都包含所有必需的信息。
分布计划需要结合以及的工具。
${this.toolsPrompt}

以 JSON 对象的形式返回响应，其结构如下：
{ "steps": ["step 1", "step 2", "step 3", ...] }
其中，每个步骤都是一个字符串，描述需要完成的操作。`),
      new HumanMessage(state.input),
    ])

    console.log('response.content', response.content)

    try {
      const content = response.content as string
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      let steps: string[] = []

      if (jsonMatch) {
        const planData = JSON.parse(jsonMatch[0])
        steps = planData.steps
      } else {
        steps = content.split('\n')
          .filter(line => line.trim())
          .map(line => line.replace(/^\d+\.\s*/, '').trim())
          .filter(step => step)
      }
      // 添加清晰计划说明
      const planText = `[生成的计划步骤]:\n${steps.map((s, i) => `${i+1}. ${s}`).join('\n')}`
      this.memory.push(getExhibitionTEXT(planText))

      return { plan: steps }
    } catch (error) {
      console.error('计划解析失败:', error)
      this.memory.push(getExhibitionTEXT(`计划生成失败: ${JSON.stringify(error)}`))
      return { plan: [response.content as string] }
    }
  }

  async rePlanStep(
    state: typeof PlanExecuteState.State,
  ): Promise<Partial<typeof PlanExecuteState.State>> {
    // 添加重新计划说明
    this.memory.push(getExhibitionTEXT('[开始重新评估计划]'))

    const output = await this.replanner.invoke({
      input: state.input,
      plan: state.plan.join('\n'),
      pastSteps: state.pastSteps.map(([step, result]) => `${step}: ${result}`).join('\n'),
    })

    const toolCall = output[0]
    console.log('[重新计划结果]', toolCall, 'output', output)

    if (toolCall.type === 'response') {
      const responseText = `[直接回复用户]: \n${toolCall.args?.response}`
      this.memory.push(getExhibitionTEXT(responseText))
      return { response: toolCall.args?.response }
    }

    if (toolCall.type === 'plan') {
      const newPlanText = `[更新的计划步骤]:\n${toolCall.args?.steps.join('\n')}`
      this.memory.push(getExhibitionTEXT(newPlanText))
      return { plan: toolCall.args?.steps }
    }

    return state
  }

  shouldEnd(state: typeof PlanExecuteState.State) {
    return state.response ? 'true' : 'false'
  }

  initWorkflow () {
    const workFlow = new StateGraph(PlanExecuteState)
      .addNode('planner', this.planStep.bind(this))
      .addNode('agent', this.executeStep.bind(this))
      .addNode('replan', this.rePlanStep.bind(this))
      .addEdge(START, 'planner')
      .addEdge('planner', 'agent')
      .addEdge('agent', 'replan')
      .addConditionalEdges('replan', this.shouldEnd.bind(this), {
        true: END,
        false: 'agent',
      })
    this.workFlow = workFlow.compile()
  }
}
