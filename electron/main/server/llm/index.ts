import { ChatOpenAI } from '@langchain/openai'

// import { ChatAlibabaTongyi } from '@langchain/community/chat_models/alibaba_tongyi'
export interface KnowledgeBase {
  id: number
  title: string
  introduction: string
  articleIds: any[]
  status: number
  documentCount: number
  createdAt: number
  updatedAt: number
}
export interface IMetadata {
  model: string
  setting: {
    modelTemperature: number
    contextCount: number
    streamOutput: boolean
    maxTokens: number
  }
  service: {
    id: string,
    name: string,
    apiUrl: string
    apiKey: string
  },
  searchEngine: string
  knowledgeBase: KnowledgeBase
}

const ModelUir = {
  QWEN: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
}

export const getModel = (metadata: IMetadata) => {
  // Qwen 模型
  if (metadata.service.apiUrl.includes(ModelUir.QWEN)) {
    // 支持不了 tool
    // return new ChatAlibabaTongyi({
    //   model: metadata.model, // Available models: qwen-turbo, qwen-plus, qwen-max
    //   temperature: 0.7,
    //   alibabaApiKey: metadata.service.apiKey, // In Node.js defaults to process.env.ALIBABA_API_KEY
    //   maxTokens: 2000,
    //   streaming: metadata.stream,
    //   enableSearch: true,
    // })
  }
  // openAI
  return new ChatOpenAI({
    openAIApiKey: metadata.service.apiKey,
    configuration: {
      baseURL: metadata.service.apiUrl,
    },
    model: metadata.model, // 使用映射后的模型名称
    temperature: metadata?.setting?.modelTemperature || 0,
    maxTokens: metadata?.setting?.maxTokens || 2000,
    streaming: metadata.setting?.streamOutput,
  })
}
