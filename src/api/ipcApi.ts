export const ipcRenderer = (channel: string, object?: any, option?: any) => {
  return window?.ipcRenderer?.invoke(channel, JSON.stringify(object || {}), JSON.stringify(option || {}))
}
