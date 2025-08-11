<template>
  <a-modal
    :visible="userInputVisible"
    :title="title"
    :closable="false"
    :mask-closable="false"
    :keyboard="false"
    :footer="null"
    width="400px"
    :body-style="{ padding: 0 }"
    class="user-input-modal"
  >
    <div class="modal-content">
      <!-- 内容区域 -->
      <div class="modal-body">
        <p class="prompt-text">
          {{ userInputPrompt }}
        </p>
        <a-input
          v-model:value="userInput"
          placeholder="请输入..."
          :disabled="isSubmitting"
          class="custom-input"
          @press-enter="handleSubmit"
        />
      </div>

      <!-- 底部按钮 -->
      <div class="modal-footer">
        <a-button
          :disabled="isSubmitting"
          class="cancel-btn"
          @click="handleCancel"
        >
          取消
        </a-button>
        <a-button
          type="primary"
          :loading="isSubmitting"
          class="submit-btn"
          @click="handleSubmit"
        >
          提交
        </a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import {InputResponseApi} from '@/api/chatApi'

const title = ref('请提供信息')
const userInput = ref<any>(null)
const isSubmitting = ref(false)

// 用户输入请求相关
const userInputVisible = ref(false)
const userInputRequestId = ref('')
const userInputPrompt = ref('')

// 任务队列管理
interface UserInputTask {
  requestId: string
  prompt: string
}

const taskQueue = ref<UserInputTask[]>([])
const isProcessing = ref(false)

// 处理用户输入请求
const handleUserInputRequest = (event: any, data: any) => {
  const { requestId, prompt } = data
  console.log('处理用户输入请求,', event, 'data', JSON.stringify(data, null, 2))

  const task: UserInputTask = { requestId, prompt }

  // 如果当前正在处理任务，则添加到队列
  if (isProcessing.value) {
    taskQueue.value.push(task)
    console.log('任务已添加到队列，当前队列长度:', taskQueue.value.length)
    return
  }

  // 立即处理任务
  processTask(task)
}

// 处理单个任务
const processTask = (task: UserInputTask) => {
  isProcessing.value = true
  userInput.value = ''
  userInputRequestId.value = task.requestId
  userInputPrompt.value = task.prompt
  userInputVisible.value = true
}

// 处理下一个任务
const processNextTask = () => {
  if (taskQueue.value.length > 0) {
    const nextTask = taskQueue.value.shift()!
    console.log('处理队列中的下一个任务:', nextTask.requestId)
    processTask(nextTask)
  } else {
    isProcessing.value = false
  }
}

// 监听用户输入请求事件
onMounted(() => {
  // 移除可能存在的旧监听器，避免重复监听
  window.ipcRenderer.off('user-input-request', handleUserInputRequest)
  window.ipcRenderer.on('user-input-request', handleUserInputRequest)
})

// 组件卸载时清理监听器
onUnmounted(() => {
  window.ipcRenderer.off('user-input-request', handleUserInputRequest)
})


// 提交用户输入
const handleSubmit = async () => {
  if (!userInput.value) {
    message.warning('请输入有效信息')
    return
  }

  isSubmitting.value = true
  try {
    // 根据不同类型处理输入值
    const processedValue = userInput.value
    console.log('processedValue', processedValue, userInputRequestId)
    await InputResponseApi({
      content: processedValue,
      requestId: userInputRequestId.value,
    })
    userInput.value = null
    userInputVisible.value = false

    // 处理队列中的下一个任务
    processNextTask()
  } catch (error) {
    console.error('提交用户输入时出错:', error)
    message.error('提交失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

// 取消输入
const handleCancel = () => {
  userInput.value = null
  userInputVisible.value = false

  // 处理队列中的下一个任务
  processNextTask()
}
</script>

<style scoped>
.user-input-modal :deep(.ant-modal-content) {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-content {
  background: #ffffff;
}

.modal-header {
  padding: 16px 0 12px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 16px;
  font-weight: 500;
  color: #262626;
  margin: 0;
}

.modal-body {
  padding: 0 0 16px;
}

.prompt-text {
  font-size: 14px;
  color: #595959;
  line-height: 1.5;
  margin: 0 0 12px 0;
}

.custom-input :deep(.ant-input) {
  border-radius: 6px;
  border: 1px solid #d9d9d9;
  padding: 8px 0;
  font-size: 14px;
  transition: border-color 0.2s;
}

.custom-input :deep(.ant-input:focus) {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.modal-footer {
  padding: 16px 0 0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid #f0f0f0;
}

.cancel-btn {
  border-radius: 6px;
  border: 1px solid #d9d9d9;
  background: #ffffff;
  color: #595959;
  font-size: 14px;
  height: 32px;
  padding: 0 16px;
}

.cancel-btn:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.submit-btn {
  border-radius: 6px;
  background: #1890ff;
  border: 1px solid #1890ff;
  font-size: 14px;
  height: 32px;
  padding: 0 16px;
}

.submit-btn:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .user-input-modal :deep(.ant-modal) {
    width: 90vw !important;
    margin: 20px auto;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
