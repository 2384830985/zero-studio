import {ipcRenderer} from '@/api/ipcApi.ts'
import {IpcChannel} from '../../../electron/main/IpcChannel.ts'
// import {IChatParams} from '@/api/knowledge/types.ts'

export const ipcLancedbInitializeApi = async () => {
  return ipcRenderer(IpcChannel.LANCEDB_INITIALIZE)
}

export const ipcLancedbListTablesApi = async () => {
  return ipcRenderer(IpcChannel.LANCEDB_LIST_TABLES)
}

/**
 * 上传文件并创建知识库表
 */
export const ipcLancedbCreateTablesApi = async (params = {}) => {
  return ipcRenderer(IpcChannel.LANCEDB_UPLOAD_FILE_CREATE_TABLE, params)
}

/**
 * 获取知识库
 */
export const ipcLancedbGetAllDocumentsApi = async (name: string) => {
  return ipcRenderer(IpcChannel.LANCEDB_GET_ALL_DOCUMENTS, name)
}
