export const ipcRenderer = (channel: string, object: object) => {
  return window?.ipcRenderer?.invoke(channel, JSON.stringify(object))
}
