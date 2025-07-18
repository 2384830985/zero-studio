import { defineStore } from 'pinia'

// 网络搜索设置接口
export interface WebSearchSettings {
  defaultEngine: string
  includeDates: boolean
  maxResults: number
  compressionMethod: 'none' | 'summary' | 'keywords'
  blacklist: string[]
  blacklistSubscriptions: Array<{ name: string; url: string }>
}

// 文档处理设置接口
export interface DocumentSettings {
  autoExtractStructure: boolean
  preserveFormatting: boolean
  smartSegmentation: boolean
}

// OCR 设置接口
export interface OcrSettings {
  enabled: boolean
  language: string
  highAccuracy: boolean
}

// 工具设置状态接口
interface ToolSettingsState {
  webSearchSettings: WebSearchSettings
  documentSettings: DocumentSettings
  ocrSettings: OcrSettings
}

export const useToolSettingsStore = defineStore('toolSettings', {
  state(): ToolSettingsState {
    return {
      webSearchSettings: {
        defaultEngine: 'bing',
        includeDates: true,
        maxResults: 5,
        compressionMethod: 'none',
        blacklist: [],
        blacklistSubscriptions: [],
      },
      documentSettings: {
        autoExtractStructure: true,
        preserveFormatting: false,
        smartSegmentation: true,
      },
      ocrSettings: {
        enabled: false,
        language: 'auto',
        highAccuracy: false,
      },
    }
  },

  getters: {
    /**
     * 获取当前选中的搜索引擎
     */
    currentSearchEngine: (state) => state.webSearchSettings.defaultEngine,

    /**
     * 获取搜索结果数量
     */
    searchResultsCount: (state) => state.webSearchSettings.maxResults,

    /**
     * 检查是否启用了 OCR
     */
    isOcrEnabled: (state) => state.ocrSettings.enabled,

    /**
     * 获取黑名单网站数量
     */
    blacklistCount: (state) => state.webSearchSettings.blacklist.length,

    /**
     * 获取黑名单订阅数量
     */
    blacklistSubscriptionCount: (state) => state.webSearchSettings.blacklistSubscriptions.length,
  },

  actions: {
    /**
     * 更新网络搜索设置
     */
    updateWebSearchSettings(settings: Partial<WebSearchSettings>) {
      this.webSearchSettings = { ...this.webSearchSettings, ...settings }
      this.saveToLocalStorage()
    },

    /**
     * 更新文档处理设置
     */
    updateDocumentSettings(settings: Partial<DocumentSettings>) {
      this.documentSettings = { ...this.documentSettings, ...settings }
      this.saveToLocalStorage()
    },

    /**
     * 更新 OCR 设置
     */
    updateOcrSettings(settings: Partial<OcrSettings>) {
      this.ocrSettings = { ...this.ocrSettings, ...settings }
      this.saveToLocalStorage()
    },

    /**
     * 设置默认搜索引擎
     */
    setDefaultSearchEngine(engine: string) {
      this.webSearchSettings.defaultEngine = engine
      this.saveToLocalStorage()
    },

    /**
     * 添加黑名单网站
     */
    addToBlacklist(sites: string[]) {
      const newSites = sites.filter(site => !this.webSearchSettings.blacklist.includes(site))
      this.webSearchSettings.blacklist.push(...newSites)
      this.saveToLocalStorage()
    },

    /**
     * 从黑名单中移除网站
     */
    removeFromBlacklist(site: string) {
      const index = this.webSearchSettings.blacklist.indexOf(site)
      if (index > -1) {
        this.webSearchSettings.blacklist.splice(index, 1)
        this.saveToLocalStorage()
      }
    },

    /**
     * 清空黑名单
     */
    clearBlacklist() {
      this.webSearchSettings.blacklist = []
      this.saveToLocalStorage()
    },

    /**
     * 添加黑名单订阅
     */
    addBlacklistSubscription(subscription: { name: string; url: string }) {
      const exists = this.webSearchSettings.blacklistSubscriptions.some(
        sub => sub.url === subscription.url,
      )
      if (!exists) {
        this.webSearchSettings.blacklistSubscriptions.push(subscription)
        this.saveToLocalStorage()
      }
    },

    /**
     * 删除黑名单订阅
     */
    removeBlacklistSubscription(index: number) {
      if (index >= 0 && index < this.webSearchSettings.blacklistSubscriptions.length) {
        this.webSearchSettings.blacklistSubscriptions.splice(index, 1)
        this.saveToLocalStorage()
      }
    },

    /**
     * 设置搜索结果数量
     */
    setSearchResultsCount(count: number) {
      this.webSearchSettings.maxResults = Math.max(1, Math.min(20, count))
      this.saveToLocalStorage()
    },

    /**
     * 切换 OCR 启用状态
     */
    toggleOcr() {
      this.ocrSettings.enabled = !this.ocrSettings.enabled
      this.saveToLocalStorage()
    },

    /**
     * 重置所有设置为默认值
     */
    resetToDefaults() {
      this.webSearchSettings = {
        defaultEngine: 'bing',
        includeDates: true,
        maxResults: 5,
        compressionMethod: 'none',
        blacklist: [],
        blacklistSubscriptions: [],
      }
      this.documentSettings = {
        autoExtractStructure: true,
        preserveFormatting: false,
        smartSegmentation: true,
      }
      this.ocrSettings = {
        enabled: false,
        language: 'auto',
        highAccuracy: false,
      }
      this.saveToLocalStorage()
    },

    /**
     * 保存设置到本地存储
     */
    saveToLocalStorage() {
      try {
        localStorage.setItem('toolSettings', JSON.stringify({
          webSearchSettings: this.webSearchSettings,
          documentSettings: this.documentSettings,
          ocrSettings: this.ocrSettings,
        }))
      } catch (error) {
        console.error('保存工具设置失败:', error)
      }
    },

    /**
     * 从本地存储加载设置
     */
    loadFromLocalStorage() {
      try {
        const saved = localStorage.getItem('toolSettings')
        if (saved) {
          const settings = JSON.parse(saved)
          if (settings.webSearchSettings) {
            this.webSearchSettings = { ...this.webSearchSettings, ...settings.webSearchSettings }
          }
          if (settings.documentSettings) {
            this.documentSettings = { ...this.documentSettings, ...settings.documentSettings }
          }
          if (settings.ocrSettings) {
            this.ocrSettings = { ...this.ocrSettings, ...settings.ocrSettings }
          }
        }
      } catch (error) {
        console.error('加载工具设置失败:', error)
      }
    },

    /**
     * 导出设置
     */
    exportSettings() {
      return {
        webSearchSettings: this.webSearchSettings,
        documentSettings: this.documentSettings,
        ocrSettings: this.ocrSettings,
        exportedAt: new Date().toISOString(),
      }
    },

    /**
     * 导入设置
     */
    importSettings(settings: any) {
      try {
        if (settings.webSearchSettings) {
          this.webSearchSettings = { ...this.webSearchSettings, ...settings.webSearchSettings }
        }
        if (settings.documentSettings) {
          this.documentSettings = { ...this.documentSettings, ...settings.documentSettings }
        }
        if (settings.ocrSettings) {
          this.ocrSettings = { ...this.ocrSettings, ...settings.ocrSettings }
        }
        this.saveToLocalStorage()
        return true
      } catch (error) {
        console.error('导入工具设置失败:', error)
        return false
      }
    },
  },

  // 启用持久化
  persist: true,
})
