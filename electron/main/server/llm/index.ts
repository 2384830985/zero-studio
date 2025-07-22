import { ChatOpenAI } from '@langchain/openai'
// import { ChatAlibabaTongyi } from '@langchain/community/chat_models/alibaba_tongyi'

interface IMetadata {
  stream: boolean;
  model: string
  service: {
    id: string,
    name: string,
    apiUrl: string
    apiKey: string
  }
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
    temperature: 0.7,
    maxTokens: 2000,
    streaming: metadata.stream,
  })
}
