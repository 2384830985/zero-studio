import { defineStore } from 'pinia'

export interface IModels {
  name: string
  description: string
  enabled: boolean
  color: string
  pid: string,
  id: string
}

export interface IServices {
  id: string
  name: string
  description: string
  color: string
  enabled: boolean
  apiKey: string
  apiUrl: string
  models: IModels[]
}

export interface IUseModelService {
  modelServices: {
    services: IServices[],
    lastUpdated: number
  }
}

export const useModelServiceStore = defineStore('modelService', {
  state(): IUseModelService {
    return {
      modelServices: {
        services: [],
        lastUpdated: Date.now(),
      },
    }
  },
  getters: {},
  actions: {
    selectModelServices(services: IServices[]) {
      this.modelServices = {
        services,
        lastUpdated: Date.now(),
      }
    },
    deleteModelServices() {
      this.modelServices = {
        services: [],
        lastUpdated: Date.now(),
      }
    },
  },
  // 这是按照插件的文档，在实例上启用了该插件，这个选项是插件特有的
  persist: true,
})
