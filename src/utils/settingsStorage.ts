/**
 * 设置存储工具类
 * 用于管理应用程序设置的本地存储
 */

export interface SettingsConfig {
  [key: string]: any
  lastUpdated?: number
}

export class SettingsStorage {
  private storageKey: string

  constructor(storageKey: string) {
    this.storageKey = storageKey
  }

  /**
   * 保存设置到本地存储
   */
  save(config: SettingsConfig): boolean {
    try {
      const configData = {
        ...config,
        lastUpdated: Date.now(),
      }
      localStorage.setItem(this.storageKey, JSON.stringify(configData))
      console.log(`设置已保存到本地存储: ${this.storageKey}`)
      return true
    } catch (error) {
      console.error(`保存设置失败 (${this.storageKey}):`, error)
      return false
    }
  }

  /**
   * 从本地存储加载设置
   */
  load(): SettingsConfig | null {
    try {
      const savedData = localStorage.getItem(this.storageKey)
      if (savedData) {
        const configData = JSON.parse(savedData)
        console.log(`从本地存储加载设置成功: ${this.storageKey}`)
        return configData
      }
      return null
    } catch (error) {
      console.error(`加载设置失败 (${this.storageKey}):`, error)
      return null
    }
  }

  /**
   * 清除本地存储的设置
   */
  clear(): boolean {
    try {
      localStorage.removeItem(this.storageKey)
      console.log(`本地设置已清除: ${this.storageKey}`)
      return true
    } catch (error) {
      console.error(`清除设置失败 (${this.storageKey}):`, error)
      return false
    }
  }

  /**
   * 检查是否存在保存的设置
   */
  exists(): boolean {
    return localStorage.getItem(this.storageKey) !== null
  }

  /**
   * 获取设置的最后更新时间
   */
  getLastUpdated(): number | null {
    const config = this.load()
    return config?.lastUpdated || null
  }
}

/**
 * 创建设置存储实例的工厂函数
 */
export function createSettingsStorage(storageKey: string): SettingsStorage {
  return new SettingsStorage(storageKey)
}

/**
 * 预定义的设置存储键名
 */
export const STORAGE_KEYS = {
  MODEL_SERVICES: 'model-services-config',
  DISPLAY_SETTINGS: 'display-settings-config',
  ZOOM_SETTINGS: 'zoom-settings-config',
  TOPIC_SETTINGS: 'topic-settings-config',
  ASSISTANT_SETTINGS: 'assistant-settings-config',
  MCP_SETTINGS: 'mcp-settings-config',
} as const

/**
 * 全局设置管理器
 */
export class GlobalSettingsManager {
  private storages: Map<string, SettingsStorage> = new Map()

  /**
   * 获取或创建设置存储实例
   */
  getStorage(key: string): SettingsStorage {
    if (!this.storages.has(key)) {
      this.storages.set(key, new SettingsStorage(key))
    }
    return this.storages.get(key)!
  }

  /**
   * 清除所有设置
   */
  clearAll(): boolean {
    let success = true
    for (const storage of this.storages.values()) {
      if (!storage.clear()) {
        success = false
      }
    }
    return success
  }

  /**
   * 导出所有设置
   */
  exportAll(): Record<string, SettingsConfig | null> {
    const allSettings: Record<string, SettingsConfig | null> = {}
    for (const [key, storage] of this.storages.entries()) {
      allSettings[key] = storage.load()
    }
    return allSettings
  }

  /**
   * 导入所有设置
   */
  importAll(settings: Record<string, SettingsConfig>): boolean {
    let success = true
    for (const [key, config] of Object.entries(settings)) {
      const storage = this.getStorage(key)
      if (!storage.save(config)) {
        success = false
      }
    }
    return success
  }
}

// 全局设置管理器实例
export const globalSettingsManager = new GlobalSettingsManager()
