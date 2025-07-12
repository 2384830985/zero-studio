import express from 'express'
import cors from 'cors'
import { Server } from 'http'
import axios from 'axios'
import { log } from 'node:console'
import {
  PlanAndExecuteAgent,
  ExecutionPlan,
  PlanStep,
} from './plan-and-execute'
import { StdioMcpClientToFunction, EnabledMCPServer } from './llm/StdioMcpServerToFunction'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, AIMessage, ToolMessage } from '@langchain/core/messages'
import { DynamicTool } from '@langchain/core/tools'

export interface MCPMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  metadata?: {
    model?: string
    temperature?: number
    maxTokens?: number
    stream?: boolean
  }
}

export interface MCPStreamChunk {
  id: string
  object: 'chat.completion.chunk'
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: string
      content?: string
    }
    finish_reason?: string | null
  }>
}

export interface MCPServerInfo {
  id: string
  name: string
  description?: string
  version?: string
  status: 'active' | 'inactive' | 'error'
  endpoint?: string
  capabilities?: string[]
  lastActivity?: number
}

export interface MCPServerConfig {
  port: number
  enableCors?: boolean
  maxConnections?: number
  streamingEnabled?: boolean
  enabledMCPServers?: MCPServerInfo[]
  AIGC: {
    apiUrl?: string
    appId: string
    defaultModel?: string
  }
}

export class MCPServer {
  private app: express.Application
  private server: Server | null = null
  private port: number
  private clients: Set<any> = new Set()
  private conversations: Map<string, MCPMessage[]> = new Map()
  private config: MCPServerConfig
  private planAgent: PlanAndExecuteAgent | null = null
  private executionPlans: Map<string, ExecutionPlan> = new Map()
  private enabledMCPServers: Map<string, MCPServerInfo> = new Map()

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
    this.setupMiddleware()
    this.setupRoutes()
    this.initializeEnabledMCPServers()
  }

  private async initializePlanAgent(metadata: any) {
    try {

      // 使用默认的 OpenAI 代理（需要配置 API Key）
      this.planAgent = new PlanAndExecuteAgent({
        model: metadata.model,
        apiKey: metadata.service.apiKey,
        // baseURL: metadata.service.baseURL,
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        temperature: 0.7,
        maxTokens: 2000,
        enableReplanning: true,
        enableSubtaskDecomposition: true,
      })
    } catch (error) {
      console.error('[MCP Server] Failed to initialize PlanAndExecute agent:', error)
      this.planAgent = null
    }
  }

  private initializeEnabledMCPServers() {
    try {
      // 初始化启用的 MCP 服务器列表
      if (this.config.enabledMCPServers && this.config.enabledMCPServers.length > 0) {
        this.config.enabledMCPServers.forEach(server => {
          this.enabledMCPServers.set(server.id, {
            ...server,
            lastActivity: Date.now(),
          })
        })
        console.log(`[MCP Server] Initialized ${this.enabledMCPServers.size} enabled MCP servers`)
      } else {
        console.log('[MCP Server] No enabled MCP servers configured')
      }
    } catch (error) {
      console.error('[MCP Server] Failed to initialize enabled MCP servers:', error)
    }
  }

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

  private setupRoutes() {
    // 健康检查
    this.app.get('/health', (req: any, res: any) => {
      res.json({
        status: 'healthy',
        timestamp: Date.now(),
        connections: this.clients.size,
        conversations: this.conversations.size,
      })
    })

    // 聊天完成接口 (兼容 OpenAI API)
    this.app.post('/v1/chat/completions', async (req: any, res: any) => {
      try {
        const { messages, stream = false, metadata = {}, enabledMCPServers } = req.body

        if (!messages || !Array.isArray(messages)) {
          return res.status(400).json({
            error: {
              message: 'Messages array is required',
              type: 'invalid_request_error',
            },
          })
        }

        const conversationId = this.generateId()

        console.log('conversationId', conversationId)

        if (stream) {
          await this.handleStreamingRequest(req, res, messages, metadata.model, metadata, conversationId, enabledMCPServers)
        } else {
          await this.handleNonStreamingRequest(req, res, messages, metadata.model, metadata, conversationId, enabledMCPServers)
        }
      } catch (error) {
        console.error('[MCP Server] Error in chat completions:', error)
        res.status(500).json({
          error: {
            message: 'Internal server error',
            type: 'server_error',
          },
        })
      }
    })

    // MCP 特定的流式聊天接口 - 不带参数
    this.app.get('/mcp/chat/stream', (req: any, res: any) => {
      const conversationId = this.generateId()

      // 设置 SSE 头部
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      })

      // 添加客户端到连接池
      this.clients.add(res)
      console.log(`[MCP Server] SSE client connected. Total: ${this.clients.size}`)

      // 发送连接确认
      this.sendSSEMessage(res, 'connected', {
        conversationId,
        message: 'Connected to MCP chat stream',
        timestamp: Date.now(),
      })

      // 处理客户端断开连接
      req.on('close', () => {
        this.clients.delete(res)
        console.log(`[MCP Server] SSE client disconnected. Total: ${this.clients.size}`)
      })
    })

    // MCP 特定的流式聊天接口 - 带参数
    this.app.get('/mcp/chat/stream/:conversationId', (req: any, res: any) => {
      const conversationId = req.params.conversationId

      // 设置 SSE 头部
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      })

      // 添加客户端到连接池
      this.clients.add(res)
      console.log(`[MCP Server] SSE client connected. Total: ${this.clients.size}`)

      // 发送连接确认
      this.sendSSEMessage(res, 'connected', {
        conversationId,
        message: 'Connected to MCP chat stream',
        timestamp: Date.now(),
      })

      // 发送历史消息
      const history = this.conversations.get(conversationId) || []
      if (history.length > 0) {
        this.sendSSEMessage(res, 'history', {
          conversationId,
          messages: history,
        })
      }

      // 处理客户端断开连接
      req.on('close', () => {
        this.clients.delete(res)
        console.log(`[MCP Server] SSE client disconnected. Total: ${this.clients.size}`)
      })
    })

    // 发送消息到 MCP 聊天
    this.app.post('/mcp/chat/send', async (req: any, res: any) => {
      try {
        const { content, conversationId, metadata = {}, enabledMCPServers } = req.body

        if (!content || typeof content !== 'string') {
          return res.status(400).json({ error: 'Content is required' })
        }

        const convId = conversationId || this.generateId()

        // 创建用户消息
        const userMessage: MCPMessage = {
          id: this.generateId(),
          role: 'user',
          content: content.trim(),
          timestamp: Date.now(),
          metadata,
        }

        // 保存到对话历史
        if (!this.conversations.has(convId)) {
          this.conversations.set(convId, [])
        }
        this.conversations.get(convId)!.push(userMessage)

        // 广播用户消息
        this.broadcastSSEMessage('message', {
          conversationId: convId,
          message: userMessage,
        })

        // https://dashscope.aliyuncs.com/compatible-mode/v1

        // 生成 AI 回复
        this.generateMCPResponse(userMessage, convId, enabledMCPServers, metadata)

        res.json({
          success: true,
          conversationId: convId,
          messageId: userMessage.id,
        })
      } catch (error) {
        console.error('[MCP Server] Error sending message:', error)
        res.status(500).json({ error: 'Failed to send message' })
      }
    })

    // 获取对话历史
    this.app.get('/mcp/conversations/:conversationId', (req: any, res: any) => {
      const { conversationId } = req.params
      const messages = this.conversations.get(conversationId) || []

      res.json({
        conversationId,
        messages,
        total: messages.length,
      })
    })

    // 清空对话
    this.app.delete('/mcp/conversations/:conversationId', (req: any, res: any) => {
      const { conversationId } = req.params
      this.conversations.delete(conversationId)

      this.broadcastSSEMessage('conversation_cleared', {
        conversationId,
        timestamp: Date.now(),
      })

      res.json({ success: true })
    })

    // 获取所有对话列表
    this.app.get('/mcp/conversations', (req: any, res: any) => {
      const conversations = Array.from(this.conversations.entries()).map(([id, messages]) => ({
        id,
        messageCount: messages.length,
        lastMessage: messages[messages.length - 1],
        createdAt: messages[0]?.timestamp || Date.now(),
      }))

      res.json({ conversations })
    })

    // MCP 服务器管理路由
    this.setupMCPServerRoutes()

    // Plan and Execute 路由
    this.setupPlanRoutes()
  }

  private setupMCPServerRoutes() {
    // 获取所有启用的 MCP 服务器列表
    this.app.get('/mcp/servers', (req: any, res: any) => {
      const servers = Array.from(this.enabledMCPServers.values())
      res.json({
        servers,
        total: servers.length,
        timestamp: Date.now(),
      })
    })

    // 获取特定 MCP 服务器信息
    this.app.get('/mcp/servers/:serverId', (req: any, res: any) => {
      const { serverId } = req.params
      const server = this.enabledMCPServers.get(serverId)

      if (!server) {
        return res.status(404).json({ error: 'MCP server not found' })
      }

      res.json({ server })
    })

    // 添加新的 MCP 服务器
    this.app.post('/mcp/servers', (req: any, res: any) => {
      try {
        const serverInfo: MCPServerInfo = req.body

        if (!serverInfo.id || !serverInfo.name) {
          return res.status(400).json({ error: 'Server ID and name are required' })
        }

        if (this.enabledMCPServers.has(serverInfo.id)) {
          return res.status(409).json({ error: 'Server with this ID already exists' })
        }

        const newServer: MCPServerInfo = {
          ...serverInfo,
          status: serverInfo.status || 'inactive',
          lastActivity: Date.now(),
        }

        this.enabledMCPServers.set(serverInfo.id, newServer)

        console.log(`[MCP Server] Added new MCP server: ${serverInfo.name} (${serverInfo.id})`)

        res.json({
          success: true,
          server: newServer,
        })
      } catch (error) {
        console.error('[MCP Server] Error adding MCP server:', error)
        res.status(500).json({
          error: 'Failed to add MCP server',
          details: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    })

    // 更新 MCP 服务器信息
    this.app.put('/mcp/servers/:serverId', (req: any, res: any) => {
      try {
        const { serverId } = req.params
        const updateInfo = req.body

        const existingServer = this.enabledMCPServers.get(serverId)
        if (!existingServer) {
          return res.status(404).json({ error: 'MCP server not found' })
        }

        const updatedServer: MCPServerInfo = {
          ...existingServer,
          ...updateInfo,
          id: serverId, // 确保ID不被修改
          lastActivity: Date.now(),
        }

        this.enabledMCPServers.set(serverId, updatedServer)

        console.log(`[MCP Server] Updated MCP server: ${updatedServer.name} (${serverId})`)

        res.json({
          success: true,
          server: updatedServer,
        })
      } catch (error) {
        console.error('[MCP Server] Error updating MCP server:', error)
        res.status(500).json({
          error: 'Failed to update MCP server',
          details: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    })

    // 删除 MCP 服务器
    this.app.delete('/mcp/servers/:serverId', (req: any, res: any) => {
      try {
        const { serverId } = req.params

        const server = this.enabledMCPServers.get(serverId)
        if (!server) {
          return res.status(404).json({ error: 'MCP server not found' })
        }

        this.enabledMCPServers.delete(serverId)

        console.log(`[MCP Server] Removed MCP server: ${server.name} (${serverId})`)

        res.json({
          success: true,
          removedServer: server,
        })
      } catch (error) {
        console.error('[MCP Server] Error removing MCP server:', error)
        res.status(500).json({
          error: 'Failed to remove MCP server',
          details: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    })

    // 更新 MCP 服务器状态
    this.app.patch('/mcp/servers/:serverId/status', (req: any, res: any) => {
      try {
        const { serverId } = req.params
        const { status } = req.body

        if (!['active', 'inactive', 'error'].includes(status)) {
          return res.status(400).json({ error: 'Invalid status. Must be active, inactive, or error' })
        }

        const server = this.enabledMCPServers.get(serverId)
        if (!server) {
          return res.status(404).json({ error: 'MCP server not found' })
        }

        const updatedServer: MCPServerInfo = {
          ...server,
          status,
          lastActivity: Date.now(),
        }

        this.enabledMCPServers.set(serverId, updatedServer)

        console.log(`[MCP Server] Updated status of MCP server ${server.name} to ${status}`)

        res.json({
          success: true,
          server: updatedServer,
        })
      } catch (error) {
        console.error('[MCP Server] Error updating MCP server status:', error)
        res.status(500).json({
          error: 'Failed to update MCP server status',
          details: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    })

    // 获取 MCP 服务器统计信息
    this.app.get('/mcp/servers/stats', (req: any, res: any) => {
      const servers = Array.from(this.enabledMCPServers.values())
      const stats = {
        total: servers.length,
        active: servers.filter(s => s.status === 'active').length,
        inactive: servers.filter(s => s.status === 'inactive').length,
        error: servers.filter(s => s.status === 'error').length,
        lastUpdated: Date.now(),
      }

      res.json({ stats })
    })
  }

  private setupPlanRoutes() {
    // 创建执行计划
    this.app.post('/mcp/plan/create', async (req: any, res: any) => {
      try {
        const { content, conversationId, metadata = {} } = req.body

        if (!content || typeof content !== 'string') {
          return res.status(400).json({ error: 'Content (goal) is required' })
        }
        await this.initializePlanAgent(metadata)

        if (!this.planAgent) {
          return res.status(503).json({ error: 'PlanAndExecute agent not available' })
        }

        console.log(`[MCP Server] Creating plan for goal: ${content}`)

        // 创建执行计划
        const plan = await this.planAgent.createPlan(content.trim())

        // 保存计划
        this.executionPlans.set(plan.id, plan)

        // 如果有对话ID，创建用户消息
        if (conversationId) {
          const userMessage: MCPMessage = {
            id: this.generateId(),
            role: 'user',
            content: content.trim(),
            timestamp: Date.now(),
            metadata: { ...metadata, planId: plan.id },
          }

          // 保存到对话历史
          if (!this.conversations.has(conversationId)) {
            this.conversations.set(conversationId, [])
          }
          this.conversations.get(conversationId)!.push(userMessage)

          // 广播用户消息
          this.broadcastSSEMessage('message', {
            conversationId,
            message: userMessage,
          })

          // 开始执行计划并流式返回结果
          this.executePlanWithStreaming(plan, conversationId, metadata)
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

        const plan = this.executionPlans.get(planId)
        if (!plan) {
          return res.status(404).json({ error: 'Plan not found' })
        }

        if (!this.planAgent) {
          return res.status(503).json({ error: 'PlanAndExecute agent not available' })
        }

        console.log(`[MCP Server] Executing plan: ${planId}`)

        // 执行计划并流式返回结果
        if (conversationId) {
          this.executePlanWithStreaming(plan, conversationId, metadata)
        } else {
          // 非流式执行
          const executedPlan = await this.planAgent.executePlan(plan)
          this.executionPlans.set(planId, executedPlan)
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

        if (!this.planAgent) {
          return res.status(503).json({ error: 'PlanAndExecute agent not available' })
        }

        console.log(`[MCP Server] Creating and executing plan for goal: ${content}`)

        // 创建执行计划
        const plan = await this.planAgent.createPlan(content.trim())
        this.executionPlans.set(plan.id, plan)

        // 如果有对话ID，创建用户消息
        if (conversationId) {
          const userMessage: MCPMessage = {
            id: this.generateId(),
            role: 'user',
            content: content.trim(),
            timestamp: Date.now(),
            metadata: { ...metadata, planId: plan.id },
          }

          // 保存到对话历史
          if (!this.conversations.has(conversationId)) {
            this.conversations.set(conversationId, [])
          }
          this.conversations.get(conversationId)!.push(userMessage)

          // 广播用户消息
          this.broadcastSSEMessage('message', {
            conversationId,
            message: userMessage,
          })

          // 执行计划并流式返回结果
          this.executePlanWithStreaming(plan, conversationId, metadata)
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
      const plan = this.executionPlans.get(planId)

      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' })
      }

      res.json({ plan })
    })

    // 获取所有计划列表
    this.app.get('/mcp/plans', (req: any, res: any) => {
      const plans = Array.from(this.executionPlans.values()).map(plan => ({
        id: plan.id,
        goal: plan.goal,
        status: plan.status,
        stepsCount: plan.steps.length,
        completedSteps: plan.steps.filter(s => s.status === 'completed').length,
        createdAt: plan.createdAt,
        completedAt: plan.completedAt,
      }))

      res.json({ plans })
    })

    // 删除计划
    this.app.delete('/mcp/plan/:planId', (req: any, res: any) => {
      const { planId } = req.params
      const deleted = this.executionPlans.delete(planId)

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

        const plan = this.executionPlans.get(planId)
        if (!plan) {
          return res.status(404).json({ error: 'Plan not found' })
        }

        if (!this.planAgent) {
          return res.status(503).json({ error: 'PlanAndExecute agent not available' })
        }

        console.log(`[MCP Server] Replanning: ${planId}`)

        // 重新执行计划（会触发内部的重规划逻辑）
        if (conversationId) {
          this.executePlanWithStreaming(plan, conversationId, metadata)
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
      if (!this.planAgent) {
        return res.status(503).json({ error: 'PlanAndExecute agent not available' })
      }

      const config = this.planAgent.getConfig()
      res.json({ config })
    })

    // 更新计划配置
    this.app.put('/mcp/plan/config', (req: any, res: any) => {
      try {
        const newConfig = req.body

        if (!this.planAgent) {
          return res.status(503).json({ error: 'PlanAndExecute agent not available' })
        }

        this.planAgent.updateConfig(newConfig)
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

  // 流式执行计划
  private async executePlanWithStreaming(
    plan: ExecutionPlan,
    conversationId: string,
    metadata: any = {},
  ) {
    if (!this.planAgent) {
      console.error('[MCP Server] PlanAndExecute agent not available')
      return
    }

    try {
      console.log(`[MCP Server] Starting streaming execution of plan: ${plan.id}`)

      // 创建助手消息用于显示计划执行过程
      const assistantMessageId = this.generateId()
      let currentContent = `🎯 **执行计划**: ${plan.goal}\n\n📋 **计划步骤**:\n`

      // 显示初始计划
      plan.steps.forEach((step, index) => {
        currentContent += `${index + 1}. ${step.description}\n`
      })
      currentContent += '\n🚀 **开始执行**...\n\n'

      // 广播初始计划消息
      this.broadcastSSEMessage('streaming', {
        conversationId,
        messageId: assistantMessageId,
        role: 'assistant',
        content: currentContent,
        timestamp: Date.now(),
      })

      // 执行计划，监听步骤更新
      const executedPlan = await this.planAgent.executePlan(plan, (step: PlanStep) => {
        // 更新步骤状态的显示
        let stepContent = ''

        if (step.status === 'executing') {
          stepContent = `⏳ **正在执行**: ${step.description}\n`
        } else if (step.status === 'completed') {
          stepContent = `✅ **已完成**: ${step.description}\n`
          if (step.result) {
            stepContent += `   📝 结果: ${step.result}\n`
          }
          if (step.subtasks && step.subtasks.length > 0) {
            stepContent += `   📂 子任务 (${step.subtasks.length}个):\n`
            step.subtasks.forEach((subtask, idx) => {
              const statusIcon = subtask.status === 'completed' ? '✅' :
                subtask.status === 'failed' ? '❌' :
                  subtask.status === 'executing' ? '⏳' : '⏸️'
              stepContent += `      ${idx + 1}. ${statusIcon} ${subtask.description}\n`
              if (subtask.result && subtask.status === 'completed') {
                stepContent += `         💡 ${subtask.result}\n`
              }
            })
          }
        } else if (step.status === 'failed') {
          stepContent = `❌ **执行失败**: ${step.description}\n`
          if (step.error) {
            stepContent += `   ⚠️ 错误: ${step.error}\n`
          }
        }

        currentContent += stepContent + '\n'

        // 广播步骤更新
        this.broadcastSSEMessage('streaming', {
          conversationId,
          messageId: assistantMessageId,
          role: 'assistant',
          content: currentContent,
          timestamp: Date.now(),
        })
      })

      // 更新保存的计划
      this.executionPlans.set(plan.id, executedPlan)

      // 添加执行总结
      const completedSteps = executedPlan.steps.filter(s => s.status === 'completed').length
      const totalSteps = executedPlan.steps.length
      const failedSteps = executedPlan.steps.filter(s => s.status === 'failed').length

      currentContent += '\n📊 **执行总结**:\n'
      currentContent += `- 总步骤: ${totalSteps}\n`
      currentContent += `- 已完成: ${completedSteps}\n`
      if (failedSteps > 0) {
        currentContent += `- 失败: ${failedSteps}\n`
      }
      currentContent += `- 状态: ${executedPlan.status === 'completed' ? '✅ 完成' :
        executedPlan.status === 'failed' ? '❌ 失败' : '⏸️ 部分完成'}\n`

      // 发送最终消息
      const finalMessage: MCPMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: currentContent,
        timestamp: Date.now(),
        metadata: {
          ...metadata,
          planId: plan.id,
          executionSummary: {
            totalSteps,
            completedSteps,
            failedSteps,
            status: executedPlan.status,
          },
        },
      }

      // 保存到对话历史
      if (!this.conversations.has(conversationId)) {
        this.conversations.set(conversationId, [])
      }
      this.conversations.get(conversationId)!.push(finalMessage)

      // 广播最终消息
      this.broadcastSSEMessage('message', {
        conversationId,
        message: finalMessage,
      })

      console.log(`[MCP Server] Plan execution completed: ${plan.id}`)
    } catch (error) {
      console.error('[MCP Server] Error in streaming plan execution:', error)

      // 发送错误消息
      const errorMessage: MCPMessage = {
        id: this.generateId(),
        role: 'assistant',
        content: `❌ **计划执行失败**: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: Date.now(),
        metadata: { ...metadata, planId: plan.id, error: true },
      }

      // 保存到对话历史
      if (!this.conversations.has(conversationId)) {
        this.conversations.set(conversationId, [])
      }
      this.conversations.get(conversationId)!.push(errorMessage)

      // 广播错误消息
      this.broadcastSSEMessage('message', {
        conversationId,
        message: errorMessage,
      })
    }
  }

  private async handleStreamingRequest(
    req: any,
    res: any,
    messages: any[],
    model: string,
    metadata: any,
    conversationId: string,
    enabledMCPServers: EnabledMCPServer[],
  ) {
    // 设置流式响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })

    const responseId = this.generateId()
    const created = Math.floor(Date.now() / 1000)

    try {
      if (model) {
        const response = await this.callAIGC(messages, true, model, enabledMCPServers, metadata)
        let fullContent = ''

        response.data.on('data', (chunk: Buffer) => {
          const chunkStr = chunk.toString()
          const lines = chunkStr.split('\n')

          for (const line of lines) {
            if (!line.trim()) {
              continue // 跳过空行
            }

            try {
              let jsonStr = ''
              let data: any = null

              // 查找第一个 { 的位置，从那里开始截取 JSON
              const jsonStart = line.indexOf('{')
              if (jsonStart !== -1) {
                jsonStr = line.substring(jsonStart)
                // 尝试解析 JSON
                if (jsonStr.startsWith('{') && jsonStr.includes('}')) {
                  data = JSON.parse(jsonStr)
                }
              }

              if (!data) {
                continue // 如果没有找到有效的 JSON，跳过这行
              }

              let deltaContent = ''

              // 优先使用标准的 delta.content 格式
              if (data.choices?.[0]?.delta?.content) {
                deltaContent = data.choices[0].delta.content
              }
              // 如果没有 delta.content，则忽略 data.content（避免重复）

              if (deltaContent) {
                fullContent += deltaContent

                // 转换为标准格式并发送
                const standardChunk: MCPStreamChunk = {
                  id: responseId,
                  object: 'chat.completion.chunk',
                  created,
                  model,
                  choices: [{
                    index: 0,
                    delta: {
                      content: deltaContent,
                    },
                    finish_reason: data.choices?.[0]?.finish_reason || (data.lastOne ? 'stop' : null),
                  }],
                }

                res.write(`data: ${JSON.stringify(standardChunk)}\n\n`)
              }
            } catch (parseError) {
              console.error('[MCP Server] Error parsing stream chunk:', parseError)
              console.error('Problematic line:', line)
            }
          }
        })

        response.data.on('end', () => {
          // 发送结束标记
          const finalChunk: MCPStreamChunk = {
            id: responseId,
            object: 'chat.completion.chunk',
            created,
            model,
            choices: [{
              index: 0,
              delta: {},
              finish_reason: 'stop',
            }],
          }

          res.write(`data: ${JSON.stringify(finalChunk)}\n\n`)
          res.write('data: [DONE]\n\n')
          res.end()

          // 保存完整消息到对话历史
          const assistantMessage: MCPMessage = {
            id: responseId,
            role: 'assistant',
            content: fullContent,
            timestamp: Date.now(),
            metadata: { model },
          }

          if (!this.conversations.has(conversationId)) {
            this.conversations.set(conversationId, [])
          }
          this.conversations.get(conversationId)!.push(assistantMessage)
        })

        response.data.on('error', (error: any) => {
          console.error('[MCP Server] Stream error:', error)
          res.write('data: {\'error\': \'Stream error\'}\n\n')
          res.end()
        })

      } else {
        // 回退到模拟响应
        const fullResponse = this.generateMockResponse(messages[messages.length - 1]?.content || '')
        const words = fullResponse.split('')
        let index = 0

        const streamInterval = setInterval(() => {
          if (index < words.length) {
            const chunk: MCPStreamChunk = {
              id: responseId,
              object: 'chat.completion.chunk',
              created,
              model,
              choices: [{
                index: 0,
                delta: {
                  content: words[index],
                },
                finish_reason: null,
              }],
            }

            res.write(`data: ${JSON.stringify(chunk)}\n\n`)
            index++
          } else {
            // 发送结束标记
            const finalChunk: MCPStreamChunk = {
              id: responseId,
              object: 'chat.completion.chunk',
              created,
              model,
              choices: [{
                index: 0,
                delta: {},
                finish_reason: 'stop',
              }],
            }

            res.write(`data: ${JSON.stringify(finalChunk)}\n\n`)
            res.write('data: [DONE]\n\n')
            res.end()
            clearInterval(streamInterval)

            // 保存完整消息到对话历史
            const assistantMessage: MCPMessage = {
              id: responseId,
              role: 'assistant',
              content: fullResponse,
              timestamp: Date.now(),
              metadata,
            }

            if (!this.conversations.has(conversationId)) {
              this.conversations.set(conversationId, [])
            }
            this.conversations.get(conversationId)!.push(assistantMessage)
          }
        }, 50)

        // 处理客户端断开连接
        req.on('close', () => {
          clearInterval(streamInterval)
        })
      }
    } catch (error) {
      console.error('[MCP Server] Error in streaming request:', error)
      res.write('data: {\'error\': \'API call failed\'}\n\n')
      res.end()
    }

    // 处理客户端断开连接
    req.on('close', () => {
      // 清理资源
    })
  }

  private async handleNonStreamingRequest(
    _req: any,
    res: any,
    messages: any[],
    model: string,
    metadata: any,
    conversationId: string,
    enabledMCPServers: EnabledMCPServer[],
  ) {
    const responseId = this.generateId()
    const created = Math.floor(Date.now() / 1000)
    let responseContent = ''

    try {
      if (model) {
        const response = await this.callAIGC(messages, false, model, enabledMCPServers, null)
        responseContent = response.data.choices[0].message.content
      } else {
        // 回退到模拟响应
        await new Promise(resolve => setTimeout(resolve, 1000))
        responseContent = this.generateMockResponse(messages[messages.length - 1]?.content || '')
      }
    } catch (error) {
      console.error('[MCP Server] Error in non-streaming request:', error)
      // 回退到模拟响应
      responseContent = this.generateMockResponse(messages[messages.length - 1]?.content || '')
    }

    const response = {
      id: responseId,
      object: 'chat.completion',
      created,
      model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: responseContent,
        },
        finish_reason: 'stop',
      }],
      usage: {
        prompt_tokens: this.estimateTokens(messages.map((m: any) => m.content).join(' ')),
        completion_tokens: this.estimateTokens(responseContent),
        total_tokens: 0,
      },
    }

    response.usage.total_tokens = response.usage.prompt_tokens + response.usage.completion_tokens

    // 保存到对话历史
    const assistantMessage: MCPMessage = {
      id: responseId,
      role: 'assistant',
      content: responseContent,
      timestamp: Date.now(),
      metadata,
    }

    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, [])
    }
    this.conversations.get(conversationId)!.push(assistantMessage)

    res.json(response)
  }

  private async generateMCPResponse(userMessage: MCPMessage, conversationId: string, enabledMCPServers: EnabledMCPServer[], metadata: any) {
    const assistantMessageId = this.generateId()

    try {
      if (metadata && metadata.model) {
        // 获取对话历史，构建完整的消息上下文
        const conversationHistory = this.conversations.get(conversationId) || []
        const messages = conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
        }))

        console.log('[MCP Server] Calling AIGC API for MCP chat...')

        // 调用 AIGC API（可能包含工具调用）
        const response = await this.callAIGC(messages, true, metadata.model, enabledMCPServers, metadata)

        console.log('[MCP Server] Response type:', typeof response.data)

        // 检查是否是流式响应还是普通响应（工具调用返回普通响应）
        if (response.data && typeof response.data.on === 'function') {
          // 流式响应处理
          let fullContent = ''

          response.data.on('data', (chunk: Buffer) => {
            const chunkStr = chunk.toString()
            const lines = chunkStr.split('\n')

            log('[MCP Server] Received chunk:', chunkStr)

            for (const line of lines) {
              if (!line.trim()) {
                continue // 跳过空行
              }

              try {
                let jsonStr = ''
                let data: any = null

                // 查找第一个 { 的位置，从那里开始截取 JSON
                const jsonStart = line.indexOf('{')
                if (jsonStart !== -1) {
                  jsonStr = line.substring(jsonStart)
                  // 尝试解析 JSON
                  if (jsonStr.startsWith('{') && jsonStr.includes('}')) {
                    data = JSON.parse(jsonStr)
                  }
                }

                if (!data) {
                  continue // 如果没有找到有效的 JSON，跳过这行
                }

                log('[MCP Server] Parsed data:', data.choices?.[0]?.delta)
                let deltaContent = ''

                // 优先使用标准的 delta.content 格式
                if (data.choices?.[0]?.delta?.content) {
                  deltaContent = data.choices[0].delta.content
                }
                log('[MCP Server] Delta content:', deltaContent)
                // 如果没有 delta.content，则忽略 data.content（避免重复）

                if (deltaContent !== '') {
                  fullContent += deltaContent

                  // 实时广播流式内容
                  this.broadcastSSEMessage('streaming', {
                    conversationId,
                    messageId: assistantMessageId,
                    role: 'assistant',
                    content: fullContent,
                    timestamp: Date.now(),
                    isComplete: false,
                  })
                }
              } catch (parseError) {
                console.error('[MCP Server] Error parsing MCP stream chunk:', parseError)
                console.error('Problematic line:', line)
              }
            }
          })

          response.data.on('end', () => {
            // 创建完整的助手消息
            const assistantMessage: MCPMessage = {
              id: assistantMessageId,
              role: 'assistant',
              content: fullContent,
              timestamp: Date.now(),
              metadata: {
                model: metadata.model,
                stream: true,
              },
            }

            // 保存到对话历史
            this.conversations.get(conversationId)!.push(assistantMessage)

            // 发送完整消息
            this.broadcastSSEMessage('message', {
              conversationId,
              message: {
                ...assistantMessage,
                isComplete: true,
              },
            })

            console.log('[MCP Server] AIGC API response completed for MCP chat')
          })

          response.data.on('error', (error: any) => {
            console.error('[MCP Server] AIGC API stream error in MCP chat:', error)
            // 回退到模拟响应
            this.generateMockMCPResponse(userMessage, conversationId, assistantMessageId)
          })

        } else {
          // 普通响应处理（工具调用的情况）
          console.log('[MCP Server] Handling non-streaming response (tool calling)', JSON.stringify(response, null, 2))

          const content = response.data.choices?.[0]?.message?.content || '抱歉，我无法处理您的请求。'

          // 模拟流式输出效果
          this.simulateStreamingFromContent(content, conversationId, assistantMessageId)
        }

      } else {
        // 回退到模拟响应
        this.generateMockMCPResponse(userMessage, conversationId, assistantMessageId)
      }
    } catch (error) {
      console.error('[MCP Server] Error in generateMCPResponse:', error)
      // 回退到模拟响应
      this.generateMockMCPResponse(userMessage, conversationId, assistantMessageId)
    }
  }

  // 新增方法：将普通响应内容模拟成流式输出
  private simulateStreamingFromContent(content: string, conversationId: string, assistantMessageId: string) {
    const words = content.split('')
    let currentContent = ''
    let index = 0

    const streamInterval = setInterval(() => {
      if (index < words.length) {
        currentContent += words[index]

        // 实时广播流式内容
        this.broadcastSSEMessage('streaming', {
          conversationId,
          messageId: assistantMessageId,
          role: 'assistant',
          content: currentContent,
          timestamp: Date.now(),
          isComplete: false,
        })

        index++
      } else {
        // 创建完整的助手消息
        const assistantMessage: MCPMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: content,
          timestamp: Date.now(),
          metadata: {
            model: 'default',
            stream: false,
          },
        }

        // 保存到对话历史
        this.conversations.get(conversationId)!.push(assistantMessage)

        // 发送完整消息
        this.broadcastSSEMessage('message', {
          conversationId,
          message: {
            ...assistantMessage,
            isComplete: true,
          },
        })

        console.log('[MCP Server] Tool calling response completed for MCP chat')
        clearInterval(streamInterval)
      }
    }, 30) // 30ms 间隔，快速打字效果
  }

  private generateMockMCPResponse(userMessage: MCPMessage, conversationId: string, assistantMessageId?: string) {
    const responses = [
      '我理解您的问题。作为 MCP 服务器，我可以为您提供详细的分析...',
      '这是一个很有趣的话题！基于 MCP 协议的处理能力...',
      '感谢您使用 MCP 服务。根据您的输入...',
      '让我通过 MCP 服务器为您详细解释这个问题...',
      '基于 MCP 协议的智能分析，这个问题涉及到几个方面...',
    ]

    const randomResponse = responses[Math.floor(Math.random() * responses.length)]
    const fullResponse = `${randomResponse}\n\n针对您提到的"${userMessage.content}"，我的回答是：${this.generateMockResponse(userMessage.content)}`

    const assistantMessage: MCPMessage = {
      id: assistantMessageId || this.generateId(),
      role: 'assistant',
      content: fullResponse,
      timestamp: Date.now(),
      metadata: {
        model: 'mcp-default',
        stream: false,
      },
    }

    // 保存到对话历史
    this.conversations.get(conversationId)!.push(assistantMessage)

    // 模拟流式回复
    this.simulateStreamingResponse(assistantMessage, conversationId)
  }

  private simulateStreamingResponse(message: MCPMessage, conversationId: string) {
    const words = message.content.split('')
    let currentContent = ''
    let index = 0

    const streamInterval = setInterval(() => {
      if (index < words.length) {
        currentContent += words[index]

        // 广播部分内容
        this.broadcastSSEMessage('streaming', {
          conversationId,
          messageId: message.id,
          role: message.role,
          content: currentContent,
          timestamp: message.timestamp,
          isComplete: false,
        })

        index++
      } else {
        // 发送完整消息
        this.broadcastSSEMessage('message', {
          conversationId,
          message: {
            ...message,
            isComplete: true,
          },
        })
        clearInterval(streamInterval)
      }
    }, 30) // 30ms 间隔，更快的打字效果
  }

  private generateMockResponse(input: string): string {
    const templates = [
      `基于您的输入"${input}"，我认为这是一个需要深入分析的问题。`,
      `关于"${input}"这个话题，我可以从多个角度来为您解答。`,
      `您提到的"${input}"确实很有意思，让我为您详细说明。`,
      `针对"${input}"，我建议我们可以这样来理解和处理。`,
    ]

    const template = templates[Math.floor(Math.random() * templates.length)]
    const additionalContent = [
      '首先，我们需要理解问题的核心所在。',
      '其次，我们可以考虑多种解决方案。',
      '最后，我建议采用渐进式的方法来处理。',
      '希望这个回答对您有所帮助！',
    ].join('\n\n')

    return `${template}\n\n${additionalContent}`
  }

  private sendSSEMessage(client: any, event: string, data: any) {
    try {
      client.write(`event: ${event}\n`)
      client.write(`data: ${JSON.stringify(data)}\n\n`)
    } catch (error) {
      console.error('[MCP Server] Error sending SSE message:', error)
      this.clients.delete(client)
    }
  }

  private broadcastSSEMessage(event: string, data: any) {
    const deadClients: any[] = []

    this.clients.forEach(client => {
      try {
        this.sendSSEMessage(client, event, data)
      } catch (error) {
        console.error('[MCP Server] Error broadcasting SSE message:', error)
        deadClients.push(client)
      }
    })

    // 清理断开的连接
    deadClients.forEach(client => {
      this.clients.delete(client)
    })
  }

  private generateId(): string {
    return `mcp_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`
  }

  private estimateTokens(text: string): number {
    // 简单的 token 估算：大约 4 个字符 = 1 个 token
    return Math.ceil(text.length / 4)
  }
  private async handleToolCallingWithLangchain(
    messages: any[],
    stream: boolean,
    model: string,
    enabledMCPServers: EnabledMCPServer[],
    metadata: any,
  ): Promise<any> {
    try {
      console.log('[MCP Server] Using langchain for tool calling')

      // 初始化 MCP 客户端
      const mcpClient = await StdioMcpClientToFunction.getInstance(enabledMCPServers)
      await mcpClient.fetchAllMcpServerData()

      // 检查是否有可用的工具
      if (!mcpClient.allMcpServer?.tools || mcpClient.allMcpServer.tools.length === 0) {
        console.log('[MCP Server] No MCP tools available, falling back to direct API call')
        return this.callAIGC(messages, stream, model, [], metadata)
      }
      // 创建 ChatOpenAI 实例，使用AIGC 配置
      const baseURL = metadata.service.apiUrl
      console.log('[MCP Server] LangChain configuration:')
      console.log('  - baseURL:', baseURL)
      console.log('  - model:', model)

      const llm = new ChatOpenAI({
        openAIApiKey: metadata.service.apiKey,
        configuration: {
          baseURL,
        },
        model,
        temperature: 0.7,
        maxTokens: 2000,
        streaming: true,
      })

      // 将 MCP 工具转换为 langchain 工具
      const langchainTools: DynamicTool[] = []

      console.log('mcpClient.allMcpServer.tools', mcpClient?.allMcpServer.tools)

      if (mcpClient.allMcpServer?.tools) {
        for (const mcpTool of mcpClient.allMcpServer.tools) {
          const dynamicTool = new DynamicTool({
            name: mcpTool.name,
            description: mcpTool.description || `MCP tool: ${mcpTool.name}`,
            func: async (input: string) => {
              try {
                // 解析输入参数
                let args = {}
                try {
                  args = JSON.parse(input)
                } catch {
                  // 如果不是 JSON，直接作为字符串参数
                  args = { input }
                }

                // 调用 MCP 工具
                const result = await mcpClient.callTool(mcpTool.name, args)
                return JSON.stringify(result)
              } catch (error) {
                console.error(`[MCP Server] Error calling tool ${mcpTool.name}:`, error)
                return `Error calling tool: ${error instanceof Error ? error.message : 'Unknown error'}`
              }
            },
          })
          langchainTools.push(dynamicTool)
        }
      }

      // 绑定工具到 LLM
      const llmWithTools = llm.bindTools(langchainTools)

      log('[MCP Server] 绑定工具到 LLM', llmWithTools)
      log('[MCP Server] 创建代理', llmWithTools)
      // 转换消息格式
      const langchainMessages = messages.map((msg: any) => {
        switch (msg.role) {
        case 'user':
          return new HumanMessage(msg.content)
        case 'assistant':
          return new AIMessage(msg.content)
        default:
          return new HumanMessage(msg.content)
        }
      })

      // 调用 LLM
      const response = await llmWithTools.invoke(langchainMessages)

      // 处理工具调用
      if (response.tool_calls && response.tool_calls.length > 0) {
        const toolMessages: ToolMessage[] = []

        for (const toolCall of response.tool_calls) {
          try {
            const toolResult = await mcpClient.callTool(toolCall.name, toolCall.args)
            toolMessages.push(new ToolMessage({
              content: JSON.stringify(toolResult),
              tool_call_id: toolCall.id || 'unknown',
            }))
          } catch (error) {
            console.error(`[MCP Server] Error executing tool ${toolCall.name}:`, error)
            toolMessages.push(new ToolMessage({
              content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              tool_call_id: toolCall.id || 'unknown',
            }))
          }
        }

        // 如果有工具调用，需要再次调用 LLM 获取最终回复
        const finalMessages = [...langchainMessages, response, ...toolMessages]
        const finalResponse = await llmWithTools.invoke(finalMessages)

        // 转换为标准格式返回
        return {
          data: {
            choices: [{
              message: {
                role: 'assistant',
                content: finalResponse.content,
              },
              finish_reason: 'stop',
            }],
          },
        }
      }

      // 没有工具调用，直接返回响应
      return {
        data: {
          choices: [{
            message: {
              role: 'assistant',
              content: response.content,
            },
            finish_reason: 'stop',
          }],
        },
      }
    } catch (error) {
      console.error('[MCP Server] Error in langchain tool calling:', error)
      console.log('[MCP Server] Falling back to direct API call due to langchain error')
      return this.callAIGC(messages, stream, model, [], null)
    }
  }

  private async callAIGC(
    messages: any[],
    stream = false,
    model: string,
    enabledMCPServers: EnabledMCPServer[],
    metadata: any,
  ): Promise<any> {
    if (!model) {
      throw new Error('model 不能为空')
    }
    const apiUrl = metadata.service.apiUrl
    const requestModel = model

    // 如果有工具调用需求，使用 langchain 进行处理
    if (enabledMCPServers && enabledMCPServers.length > 0) {
      try {
        return await this.handleToolCallingWithLangchain(messages, stream, requestModel, enabledMCPServers, metadata)
      } catch (error) {
        console.error('[MCP Server] Tool calling failed, falling back to direct API call:', error)
        // 继续执行直接API调用
      }
    }

    const requestData = {
      model: requestModel,
      messages,
      stream,
    }

    const headers = {
      'Authorization': `Bearer ${metadata.service.apiKey}`,
      'Content-Type': 'application/json',
    }

    try {
      const response = await axios.post(apiUrl, requestData, {
        headers,
        responseType: stream ? 'stream' : 'json',
      })

      return response
    } catch (error) {
      console.error('[MCP Server] Error calling AIGC API:', error)
      throw error
    }
  }

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

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        // 关闭所有 SSE 连接
        this.clients.forEach(client => {
          try {
            client.end()
          } catch (error) {
            console.error('[MCP Server] Error closing client connection:', error)
          }
        })
        this.clients.clear()

        this.server.close(() => {
          console.log('[MCP Server] Stopped')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  public getStats() {
    return {
      connectedClients: this.clients.size,
      totalConversations: this.conversations.size,
      totalMessages: Array.from(this.conversations.values()).reduce((sum, msgs) => sum + msgs.length, 0),
      port: this.port,
      config: this.config,
    }
  }

  public getConversations() {
    return Array.from(this.conversations.entries()).map(([id, messages]) => ({
      id,
      messages,
      messageCount: messages.length,
      lastActivity: messages[messages.length - 1]?.timestamp || 0,
    }))
  }
}
