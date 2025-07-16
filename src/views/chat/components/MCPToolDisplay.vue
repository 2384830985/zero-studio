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

        <!-- 工具参数 -->
        <div
          v-if="toolCall.arguments && Object.keys(toolCall.arguments).length > 0"
          class="ml-6 mb-2"
        >
          <div class="text-xs text-gray-500 mb-1">
            参数:
          </div>
          <div class="bg-gray-50 rounded p-2 text-xs font-mono">
            <pre class="whitespace-pre-wrap text-gray-700">{{ formatArguments(toolCall.arguments) }}</pre>
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

        <!-- 结果内容 -->
        <div class="ml-6">
          <div
            v-if="result.success && result.result"
            class="bg-green-50 border border-green-200 rounded p-3"
          >
            <div class="text-xs text-green-600 mb-1">
              执行成功:
            </div>
            <div class="text-sm text-gray-700">
              <pre
                v-if="isJsonResult(result.result)"
                class="whitespace-pre-wrap font-mono text-xs"
              >{{ formatResult(result.result) }}</pre>
              <div
                v-else
                class="whitespace-pre-wrap"
              >
                {{ result.result }}
              </div>
            </div>
          </div>

          <div
            v-if="!result.success && result.error"
            class="bg-red-50 border border-red-200 rounded p-3"
          >
            <div class="text-xs text-red-600 mb-1">
              执行失败:
            </div>
            <div class="text-sm text-red-700 whitespace-pre-wrap">
              {{ result.error }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
</style>
