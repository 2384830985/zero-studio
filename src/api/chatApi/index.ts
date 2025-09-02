import {ipcRenderer} from '@/api/ipcApi.ts'
import {IpcChannel} from '../../../electron/main/IpcChannel.ts'
import {IChatParams} from '@/api/chatApi/types.ts'
import {MCPServerConfig} from '@/store'

export const PostChatSendApi = async (params: IChatParams) => {
  return ipcRenderer(IpcChannel.CHAT_SEND, params)
}
export const PostPlanCreateApi = async (params: IChatParams) => {
  return ipcRenderer(IpcChannel.CHAT_PLAN, params)
}
export const ConnectMCPApi = async (params: { enabledMCPServers: Partial<MCPServerConfig>[] }) => {
  return ipcRenderer(IpcChannel.CONNECT_MCP, params)
}
export const ConnectReActApi = async (params: IChatParams) => {
  return ipcRenderer(IpcChannel.CHAT_REACT, params)
}

export const InputResponseApi = async (params: { content: string, requestId: string }) => {
  return ipcRenderer(IpcChannel.USER_INPUT_RESPONSE, params)
}

export const optimizationPromptApi = async (params: any) => {
  return ipcRenderer(IpcChannel.OPTIMIZATION_PROMPT, params)
}

export const interruptRequestApi = async () => {
  return ipcRenderer(IpcChannel.INTERRUPT_REQUEST, {})
}
