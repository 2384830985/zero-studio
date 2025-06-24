/// <reference types="vite/client" />
/// <reference types="./types/electron" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, any>
  export default component
}

// 扩展 ImportMeta 接口以包含 env 属性
interface ImportMetaEnv {
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
  readonly VITE_DEV_SERVER_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
