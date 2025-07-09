# PlanAndExecute 功能说明

## 概述

PlanAndExecute 是基于 LangChain 的智能规划和执行系统，集成在 MCP 服务器中。它可以将复杂的目标分解为具体的执行步骤，并逐步执行这些步骤。

## 功能特性

- **智能规划**: 使用 LLM 将复杂目标分解为可执行的步骤
- **步骤执行**: 逐步执行计划中的每个步骤
- **子任务分解**: 自动将复杂步骤分解为更小的子任务
- **智能重规划**: 当执行失败时自动重新调整计划策略
- **实时反馈**: 通过 SSE 实时广播执行进度
- **错误处理**: 处理执行过程中的错误并提供反馈
- **多种模式**: 支持分步执行和一步执行两种模式
- **配置灵活**: 支持自定义重规划阈值和策略

## API 端点

### 1. 创建执行计划
```http
POST /mcp/plan/create
Content-Type: application/json

{
  "goal": "你的目标描述"
}
```

**响应示例:**
```json
{
  "success": true,
  "plan": {
    "id": "plan_xxx",
    "goal": "制作一个简单的网页",
    "status": "planning",
    "steps": [
      {
        "id": "step_xxx",
        "description": "创建 HTML 基础结构",
        "status": "pending",
        "timestamp": 1234567890
      }
    ],
    "createdAt": 1234567890
  }
}
```

### 2. 执行计划
```http
POST /mcp/plan/execute/{planId}
```

**响应示例:**
```json
{
  "success": true,
  "plan": {
    "id": "plan_xxx",
    "status": "completed",
    "steps": [
      {
        "id": "step_xxx",
        "description": "创建 HTML 基础结构",
        "status": "completed",
        "result": "已创建包含标题、导航和内容区域的 HTML 结构...",
        "timestamp": 1234567890
      }
    ],
    "completedAt": 1234567890
  }
}
```

### 3. 一步执行（创建并执行）
```http
POST /mcp/plan/execute
Content-Type: application/json

{
  "goal": "你的目标描述"
}
```

### 4. 获取计划详情
```http
GET /mcp/plan/{planId}
```

### 5. 获取所有计划列表
```http
GET /mcp/plans
```

**响应示例:**
```json
{
  "plans": [
    {
      "id": "plan_xxx",
      "goal": "制作一个简单的网页",
      "status": "completed",
      "stepCount": 5,
      "completedSteps": 5,
      "createdAt": 1234567890,
      "completedAt": 1234567890
    }
  ]
}
```

### 6. 删除计划
```http
DELETE /mcp/plan/{planId}
```

### 7. 手动触发重规划
```http
POST /mcp/plan/replan/{planId}
Content-Type: application/json

{
  "currentStepIndex": 2  // 可选，从哪个步骤开始重规划
}
```

**响应示例:**
```json
{
  "success": true,
  "plan": {
    "id": "plan_xxx",
    "steps": [
      // 原有步骤 + 新的重规划步骤
    ]
  },
  "newStepsCount": 3
}
```

### 8. 获取重规划配置
```http
GET /mcp/plan/config
```

**响应示例:**
```json
{
  "enableReplanning": true,
  "replanThreshold": 2,
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "maxTokens": 2000
}
```

### 9. 更新重规划配置
```http
PUT /mcp/plan/config
Content-Type: application/json

{
  "enableReplanning": true,
  "replanThreshold": 3,
  "temperature": 0.8,
  "maxTokens": 2500
}
```

## 实时更新

通过 SSE 连接 `/mcp/chat/stream` 可以接收实时的计划执行更新：

```javascript
const eventSource = new EventSource('/mcp/chat/stream');

eventSource.addEventListener('plan_step_update', (event) => {
  const data = JSON.parse(event.data);
  console.log('步骤更新:', data.step);
});
```

## 配置选项

### 基础配置
```typescript
interface PlanAndExecuteConfig {
  apiKey?: string;          // API 密钥
  baseURL?: string;         // API 基础 URL
  model?: string;           // 使用的模型
  temperature?: number;     // 温度参数
  maxTokens?: number;       // 最大 token 数
  plannerPrompt?: string;   // 规划提示词
  executorPrompt?: string;  // 执行提示词
  replannerPrompt?: string; // 重规划提示词
  subtaskDecomposerPrompt?: string; // 子任务分解器提示词
  enableReplanning?: boolean; // 是否启用重规划
  replanThreshold?: number; // 失败步骤数阈值，超过此数量触发重规划
  enableSubtaskDecomposition?: boolean; // 是否启用子任务分解
  maxSubtaskDepth?: number; // 最大子任务深度
}
```

### 美团 AIGC 配置
服务器会自动检测美团 AIGC 配置并使用相应的 API：

```typescript
// 在 MCPServerConfig 中配置
{
  meituanAIGC: {
    apiUrl: 'https://aigc.com/v1/openai/native',
    appId: 'your-app-id',
    defaultModel: 'gpt-3.5-turbo'
  }
}
```

## 使用示例

### 1. 基础使用
```javascript
// 创建计划
const createResponse = await fetch('/mcp/plan/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    goal: '制作一个简单的网页，包含标题、导航栏和内容区域'
  })
});

const { plan } = await createResponse.json();

// 执行计划
const executeResponse = await fetch(`/mcp/plan/execute/${plan.id}`, {
  method: 'POST'
});

const { plan: executedPlan } = await executeResponse.json();
console.log('执行结果:', executedPlan);
```

### 2. 一步执行
```javascript
const response = await fetch('/mcp/plan/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    goal: '写一个 JavaScript 函数来计算两个数的和'
  })
});

const { plan } = await response.json();
console.log('执行完成:', plan);
```

## 测试

运行测试脚本来验证功能：

```bash
# 确保 MCP 服务器在 localhost:3001 运行
node scripts/test-plan-and-execute.js
```

测试脚本会执行以下操作：
1. 检查服务器健康状态
2. 创建执行计划
3. 执行计划
4. 获取计划详情
5. 测试一步执行功能
6. 获取所有计划列表

## 错误处理

- **400 Bad Request**: 请求参数错误
- **404 Not Found**: 计划不存在
- **503 Service Unavailable**: PlanAndExecute 代理不可用
- **500 Internal Server Error**: 服务器内部错误

## 注意事项

1. **API 密钥**: 确保配置了正确的 API 密钥（OpenAI 或美团 AIGC）
2. **网络连接**: 执行过程需要网络连接来调用 LLM API
3. **执行时间**: 复杂任务可能需要较长时间执行
4. **资源限制**: 注意 API 调用的频率和 token 限制

## 扩展功能

可以通过以下方式扩展功能：

1. **自定义提示词**: 修改 `plannerPrompt` 和 `executorPrompt`
2. **添加工具**: 在执行步骤中集成外部工具和 API
3. **持久化存储**: 将计划和执行结果保存到数据库
4. **权限控制**: 添加用户认证和权限管理

## 故障排除

### 常见问题

1. **PlanAndExecute agent is not available**
   - 检查 API 密钥配置
   - 确认网络连接正常

2. **Failed to create plan**
   - 检查目标描述是否清晰
   - 确认 API 配额是否充足

3. **Step execution failed**
   - 查看具体错误信息
   - 检查步骤描述是否合理

### 调试模式

启用详细日志来调试问题：

```bash
DEBUG=plan-and-execute npm run dev
