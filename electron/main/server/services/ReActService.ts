import { LangGraphReActAgent, LangGraphReActConfig, LangGraphTool, StepCallback } from './react-agent'
import { MCPMessage } from '../types'
import { generateId } from '../utils/helpers'
import { BrowserWindow } from 'electron'
import {McpServer} from '../../mcp/mcp-server'
import {CommunicationRole} from '../../mcp'

interface ReActSession {
  id: string
  goal: string
  status: 'idle' | 'reasoning' | 'executing' | 'completed' | 'failed'
  steps: Array<{
    type: 'reasoning' | 'tool-call' | 'observation' | 'final-answer'
    content: string
    timestamp: number
    data?: any
  }>
  result?: string
  error?: string
}

/**
 * 基于 LangGraph 的 ReAct 服务类
 * 管理 ReAct 会话的推理-行动循环
 */
export class ReActService {
  reactAgent: LangGraphReActAgent | null = null
  private activeSessions: Map<string, ReActSession> = new Map()
  private win: BrowserWindow

  constructor(win: BrowserWindow) {
    this.win = win
  }

  /**
   * 初始化 ReAct 代理
   */
  async initializeReActAgent(metadata: any) {
    try {
      const config: LangGraphReActConfig = {
        model: metadata.model,
        apiKey: metadata.service.apiKey,
        baseURL: metadata.service.apiUrl,
        temperature: 0.3,
        maxTokens: 1000,
        maxIterations: 15,
        tools: McpServer.langchainTools as LangGraphTool[],
      }

      this.reactAgent = new LangGraphReActAgent(config)
      console.log('[ReAct Service] LangGraph Agent initialized successfully')
    } catch (error) {
      console.error('[ReAct Service] Agent initialization failed:', error)
      this.reactAgent = null
    }
  }

  /**
   * 创建新的 ReAct 会话
   */
  createSession(goal: string): ReActSession {
    const sessionId = generateId()
    const session: ReActSession = {
      id: sessionId,
      goal,
      status: 'idle',
      steps: [],
    }
    this.activeSessions.set(sessionId, session)
    return session
  }

  /**
   * 流式执行 ReAct 会话
   */
  async executeSessionWithStreaming(
    sessionId: string,
    conversationId: string,
    metadata: any = {},
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    if (!this.reactAgent) {
      throw new Error('ReAct agent not available')
    }

    try {
      session.status = 'reasoning'

      // 创建助手消息用于显示执行过程
      const assistantMessageId = generateId()
      let currentContent = `🧠 **ReAct 会话启动**: ${session.goal}\n\n`

      // 广播初始消息
      this.win.webContents.send('streaming', {
        conversationId,
        messageId: assistantMessageId,
        role: 'assistant',
        content: currentContent,
        timestamp: Date.now(),
      })

      // 定义步骤回调
      const stepCallback: StepCallback = (step) => {
        const stepData = {
          type: step.type,
          content: step.content,
          timestamp: Date.now(),
          data: step.data,
        }
        session.steps.push(stepData)

        // 处理不同类型的步骤
        switch (step.type) {
        case 'reasoning':
          currentContent += `💭 **推理**: ${step.content}\n\n`
          break

        case 'tool-call':
          currentContent += `🛠️ **调用工具**: ${step.content}\n`
          if (step.data) {
            currentContent += `   参数: ${JSON.stringify(step.data.parameters)}\n`
          }
          break

        case 'observation': {
          let obsContent = step.content
          if (obsContent.length > 150) {
            obsContent = obsContent.substring(0, 150) + '...'
          }
          currentContent += `👀 **观察结果**: ${obsContent}\n\n`
          break
        }

        case 'final-answer':
          session.status = 'completed'
          session.result = step.content
          currentContent += `🎉 **最终答案**: ${step.content}\n`
          break
        }

        // 广播更新
        this.win.webContents.send('streaming', {
          conversationId,
          messageId: assistantMessageId,
          role: 'assistant',
          content: currentContent,
          timestamp: Date.now(),
        })
      }

      // 执行 LangGraph ReAct 流程
      await this.reactAgent.execute(session.goal, stepCallback)

      // 发送最终消息
      const finalMessage: MCPMessage = {
        id: assistantMessageId,
        role: CommunicationRole.ASSISTANT,
        content: currentContent,
        timestamp: Date.now(),
        metadata: {
          ...metadata,
          sessionId: session.id,
          steps: session.steps.length,
          status: session.status,
          langGraph: true, // 标识使用了 LangGraph
        },
      }

      this.win.webContents.send('message', {
        conversationId,
        message: finalMessage,
      })

      console.log(`[ReAct Service] LangGraph session completed: ${sessionId}`)
    } catch (error) {
      console.error('[ReAct Service] Session execution failed:', error)
      session.status = 'failed'
      session.error = error instanceof Error ? error.message : '未知错误'

      const errorMessage: MCPMessage = {
        id: generateId(),
        role: CommunicationRole.ASSISTANT,
        content: `❌ **ReAct 会话失败**: ${session.error}`,
        timestamp: Date.now(),
        metadata: { ...metadata, sessionId, error: true },
      }

      this.win.webContents.send('message', {
        conversationId,
        message: errorMessage,
      })
    }
  }

  /**
   * 获取会话详情
   */
  getSession(sessionId: string): ReActSession | undefined {
    return this.activeSessions.get(sessionId)
  }

  /**
   * 获取所有活动会话
   */
  getAllSessions() {
    return Array.from(this.activeSessions.values()).map(session => ({
      id: session.id,
      goal: session.goal,
      status: session.status,
      steps: session.steps.length,
      createdAt: Date.now(),
      langGraph: true, // 标识使用了 LangGraph
    }))
  }

  /**
   * 终止会话
   */
  terminateSession(sessionId: string): boolean {
    return this.activeSessions.delete(sessionId)
  }

  /**
   * 检查代理是否可用
   */
  isAgentAvailable(): boolean {
    return this.reactAgent !== null
  }

  /**
   * 获取会话执行步骤详情
   */
  getSessionSteps(sessionId: string) {
    const session = this.activeSessions.get(sessionId)
    return session?.steps || []
  }

  /**
   * 重置会话状态
   */
  resetSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      return false
    }

    session.status = 'idle'
    session.steps = []
    session.result = undefined
    session.error = undefined

    return true
  }
}
