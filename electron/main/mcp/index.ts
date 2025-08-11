import {BrowserWindow} from 'electron'
import {IMessageMetadata} from '../server/types'
import {IExhibitionCon} from '../server/utils'

type IObjAny = {
  [key: string]: any
}

export enum CommunicationType {
  STREAMING = 'streaming',
  MESSAGE = 'message',
  USER_INPUT_REQUEST = 'user-input-request',
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

interface IStreamingParams {
  id?: string
  conversationId?: string
  messageId?: string
  role?: CommunicationRole,
  contentLimited?: {
    cardList?: IExhibitionCon[]
  },
  timestamp?: number
  content?: string
  message?: Partial<IStreamingParams>
  metadata?: IMessageMetadata
}

interface IUserInputRequestParams {
  requestId: string
  prompt: string
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

  setMessage (messageParams: Partial<IStreamingParams>) {
    // 结束发送工具调用信息
    this.win.webContents.send(CommunicationType.MESSAGE, {
      timestamp: messageParams?.timestamp || Date.now(),
      ...messageParams,
    })
  }

  /**
   * 发送用户输入请求
   * @param requestParams 请求参数
   */
  sendUserInputRequest(requestParams: IUserInputRequestParams) {
    // 发送用户输入请求
    console.log(`[发送用户输入请求] ID: ${requestParams.requestId}, 提示: ${requestParams.prompt}`)
    this.win.webContents.send(CommunicationType.USER_INPUT_REQUEST, requestParams)
  }
}

