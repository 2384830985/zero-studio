/**
 * IPC 通道枚举
 * 定义了主进程和渲染进程之间通信的所有通道名称
 *
 * 使用枚举的好处：
 * 1. 类型安全 - 避免字符串拼写错误
 * 2. 代码提示 - IDE 可以提供自动补全
 * 3. 重构友好 - 修改通道名称时可以全局替换
 * 4. 文档化 - 集中管理所有 IPC 通道
 */
export enum IpcChannel {
  // ==================== 聊天相关 ====================
  /** 发送聊天消息 */
  CHAT_SEND = 'chat-send',
  /** ReAct 模式聊天 - 推理和行动循环 */
  CHAT_REACT = 'chat-reAct',
  /** 计划模式聊天 - 制定和执行计划 */
  CHAT_PLAN = 'chat-plan',
  /** 中断请求 */
  INTERRUPT_REQUEST = 'interrupt-request',

  // ==================== MCP 连接相关 ====================
  /** 连接 MCP (Model Context Protocol) 服务器 */
  CONNECT_MCP = 'connect-mcp',
  /** 用户输入响应 */
  USER_INPUT_RESPONSE = 'user-input-response',

  // ==================== LanceDB 向量数据库相关 ====================
  // 数据库管理
  /** 初始化 LanceDB 数据库连接 */
  LANCEDB_INITIALIZE = 'lancedb-initialize',
  /** 获取数据库统计信息（表数量、文档数量等） */
  LANCEDB_GET_DATABASE_STATS = 'lancedb-get-database-stats',

  // 表管理 (Table Management)
  /** 列出所有数据表 */
  LANCEDB_LIST_TABLES = 'lancedb-list-tables',
  /** 获取指定表的详细信息（字段结构、文档数量等） */
  LANCEDB_GET_TABLE_INFO = 'lancedb-get-table-info',
  /** 创建新的数据表 */
  LANCEDB_CREATE_TABLE = 'lancedb-create-table',
  /** 删除指定的数据表 */
  LANCEDB_DELETE_TABLE = 'lancedb-delete-table',
  /** 创建表的同时批量添加文档 */
  LANCEDB_CREATE_TABLE_WITH_DOCUMENTS = 'lancedb-create-table-with-documents',

  // 文档操作 (Document CRUD)
  /** 获取表中的所有文档 */
  LANCEDB_GET_ALL_DOCUMENTS = 'lancedb-get-all-documents',
  /** 根据 ID 获取特定文档 */
  LANCEDB_GET_DOCUMENT_BY_ID = 'lancedb-get-document-by-id',
  /** 向表中批量添加文档 */
  LANCEDB_ADD_DOCUMENTS = 'lancedb-add-documents',
  /** 更新指定文档的内容 */
  LANCEDB_UPDATE_DOCUMENT = 'lancedb-update-document',
  /** 删除指定的文档 */
  LANCEDB_DELETE_DOCUMENT = 'lancedb-delete-document',

  // 搜索功能 (Search & Query)
  /** 执行向量相似度搜索 */
  LANCEDB_SEARCH_DOCUMENTS = 'lancedb-search-documents',
  /** 获取搜索建议（基于现有文档内容） */
  LANCEDB_GET_SEARCH_SUGGESTIONS = 'lancedb-get-search-suggestions',

  // 文件上传相关
  /** 上传文件并创建知识库表 */
  LANCEDB_UPLOAD_FILE_CREATE_TABLE = 'lancedb-upload-file-create-table',

  // ==================== 数据库相关 ====================
  // 数据库管理
  /** 初始化数据库 */
  DATABASE_INITIALIZE = 'database-initialize',
  /** 检查数据库连接 */
  DATABASE_CHECK_CONNECTION = 'database-check-connection',
  /** 获取数据库统计信息 */
  DATABASE_GET_STATS = 'database-get-stats',
  /** 重置数据库 */
  DATABASE_RESET = 'database-reset',
  /** 备份数据库 */
  DATABASE_BACKUP = 'database-backup',

  // 用户管理
  /** 创建用户 */
  USER_CREATE = 'user-create',
  /** 获取用户列表 */
  USER_LIST = 'user-list',
  /** 根据ID获取用户 */
  USER_GET_BY_ID = 'user-get-by-id',
  /** 更新用户 */
  USER_UPDATE = 'user-update',
  /** 删除用户 */
  USER_DELETE = 'user-delete',

  // 项目管理
  /** 创建项目 */
  PROJECT_CREATE = 'project-create',
  /** 获取项目列表 */
  PROJECT_LIST = 'project-list',
  /** 根据ID获取项目 */
  PROJECT_GET_BY_ID = 'project-get-by-id',
  /** 更新项目 */
  PROJECT_UPDATE = 'project-update',
  /** 删除项目 */
  PROJECT_DELETE = 'project-delete',

  // 任务管理
  /** 创建任务 */
  TASK_CREATE = 'task-create',
  /** 获取任务列表 */
  TASK_LIST = 'task-list',
  /** 根据ID获取任务 */
  TASK_GET_BY_ID = 'task-get-by-id',
  /** 更新任务 */
  TASK_UPDATE = 'task-update',
  /** 删除任务 */
  TASK_DELETE = 'task-delete',

  // 笔记管理
  /** 创建笔记 */
  NOTE_CREATE = 'note-create',
  /** 获取笔记列表 */
  NOTE_LIST = 'note-list',
  /** 根据ID获取笔记 */
  NOTE_GET_BY_ID = 'note-get-by-id',
  /** 更新笔记 */
  NOTE_UPDATE = 'note-update',
  /** 删除笔记 */
  NOTE_DELETE = 'note-delete',

  // 设置管理
  /** 获取设置 */
  SETTING_GET = 'setting-get',
  /** 设置值 */
  SETTING_SET = 'setting-set',
  /** 获取所有设置 */
  SETTING_LIST = 'setting-list',

  // 文章管理
  /** 创建文章 */
  ARTICLE_CREATE = 'article-create',
  /** 获取文章列表 */
  ARTICLE_LIST = 'article-list',
  /** 根据ID获取文章 */
  ARTICLE_GET_BY_ID = 'article-get-by-id',
  /** 更新文章 */
  ARTICLE_UPDATE = 'article-update',
  /** 删除文章 */
  ARTICLE_DELETE = 'article-delete',

  /** 优化 prompt */
  OPTIMIZATION_PROMPT = 'optimization-prompt',
}
