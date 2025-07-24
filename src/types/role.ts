export interface AIRole {
  id: string
  name: string
  description: string
  avatar?: string
  systemPrompt: string
  category: string
  tags: string[]
  isEnabled: boolean
  createdAt: number
  updatedAt: number
}

export interface RoleCategory {
  id: string
  name: string
  description: string
  icon?: string
}

export const DEFAULT_ROLE_CATEGORIES: RoleCategory[] = [
  { id: 'assistant', name: '助手', description: '通用助手角色', icon: '🤖' },
  { id: 'creative', name: '创意', description: '创意写作和设计', icon: '🎨' },
  { id: 'professional', name: '专业', description: '专业领域专家', icon: '💼' },
  { id: 'education', name: '教育', description: '教学和学习助手', icon: '📚' },
  { id: 'entertainment', name: '娱乐', description: '娱乐和游戏', icon: '🎮' },
  { id: 'custom', name: '自定义', description: '用户自定义角色', icon: '⚙️' },
]

export const BUILT_IN_ROLES: AIRole[] = [
  {
    id: 'default',
    name: '默认助手',
    description: '通用AI助手，可以帮助您解答问题和完成各种任务',
    systemPrompt: '你是一个有用的AI助手，请友好、准确地回答用户的问题。',
    category: 'assistant',
    tags: ['通用', '助手'],
    isEnabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'programmer',
    name: '编程助手',
    description: '专业的编程和技术问题解答助手',
    systemPrompt: '你是一个专业的编程助手，擅长各种编程语言和技术问题。请提供准确、实用的编程建议和代码示例。',
    category: 'professional',
    tags: ['编程', '技术', '代码'],
    isEnabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'writer',
    name: '写作助手',
    description: '创意写作和文案创作助手',
    systemPrompt: '你是一个专业的写作助手，擅长创意写作、文案创作和文本优化。请帮助用户创作优质的文本内容。',
    category: 'creative',
    tags: ['写作', '创意', '文案'],
    isEnabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'teacher',
    name: '教学助手',
    description: '耐心的教学和学习指导助手',
    systemPrompt: '你是一个耐心的教学助手，擅长解释复杂概念，提供学习指导。请用简单易懂的方式帮助用户学习。',
    category: 'education',
    tags: ['教学', '学习', '指导'],
    isEnabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'translator',
    name: '翻译助手',
    description: '专业的多语言翻译助手',
    systemPrompt: '你是一个专业的翻译助手，擅长多种语言之间的准确翻译。请提供自然、流畅的翻译结果。',
    category: 'professional',
    tags: ['翻译', '语言', '多语言'],
    isEnabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]
