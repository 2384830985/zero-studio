export const PostChatSendApi = async (obj: object) => {
  return window?.ipcRenderer?.invoke('chat-send', JSON.stringify(obj))
}
export const PostPlanCreateApi = async (obj: object) => {
  return window?.ipcRenderer?.invoke('chat-plan', JSON.stringify(obj))
}
export const ConnectMCPApi = async (obj: object) => {
  return window?.ipcRenderer?.invoke('connect-mcp', JSON.stringify(obj))
}
export const ConnectReActApi = async (obj: object) => {
  return window?.ipcRenderer?.invoke('chat-reAct', JSON.stringify(obj))
}
