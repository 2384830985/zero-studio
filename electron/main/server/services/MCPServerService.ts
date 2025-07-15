import { MCPServerInfo } from '../types'

/**
 * MCP服务器管理服务类
 * 负责管理启用的MCP服务器
 */
export class MCPServerService {
  private enabledMCPServers: Map<string, MCPServerInfo> = new Map()

  /**
   * 初始化启用的MCP服务器
   */
  initializeEnabledMCPServers(servers: MCPServerInfo[] = []): void {
    try {
      if (servers.length > 0) {
        servers.forEach(server => {
          this.enabledMCPServers.set(server.id, {
            ...server,
            lastActivity: Date.now(),
          })
        })
        console.log(`[MCP Server Service] Initialized ${this.enabledMCPServers.size} enabled MCP servers`)
      } else {
        console.log('[MCP Server Service] No enabled MCP servers configured')
      }
    } catch (error) {
      console.error('[MCP Server Service] Failed to initialize enabled MCP servers:', error)
    }
  }

  /**
   * 获取所有启用的MCP服务器
   */
  getAllServers(): MCPServerInfo[] {
    return Array.from(this.enabledMCPServers.values())
  }

  /**
   * 获取特定MCP服务器
   */
  getServer(serverId: string): MCPServerInfo | undefined {
    return this.enabledMCPServers.get(serverId)
  }

  /**
   * 添加新的MCP服务器
   */
  addServer(serverInfo: MCPServerInfo): { success: boolean; server?: MCPServerInfo; error?: string } {
    try {
      if (!serverInfo.id || !serverInfo.name) {
        return { success: false, error: 'Server ID and name are required' }
      }

      if (this.enabledMCPServers.has(serverInfo.id)) {
        return { success: false, error: 'Server with this ID already exists' }
      }

      const newServer: MCPServerInfo = {
        ...serverInfo,
        status: serverInfo.status || 'inactive',
        lastActivity: Date.now(),
      }

      this.enabledMCPServers.set(serverInfo.id, newServer)
      console.log(`[MCP Server Service] Added new MCP server: ${serverInfo.name} (${serverInfo.id})`)

      return { success: true, server: newServer }
    } catch (error) {
      console.error('[MCP Server Service] Error adding MCP server:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 更新MCP服务器信息
   */
  updateServer(serverId: string, updateInfo: Partial<MCPServerInfo>): { success: boolean; server?: MCPServerInfo; error?: string } {
    try {
      const existingServer = this.enabledMCPServers.get(serverId)
      if (!existingServer) {
        return { success: false, error: 'MCP server not found' }
      }

      const updatedServer: MCPServerInfo = {
        ...existingServer,
        ...updateInfo,
        id: serverId, // 确保ID不被修改
        lastActivity: Date.now(),
      }

      this.enabledMCPServers.set(serverId, updatedServer)
      console.log(`[MCP Server Service] Updated MCP server: ${updatedServer.name} (${serverId})`)

      return { success: true, server: updatedServer }
    } catch (error) {
      console.error('[MCP Server Service] Error updating MCP server:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 删除MCP服务器
   */
  removeServer(serverId: string): { success: boolean; removedServer?: MCPServerInfo; error?: string } {
    try {
      const server = this.enabledMCPServers.get(serverId)
      if (!server) {
        return { success: false, error: 'MCP server not found' }
      }

      this.enabledMCPServers.delete(serverId)
      console.log(`[MCP Server Service] Removed MCP server: ${server.name} (${serverId})`)

      return { success: true, removedServer: server }
    } catch (error) {
      console.error('[MCP Server Service] Error removing MCP server:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 更新MCP服务器状态
   */
  updateServerStatus(serverId: string, status: 'active' | 'inactive' | 'error'): { success: boolean; server?: MCPServerInfo; error?: string } {
    try {
      const server = this.enabledMCPServers.get(serverId)
      if (!server) {
        return { success: false, error: 'MCP server not found' }
      }

      const updatedServer: MCPServerInfo = {
        ...server,
        status,
        lastActivity: Date.now(),
      }

      this.enabledMCPServers.set(serverId, updatedServer)
      console.log(`[MCP Server Service] Updated status of MCP server ${server.name} to ${status}`)

      return { success: true, server: updatedServer }
    } catch (error) {
      console.error('[MCP Server Service] Error updating MCP server status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 获取MCP服务器统计信息
   */
  getServerStats() {
    const servers = Array.from(this.enabledMCPServers.values())
    return {
      total: servers.length,
      active: servers.filter(s => s.status === 'active').length,
      inactive: servers.filter(s => s.status === 'inactive').length,
      error: servers.filter(s => s.status === 'error').length,
      lastUpdated: Date.now(),
    }
  }

  /**
   * 获取服务器数量
   */
  getServerCount(): number {
    return this.enabledMCPServers.size
  }
}
