# MCP Plan-and-Execute 集成总结

## 概述

已成功将 `plan-and-execute` 功能集成到 MCP 聊天界面中，用户现在可以在普通聊天模式和计划执行模式之间切换。

## 主要变更

### 1. 后端集成 (electron/main/mcp-server.ts)

#### 新增导入
```typescript
import {
  PlanAndExecuteAgent,
  ExecutionPlan,
  PlanStep,
  MeituanPlanAndExecuteAgent,
} from './plan-and-execute'
```

#### 新增属性
- `planAgent: PlanAndExecuteAgent | null` - Plan-and-Execute 代理实例
- `executionPlans: Map<string, ExecutionPlan>` - 存储执行计划

#### 新增方法
- `initializePlanAgent()` - 初始化 Plan-and-Execute 代理
- `setupPlanRoutes()` - 设置计划相关的 API 路由
- `executePlanWithStreaming()` - 流式执行计划并实时广播结果

#### 新增 API 路由
- `POST /mcp/plan/create` - 创建执行计划
- `POST /mcp/plan/execute/:planId` - 执行指定计划
- `POST /mcp/plan/execute` - 一步创建并执行计划
- `GET /mcp/plan/:planId` - 获取计划详情
- `GET /mcp/plans` - 获取所有计划列表
- `DELETE /mcp/plan/:planId` - 删除计划
- `POST /mcp/plan/replan/:planId` - 重新规划
- `GET /mcp/plan/config` - 获取计划配置
- `PUT /mcp/plan/config` - 更新计划配置

### 2. 前端集成 (src/views/mcp/MCPChatView.vue)

#### 新增功能
- **模式切换按钮**: 在顶部状态栏添加了计划模式/聊天模式切换按钮
- **动态提示文本**: 根据当前模式显示不同的输入提示
- **动态欢迎消息**: 根据当前模式显示不同的欢迎信息
- **智能路由选择**: 根据模式自动选择不同的 API 端点

#### 新增响应式数据
```typescript
const usePlanMode = ref(false) // 控制模式切换
```

#### 新增图标导入
```typescript
import {
  BulbOutlined,    // 计划模式图标
  MessageOutlined, // 聊天模式图标
} from '@ant-design/icons-vue'
```

#### 修改的功能
- **发送消息逻辑**: 根据 `usePlanMode` 选择调用不同的 API
  - 聊天模式: `POST /mcp/chat/send`
  - 计划模式: `POST /mcp/plan/create`

## 功能特性

### 1. 智能模式切换
- 用户可以通过顶部的按钮在聊天模式和计划模式之间切换
- 不同模式下显示不同的图标和文本提示
- 模式切换会影响输入提示和欢迎消息

### 2. 流式计划执行
- 计划模式下，AI 会将用户输入的目标分解为具体步骤
- 执行过程中实时显示每个步骤的状态和结果
- 支持子任务分解和重规划功能
- 执行结果以结构化的方式展示，包含进度和状态图标

### 3. 兼容性保持
- 原有的聊天功能完全保持不变
- 模型选择、统计信息等功能正常工作
- 对话历史和消息流式传输功能不受影响

## 使用方式

### 聊天模式 (默认)
1. 点击顶部的"聊天模式"按钮确保处于聊天模式
2. 正常输入消息进行对话
3. AI 会直接回复用户的问题

### 计划模式
1. 点击顶部的"计划模式"按钮切换到计划模式
2. 输入目标任务，例如："帮我制定一个学习 Vue.js 的计划"
3. AI 会自动分解任务为具体步骤并逐步执行
4. 实时查看执行进度和每个步骤的结果

## 技术实现

### 后端架构
- 使用 `PlanAndExecuteAgent` 处理计划创建和执行
- 支持美团 AIGC API 和 OpenAI API
- 通过 Server-Sent Events (SSE) 实现实时状态更新
- 计划数据存储在内存中，支持持久化查询

### 前端架构
- Vue 3 Composition API 实现响应式状态管理
- 通过 EventSource 接收实时更新
- 动态 UI 根据模式自动调整
- 保持与现有聊天功能的完全兼容

## 配置说明

### 美团 AIGC 配置
如果配置了美团 AIGC，系统会自动使用 `MeituanPlanAndExecuteAgent`：
```typescript
{
  appId: 'your-app-id',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 2000,
  enableReplanning: true,
  enableSubtaskDecomposition: true,
}
```

### OpenAI 配置
如果没有配置美团 AIGC，会使用默认的 OpenAI 配置（需要设置 API Key）。

## 注意事项

1. **API 依赖**: 计划模式需要 LLM API 支持，确保已正确配置
2. **性能考虑**: 复杂任务的计划执行可能需要较长时间
3. **错误处理**: 系统包含完善的错误处理和回退机制
4. **内存使用**: 计划数据存储在内存中，重启后会丢失

## 后续优化建议

1. **持久化存储**: 将计划数据存储到数据库中
2. **计划模板**: 提供常用任务的计划模板
3. **进度可视化**: 添加更丰富的进度条和状态图表
4. **计划编辑**: 允许用户手动编辑和调整计划步骤
5. **历史记录**: 提供计划执行历史的查看和管理功能
