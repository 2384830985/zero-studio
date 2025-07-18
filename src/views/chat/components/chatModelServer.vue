<script setup lang="ts">
import {SettingOutlined} from '@ant-design/icons-vue'
import {ref,computed} from 'vue'
import { message as antMessage } from 'ant-design-vue'
import type {ModelInfo, ModelService} from '@/views/chat/chat.type.ts'
import {useChatStore, useModelServiceStore} from '@/store'

const showModelSelector = ref(false)

const chatStore = useChatStore()
const modelServiceStore = useModelServiceStore()

const selectedModel = computed(() => chatStore.selectedModel)

// 获取启用的模型服务
const enabledModelServices = computed(() => {
  return modelServiceStore.modelServices.services.filter(service => service.enabled && service.models.some(m => m.enabled))
})

// 选择模型
const selectModel = (service: ModelService, model: ModelInfo) => {
  chatStore.selectSettingModel(service, model)
  showModelSelector.value = false
  console.log('[MCP Chat] 选择模型:', service.name, '-', model.name)
  antMessage.success(`已选择模型: ${service.name} - ${model.name}`)
}

</script>

<template>
  <a-dropdown
    v-model:open="showModelSelector"
    placement="bottomRight"
    :trigger="['click']"
  >
    <a-button size="small">
      <template #icon>
        <SettingOutlined />
      </template>
      {{ selectedModel ? `${selectedModel.service.name} - ${selectedModel.model.name}` : '选择模型' }}
    </a-button>
    <template #overlay>
      <a-menu
        class="max-h-80 overflow-y-auto"
        style="min-width: 300px;"
      >
        <template
          v-for="service in enabledModelServices"
          :key="service.id"
        >
          <a-menu-item-group :title="service.name">
            <a-menu-item
              v-for="model in service.models.filter(m => m.enabled)"
              :key="`${service.id}-${model.name}`"
              @click="selectModel(service, model)"
            >
              <div class="flex items-center space-x-3">
                <div
                  class="w-4 h-4 rounded-full flex-shrink-0"
                  :style="{ backgroundColor: model.color || service.color }"
                />
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-gray-900 truncate">
                    {{ model.name }}
                  </div>
                  <div class="text-xs text-gray-500 truncate">
                    {{ model.description }}
                  </div>
                </div>
                <div
                  v-if="selectedModel?.service.id === service.id && selectedModel?.model.name === model.name"
                  class="text-blue-500 text-xs"
                >
                  ✓
                </div>
              </div>
            </a-menu-item>
          </a-menu-item-group>
        </template>
        <a-menu-divider v-if="enabledModelServices.length > 0" />
        <a-menu-item @click="$router.push('/settings/model')">
          <div class="flex items-center space-x-2 text-gray-500">
            <SettingOutlined />
            <span>管理模型服务</span>
          </div>
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<style scoped>
/* 确保按钮高度统一 */
:deep(.ant-btn-sm) {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

:deep(.ant-btn-sm .ant-btn-icon) {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
}

:deep(.ant-btn-sm .anticon) {
  display: flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}
</style>
