import { defineStore } from 'pinia'
import type {ModelInfo, ModelService} from '@/views/chat/chat.type.ts'

export enum USE_PLAN_MODE {
  // 问答模式
  QUEST_ANSWERS = 'QUEST_ANSWERS',
  // 计划模式
  PLAN_NING_MODE = 'PLAN_NING_MODE',
  // ReACT 模式
  RE_ACT = 'RE_ACT'
}

export interface IUsePlanMode {
  name: string,
  value: USE_PLAN_MODE
}

interface IIseChatStore {
  UsePlanModeList: IUsePlanMode[],
  usePlanMode: USE_PLAN_MODE,
  selectedMCPServers: string[],
  selectedModel?: {
    service: ModelService,
    model: ModelInfo
  }
}

const UsePlanModeList: IUsePlanMode[] = [
  {
    name: '问答模式',
    value: USE_PLAN_MODE.QUEST_ANSWERS,
  },
  {
    name: '计划模式',
    value: USE_PLAN_MODE.PLAN_NING_MODE,
  },
  {
    name: 'ReAct',
    value: USE_PLAN_MODE.RE_ACT,
  },
]

export const useChatStore = defineStore('chat', {
  state(): IIseChatStore {
    return {
      UsePlanModeList,
      usePlanMode: USE_PLAN_MODE.QUEST_ANSWERS,
      selectedMCPServers: [],
      selectedModel: undefined,
    }
  },
  getters: {
    usePlanModeName (state) {
      return state.UsePlanModeList?.find(usePlan => usePlan.value === state.usePlanMode)?.name || ''
    },
  },
  actions: {
    selectUsePlanMode (value: USE_PLAN_MODE){
      this.usePlanMode = value
    },
    selectSettingModel (service: ModelService, model: ModelInfo) {
      this.selectedModel = { service, model }
    },
    toggleMCPServer (serverId: string){
      const index = this.selectedMCPServers.indexOf(serverId)
      if (index > -1) {
        this.selectedMCPServers.splice(index, 1)
      } else {
        this.selectedMCPServers.push(serverId)
      }
      return index
    },
  },
  // 这是按照插件的文档，在实例上启用了该插件，这个选项是插件特有的
  persist: true,
})
