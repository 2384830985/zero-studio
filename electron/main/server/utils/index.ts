// 页面 card 的展示类型
import {MCPToolCall, MCPToolResult} from '../types'

export enum Exhibition {
  TEXT='text',
  TOOLS='TOOLS',
  SEARCH='search',
}

export interface IExhibitionCon {
  type: Exhibition
  content?: string
  searchContent?: string
  // MCP 工具调用相关信息
  toolCalls?: MCPToolCall[] | undefined
  toolResults?: MCPToolResult[] | undefined
}

export const getExhibitionTEXT = (content: string): IExhibitionCon => {
  return {
    type: Exhibition.TEXT,
    content,
  }
}

export const getExhibitionTOOLS = ({
  toolCalls,
  toolResults,
  content,
}: {
  toolCalls?: MCPToolCall[] | undefined
  toolResults?: MCPToolResult[] | undefined
  content?: string
}): IExhibitionCon => {
  return {
    type: Exhibition.TOOLS,
    content,
    toolCalls,
    toolResults,
  }
}

export const getExhibitionSEARCH = ({
  content,
  searchContent,
}: {
  content?: string
  searchContent?: string
}): IExhibitionCon => {
  return {
    type: Exhibition.SEARCH,
    content,
    searchContent,
  }
}

/**
 * JSON 参数解析装饰器
 * 自动将方法的特定参数从 JSON 字符串解析为对象
 * @param paramIndex - 要解析的参数索引（从0开始）
 */
export function JSON_PARSE(paramIndex = 1) {
  return function(_target: any, _propertyKey: string | symbol, descriptor?: PropertyDescriptor) {
    if (!descriptor) {
      // 如果没有 descriptor，创建一个新的
      descriptor = Object.getOwnPropertyDescriptor(_target, _propertyKey) || {
        value: _target[_propertyKey],
        writable: true,
        enumerable: true,
        configurable: true,
      }
    }

    const originalMethod = descriptor.value

    descriptor.value = function(...args: any[]) {
      // 检查指定索引的参数是否存在且是字符串
      if (args.length > paramIndex && args[paramIndex]) {
        const paramValue = args[paramIndex]

        if (typeof paramValue === 'string') {
          try {
            // 尝试解析 JSON 字符串
            args[paramIndex] = JSON.parse(paramValue)
          } catch (error) {
            console.warn(`JSON 解析失败，参数索引 ${paramIndex}:`, error)
            // 可以选择抛出错误或保持原值
            throw new Error(`Invalid JSON parameter at index ${paramIndex}`)
          }
        }
      }

      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}
