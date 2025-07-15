import express from 'express'
import cors from 'cors'
import { Server } from 'http'
import { MCPServerConfig, ServerStats } from './types'
import { ConversationService } from './services/ConversationService'
import { SSEService } from './services/SSEService'
import { MCPServerService } from './services/MCPServerService'
import { AIGCService } from './services/AIGCService'
import { PlanService } from './services/PlanService'
import { ChatRoutes } from './routes/chatRoutes'
import { MCPServerRoutes } from './routes/mcpServerRoutes'

/**
 * 主服务器类
 * 整合所有服务和路由，提供统一的服务器管理
 */
export class BigServer {
  private app: express.Application
  private server: Server | null = null
  private port: number
  private config: MCPServerConfig

  // 服务实例
  private conversationService!: ConversationService
  private sseService!: SSEService
  private mcpServerService!: MCPServerService
  private aigcService!: AIGCService
  private planService!: PlanService

  // 路由实例
  private chatRoutes!: ChatRoutes
  private mcpServerRoutes!: MCPServerRoutes

  constructor(config: MCPServerConfig) {
    this.config = {
      enableCors: true,
      maxConnections: 100,
      streamingEnabled: true,
      enabledMCPServers: [],
      ...config,
    }
    this.port = config.port
    this.app = express()

    // 初始化服务
    this.initializeServices()

    // 初始化路由
    this.initializeRoutes()

    // 设置中间件和基础路由
    this.setupMiddleware()
    this.setupBaseRoutes()
    this.setupRoutes()

    // 初始化MCP服务器
    this.initializeEnabledMCPServers()
  }

  /**
   * 初始化所有服务
   */
  private initializeServices() {
    this.conversationService = new ConversationService()
    this.sseService = new SSEService()
    this.mcpServerService = new MCPServerService()
    this.aigcService = new AIGCService()
    this.planService = new PlanService(this.conversationService, this.sseService)
  }

  /**
   * 初始化所有路由
   */
  private initializeRoutes() {
    this.chatRoutes = new ChatRoutes(
      this.conversationService,
      this.sseService,
      this.aigcService,
    )
    this.mcpServerRoutes = new MCPServerRoutes(this.mcpServerService)
  }

  /**
   * 初始化启用的MCP服务器
   */
  private initializeEnabledMCPServers() {
    this.mcpServerService.initializeEnabledMCPServers(this.config.enabledMCPServers)
  }

  /**
   * 设置中间件
   */
  private setupMiddleware() {
    // 启用 CORS
    if (this.config.enableCors) {
      this.app.use(cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      }))
    }

    // 解析 JSON
    this.app.use(express.json({ limit: '10mb' }))
    this.app.use(express.urlencoded({ extended: true }))

    // 请求日志
    this.app.use((req: any, res: any, next: any) => {
      console.log(`[MCP Server] ${req.method} ${req.path}`)
      next()
    })
  }

  /**
   * 设置基础路由
   */
  private setupBaseRoutes() {
    // 健康检查
    this.app.get('/health', (req: any, res: any) => {
      res.json({
        status: 'healthy',
        timestamp: Date.now(),
        connections: this.sseService.getClientCount(),
        conversations: this.conversationService.getConversationCount(),
      })
    })
  }

  /**
   * 设置所有路由
   */
  private setupRoutes() {
    // 聊天相关路由
    this.app.use('/', this.chatRoutes.getRouter())

    // MCP服务器管理路由
    this.app.use('/', this.mcpServerRoutes.getRouter())

    // 计划执行路由
    this.setupPlanRoutes()
  }

  /**
   * 设置计划执行路由
   */
  private setupPlanRoutes() {
    // 创建执行计划
    this.app.post('/mcp/plan/create', async (req: any, res: any) => {
      try {
        const { content, conversationId, metadata = {} } = req.body

        if (!content || typeof content !== 'string') {
          return res.status(400).json({ error: 'Content (goal) is required' })
        }

        await this.planService.initializePlanAgent(metadata)

        if (!this.planService.isPlanAgentAvailable()) {
          return res.status(503).json({ error: 'PlanAndExecute agent not available' })
        }

        console.log(`[MCP Server] Creating plan for goal: ${content}`)

        // 创建执行计划
        const plan = await this.planService.createPlan(content.trim())
        if (!plan) {
          return res.status(500).json({ error: 'Failed to create plan' })
        }

        // 如果有对话ID，开始执行计划并流式返回结果
        if (conversationId) {
          this.planService.executePlanWithStreaming(plan, conversationId, metadata)
        }

        res.json({
          success: true,
          plan: {
            id: plan.id,
            goal: plan.goal,
            status: plan.status,
            stepsCount: plan.steps.length,
            createdAt: plan.createdAt,
          },
          conversationId,
        })
      } catch (error) {
        console.error('[MCP Server] Error creating plan:', error)
        res.status(500).json({
          error: 'Failed to create plan',
          details: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    })

    // 执行计划
    this.app.post('/mcp/plan/execute/:planId', async (req: any, res: any) => {
      try {
        const { planId } = req.params
        const { conversationId, metadata = {} } = req.body

        const plan = this.planService.getPlan(planId)
        if (!plan) {
          return res.status(404).json({ error: 'Plan not found' })
        }

        if (!this.planService.isPlanAgentAvailable()) {
          return res.status(503).json({ error: 'PlanAndExecute agent not available' })
        }

        console.log(`[MCP Server] Executing plan: ${planId}`)

        // 执行计划并流式返回结果
        if (conversationId) {
          this.planService.executePlanWithStreaming(plan, conversationId, metadata)
        } else {
          // 非流式执行
          await this.planService.executePlan(planId)
        }

        res.json({
          success: true,
          planId,
          conversationId,
        })
      } catch (error) {
        console.error('[MCP Server] Error executing plan:', error)
        res.status(500).json({
          error: 'Failed to execute plan',
          details: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    })

    // 一步创建并执行计划
    this.app.post('/mcp/plan/execute', async (req: any, res: any) => {
      try {
        const { content, conversationId, metadata = {} } = req.body

        if (!content || typeof content !== 'string') {
          return res.status(400).json({ error: 'Content (goal) is required' })
        }

        await this.planService.initializePlanAgent(metadata)

        if (!this.planService.isPlanAgentAvailable()) {
          return res.status(503).json({ error: 'PlanAndExecute agent not available' })
        }

        console.log(`[MCP Server] Creating and executing plan for goal: ${content}`)

        // 创建执行计划
        const plan = await this.planService.createPlan(content.trim())
        if (!plan) {
          return res.status(500).json({ error: 'Failed to create plan' })
        }

        // 如果有对话ID，执行计划并流式返回结果
        if (conversationId) {
          this.planService.executePlanWithStreaming(plan, conversationId, metadata)
        }

        res.json({
          success: true,
          plan: {
            id: plan.id,
            goal: plan.goal,
            status: plan.status,
            stepsCount: plan.steps.length,
            createdAt: plan.createdAt,
          },
          conversationId,
        })
      } catch (error) {
        console.error('[MCP Server] Error in plan and execute:', error)
        res.status(500).json({
          error: 'Failed to create and execute plan',
          details: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    })

    // 获取计划详情
    this.app.get('/mcp/plan/:planId', (req: any, res: any) => {
      const { planId } = req.params
      const plan = this.planService.getPlan(planId)

      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' })
      }

      res.json({ plan })
    })

    // 获取所有计划列表
    this.app.get('/mcp/plans', (req: any, res: any) => {
      const plans = this.planService.getAllPlans()
      res.json({ plans })
    })

    // 删除计划
    this.app.delete('/mcp/plan/:planId', (req: any, res: any) => {
      const { planId } = req.params
      const deleted = this.planService.deletePlan(planId)

      if (!deleted) {
        return res.status(404).json({ error: 'Plan not found' })
      }

      res.json({ success: true })
    })

    // 重新规划
    this.app.post('/mcp/plan/replan/:planId', async (req: any, res: any) => {
      try {
        const { planId } = req.params
        const { conversationId, metadata = {} } = req.body

        const plan = this.planService.getPlan(planId)
        if (!plan) {
          return res.status(404).json({ error: 'Plan not found' })
        }

        if (!this.planService.isPlanAgentAvailable()) {
          return res.status(503).json({ error: 'PlanAndExecute agent not available' })
        }

        console.log(`[MCP Server] Replanning: ${planId}`)

        // 重新执行计划（会触发内部的重规划逻辑）
        if (conversationId) {
          this.planService.executePlanWithStreaming(plan, conversationId, metadata)
        }

        res.json({
          success: true,
          planId,
          conversationId,
        })
      } catch (error) {
        console.error('[MCP Server] Error in replanning:', error)
        res.status(500).json({
          error: 'Failed to replan',
          details: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    })

    // 获取计划配置
    this.app.get('/mcp/plan/config', (req: any, res: any) => {
      try {
        if (!this.planService.isPlanAgentAvailable()) {
          return res.status(503).json({ error: 'PlanAndExecute agent not available' })
        }

        const config = this.planService.getConfig()
        res.json({ config })
      } catch (error) {
        console.error('[MCP Server] Error getting plan config:', error)
        res.status(500).json({
          error: 'Failed to get config',
          details: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    })

    // 更新计划配置
    this.app.put('/mcp/plan/config', (req: any, res: any) => {
      try {
        const newConfig = req.body

        if (!this.planService.isPlanAgentAvailable()) {
          return res.status(503).json({ error: 'PlanAndExecute agent not available' })
        }

        this.planService.updateConfig(newConfig)
        console.log('[MCP Server] Plan agent config updated')

        res.json({ success: true })
      } catch (error) {
        console.error('[MCP Server] Error updating plan config:', error)
        res.status(500).json({
          error: 'Failed to update config',
          details: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    })
  }

  /**
   * 启动服务器
   */
  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          console.log(`[MCP Server] Running on http://localhost:${this.port}`)
          console.log(`[MCP Server] Health check: http://localhost:${this.port}/health`)
          console.log(`[MCP Server] Chat completions: http://localhost:${this.port}/v1/chat/completions`)
          console.log(`[MCP Server] MCP Stream: http://localhost:${this.port}/mcp/chat/stream`)
          resolve()
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 停止服务器
   */
  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        // 关闭所有 SSE 连接
        this.sseService.closeAllConnections()

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
      connectedClients: this.sseService.getClientCount(),
      totalConversations: this.conversationService.getConversationCount(),
      totalMessages: this.conversationService.getTotalMessageCount(),
      port: this.port,
      config: this.config,
    }
  }

  /**
   * 获取所有对话
   */
  public getConversations() {
    return this.conversationService.getAllConversationSummaries().map(summary => ({
      id: summary.id,
      messages: this.conversationService.getConversation(summary.id),
      messageCount: summary.messageCount,
      lastActivity: summary.lastMessage?.timestamp || 0,
    }))
  }
}
