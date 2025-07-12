import axios from 'axios'

export const PostChatSendApi = async (obj: object) => {
  return axios.post('http://localhost:3002/mcp/chat/send', {
    ...obj,
  })
}
export const PostPlanCreateApi = async (obj: object) => {
  return axios.post('http://localhost:3002/mcp/plan/create', {
    ...obj,
  })
}
