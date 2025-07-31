import { BrowserWindow } from 'electron'
import { ChatHandler } from './ChatHandler'
import { CommunicationRole } from '../../../mcp'
import { generateId } from '../../utils/helpers'
import {LangGraphReActAgent, LangGraphReActConfig, LangGraphTool} from '../../services/react-agent'
import {McpServer} from '../../../mcp/mcp-server'

export class ReActChatHandler extends ChatHandler {
  constructor(win: BrowserWindow) {
    super(win)
  }

  /**
   * 处理 ReAct 聊天发送
   */
  async handleChatReActSend(_, object: string) {
    try {
      const req = JSON.parse(object)
      const { content, metadata = {}, conversationId = '' } = req

      // 验证内容
      const validation = this.validateContent(content)
      if (!validation.isValid) {
        return this.createErrorResponse(400, validation.error!)
      }

      // 广播用户消息
      this.broadcastUserMessage(content, conversationId, metadata)
      const config: LangGraphReActConfig = {
        model: metadata.model,
        apiKey: metadata.service.apiKey,
        baseURL: metadata.service.apiUrl,
        temperature: 0.3,
        maxTokens: 1000,
        maxIterations: 15,
        tools: McpServer.langchainTools as LangGraphTool[],
      }
      // 初始化 ReAct 服务
      const reAct = new LangGraphReActAgent(config)

      // // 创建步骤回调
      // const stepCallback = (type: string, content) => {
      //   console.log(111111111)
      //   if (type === 'stream') {
      //     this.processStreamResponse(content, conversationId, metadata)
      //   } else {
      //     this.sendAssistantMessage(content, conversationId, metadata)
      //   }
      // }

      // 创建流式发送函数
      const sendStreaming = () => {
        this.sendStreamingMessage('', conversationId, metadata)
      }

      // 调用 AIGC API
      await reAct?.execute(content, sendStreaming).then(async response => {
        // 处理响应
        const fullContent = await this.processAIGCResponseContent(response, conversationId, metadata)
        // 发送完整消息
        if (fullContent) {
          this.sendFinalMessage(fullContent, response, conversationId, metadata)
        }
      })

      return this.createSuccessResponse({ conversationId })
    } catch (error) {
      console.error('[ReAct Chat Handler] Error:', error)
      return this.createErrorResponse(500, 'Failed to process ReAct request')
    }
  }

  /**
   * 创建步骤回调函数
   */
  private createStepCallback(conversationId: string, metadata: any) {
    return (step: any) => {
      console.log(`[${step.type}] ${step.content}`)

      // 发送步骤消息
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
  }
}
