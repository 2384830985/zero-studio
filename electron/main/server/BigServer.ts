import { Server } from 'http'
import { MCPServerConfig, ServerStats } from './types'
import { AIGCService } from './services/AIGCService'
import { PlanService } from './services/PlanService'
import { ChatRoutes } from './routes/chatRoutes'
import { MCPServerRoutes } from './routes/mcpServerRoutes'
import {BrowserWindow, ipcMain} from 'electron'

/**
 * 主服务器类
 * 整合所有服务和路由，提供统一的服务器管理
 */
export class BigServer {
  private server: Server | null = null
  private port: number
  private config: MCPServerConfig

  private aigcService!: AIGCService
  private planService!: PlanService

  // 路由实例
  private chatRoutes!: ChatRoutes
  private mcpServerRoutes!: MCPServerRoutes

  constructor(config: MCPServerConfig, win: BrowserWindow) {
    this.config = {
      enableCors: true,
      maxConnections: 100,
      streamingEnabled: true,
      enabledMCPServers: [],
      ...config,
    }
    this.port = config.port

    // 初始化服务
    this.initializeServices(win)

    // 初始化路由
    this.initializeRoutes(win)

    this.setupRoutes()

    // 初始化MCP服务器
    this.initializeEnabledMCPServers()
  }

  /**
   * 初始化所有服务
   */
  private initializeServices(win: BrowserWindow) {
    this.aigcService = new AIGCService()
    this.planService = new PlanService(win)
  }

  /**
   * 初始化所有路由
   */
  private initializeRoutes(win: BrowserWindow) {
    this.chatRoutes = new ChatRoutes(
      this.aigcService,
      win,
    )
    this.mcpServerRoutes = new MCPServerRoutes()
  }

  /**
   * 设置所有路由
   */
  private setupRoutes() {
    // 计划执行路由
    this.setupPlanRoutes()
  }

  /**
   * 设置计划执行路由
   */
  private setupPlanRoutes() {
    // 创建计划
    ipcMain.handle('plan-create', async (_, object) => {
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
    })
  }

  /**
   * 启动服务器
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async start(): Promise<void> {
  }

  /**
   * 停止服务器
   */
  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('[MCP Server] Stopped')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  /**
   * 获取服务器统计信息
   */
  public getStats(): ServerStats {
    return {
      totalMessages: this.conversationService.getTotalMessageCount(),
      port: this.port,
      config: this.config,
    }
  }
}
