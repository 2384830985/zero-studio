import {BrowserWindow} from 'electron'

type IObjAny = {
  [key: string]: any
}

export enum CommunicationType {
  STREAMING = 'streaming',
  MESSAGE = 'message'
}

export enum CommunicationRole{
  ASSISTANT='assistant',
  USER='user',
}

export interface IMCPToolCall {
  id: string;
  name: string;
  arguments: string[];
  serverId: string
  serverName: string
}

export interface IMCPToolResult {
  toolCallId: string
  toolName: string
  success: boolean
  result: IObjAny
  executionTime: number
}

interface IStreamingParams {
  conversationId: string
  messageId: string
  role: CommunicationRole,
  timestamp: number
  content: string
  isComplete: boolean
  metadata: {
    stream?: boolean
    model?: string
    toolCalls: IMCPToolCall[]
    toolResults: IMCPToolResult[]
  }
}

interface IMessageParams extends IStreamingParams{
  conversationId: string
  message: IStreamingParams
}

export class Communication {
  private win: BrowserWindow
  constructor(win: BrowserWindow) {
    this.win = win
  }

  sendStreaming(streamingParams: IStreamingParams) {
    // 实时发送工具调用信息
    this.win.webContents.send(CommunicationType.STREAMING, {
      ...streamingParams,
      timestamp: streamingParams?.timestamp || Date.now(),
      content: streamingParams?.content || '',
    })
  }

  setMessage (messageParams: IMessageParams) {
    // 结束发送工具调用信息
    this.win.webContents.send(CommunicationType.MESSAGE, {
      ...messageParams,
    })
  }
}

