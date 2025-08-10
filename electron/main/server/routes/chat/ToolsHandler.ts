import { McpServer } from '../../../mcp/mcp-server'
import {DynamicTool} from '@langchain/core/tools'

export abstract class ToolsHandler {
  protected tools
  protected toolsPrompt

  initToolWrappers() {
    const { tools, toolsPrompt } = this.createToolWrappers()
    this.tools = tools
    this.toolsPrompt = toolsPrompt
  }

  /**
   * 解析工具输入
   */
  parseToolInput(input: string | object): any {
    if (typeof input === 'object') {
      return input
    }

    try {
      return JSON.parse(input)
    } catch {
      // 如果不是 JSON，尝试作为简单字符串处理
      return { input }
    }
  }

  /**
   * 安全执行工具
   */
  async executeToolSafely(toolName: string, input: string | object): Promise<any> {
    try {
      console.log(`[工具执行] ${toolName}:`, input)

      // 解析输入参数
      const args = this.parseToolInput(input)

      // 获取工具实例
      const toolInstance = McpServer.langchainTools.find(tool => tool.name === toolName)
      if (!toolInstance) {
        return `错误: 未找到工具 "${toolName}"`
      }

      // 执行工具
      const result = await Promise.race([
        toolInstance.invoke(args),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Tool execution timeout')), 15000),
        ),
      ])

      console.log(`[工具结果] ${toolName}:`, result)
      return result

    } catch (error) {
      const errorMsg = `工具 "${toolName}" 执行失败: ${error instanceof Error ? error.message : '未知错误'}`
      console.error(`[工具错误] ${errorMsg}`)
      return errorMsg
    }
  }

  /**
   * 创建工具包装器
   */
  createToolWrappers(): { tools: DynamicTool<any>[]; toolsPrompt: string } {
    let toolsPrompt = ''
    console.log('McpServer.langchainTools.', McpServer.langchainTools.length)
    const tools = McpServer.langchainTools.map(toolItem => {
      // # Tool_Name: Addition
      // # Tool_Description: useful when to add two numbers
      // # Tool_Input: {{"a": integer, "b": integer}}
      let input = JSON.stringify((toolItem?.schema as any)?.properties || '}')

      input = input.replace(/\{/g, '{{')
      input = input.replace(/}/g, '}}')

      toolsPrompt += `
        # Tool_Name: ${toolItem.name}
        # Tool_Description: ${toolItem.description}
        # Tool_Input: ${input || '无输入参数'}
      `
      return new DynamicTool({
        name: toolItem.name,
        description: toolItem.description,
        func: async (_input: string | object) => {
          return this.executeToolSafely(toolItem.name, _input)
        },
      })
    })

    return {
      tools,
      toolsPrompt,
    }
  }
}
