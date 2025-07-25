import type { KnowledgeBase, Document, KnowledgeBaseForm, KnowledgeBaseQuery, DocumentUpload } from '@/types/knowledge'

// 模拟数据存储
const knowledgeBases: KnowledgeBase[] = [
  {
    id: '1',
    name: '技术文档',
    description: '包含各种技术文档和API说明',
    status: 'active',
    documentCount: 15,
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: '2',
    name: '产品手册',
    description: '产品使用说明和常见问题',
    status: 'active',
    documentCount: 8,
    createdAt: Date.now() - 86400000 * 14,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: '3',
    name: '公司政策',
    description: '公司规章制度和政策文档',
    status: 'inactive',
    documentCount: 12,
    createdAt: Date.now() - 86400000 * 21,
    updatedAt: Date.now() - 86400000 * 5,
  },
]

let documents: Document[] = [
  {
    id: '1',
    name: 'API文档.pdf',
    type: 'PDF',
    size: 1024000,
    uploadedAt: Date.now() - 86400000,
    knowledgeBaseId: '1',
  },
  {
    id: '2',
    name: '用户手册.docx',
    type: 'Word',
    size: 512000,
    uploadedAt: Date.now() - 86400000 * 2,
    knowledgeBaseId: '1',
  },
  {
    id: '3',
    name: '产品介绍.pptx',
    type: 'PowerPoint',
    size: 2048000,
    uploadedAt: Date.now() - 86400000 * 3,
    knowledgeBaseId: '2',
  },
]

// 知识库API
export const knowledgeApi = {
  // 获取知识库列表
  async getKnowledgeBases(query?: KnowledgeBaseQuery): Promise<KnowledgeBase[]> {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 100))

    let result = [...knowledgeBases]

    if (query?.status) {
      result = result.filter(kb => kb.status === query.status)
    }

    if (query?.keyword) {
      const keyword = query.keyword.toLowerCase()
      result = result.filter(kb =>
        kb.name.toLowerCase().includes(keyword) ||
        kb.description.toLowerCase().includes(keyword),
      )
    }

    return result
  },

  // 获取单个知识库
  async getKnowledgeBase(id: string): Promise<KnowledgeBase | null> {
    await new Promise(resolve => setTimeout(resolve, 100))
    return knowledgeBases.find(kb => kb.id === id) || null
  },

  // 创建知识库
  async createKnowledgeBase(form: KnowledgeBaseForm): Promise<KnowledgeBase> {
    await new Promise(resolve => setTimeout(resolve, 200))

    const newKb: KnowledgeBase = {
      id: Date.now().toString(),
      name: form.name,
      description: form.description,
      status: form.status ? 'active' : 'inactive',
      documentCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    knowledgeBases.push(newKb)
    return newKb
  },

  // 更新知识库
  async updateKnowledgeBase(id: string, form: KnowledgeBaseForm): Promise<KnowledgeBase | null> {
    await new Promise(resolve => setTimeout(resolve, 200))

    const index = knowledgeBases.findIndex(kb => kb.id === id)
    if (index === -1) {
      return null
    }

    knowledgeBases[index] = {
      ...knowledgeBases[index],
      name: form.name,
      description: form.description,
      status: form.status ? 'active' : 'inactive',
      updatedAt: Date.now(),
    }

    return knowledgeBases[index]
  },

  // 删除知识库
  async deleteKnowledgeBase(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200))

    const index = knowledgeBases.findIndex(kb => kb.id === id)
    if (index === -1) {
      return false
    }

    knowledgeBases.splice(index, 1)
    // 同时删除相关文档
    documents = documents.filter(doc => doc.knowledgeBaseId !== id)
    return true
  },
}

// 文档API
export const documentApi = {
  // 获取知识库的文档列表
  async getDocuments(knowledgeBaseId: string): Promise<Document[]> {
    await new Promise(resolve => setTimeout(resolve, 100))
    return documents.filter(doc => doc.knowledgeBaseId === knowledgeBaseId)
  },

  // 上传文档
  async uploadDocument(upload: DocumentUpload): Promise<Document> {
    await new Promise(resolve => setTimeout(resolve, 500))

    const newDoc: Document = {
      id: Date.now().toString(),
      name: upload.name || upload.file.name,
      type: upload.file.type || 'unknown',
      size: upload.file.size,
      uploadedAt: Date.now(),
      knowledgeBaseId: upload.knowledgeBaseId,
    }

    documents.push(newDoc)

    // 更新知识库的文档数量
    const kb = knowledgeBases.find(kb => kb.id === upload.knowledgeBaseId)
    if (kb) {
      kb.documentCount++
      kb.updatedAt = Date.now()
    }

    return newDoc
  },

  // 删除文档
  async deleteDocument(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200))

    const index = documents.findIndex(doc => doc.id === id)
    if (index === -1) {
      return false
    }

    const doc = documents[index]
    documents.splice(index, 1)

    // 更新知识库的文档数量
    const kb = knowledgeBases.find(kb => kb.id === doc.knowledgeBaseId)
    if (kb) {
      kb.documentCount = Math.max(0, kb.documentCount - 1)
      kb.updatedAt = Date.now()
    }

    return true
  },
}
