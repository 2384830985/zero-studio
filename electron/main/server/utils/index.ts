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
