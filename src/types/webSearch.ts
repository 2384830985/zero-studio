export interface SearchResult {
  title: string
  url: string
  snippet: string
}

export interface WebSearchResponse {
  success: boolean
  query: string
  engine: string
  results: SearchResult[]
  totalResults?: number
  searchTime?: number
}

export interface SearchEngine {
  id: string
  name: string
  description: string
  icon: any
  color: string
}

export type SupportedSearchEngine = 'google' | 'bing' | 'baidu' | 'duckduckgo'
