/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `big_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 估算文本的token数量
 * @param text 要估算的文本
 * @returns token数量
 */
export function estimateTokens(text: string): number {
  // 简单的 token 估算：大约 4 个字符 = 1 个 token
  return Math.ceil(text.length / 4)
}

/**
 * 生成模拟响应
 * @param input 用户输入
 * @returns 模拟的响应内容
 */
export function generateMockResponse(input: string): string {
  const templates = [
    `基于您的输入"${input}"，我认为这是一个需要深入分析的问题。`,
    `关于"${input}"这个话题，我可以从多个角度来为您解答。`,
    `您提到的"${input}"确实很有意思，让我为您详细说明。`,
    `针对"${input}"，我建议我们可以这样来理解和处理。`,
  ]

  const template = templates[Math.floor(Math.random() * templates.length)]
  const additionalContent = [
    '首先，我们需要理解问题的核心所在。',
    '其次，我们可以考虑多种解决方案。',
    '最后，我建议采用渐进式的方法来处理。',
    '希望这个回答对您有所帮助！',
  ].join('\n\n')

  return `${template}\n\n${additionalContent}`
}

/**
 * 生成MCP模拟响应
 * @param userContent 用户输入内容
 * @returns 模拟的MCP响应
 */
export function generateMockMCPResponseContent(userContent: string): string {
  const responses = [
    '我理解您的问题。作为 MCP 服务器，我可以为您提供详细的分析...',
    '这是一个很有趣的话题！基于 MCP 协议的处理能力...',
    '感谢您使用 MCP 服务。根据您的输入...',
    '让我通过 MCP 服务器为您详细解释这个问题...',
    '基于 MCP 协议的智能分析，这个问题涉及到几个方面...',
  ]

  const randomResponse = responses[Math.floor(Math.random() * responses.length)]
  return `${randomResponse}\n\n针对您提到的"${userContent}"，我的回答是：${generateMockResponse(userContent)}`
}
