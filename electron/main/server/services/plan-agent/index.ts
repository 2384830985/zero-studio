import {BrowserWindow} from 'electron'
import { Annotation } from '@langchain/langgraph'
import {HumanMessage, SystemMessage} from '@langchain/core/messages'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { z } from 'zod'
import { JsonOutputToolsParser } from '@langchain/core/output_parsers/openai_tools'
import { tool } from '@langchain/core/tools'
import { END, START, StateGraph } from '@langchain/langgraph'
import { RunnableConfig } from '@langchain/core/runnables'

import {Communication} from '../../../mcp'
import {getModel, IMetadata} from '../../llm'
import {ToolsHandler} from '../../routes/chat/ToolsHandler'
import {getExhibitionTEXT, getExhibitionTOOLS, IExhibitionCon} from '../../utils'

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
  private win: BrowserWindow
  private agentExecutor
  private planObject
  public memory: IExhibitionCon[] = []
  constructor(win: BrowserWindow) {
    super()
    this.win = win
    this.communication = new Communication(win)

    this.planObject = z.object({
      steps: z
        .array(z.string())
        .describe('different steps to follow, should be in sorted order'),
    })
  }

  initPlanAgent (metadata: IMetadata) {
    this.initToolWrappers()
    this.initAgent(metadata)
    this.initRePlan()
    this.initWorkflow()
  }

  initAgent(metadata: IMetadata){
    this.llm = getModel(metadata as IMetadata)
    this.agentExecutor = createReactAgent({
      llm: this.llm,
      tools: this.tools,
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
      description: 'Respond to the user.',
      schema: responseObject,
    })

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const planTool = tool(() => {}, {
      name: 'plan',
      description: 'This tool is used to plan the steps to follow.',
      schema: this.planObject,
    })

    const plannerPrompt = ChatPromptTemplate.fromTemplate(
      `针对给定的目标，制定一个简单的分步计划。
该计划应包含各个任务，如果正确执行，将产生正确的答案。不要添加任何多余的步骤。
最后一步的结果应为最终答案。确保每个步骤都包含所有必要的信息 - 不要跳过任何步骤。

您的目标如下：
{input}

您的原始计划如下：
{plan}

您目前已完成以下步骤：
{pastSteps}

请相应地更新您的计划。如果不需要更多步骤，您可以返回给用户，请回复该步骤并使用“response”功能。
否则，请填写计划。
仅向计划中添加仍需完成的步骤。不要将之前完成的步骤作为计划的一部分返回。`,
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
    console.log('[input]', task)
    const { messages } = await this.agentExecutor.invoke(input, config)

    console.log('[messages]', JSON.stringify(messages, null, 2))

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

    // 添加记忆
    this.memory.push(getExhibitionTEXT(response.content))
    console.log('response.content', response.content)

    try {
      // 解析LLM响应中的JSON
      const content = response.content as string
      const jsonMatch = content.match(/\{[\s\S]*\}/)

      if (jsonMatch) {
        const planData = JSON.parse(jsonMatch[0])
        return { plan: planData.steps }
      } else {
        // 如果没有找到JSON，尝试从文本中提取步骤
        const lines = content.split('\n').filter(line => line.trim())
        const steps = lines.map(line => line.replace(/^\d+\.\s*/, '').trim()).filter(step => step)
        return { plan: steps }
      }
    } catch (error) {
      console.error('Failed to parse plan:', error)
      // 回退方案：将整个响应作为单个步骤
      return { plan: [response.content as string] }
    }
  }

  async rePlanStep(
    state: typeof PlanExecuteState.State,
  ): Promise<Partial<typeof PlanExecuteState.State>> {
    const output = await this.replanner.invoke({
      input: state.input,
      plan: state.plan.join('\n'),
      pastSteps: state.pastSteps
        .map(([step, result]) => `${step}: ${result}`)
        .join('\n'),
    })
    const toolCall = output[0]

    console.log('[toolCall]', toolCall)

    if (toolCall.type === 'response') {
      this.memory.push(getExhibitionTEXT(toolCall.args?.response))
      return { response: toolCall.args?.response }
    }

    return { plan: toolCall.args?.steps }
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
