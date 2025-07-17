export const PostChatSendApi = async (obj: object) => {
  return window?.ipcRenderer?.invoke('chat-send', JSON.stringify(obj))
}
export const PostPlanCreateApi = async (obj: object) => {
  return window?.ipcRenderer?.invoke('plan-create', JSON.stringify(obj))
}
export const ConnectMCPApi = async (obj: object) => {
  return window?.ipcRenderer?.invoke('connect-mcp', JSON.stringify(obj))
}
