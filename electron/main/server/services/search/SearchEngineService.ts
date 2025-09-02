import axios from 'axios'
import * as cheerio from 'cheerio'

export interface SearchResult {
  title: string
  url: string
  snippet: string
  content?: string
}

export interface SearchEngineConfig {
  google?: {
    apiKey?: string
    searchEngineId?: string
  }
  bing?: {
    apiKey?: string
  }
  baidu?: {
    // 百度搜索不需要API key，使用网页爬取
  }
}

/**
 * 搜索引擎服务类
 * 支持Google、Bing、百度搜索，并提供内容爬取和广告过滤功能
 */
export class SearchEngineService {
  private config: SearchEngineConfig

  constructor(config: SearchEngineConfig = {}) {
    this.config = config
  }

  /**
   * 根据搜索引擎类型执行搜索
   */
  async search(
    query: string,
    engine: 'google' | 'bing' | 'baidu',
    limit = 5,
  ): Promise<SearchResult[]> {
    try {
      switch (engine) {
      case 'google':
        return await this.searchGoogle(query, limit)
      case 'bing':
        return await this.searchBing(query, limit)
      case 'baidu':
        return await this.searchBaidu(query, limit)
      default:
        throw new Error(`Unsupported search engine: ${engine}`)
      }
    } catch (error) {
      console.error(`[SearchEngine] Error searching with ${engine}:`, error)
      return []
    }
  }

  /**
   * Google搜索
   */
  private async searchGoogle(query: string, limit: number): Promise<SearchResult[]> {
    const { apiKey, searchEngineId } = this.config.google || {}

    if (!apiKey || !searchEngineId) {
      // 如果没有API配置，使用网页爬取
      return await this.searchGoogleWeb(query, limit)
    }

    try {
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: apiKey,
          cx: searchEngineId,
          q: query,
          num: limit,
        },
      })

      const results: SearchResult[] = []
      if (response.data.items) {
        for (const item of response.data.items) {
          const content = await this.crawlContent(item.link)
          results.push({
            title: item.title,
            url: item.link,
            snippet: item.snippet,
            content,
          })
        }
      }
      return results
    } catch (error) {
      console.error('[SearchEngine] Google API search failed:', error)
      return await this.searchGoogleWeb(query, limit)
    }
  }

  /**
   * Google网页搜索（备用方案）
   */
  private async searchGoogleWeb(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const response = await axios.get('https://www.google.com/search', {
        params: { q: query, num: limit },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      })

      const $ = cheerio.load(response.data)
      const results: SearchResult[] = []

      $('.g').each((index, element) => {
        if (index >= limit) {
          return false
        }

        const titleElement = $(element).find('h3').first()
        const linkElement = $(element).find('a').first()
        const snippetElement = $(element).find('.VwiC3b, .s3v9rd, .st').first()

        const title = titleElement.text().trim()
        const url = linkElement.attr('href')
        const snippet = snippetElement.text().trim()

        if (title && url && !this.isAd(element, $)) {
          results.push({ title, url, snippet })
        }
      })

      // 爬取内容
      for (const result of results) {
        result.content = await this.crawlContent(result.url)
      }

      return results
    } catch (error) {
      console.error('[SearchEngine] Google web search failed:', error)
      return []
    }
  }

  /**
   * Bing搜索
   */
  private async searchBing(query: string, limit: number): Promise<SearchResult[]> {
    const { apiKey } = this.config.bing || {}

    if (!apiKey) {
      return await this.searchBingWeb(query, limit)
    }

    try {
      const response = await axios.get('https://api.bing.microsoft.com/v7.0/search', {
        params: {
          q: query,
          count: limit,
        },
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
        },
      })

      const results: SearchResult[] = []
      console.log('response.data.webPages', response.data.webPages)
      if (response.data.webPages?.value) {
        for (const item of response.data.webPages.value) {
          const content = await this.crawlContent(item.url)
          results.push({
            title: item.name,
            url: item.url,
            snippet: item.snippet,
            content,
          })
        }
      }
      return results
    } catch (error) {
      console.error('[SearchEngine] Bing API search failed:', error)
      return await this.searchBingWeb(query, limit)
    }
  }

  /**
   * Bing网页搜索（备用方案）
   */
  private async searchBingWeb(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const response = await axios.get('https://www.bing.com/search', {
        params: { q: query, count: limit },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      })

      const $ = cheerio.load(response.data)
      const results: SearchResult[] = []

      $('.b_algo').each((index, element) => {
        if (index >= limit) {
          return false
        }

        const titleElement = $(element).find('h2 a').first()
        const snippetElement = $(element).find('.b_caption p').first()

        const title = titleElement.text().trim()
        const url = titleElement.attr('href')
        const snippet = snippetElement.text().trim()

        if (title && url && !this.isAd(element, $)) {
          results.push({ title, url, snippet })
        }
      })

      // 爬取内容
      for (const result of results) {
        result.content = await this.crawlContent(result.url)
      }

      return results
    } catch (error) {
      console.error('[SearchEngine] Bing web search failed:', error)
      return []
    }
  }

  /**
   * 百度搜索
   */
  private async searchBaidu(query: string, limit: number): Promise<SearchResult[]> {
    try {
      const response = await axios.get('https://www.baidu.com/s', {
        params: {
          wd: query,
          rn: Math.max(limit, 10), // 百度至少返回10条结果
          pn: 0, // 页码，从0开始
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
      })

      const $ = cheerio.load(response.data)
      const results: SearchResult[] = []

      // 百度搜索结果的多种可能选择器
      const resultSelectors = [
        '.result.c-container', // 新版百度
        '.result', // 旧版百度
        '[tpl]', // 带模板属性的结果
        '.c-container', // 通用容器
      ]

      let foundResults = false

      for (const selector of resultSelectors) {
        const elements = $(selector)
        if (elements.length > 0) {
          console.log(`[Baidu] Found ${elements.length} results with selector: ${selector}`)

          elements.each((index, element) => {
            if (results.length >= limit) {
              return false
            }

            const $element = $(element)

            // 跳过广告结果
            if (this.isBaiduAd($element)) {
              return true // continue
            }

            // 多种标题选择器
            let titleElement = $element.find('h3 a').first()
            if (!titleElement.length) {
              titleElement = $element.find('a[data-click]').first()
            }
            if (!titleElement.length) {
              titleElement = $element.find('.t a').first()
            }
            if (!titleElement.length) {
              titleElement = $element.find('a').first()
            }

            // 多种摘要选择器
            let snippetElement = $element.find('.c-abstract').first()
            if (!snippetElement.length) {
              snippetElement = $element.find('.c-span9').first()
            }
            if (!snippetElement.length) {
              snippetElement = $element.find('.c-span-last').first()
            }
            if (!snippetElement.length) {
              snippetElement = $element.find('[class*="abstract"]').first()
            }

            const title = titleElement.text().trim()
            let url = titleElement.attr('href')
            const snippet = snippetElement.text().trim()

            // 处理百度的重定向URL
            if (url && url.startsWith('/link?url=')) {
              try {
                const urlMatch = url.match(/url=([^&]+)/)
                if (urlMatch) {
                  url = decodeURIComponent(urlMatch[1])
                }
              } catch (e) {
                console.warn('[Baidu] Failed to decode URL:', url)
              }
            }

            // 确保URL是完整的
            if (url && !url.startsWith('http')) {
              if (url.startsWith('//')) {
                url = 'https:' + url
              } else if (url.startsWith('/')) {
                url = 'https://www.baidu.com' + url
              }
            }

            if (title && url && snippet) {
              results.push({ title, url, snippet })
              console.log(`[Baidu] Added result ${results.length}: ${title}`)
            }
          })

          if (results.length > 0) {
            foundResults = true
            break
          }
        }
      }

      if (!foundResults) {
        console.warn('[Baidu] No results found with any selector, trying fallback')
        // 备用方案：查找所有包含链接的元素
        $('a[href]').each((index, element) => {
          if (results.length >= limit) {
            return false
          }

          const $element = $(element)
          const title = $element.text().trim()
          const url = $element.attr('href')
          const parent = $element.parent()
          const snippet = parent.text().trim()

          if (title && url && title.length > 10 && url.includes('http') && !this.isBaiduAd($element)) {
            results.push({ title, url, snippet: snippet.slice(0, 200) })
          }
        })
      }

      console.log(`[Baidu] Total results found: ${results.length}`)

      // 爬取内容（限制并发数量）
      const maxConcurrent = 3
      for (let i = 0; i < results.length; i += maxConcurrent) {
        const batch = results.slice(i, i + maxConcurrent)
        console.log(12321321321312312, batch)
        await Promise.all(
          batch.map(async (result) => {
            result.content = await this.crawlContent(result.url)
          }),
        )
      }

      return results.slice(0, limit)
    } catch (error) {
      console.error('[SearchEngine] Baidu search failed:', error)
      return []
    }
  }

  /**
   * 检查是否为百度广告
   */
  private isBaiduAd($element: cheerio.Cheerio<any>): boolean {
    const className = $element.attr('class') || ''
    const id = $element.attr('id') || ''
    const tpl = $element.attr('tpl') || ''

    // 百度广告的特征
    const adPatterns = [
      'ec_wise_ad', 'ad', 'ads', 'tuiguang', 'sponsored',
      'right_toplist', 'ec_im_container', 'c-recommend',
    ]

    return adPatterns.some(pattern =>
      className.includes(pattern) ||
      id.includes(pattern) ||
      tpl.includes(pattern),
    ) || $element.find('.tuiguang').length > 0
  }

  /**
   * 爬取网页内容并过滤广告
   */
  private async crawlContent(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        timeout: 10000,
      })

      const $ = cheerio.load(response.data)

      // 移除广告和无用元素
      this.removeAdsAndClutter($)

      // 提取主要内容
      const content = this.extractMainContent($)

      return content.slice(0, 2000) // 限制内容长度
    } catch (error) {
      console.error(`[SearchEngine] Failed to crawl content from ${url}:`, error)
      return ''
    }
  }

  /**
   * 移除广告和无用元素
   */
  private removeAdsAndClutter($: cheerio.CheerioAPI): void {
    // 移除常见的广告和无用元素
    const adSelectors = [
      'script', 'style', 'noscript', 'iframe',
      '.ad', '.ads', '.advertisement', '.google-ad',
      '.banner', '.popup', '.modal', '.overlay',
      '.sidebar', '.footer', '.header', '.nav',
      '.social', '.share', '.comment', '.related',
      '[class*="ad-"]', '[id*="ad-"]', '[class*="ads-"]',
      '[class*="banner"]', '[class*="popup"]',
      '.adsbygoogle', '.adsense',
    ]

    adSelectors.forEach(selector => {
      $(selector).remove()
    })

    // 移除包含广告关键词的元素
    const adKeywords = ['广告', '推广', 'advertisement', 'sponsored', 'promo']
    $('*').each((_, element) => {
      const text = $(element).text().toLowerCase()
      const className = $(element).attr('class') || ''
      const id = $(element).attr('id') || ''

      if (adKeywords.some(keyword =>
        text.includes(keyword) ||
        className.includes(keyword) ||
        id.includes(keyword),
      )) {
        $(element).remove()
      }
    })
  }

  /**
   * 提取主要内容
   */
  private extractMainContent($: cheerio.CheerioAPI): string {
    // 尝试从常见的内容容器中提取文本
    const contentSelectors = [
      'article', 'main', '.content', '.post', '.entry',
      '.article-content', '.post-content', '.entry-content',
      '.main-content', '.page-content', 'p',
    ]

    let content = ''

    for (const selector of contentSelectors) {
      const elements = $(selector)
      if (elements.length > 0) {
        content = elements.map((_, el) => $(el).text()).get().join('\n')
        if (content.length > 100) {
          break
        }
      }
    }

    // 如果没有找到合适的内容，使用body文本
    if (!content || content.length < 100) {
      content = $('body').text()
    }

    // 清理文本
    return content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim()
  }

  /**
   * 检查元素是否为广告
   */
  private isAd(element: any, $: cheerio.CheerioAPI): boolean {
    const $element = $(element)
    const className = $element.attr('class') || ''
    const id = $element.attr('id') || ''
    const text = $element.text().toLowerCase()

    // 检查广告相关的类名和ID
    const adPatterns = [
      'ad', 'ads', 'advertisement', 'sponsored', 'promo',
      'banner', 'popup', 'adsbygoogle',
    ]

    return adPatterns.some(pattern =>
      className.includes(pattern) ||
      id.includes(pattern) ||
      text.includes('广告') ||
      text.includes('推广'),
    )
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<SearchEngineConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// 单例实例
let searchEngineService: SearchEngineService | null = null

export const getSearchEngineService = (config?: SearchEngineConfig): SearchEngineService => {
  if (!searchEngineService) {
    searchEngineService = new SearchEngineService(config)
  }
  return searchEngineService
}
