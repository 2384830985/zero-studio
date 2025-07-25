// 知识库接口定义
export interface KnowledgeBase {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive'
  documentCount: number
  createdAt: number
  updatedAt: number
}

// 文档接口定义
export interface Document {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: number
  knowledgeBaseId: string
}

// 知识库创建/更新表单
export interface KnowledgeBaseForm {
  name: string
  description: string
  status: boolean
}

// 知识库查询参数
export interface KnowledgeBaseQuery {
  page?: number
  pageSize?: number
  keyword?: string
  status?: 'active' | 'inactive'
}

// 文档上传参数
export interface DocumentUpload {
  file: File
  knowledgeBaseId: string
  name?: string
}
