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
  SYSTEM='system',
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

export interface IMetadata {
  stream: boolean
  model: string
  toolCalls: IMCPToolCall[]
  toolResults: IMCPToolResult[]
}

interface IStreamingParams {
  id: string
  conversationId: string
  messageId: string
  role: CommunicationRole,
  timestamp: number
  content: string
  isComplete: boolean
  metadata: Partial<IMetadata>
}

interface IMessageParams extends Partial<IStreamingParams>{
  message?: IStreamingParams
}

export class Communication {
  private win: BrowserWindow
  constructor(win: BrowserWindow) {
    this.win = win
  }

  sendStreaming(streamingParams: Partial<IStreamingParams>) {
    // 实时发送工具调用信息
    this.win.webContents.send(CommunicationType.STREAMING, {
      ...streamingParams,
      timestamp: streamingParams?.timestamp || Date.now(),
      content: streamingParams?.content || '',
    })
  }

  setMessage (messageParams: Partial<IMessageParams>) {
    // 结束发送工具调用信息
    this.win.webContents.send(CommunicationType.MESSAGE, {
      ...messageParams,
    })
  }
}

