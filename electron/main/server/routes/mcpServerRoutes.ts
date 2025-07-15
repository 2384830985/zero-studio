import { MCPServerService } from '../services/MCPServerService'
// import { MCPServerInfo } from '../types'

export class MCPServerRoutes {
  private mcpServerService: MCPServerService

  constructor(mcpServerService: MCPServerService) {
    this.mcpServerService = mcpServerService
    // this.setupRoutes()
  }

  // private setupRoutes() {
  //   // 获取所有启用的 MCP 服务器列表
  //   this.router.get('/mcp/servers', (req, res) => this.getAllServers(req, res))
  //
  //   // 获取特定 MCP 服务器信息
  //   this.router.get('/mcp/servers/:serverId', (req, res) => this.getServer(req, res))
  //
  //   // 添加新的 MCP 服务器
  //   this.router.post('/mcp/servers', (req, res) => this.addServer(req, res))
  //
  //   // 更新 MCP 服务器信息
  //   this.router.put('/mcp/servers/:serverId', (req, res) => this.updateServer(req, res))
  //
  //   // 删除 MCP 服务器
  //   this.router.delete('/mcp/servers/:serverId', (req, res) => this.removeServer(req, res))
  //
  //   // 更新 MCP 服务器状态
  //   this.router.patch('/mcp/servers/:serverId/status', (req, res) => this.updateServerStatus(req, res))
  //
  //   // 获取 MCP 服务器统计信息
  //   this.router.get('/mcp/servers/stats', (req, res) => this.getServerStats(req, res))
  // }
  //
  // private getAllServers(req: Request, res: Response) {
  //   const servers = this.mcpServerService.getAllServers()
  //   // res.json({
  //   //   servers,
  //   //   total: servers.length,
  //   //   timestamp: Date.now(),
  //   // })
  // }
  //
  // private getServer(req: Request, res: Response) {
  //   const { serverId } = req.params
  //   const server = this.mcpServerService.getServer(serverId)
  //
  //   if (!server) {
  //     return res.status(404).json({ error: 'MCP server not found' })
  //   }
  //
  //   res.json({ server })
  // }
  //
  // private addServer(req: Request, res: Response) {
  //   const serverInfo: MCPServerInfo = req.body
  //   const result = this.mcpServerService.addServer(serverInfo)
  //
  //   if (!result.success) {
  //     return res.status(result.error === 'Server with this ID already exists' ? 409 : 400)
  //       .json({ error: result.error })
  //   }
  //
  //   res.json(result)
  // }
  //
  // private updateServer(req: Request, res: Response) {
  //   const { serverId } = req.params
  //   const updateInfo = req.body
  //   const result = this.mcpServerService.updateServer(serverId, updateInfo)
  //
  //   if (!result.success) {
  //     return res.status(404).json({ error: result.error })
  //   }
  //
  //   res.json(result)
  // }
  //
  // private removeServer(req: Request, res: Response) {
  //   const { serverId } = req.params
  //   const result = this.mcpServerService.removeServer(serverId)
  //
  //   if (!result.success) {
  //     return res.status(404).json({ error: result.error })
  //   }
  //
  //   res.json(result)
  // }
  //
  // private updateServerStatus(req: Request, res: Response) {
  //   const { serverId } = req.params
  //   const { status } = req.body
  //
  //   if (!['active', 'inactive', 'error'].includes(status)) {
  //     return res.status(400).json({ error: 'Invalid status. Must be active, inactive, or error' })
  //   }
  //
  //   const result = this.mcpServerService.updateServerStatus(serverId, status)
  //
  //   if (!result.success) {
  //     return res.status(404).json({ error: result.error })
  //   }
  //
  //   res.json(result)
  // }
  //
  // private getServerStats(req: Request, res: Response) {
  //   const stats = this.mcpServerService.getServerStats()
  //   res.json({ stats })
  // }
  //
  // getRouter(): Router {
  //   return this.router
  // }
}
