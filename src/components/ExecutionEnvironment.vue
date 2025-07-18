<template>
  <div class="execution-environment">
    <!-- 执行环境按钮组 -->
    <a-dropdown
      :trigger="['click']"
      placement="topLeft"
    >
      <a-button
        size="small"
        type="text"
        class="env-button"
        :loading="isExecuting"
      >
        <template #icon>
          <CodeOutlined />
        </template>
        执行环境
        <DownOutlined />
      </a-button>

      <template #overlay>
        <a-menu class="env-menu">
          <!-- 当前环境状态 -->
          <a-menu-item-group title="当前环境">
            <a-menu-item
              key="current-env"
              disabled
            >
              <div class="flex items-center justify-between">
                <span>Node.js: {{ nodeVersion }}</span>
                <CheckCircleOutlined class="text-green-500" />
              </div>
            </a-menu-item>
            <a-menu-item
              key="current-bun"
              :disabled="!bunAvailable"
            >
              <div class="flex items-center justify-between">
                <span>Bun: {{ bunVersion || '未安装' }}</span>
                <CheckCircleOutlined
                  v-if="bunAvailable"
                  class="text-green-500"
                />
                <CloseCircleOutlined
                  v-else
                  class="text-red-500"
                />
              </div>
            </a-menu-item>
            <a-menu-item
              key="current-uv"
              :disabled="!uvAvailable"
            >
              <div class="flex items-center justify-between">
                <span>UV: {{ uvVersion || '未安装' }}</span>
                <CheckCircleOutlined
                  v-if="uvAvailable"
                  class="text-green-500"
                />
                <CloseCircleOutlined
                  v-else
                  class="text-red-500"
                />
              </div>
            </a-menu-item>
          </a-menu-item-group>

          <a-menu-divider />

          <!-- 安装选项 -->
          <a-menu-item-group title="安装工具">
            <a-menu-item
              key="install-bun"
              :disabled="isExecuting || bunAvailable"
              @click="installBun"
            >
              <DownloadOutlined />
              安装 Bun
              <span
                v-if="bunAvailable"
                class="text-green-500 ml-2"
              >已安装</span>
            </a-menu-item>
            <a-menu-item
              key="install-uv"
              :disabled="isExecuting || uvAvailable"
              @click="installUv"
            >
              <DownloadOutlined />
              安装 UV
              <span
                v-if="uvAvailable"
                class="text-green-500 ml-2"
              >已安装</span>
            </a-menu-item>
          </a-menu-item-group>

          <a-menu-divider />

          <!-- 执行环境切换 -->
          <a-menu-item-group title="切换执行环境">
            <a-menu-item
              key="use-node"
              :class="{ 'ant-menu-item-selected': currentRuntime === 'node' }"
              @click="switchRuntime('node')"
            >
              <NodeIndexOutlined />
              使用 Node.js
            </a-menu-item>
            <a-menu-item
              key="use-bun"
              :disabled="!bunAvailable"
              :class="{ 'ant-menu-item-selected': currentRuntime === 'bun' }"
              @click="switchRuntime('bun')"
            >
              <ThunderboltOutlined />
              使用 Bun
              <span
                v-if="!bunAvailable"
                class="text-gray-400 ml-2"
              >需要安装</span>
            </a-menu-item>
            <a-menu-item
              key="use-uv"
              :disabled="!uvAvailable"
              :class="{ 'ant-menu-item-selected': currentRuntime === 'uv' }"
              @click="switchRuntime('uv')"
            >
              <RocketOutlined />
              使用 UV
              <span
                v-if="!uvAvailable"
                class="text-gray-400 ml-2"
              >需要安装</span>
            </a-menu-item>
          </a-menu-item-group>

          <a-menu-divider />

          <!-- 工具选项 -->
          <a-menu-item-group title="工具">
            <a-menu-item
              key="refresh"
              @click="refreshEnvironment"
            >
              <ReloadOutlined />
              刷新环境信息
            </a-menu-item>
            <a-menu-item
              key="open-bin"
              @click="openBinDirectory"
            >
              <FolderOpenOutlined />
              打开 bin 目录
            </a-menu-item>
          </a-menu-item-group>
        </a-menu>
      </template>
    </a-dropdown>

    <!-- 执行状态提示 -->
    <a-modal
      v-model:open="showExecutionModal"
      title="执行环境操作"
      :footer="null"
      :closable="false"
      :mask-closable="false"
    >
      <div class="text-center py-4">
        <LoadingOutlined class="text-2xl text-blue-500 mb-4" />
        <p class="text-lg mb-2">
          {{ executionMessage }}
        </p>
        <p class="text-gray-500">
          请稍候...
        </p>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message as antMessage } from 'ant-design-vue'
import {
  CodeOutlined,
  DownOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  NodeIndexOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  ReloadOutlined,
  FolderOpenOutlined,
  LoadingOutlined,
} from '@ant-design/icons-vue'

// 响应式数据
const isExecuting = ref(false)
const showExecutionModal = ref(false)
const executionMessage = ref('')

// 环境信息
const nodeVersion = ref('')
const bunVersion = ref('')
const uvVersion = ref('')
const bunAvailable = ref(false)
const uvAvailable = ref(false)
const currentRuntime = ref<'node' | 'bun' | 'uv'>('node')

// 获取环境信息
const getEnvironmentInfo = async () => {
  try {
    // 获取 Node.js 版本
    const envInfo = window.electronAPI?.dev?.getEnvironment()
    if (envInfo) {
      nodeVersion.value = envInfo.nodeVersion
    }

    // 检查 Bun 和 UV 是否可用
    await checkRuntimeAvailability()
  } catch (error) {
    console.error('获取环境信息失败:', error)
  }
}

// 检查运行时可用性
const checkRuntimeAvailability = async () => {
  try {
    // 通过 IPC 检查 Bun 和 UV 是否安装
    const bunExists = await window.ipcRenderer?.invoke('check-binary-exists', 'bun')
    const uvExists = await window.ipcRenderer?.invoke('check-binary-exists', 'uv')

    bunAvailable.value = bunExists || false
    uvAvailable.value = uvExists || false

    // 获取版本信息
    if (bunAvailable.value) {
      try {
        const bunVersionResult = await window.ipcRenderer?.invoke('get-binary-version', 'bun')
        bunVersion.value = bunVersionResult || 'unknown'
      } catch (error) {
        console.warn('获取 Bun 版本失败:', error)
      }
    }

    if (uvAvailable.value) {
      try {
        const uvVersionResult = await window.ipcRenderer?.invoke('get-binary-version', 'uv')
        uvVersion.value = uvVersionResult || 'unknown'
      } catch (error) {
        console.warn('获取 UV 版本失败:', error)
      }
    }
  } catch (error) {
    console.error('检查运行时可用性失败:', error)
  }
}

// 安装 Bun
const installBun = async () => {
  if (isExecuting.value) {
    return
  }

  isExecuting.value = true
  showExecutionModal.value = true
  executionMessage.value = '正在安装 Bun...'

  try {
    await window.ipcRenderer?.invoke('run-install-script', 'install-bun.cjs')
    antMessage.success('Bun 安装成功！')
    await refreshEnvironment()
  } catch (error) {
    console.error('安装 Bun 失败:', error)
    antMessage.error('Bun 安装失败，请查看控制台日志')
  } finally {
    isExecuting.value = false
    showExecutionModal.value = false
  }
}

// 安装 UV
const installUv = async () => {
  if (isExecuting.value) {
    return
  }

  isExecuting.value = true
  showExecutionModal.value = true
  executionMessage.value = '正在安装 UV...'

  try {
    await window.ipcRenderer?.invoke('run-install-script', 'install-uv.cjs')
    antMessage.success('UV 安装成功！')
    await refreshEnvironment()
  } catch (error) {
    console.error('安装 UV 失败:', error)
    antMessage.error('UV 安装失败，请查看控制台日志')
  } finally {
    isExecuting.value = false
    showExecutionModal.value = false
  }
}

// 切换运行时环境
const switchRuntime = async (runtime: 'node' | 'bun' | 'uv') => {
  if (isExecuting.value) {
    return
  }

  // 检查运行时是否可用
  if (runtime === 'bun' && !bunAvailable.value) {
    antMessage.warning('Bun 未安装，请先安装 Bun')
    return
  }
  if (runtime === 'uv' && !uvAvailable.value) {
    antMessage.warning('UV 未安装，请先安装 UV')
    return
  }

  currentRuntime.value = runtime

  try {
    // 通过 IPC 设置默认运行时
    await window.ipcRenderer?.invoke('set-default-runtime', runtime)
    antMessage.success(`已切换到 ${runtime.toUpperCase()} 运行时`)
  } catch (error) {
    console.error('切换运行时失败:', error)
    antMessage.error('切换运行时失败')
  }
}

// 刷新环境信息
const refreshEnvironment = async () => {
  if (isExecuting.value) {
    return
  }

  isExecuting.value = true
  try {
    await getEnvironmentInfo()
    antMessage.success('环境信息已刷新')
  } catch (error) {
    console.error('刷新环境信息失败:', error)
    antMessage.error('刷新环境信息失败')
  } finally {
    isExecuting.value = false
  }
}

// 打开 bin 目录
const openBinDirectory = async () => {
  try {
    await window.ipcRenderer?.invoke('open-bin-directory')
  } catch (error) {
    console.error('打开 bin 目录失败:', error)
    antMessage.error('打开 bin 目录失败')
  }
}

// 组件挂载时获取环境信息
onMounted(() => {
  getEnvironmentInfo()
})
</script>

<style scoped>
.execution-environment {
  display: inline-block;
}

.env-button {
  color: #9ca3af;
  border: none;
  box-shadow: none;
  transition: color 0.2s ease;
  height: 20px;
  padding: 0 6px;
  font-size: 12px;
  display: flex;
  align-items: center;
  line-height: 1;
}

.env-button:hover {
  color: #3b82f6;
  background-color: transparent;
}

.env-button:focus {
  color: #3b82f6;
  background-color: transparent;
}

/* 修复按钮内图标对齐问题 */
.env-button :deep(.ant-btn-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
  font-size: 14px;
  width: 14px;
  height: 14px;
  vertical-align: middle;
}

.env-button :deep(.anticon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  line-height: 1;
}

/* 修复下拉箭头的对齐 */
.env-button :deep(.anticon-down) {
  font-size: 10px;
  margin-left: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}

/* 确保按钮内容垂直居中 */
.env-button :deep(.ant-btn-content) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.env-menu {
  min-width: 250px;
}

.env-menu .ant-menu-item {
  padding: 8px 16px;
}

.env-menu .ant-menu-item-group-title {
  font-weight: 600;
  color: #333;
}

.env-menu .ant-menu-item-selected {
  background-color: #e6f7ff;
  color: #1890ff;
}

.env-menu .ant-menu-item:hover {
  background-color: #f5f5f5;
}
</style>
