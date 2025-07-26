import {BrowserWindow} from 'electron'
// import { log } from 'node:console'
import { MCPMessage } from '../types'
import { AIGCService } from '../services/AIGCService'
import {AIMessage, HumanMessage, SystemMessage} from '@langchain/core/messages'
import { generateId } from '../utils/helpers'
import { EnabledMCPServer } from '../../mcp/StdioMcpServerToFunction'
import { Communication, CommunicationRole } from '../../mcp'
import { ReActService } from '../services/ReActService'
import { PlanService } from '../services/PlanService'

export class Chat {
  private aigcService: AIGCService
  private win: BrowserWindow
  private communication: Communication
  private planService!: PlanService

  constructor(
    win: BrowserWindow,
    aigcService: AIGCService,
  ) {
    this.aigcService = aigcService
    this.win = win
    this.communication = new Communication(win)
    this.planService = new PlanService(win)
  }

  /**
   * ReAct
   * @param _
   * @param object
   * @private
   */
  async handleChatReactSend(_, object) {
    const req = JSON.parse(object)
    const { content, metadata = {}, conversationId = '' } = req
    if (!content) {
      return {
        code: 400,
        body: {
          error: 'Content is required',
        },
      }
    }
    // 广播用户消息
    this.communication.setMessage({
      conversationId,
      message: {
        id: generateId(),
        role: CommunicationRole.USER,
        content: content.trim(),
        metadata,
      },
    })

    const reAct = new ReActService(this.win)
    reAct.initializeReActAgent(metadata)

    const stepCallback = (step) => {
      console.log(`[${step.type}] ${step.content}`)
      // 发送完整消息
      this.communication.setMessage({
        content: '',
        conversationId: conversationId,
        message: {
          id: generateId(),
          role: CommunicationRole.ASSISTANT,
          content: step.content,
          metadata,
        },
      })
    }

    const result = await reAct.reactAgent?.execute(content, stepCallback) as string
    console.log('最终结果:', result)

    // 发送完整消息
    this.communication.setMessage({
      conversationId: conversationId,
      message: {
        id: generateId(),
        role: CommunicationRole.ASSISTANT,
        content: result,
        metadata,
      },
    })
  }

  async handleChatPlanSend(_, object) {
    try {
      const { content, conversationId, metadata = {} } = JSON.parse(object)

      if (!content || typeof content !== 'string') {
        return {
          code: 400,
          data: {
            error: 'Content (goal) is required',
          },
        }
      }

      await this.planService.initializePlanAgent(metadata)

      if (!this.planService.isPlanAgentAvailable()) {
        return {
          code: 503,
          data: {
            error: 'PlanAndExecute agent not available',
          },
        }
      }

      console.log(`[MCP Server] Creating plan for goal: ${content}`)

      // 创建执行计划
      const plan = await this.planService.createPlan(content.trim())
      if (!plan) {
        return {
          code: 500,
          data: {
            error: 'Failed to create plan',
          },
        }
      }

      // 如果有对话ID，开始执行计划并流式返回结果
      if (conversationId) {
        this.planService.executePlanWithStreaming(plan, conversationId, metadata)
      }
      return {
        success: true,
        plan: {
          id: plan.id,
          goal: plan.goal,
          status: plan.status,
          stepsCount: plan.steps.length,
          createdAt: plan.createdAt,
        },
        conversationId,
      }
    } catch (error) {
      console.error('[MCP Server] Error creating plan:', error)
      return {
        code: 500,
        data: {
          error: 'Failed to create plan',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  /**
   * Chat
   * @param _
   * @param object
   * @private
   */

  async handleChatSend(_, object) {
    try {
      const response = JSON.parse(object)
      const { content, conversationId, metadata = {}, enabledMCPServers, oldMessage } = response
      if (!content) {
        return {
          code: 400,
          body: {
            error: 'Content is required',
          },
        }
      }

      // 创建用户消息
      const userMessage: MCPMessage = {
        id: generateId(),
        role: CommunicationRole.USER,
        content: content.trim(),
        metadata,
      }

      // 广播用户消息
      this.communication.setMessage({
        conversationId,
        message: userMessage,
      })

      // 转换消息格式
      const langchainMessages = [...oldMessage, userMessage].map((msg: any) => {
        switch (msg.role) {
        case CommunicationRole.USER:
          return new HumanMessage(msg.content)
        case CommunicationRole.SYSTEM:
          return new SystemMessage(msg.content)
        case CommunicationRole.ASSISTANT:
          return new AIMessage(msg.content)
        default:
          return new HumanMessage(msg.content)
        }
      })

      // 生成 AI 回复
      this.generateMCPResponse(langchainMessages, conversationId, enabledMCPServers, metadata)

      return {
        success: true,
        conversationId,
        messageId: userMessage.id,
      }
    } catch (error) {
      console.error('[Chat Routes] Error sending message:', error)
      return {
        code: 500,
        body: {
          error: 'Failed to send message',
        },
      }
    }
  }

  private async generateMCPResponse(userMessage: any[], conversationId: string, enabledMCPServers: EnabledMCPServer[], metadata: any) {
    let toolCalls: any[] = []
    let toolResults: any[] = []

    try {
      if (metadata && metadata.model) {
        // 获取对话历史，构建完整的消息上下文
        console.log('[Chat Routes] Calling AIGC API for MCP chat...')

        // 定义回调函数来实时发送工具调用信息
        // const onToolCall = (toolCall: any) => {
        //   toolCalls.push(toolCall)
        //   // 实时发送工具调用信息
        //   this.communication.sendStreaming({
        //     conversationId,
        //     messageId: assistantMessageId,
        //     role: CommunicationRole.ASSISTANT,
        //     metadata: {
        //       toolCalls: [toolCall],
        //     },
        //   })
        // }

        // const onToolResult = (toolResult: any) => {
        //   toolResults.push(toolResult)
        //   // 实时发送工具结果信息
        //   this.communication.sendStreaming({
        //     conversationId,
        //     messageId: assistantMessageId,
        //     role: CommunicationRole.ASSISTANT,
        //     metadata: {
        //       toolCalls,
        //       toolResults: [toolResult],
        //     },
        //   })
        // }
        // 调用 AIGC API（可能包含工具调用）
        const response = await this.aigcService.callAIGC(
          userMessage,
          metadata,
          // onToolCall,
          // onToolResult,
        )

        let fullContent = ''
        console.log('response', response)

        // 处理不同类型的响应
        if (typeof response === 'object' && response !== null) {
          // 如果响应包含流式数据
          if (response.stream) {
            for await (const chunk of response.stream) {
              if (chunk.content) {
                fullContent += chunk.content
                this.communication.sendStreaming({
                  conversationId,
                  messageId: generateId(),
                  role: CommunicationRole.ASSISTANT,
                  content: fullContent,
                  metadata: {
                    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                    toolResults: toolResults.length > 0 ? toolResults : undefined,
                  },
                })
              }
            }
          } else if (response.content) {
            // 非流式响应
            fullContent = response.content
          }

          // 更新工具调用信息
          if (response.toolCalls) {
            toolCalls = response.toolCalls
          }
          if (response.toolResults) {
            toolResults = response.toolResults
          }
        } else if (typeof response === 'string') {
          fullContent = response
        }

        if (fullContent) {
          // 发送完整消息
          this.communication.setMessage({
            conversationId,
            message: {
              id: generateId(),
              role: CommunicationRole.ASSISTANT,
              content: fullContent,
              metadata: {
                model: metadata.model,
                toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                toolResults: toolResults.length > 0 ? toolResults : undefined,
              },
            },
          })
        }
      } else {
        // 回退到模拟响应
        this.generateMockMCPResponse(conversationId)
      }
    } catch (error) {
      console.error('[Chat Routes] Error in generateMCPResponse:', error)
      // 回退到模拟响应
      this.generateMockMCPResponse(conversationId)
    }
  }

  private generateMockMCPResponse(conversationId: string) {
    // 发送完整消息
    this.communication.setMessage({
      conversationId,
      message: {
        id: generateId(),
        role: CommunicationRole.ASSISTANT,
        content: '请求出现错误，请重新尝试或者联系开发同学',
        metadata: {
          model: 'default',
        },
      },
    })
  }
}
