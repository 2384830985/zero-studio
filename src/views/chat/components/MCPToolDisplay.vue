<template>
  <div class="mcp-tool-display">
    <!-- 工具调用信息 -->
    <div
      v-if="toolCalls && toolCalls.length > 0"
      class="mb-3"
    >
      <div
        v-for="toolCall in toolCalls"
        :key="toolCall.id"
        class="mcp-tool-call mb-2"
      >
        <div class="flex items-center gap-2 mb-2">
          <ToolOutlined class="text-blue-500" />
          <span class="font-medium text-sm text-gray-700">调用工具</span>
          <div class="flex items-center gap-1">
            <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono">
              {{ toolCall.name }}
            </span>
            <span
              v-if="toolCall.serverName"
              class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
            >
              {{ toolCall.serverName }}
            </span>
          </div>
        </div>

        <!-- 工具参数 - 可收缩 -->
        <div
          v-if="toolCall.arguments && Object.keys(toolCall.arguments).length > 0"
          class="ml-6 mb-2"
        >
          <div
            class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded p-1 -m-1 transition-colors"
            @click="toggleArgumentsCollapse(toolCall.id)"
          >
            <span
              class="text-xs text-gray-400 transition-transform duration-200"
              :class="{ 'rotate-90': argumentsCollapsed[toolCall.id] === false }"
            >
              ▶
            </span>
            <span class="text-xs text-gray-500 select-none">
              参数 ({{ getArgumentsSize(toolCall.arguments) }})
            </span>
          </div>
          <div
            v-show="argumentsCollapsed[toolCall.id] === false"
            class="bg-gray-50 rounded p-2 text-xs font-mono mt-1 transition-all duration-200"
          >
            <pre class="whitespace-pre-wrap text-gray-700 break-all overflow-wrap-anywhere">{{ formatArguments(toolCall.arguments) }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 工具执行结果 -->
    <div
      v-if="toolResults && toolResults.length > 0"
      class="mb-3"
    >
      <div
        v-for="result in toolResults"
        :key="result.toolCallId"
        class="mcp-tool-result mb-2"
      >
        <div class="flex items-center gap-2 mb-2">
          <CheckCircleOutlined
            v-if="result.success"
            class="text-green-500"
          />
          <ExclamationCircleOutlined
            v-else
            class="text-red-500"
          />
          <span class="font-medium text-sm text-gray-700">工具结果</span>
          <span class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono">
            {{ result.toolName }}
          </span>
          <span
            v-if="result.executionTime"
            class="text-xs text-gray-500"
          >
            {{ result.executionTime }}ms
          </span>
        </div>

        <!-- 结果内容 - 可收缩 -->
        <div class="ml-6">
          <!-- 成功结果 -->
          <div
            v-if="result.success && result.result"
            class="bg-green-50 border border-green-200 rounded"
          >
            <div
              class="flex items-center gap-2 cursor-pointer hover:bg-green-100 rounded-t p-2 transition-colors"
              @click="toggleResultCollapse(result.toolCallId)"
            >
              <span
                class="text-xs text-green-600 transition-transform duration-200"
                :class="{ 'rotate-90': resultsCollapsed[result.toolCallId] === false }"
              >
                ▶
              </span>
              <span class="text-xs text-green-600 select-none">
                执行成功 ({{ getResultSize(result.result) }})
              </span>
            </div>
            <div
              v-show="resultsCollapsed[result.toolCallId] === false"
              class="px-3 pb-3 transition-all duration-200"
            >
              <div class="text-sm text-gray-700">
                <pre
                  v-if="isJsonResult(result.result)"
                  class="whitespace-pre-wrap font-mono text-xs max-h-60 overflow-y-auto break-all overflow-wrap-anywhere"
                >{{ formatResult(result.result) }}</pre>
                <div
                  v-else
                  class="whitespace-pre-wrap max-h-60 overflow-y-auto break-all overflow-wrap-anywhere"
                >
                  {{ result.result }}
                </div>
              </div>
            </div>
          </div>

          <!-- 失败结果 -->
          <div
            v-if="!result.success && result.error"
            class="bg-red-50 border border-red-200 rounded"
          >
            <div
              class="flex items-center gap-2 cursor-pointer hover:bg-red-100 rounded-t p-2 transition-colors"
              @click="toggleResultCollapse(result.toolCallId)"
            >
              <span
                class="text-xs text-red-600 transition-transform duration-200"
                :class="{ 'rotate-90': resultsCollapsed[result.toolCallId] === false }"
              >
                ▶
              </span>
              <span class="text-xs text-red-600 select-none">
                执行失败
              </span>
            </div>
            <div
              v-show="resultsCollapsed[result.toolCallId] === false"
              class="px-3 pb-3 transition-all duration-200"
            >
              <div class="text-sm text-red-700 whitespace-pre-wrap max-h-60 overflow-y-auto break-all overflow-wrap-anywhere">
                {{ result.error }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import {
  ToolOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons-vue'
import type { MCPToolCall, MCPToolResult } from '../chat.type'

interface Props {
  toolCalls?: MCPToolCall[]
  toolResults?: MCPToolResult[]
}

defineProps<Props>()

// 收缩状态管理
const argumentsCollapsed = reactive<Record<string, boolean>>({})
const resultsCollapsed = reactive<Record<string, boolean>>({})

// 切换参数收缩状态
const toggleArgumentsCollapse = (toolCallId: string) => {
  // 如果未定义，默认为收起状态(undefined)，点击后展开(false)
  // 如果已展开(false)，点击后收起(true)
  // 如果已收起(true)，点击后展开(false)
  if (argumentsCollapsed[toolCallId] === undefined) {
    argumentsCollapsed[toolCallId] = false // 展开
  } else {
    argumentsCollapsed[toolCallId] = !argumentsCollapsed[toolCallId]
  }
}

// 切换结果收缩状态
const toggleResultCollapse = (toolCallId: string) => {
  // 同样的逻辑
  if (resultsCollapsed[toolCallId] === undefined) {
    resultsCollapsed[toolCallId] = false // 展开
  } else {
    resultsCollapsed[toolCallId] = !resultsCollapsed[toolCallId]
  }
}

// 获取参数大小描述
const getArgumentsSize = (args: any) => {
  try {
    const size = Object.keys(JSON.parse(args))?.length
    return `${size} 项`
  } catch (error) {
    return '未知'
  }
}

// 获取结果大小描述
const getResultSize = (result: any) => {
  if (typeof result === 'string') {
    return `${result.length} 字符`
  } else if (typeof result === 'object' && result !== null) {
    const keys = Object.keys(result)
    return `${keys.length} 字段`
  }
  return '数据'
}

// 格式化工具参数
const formatArguments = (args: Record<string, any>) => {
  try {
    return JSON.stringify(args, null, 2)
  } catch {
    return String(args)
  }
}

// 判断结果是否为JSON格式
const isJsonResult = (result: any) => {
  return typeof result === 'object' && result !== null
}

// 格式化工具结果
const formatResult = (result: any) => {
  try {
    if (typeof result === 'string') {
      // 尝试解析字符串是否为JSON
      try {
        const parsed = JSON.parse(result)
        return JSON.stringify(parsed, null, 2)
      } catch {
        return result
      }
    }
    return JSON.stringify(result, null, 2)
  } catch {
    return String(result)
  }
}
</script>

<style scoped>
.mcp-tool-display {
  font-size: 14px;
}

.mcp-tool-call,
.mcp-tool-result {
  border-left: 3px solid #e5e7eb;
  padding-left: 12px;
}

.mcp-tool-call {
  border-left-color: #3b82f6;
}

.mcp-tool-result {
  border-left-color: #10b981;
}

pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.4;
}

/* 滚动条样式 */
.max-h-60::-webkit-scrollbar {
  width: 4px;
}

.max-h-60::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.max-h-60::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.max-h-60::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 过渡动画 */
.transition-all {
  transition: all 0.2s ease-in-out;
}

/* 强制换行样式 */
.mcp-tool-display * {
  word-wrap: break-word;
  overflow-wrap: anywhere;
  word-break: break-all;
}

/* 确保长 URL 和代码能够正确换行 */
.mcp-tool-display pre,
.mcp-tool-display code {
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: anywhere;
  word-break: break-all;
}
</style>
