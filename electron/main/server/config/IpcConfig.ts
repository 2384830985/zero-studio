/**
 * IPC 配置管理
 * 集中管理所有 IPC 相关的配置信息
 */

/**
 * IPC 路由配置
 */
export interface IpcRouteConfig {
  /** 路由名称 */
  name: string
  /** 路由描述 */
  description: string
  /** 是否启用 */
  enabled: boolean
  /** 是否仅在开发环境启用 */
  developmentOnly?: boolean
}

/**
 * 所有 IPC 路由的配置
 */
export const IPC_ROUTES_CONFIG: Record<string, IpcRouteConfig> = {
  chat: {
    name: 'ChatIpcRoutes',
    description: '聊天系统 - 处理 AI 对话、ReAct 模式和计划模式',
    enabled: true,
  },
  mcp: {
    name: 'McpIpcRoutes',
    description: 'MCP 连接 - 处理 Model Context Protocol 服务器连接',
    enabled: true,
  },
  vectorDB: {
    name: 'VectorDBIpcRoutes',
    description: 'LanceDB 向量数据库 - 处理文档存储、搜索和管理',
    enabled: true,
  },
  runtime: {
    name: 'RuntimeIpcRoutes',
    description: '执行环境管理 - 处理运行时安装、版本检查等',
    enabled: true,
  },
  webSearch: {
    name: 'WebSearchIpcRoutes',
    description: '网络搜索 - 处理多引擎网络搜索功能',
    enabled: true,
  },
  window: {
    name: 'WindowIpcRoutes',
    description: '窗口管理 - 处理窗口创建和管理',
    enabled: true,
  },
  debug: {
    name: 'DebugIpcRoutes',
    description: '开发调试工具 - 处理开发环境下的调试功能',
    enabled: true,
    developmentOnly: true,
  },
}

/**
 * 获取启用的路由配置
 * @param isDevelopment 是否为开发环境
 * @returns 启用的路由配置列表
 */
export function getEnabledRoutes(isDevelopment = false): IpcRouteConfig[] {
  return Object.values(IPC_ROUTES_CONFIG).filter(config => {
    if (!config.enabled) {
      return false
    }
    if (config.developmentOnly && !isDevelopment) {
      return false
    }
    return true
  })
}

/**
 * 日志配置
 */
export const IPC_LOG_CONFIG = {
  /** 是否启用详细日志 */
  verbose: process.env.NODE_ENV === 'development',
  /** 日志前缀 */
  prefix: '[IPC]',
  /** 是否记录路由注册信息 */
  logRouteRegistration: true,
  /** 是否记录路由清理信息 */
  logRouteCleanup: true,
}
