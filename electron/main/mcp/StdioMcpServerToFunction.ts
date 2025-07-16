import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import type { Tool, Prompt, Resource } from '@modelcontextprotocol/sdk/types.js'
// import { SSEClientTransport, SSEClientTransportOptions } from '@modelcontextprotocol/sdk/client/sse.js'
// import {
//   StreamableHTTPClientTransport,
//   type StreamableHTTPClientTransportOptions,
// } from '@modelcontextprotocol/sdk/client/streamableHttp'
import { log } from 'console'
import {getBinaryPath} from '../utils/process'
import path from 'node:path'
import os from 'node:os'
import getLoginShellEnvironment from '../utils/shell-env'

// 定义mcp server配置类型
export interface McpServerConfig {
    command: string;
    args: string[];
    env: {
        [key: string]: string;
    };
    disabled: boolean;
    autoApprove: string[];
    timeout: number;
}

// 定义从请求中传入的 MCP 服务器配置类型
export interface EnabledMCPServer {
    id: string;
    name: string;
    description?: string;
    enabled: boolean;
    type: string;
    command: string;
    args: string[];
    env?: {
        [key: string]: string;
    };
    tools?: any[];
    timeout?: number;
    retryCount?: number;
    color?: string;
    createdAt?: number;
    updatedAt?: number;
}
// 定义mcp client配置类型
export interface McpClientConfig {
    mcpClient: {
        name: string;
        version: string;
    };
    mcpServers: {
        [serverName: string]: McpServerConfig;
    };
}

export interface AllMcpServerI {
  tools: Tool[];
  funcTools: OpenAiFunctionI[];
  resources: Resource[];
  prompts: Prompt[];
}

export interface OpenAiFunctionI{
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters?: {
      type: 'object' | 'array';
      properties?: Record<string, any>;
      required?: string[];
    } | null;
  };
}


/**
 * StdioMcpClientToFunction 类
 *
 * 管理与 MCP 服务器的通信，提供工具调用、资源访问等功能。
 * 通过单例模式确保全局只有一个实例。
 */
export class StdioMcpClientToFunction {
  /** MCP 客户端配置 */
  private config: McpClientConfig

  /** MCP 服务器的传输实例数组 */
  private transports: StdioClientTransport[] = []

  /** MCP 客户端实例数组 */
  private clients: Client[] = []

  /** 工具列表 */
  private tools: Tool[] = []

  private funcTools: OpenAiFunctionI[] = []

  /** 资源列表 */
  private resources: Resource[] = []

  /** 提示列表 */
  private prompts: Prompt[] = []

  /** 缓存的所有 MCP 服务器信息 */
  public allMcpServer: AllMcpServerI | null = null

  /** 单例实例 */
  private static instance: StdioMcpClientToFunction

  /** 当前使用的 MCP 服务器配置 */
  private currentEnabledServers: EnabledMCPServer[] = []

  /**
   * 私有构造函数
   *
   * 初始化配置文件，解析路径并建立与 MCP 服务器的连接。
   */
  private constructor(enabledMCPServers: EnabledMCPServer[]) {
    this.config = this.createConfigFromEnabledServers(enabledMCPServers)
    this.currentEnabledServers = enabledMCPServers
  }

  /**
   * 获取单例实例
   *
   * @param {EnabledMCPServer[]} [enabledMCPServers] 可选的启用MCP服务器配置
   * @returns {StdioMcpClientToFunction} 单例实例
   */
  static async getInstance(enabledMCPServers: EnabledMCPServer[]): Promise<StdioMcpClientToFunction> {
    // 如果传入了新的配置，或者实例不存在，则重新创建实例
    if (!this.instance || (enabledMCPServers && enabledMCPServers.length > 0)) {
      this.instance = new StdioMcpClientToFunction(enabledMCPServers)
      await this.instance.initializeMcpServerConnections()
    }
    return this.instance
  }

  /**
   * 重新初始化 MCP 服务器连接
   *
   * @param {EnabledMCPServer[]} enabledMCPServers 新的启用MCP服务器配置
   */
  async reinitialize(enabledMCPServers: EnabledMCPServer[]): Promise<void> {
    // 清理现有连接
    await this.cleanup()

    // 重新设置配置
    this.config = this.createConfigFromEnabledServers(enabledMCPServers)
    this.currentEnabledServers = enabledMCPServers

    // 重新初始化连接
    this.initializeMcpServerConnections()

    // 清除缓存，强制重新获取数据
    this.allMcpServer = null
  }

  /**
   * 从启用的 MCP 服务器配置创建 McpClientConfig
   *
   * @param {EnabledMCPServer[]} enabledServers 启用的 MCP 服务器配置
   * @returns {McpClientConfig} 转换后的配置
   */
  private createConfigFromEnabledServers(enabledServers: EnabledMCPServer[]): McpClientConfig {
    const mcpServers: { [serverName: string]: McpServerConfig } = {}

    enabledServers
      .filter(server => server.enabled && server.type === 'stdio')
      .forEach(server => {
        mcpServers[server.id] = {
          command: server.command,
          args: server.args,
          env: server.env || {},
          disabled: false,
          autoApprove: [],
          timeout: server.timeout || 30000,
        }
      })

    return {
      mcpClient: {
        name: 'mcp-client',
        version: '1.0.0',
      },
      mcpServers,
    }
  }

  /**
   * 清理现有的 MCP 连接
   */
  private async cleanup(): Promise<void> {
    try {
      // 关闭所有客户端连接
      for (const client of this.clients) {
        try {
          await client.close()
        } catch (error) {
          console.error('关闭 MCP 客户端时出错:', error)
        }
      }

      // 关闭所有传输连接
      for (const transport of this.transports) {
        try {
          await transport.close()
        } catch (error) {
          console.error('关闭 MCP 传输时出错:', error)
        }
      }

      // 清空数组
      this.clients = []
      this.transports = []
      this.tools = []
      this.funcTools = []
      this.resources = []
      this.prompts = []
    } catch (error) {
      console.error('清理 MCP 连接时出错:', error)
    }
  }

  private getLoginShellEnv = async (): Promise<Record<string, string>> => {
    try {
      const loginEnv = await getLoginShellEnvironment()
      const pathSeparator = process.platform === 'win32' ? ';' : ':'
      const cherryBinPath = path.join(os.homedir(), '.bigBrother', 'bin')
      loginEnv.PATH = `${loginEnv.PATH}${pathSeparator}${cherryBinPath}`
      console.info('[MCP] Successfully fetched login shell environment variables:')
      return loginEnv
    } catch (error) {
      console.error('[MCP] Failed to fetch login shell environment variables:', error)
      return {}
    }
  }

  private removeProxyEnv(env: Record<string, string>) {
    delete env.HTTPS_PROXY
    delete env.HTTP_PROXY
    delete env.grpc_proxy
    delete env.http_proxy
    delete env.https_proxy
  }

  /**
   * 初始化 MCP 服务器连接
   *
   * 为配置中的每个服务器创建传输和客户端实例。
   */
  private async initializeMcpServerConnections() {
    for (const key in this.config.mcpServers) {
      log('his.config.mcpServers', key, this.config.mcpServers)
      // eslint-disable-next-line no-prototype-builtins
      if (this.config.mcpServers?.hasOwnProperty(key)) {
        try {
          log('this.config.mcpServers[key].args', this.config.mcpServers[key])
          const config = this.config.mcpServers[key]
          let cmd = config.command
          // 如果配置的是 npx，检查是否有 bun 可用，否则使用 npx
          if (config.command === 'npx') {
            try {
              cmd = await getBinaryPath('bun')
              console.log(`[MCP] Using bun instead of npx: ${cmd}`)
            } catch (error) {
              console.log(`[MCP] bun not found, using npx: ${config.command}`)
              cmd = config.command
            }
          }
          console.log('cmd', cmd)
          console.info(`[MCP] Starting server with command: ${cmd} ${config.args ? config.args.join(' ') : ''}`)

          const loginShellEnv = await this.getLoginShellEnv()
          if (cmd.includes('bun')) {
            this.removeProxyEnv(loginShellEnv)
          }
          console.log('loginShellEnv', loginShellEnv)

          // add -x to args if args exist
          if (config.args && config.args.length > 0) {
            if (!config.args.includes('-y')) {
              config.args.unshift('-y')
            }
            if (!config.args.includes('x')) {
              config.args.unshift('x')
            }
          }

          console.log('config.args', config.args)

          // 创建传输实例
          const transport = new StdioClientTransport({
            command: cmd,
            args: config.args,
            env: {
              ...loginShellEnv,
              ...(config?.env ? config?.env : {}),
            },
            stderr: 'pipe',
          })

          transport.stderr?.on('data', (data) =>
            console.info('[MCP] Stdio stderr for server ', data.toString()),
          )

          // 添加错误处理
          transport.onerror = (error: Error) => {
            console.error(`[MCP] Transport error for ${key}:`, error)
          }

          transport.onclose = () => {
            console.warn(`[MCP] Transport closed for ${key}`)
          }

          // 创建客户端实例
          const client = new Client({
            name: key || this.config.mcpClient.name || 'mcp-client',
            version: this.config?.mcpClient?.version || '1.0.0',
            capabilities: {},
          })

          this.transports.push(transport)
          this.clients.push(client)
        } catch (error) {
          console.error(`[MCP] 连接 MCP 服务器 ${key} 时出错:`, error)
          console.error('[MCP] 服务器配置:', JSON.stringify(this.config.mcpServers[key], null, 2))
          console.error(`[MCP] 命令: ${this.config.mcpServers[key].command}`)
          console.error(`[MCP] 参数: ${this.config.mcpServers[key].args?.join(' ') || 'none'}`)
        }
      }
    }
  }

  /**
   * 调用 MCP 工具
   *
   * @param {string} toolName 工具名称
   * @param {any} [toolArgs] 工具参数，可选
   * @returns {Promise<any>} 工具调用的结果
   */
  async callTool(toolName: string, toolArgs?: any): Promise<any> {
    console.log(`\n🔧 正在调用工具: ${toolName}`)
    console.log('📝 参数:', JSON.stringify(toolArgs, null, 2))

    // 如果尚未加载所有 MCP 服务器信息，先加载
    if (!this.allMcpServer) {
      await this.fetchAllMcpServerData()
    }

    // 查找工具所属的客户端
    const toolIndex = this.clients.findIndex(() =>
      this.tools.some((tool) => tool.name === toolName),
    )

    if (toolIndex === -1) {
      console.error(`未找到名为 "${toolName}" 的工具。`)
      return null
    }
    console.log(toolIndex)

    // 确保参数是有效的，特别是检查 path 参数
    if (toolArgs.name === 'list_directory' && (!toolArgs.args || !toolArgs.args.path)) {
      console.warn('[AIGC Service] Missing required path parameter for list_directory')
      // 可以设置默认值或返回错误信息
      toolArgs.args = { path: '.' } // 设置默认值为当前目录
    }

    try {
      console.log('toolArgs', toolArgs)
      // 调用工具
      const result = await this.clients[toolIndex].callTool({
        name: toolName,
        arguments: {
          ...toolArgs,
        },
      })
      return result
    } catch (error) {
      console.error(`调用工具 "${toolName}" 时出错:`, error)
      return '调用工具失败'
    }
  }

  /**
   * 获取所有 MCP 服务器的数据（工具、资源、提示）
   * @returns {Promise<void>}
   */
  async fetchAllMcpServerData(): Promise<void> {
    if (this.allMcpServer) {
      console.log('已使用缓存的 MCP 服务器数据。')
      console.log(this.allMcpServer)
      return
    }

    this.tools = []
    this.resources = []
    this.prompts = []

    for (let i = 0; i < this.clients.length; i++) {
      const serverName = Object.keys(this.config.mcpServers)[i] || `server-${i}`
      try {
        console.log(`[MCP] Connecting to server: ${serverName}`)

        // 设置连接超时（增加到30秒）
        const connectTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout')), 30000)
        })

        // 连接到 MCP 服务器
        await Promise.race([
          this.clients[i].connect(this.transports[i]),
          connectTimeout,
        ])

        console.log(`[MCP] Successfully connected to server: ${serverName}`)

        // 获取工具、资源和提示信息
        let tools: Tool[] = []
        let resources: Resource[] = []
        let prompts: Prompt[] = []

        try {
          console.log(`[MCP] Fetching tools from server: ${serverName}`)
          tools = (await this.clients[i].listTools()).tools as Tool[]
          console.log(`[MCP] Found ${tools.length} tools from server: ${serverName}`)
        } catch (e) {
          console.error(`[MCP] Error fetching tools from server ${serverName}:`, e)
        }

        try {
          console.log(`[MCP] Fetching resources from server: ${serverName}`)
          resources = (await this.clients[i].listResources())?.resources as Resource[]
          console.log(`[MCP] Found ${resources?.length || 0} resources from server: ${serverName}`)
        } catch (e) {
          console.error(`[MCP] Error fetching resources from server ${serverName}:`, e)
        }

        try {
          console.log(`[MCP] Fetching prompts from server: ${serverName}`)
          prompts = (await this.clients[i].listPrompts())?.prompts as Prompt[]
          console.log(`[MCP] Found ${prompts?.length || 0} prompts from server: ${serverName}`)
        } catch (e) {
          console.error(`[MCP] Error fetching prompts from server ${serverName}:`, e)
        }

        this.tools.push(...tools)
        this.resources.push(...resources)
        this.prompts.push(...prompts)

      } catch (error) {
        console.error(`[MCP] Error connecting to server ${serverName}:`, error)
        console.error('[MCP] Server config:', this.config.mcpServers[serverName])
      }
    }

    // 转化function call tools
    this.mcpToolsToFunctionCallTools()

    // 缓存所有数据
    this.allMcpServer = {
      tools: this.tools,
      funcTools: this.funcTools,
      resources: this.resources,
      prompts: this.prompts,
    }

    console.log(`[MCP] Total tools loaded: ${this.tools.length}`)
    console.log(`[MCP] Total resources loaded: ${this.resources.length}`)
    console.log(`[MCP] Total prompts loaded: ${this.prompts.length}`)
  }

  // 转化mcp tools到function call tools
  private mcpToolsToFunctionCallTools(){
    if (!this.tools || (this.tools && this.tools.length <= 0)) {
      return
    }
    this.funcTools = this.tools.map((tool:Tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name as string,
        description: tool.description as string,
        parameters: {
          type: 'object',
          properties: tool.inputSchema.properties as Record<string, unknown>,
          required: tool.inputSchema.required as string[],
        },
      },
    }))
  }
}
