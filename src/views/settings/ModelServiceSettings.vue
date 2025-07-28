<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-bold text-gray-900 mb-1">
        模型服务
      </h2>
      <p class="text-sm text-gray-600 mb-4">
        管理 AI 模型服务提供商配置
      </p>

      <!-- 搜索框 -->
      <div class="mb-4">
        <a-input
          v-model:value="searchQuery"
          placeholder="搜索模型平台..."
          class="max-w-md"
        >
          <template #prefix>
            <SearchOutlined class="text-gray-400" />
          </template>
        </a-input>
      </div>

      <!-- 模型服务列表 -->
      <div class="space-y-3">
        <div
          v-for="service in filteredModelServices"
          :key="service.id"
          class="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-sm transition-shadow"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                :style="{ backgroundColor: service.color }"
              >
                {{ service.name.charAt(0) }}
              </div>
              <div>
                <h3 class="text-sm font-semibold text-gray-900">
                  {{ service.name }}
                </h3>
                <p class="text-xs text-gray-500">
                  {{ service.description }}
                </p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <a-tag
                :color="service.enabled ? 'green' : 'default'"
                size="small"
              >
                {{ service.enabled ? 'ON' : 'OFF' }}
              </a-tag>
              <a-switch
                v-model:checked="service.enabled"
                size="small"
                @change="toggleService(service)"
              />
            </div>
          </div>

          <!-- 展开的配置区域 -->
          <div
            v-if="service.enabled && expandedService === service.id"
            class="mt-4 pt-4 border-t border-gray-200"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- API 密钥 -->
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">
                  API 密钥
                </label>
                <a-input-password
                  v-model:value="service.apiKey"
                  placeholder="输入API密钥"
                  size="small"
                  class="w-full"
                />
              </div>

              <!-- API 地址 -->
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">
                  API 地址
                </label>
                <a-input
                  v-model:value="service.apiUrl"
                  placeholder="输入API地址"
                  size="small"
                  class="w-full"
                />
              </div>
            </div>

            <!-- 可用模型 -->
            <div class="mt-4">
              <div class="flex items-center justify-between mb-3">
                <label class="block text-xs font-medium text-gray-700">
                  可用模型
                </label>
                <a-button
                  type="primary"
                  size="small"
                  @click="addModel(service)"
                >
                  <template #icon>
                    <PlusOutlined />
                  </template>
                  添加模型
                </a-button>
              </div>

              <div class="space-y-2">
                <div
                  v-for="(model, index) in service.models"
                  :key="index"
                  class="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div class="flex items-center space-x-2">
                    <div
                      class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      :style="{ backgroundColor: model.color || '#6b7280' }"
                    >
                      {{ model.name.charAt(0) }}
                    </div>
                    <div>
                      <div class="text-sm font-medium text-gray-900">
                        {{ model.name }}
                      </div>
                      <div class="text-xs text-gray-500">
                        {{ model.description }}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <a-tag
                      :color="model.enabled ? 'green' : 'default'"
                      size="small"
                      class="cursor-pointer"
                      @click="toggleModel(service, model)"
                    >
                      {{ model.enabled ? '启用' : '禁用' }}
                    </a-tag>
                    <a-button
                      type="text"
                      size="small"
                      danger
                      @click="removeModel(service, index)"
                    >
                      <template #icon>
                        <DeleteOutlined />
                      </template>
                    </a-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="mt-4 flex justify-end space-x-2">
              <a-button
                size="small"
                @click="testConnection(service)"
              >
                检测连接
              </a-button>
              <a-button
                type="primary"
                size="small"
                @click="saveServiceConfig(service)"
              >
                保存配置
              </a-button>
            </div>
          </div>

          <!-- 展开/收起按钮 -->
          <div
            v-if="service.enabled"
            class="mt-3 text-center"
          >
            <a-button
              type="text"
              size="small"
              @click="toggleExpand(service.id)"
            >
              {{ expandedService === service.id ? '收起' : '展开配置' }}
              <template #icon>
                <UpOutlined v-if="expandedService === service.id" />
                <DownOutlined v-else />
              </template>
            </a-button>
          </div>
        </div>
      </div>

      <!-- 添加新服务按钮 -->
      <div class="mt-6 text-center">
        <a-button
          type="dashed"
          class="w-full max-w-md"
          @click="showAddServiceModal = true"
        >
          <template #icon>
            <PlusOutlined />
          </template>
          添加新的模型服务
        </a-button>

        <!-- 清除配置按钮 -->
        <div class="text-center">
          <a-button
            type="text"
            danger
            size="small"
            @click="handleClearConfig"
          >
            清除所有配置
          </a-button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑服务器模态框 -->
    <a-modal
      v-model:open="showAddModal"
      :title="serverForm.id !== '' ? '编辑模型' : '添加模型'"
      :width="600"
      @ok="handleSaveServer"
      @cancel="handleCancelEdit"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            名称 *
          </label>
          <a-input
            v-model:value="serverForm.name"
            placeholder="输入模型名称"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            描述
          </label>
          <a-textarea
            v-model:value="serverForm.description"
            placeholder="输入服务器描述"
            :rows="2"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            颜色
          </label>
          <a-input
            v-model:value="serverForm.color"
            placeholder="例如: red"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            是否启用
          </label>
          <a-switch
            v-model:checked="serverForm.enabled"
          />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { message } from 'ant-design-vue'
import {
  SearchOutlined,
  UpOutlined,
  DownOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue'
import {IModels, useModelServiceStore} from '@/store'

const modelServiceStore = useModelServiceStore()

// 模型服务相关数据
const searchQuery = ref('')
const expandedService = ref<string | null>(null)
const showAddServiceModal = ref(false)
const showAddModal = ref(false)

// 服务器表单
const serverForm = reactive<IModels>({
  name: '',
  description: '',
  color: '',
  enabled: false,
  pid: '',
  id: '',
})

// 模型服务列表
const modelServices = ref([
  {
    id: 'friday',
    name: 'Friday',
    description: '智能对话助手',
    color: '#3b82f6',
    enabled: true,
    apiKey: '',
    apiUrl: '',
    models: [
      {
        name: 'Friday',
        description: '通用对话模型',
        enabled: true,
        color: '#3b82f6',
        pid: 'friday',
        id: `${Date.now()}`,
      },
    ],
  },
  {
    id: 'siliconglow',
    name: '硅基流动',
    description: '高性能AI模型服务',
    color: '#8b5cf6',
    enabled: true,
    apiKey: '',
    apiUrl: '',
    models: [],
  },
  {
    id: 'aihubmix',
    name: 'AiHubMix',
    description: '多模型聚合平台',
    color: '#06b6d4',
    enabled: false,
    apiKey: '',
    apiUrl: '',
    models: [],
  },
  {
    id: 'ocoolai',
    name: 'ocoolAI',
    description: 'AI模型服务平台',
    color: '#000000',
    enabled: false,
    apiKey: '',
    apiUrl: '',
    models: [],
  },
  {
    id: 'deepseek',
    name: '深度求索',
    description: '深度学习模型服务',
    color: '#1e40af',
    enabled: false,
    apiKey: '',
    apiUrl: '',
    models: [],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: '开放式AI路由服务',
    color: '#10b981',
    enabled: false,
    apiKey: '',
    apiUrl: '',
    models: [],
  },
  {
    id: 'ppio',
    name: 'PPIO 派欧云',
    description: '分布式云计算平台',
    color: '#3b82f6',
    enabled: false,
    apiKey: '',
    apiUrl: '',
    models: [],
  },
  {
    id: 'alaya',
    name: 'Alaya NeW',
    description: '新一代AI服务',
    color: '#f59e0b',
    enabled: false,
    apiKey: '',
    apiUrl: '',
    models: [],
  },
  {
    id: 'wuxinxin',
    name: '无问芯穹',
    description: 'AI芯片与服务',
    color: '#8b5cf6',
    enabled: false,
    apiKey: '',
    apiUrl: '',
    models: [],
  },
  {
    id: 'burncloud',
    name: 'BurnCloud',
    description: '云端AI计算服务',
    color: '#f97316',
    enabled: false,
    apiKey: '',
    apiUrl: '',
    models: [],
  },
  {
    id: 'qiniuai',
    name: '七牛云 AI 推理',
    description: '七牛云AI推理服务',
    color: '#06b6d4',
    enabled: false,
    apiKey: '',
    apiUrl: '',
    models: [],
  },
  {
    id: 'dmxapi',
    name: 'DMXAPI',
    description: 'AI模型API服务',
    color: '#8b5cf6',
    enabled: false,
    apiKey: '',
    apiUrl: '',
    models: [],
  },
  {
    id: 'cephalon',
    name: 'Cephalon',
    description: '智能AI助手平台',
    color: '#000000',
    enabled: false,
    apiKey: '',
    apiUrl: '',
    models: [],
  },
  {
    id: '302ai',
    name: '302.AI',
    description: 'AI工具集合平台',
    color: '#8b5cf6',
    enabled: false,
    apiKey: '',
    apiUrl: '',
    models: [],
  },
])

const handleSaveServer = () => {
  console.log('1111')
  if (!serverForm.name.trim()) {
    message.error('请输入模型名称')
    return
  }
  console.log('2222')

  const modelName = serverForm.name.trim()
  if (modelName) {
    const index = modelServices.value.findIndex(service => service.id === serverForm.pid)
    console.log('3333', index)
    if (modelServices.value[index]) {
      console.log('4444')
      if (serverForm.id !== '') {
        console.log('555')
        const itemIndex = modelServices.value[index].models.findIndex(model => model.id === serverForm.id)
        if (modelServices.value[index].models[itemIndex]) {
          modelServices.value[index].models[itemIndex] = {
            name: modelName,
            id: modelServices.value[index].models[itemIndex].id,
            pid: modelServices.value[index].models[itemIndex].pid,
            description: serverForm.description,
            enabled: serverForm.enabled,
            color: serverForm.color,
          }
          message.success('模型修改成功')
          showAddModal.value = false
        }
      } else {
        console.log('666')
        modelServices.value[index].models.push({
          name: modelName,
          id: `${Date.now()}`,
          description: serverForm.description,
          enabled: serverForm.enabled,
          pid: serverForm.pid,
          color: serverForm.color,
        })
        message.success('模型添加成功')
        showAddModal.value = false
      }
    }
  }
}
const handleCancelEdit = () => {
  showAddModal.value = false

  // 重置表单
  serverForm.name = ''
  serverForm.description = ''
  serverForm.color = ''
  serverForm.pid = ''
  serverForm.id = ''
  serverForm.enabled = false
}

// 过滤后的模型服务
const filteredModelServices = computed(() => {
  if (!searchQuery.value) {
    return modelServices.value
  }
  return modelServices.value.filter(service =>
    service.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

// 模型服务相关方法
const toggleService = (service: any) => {
  if (service.enabled && !expandedService.value) {
    expandedService.value = service.id
  }
  message.success(`${service.name} 已${service.enabled ? '启用' : '禁用'}`)
}

const toggleExpand = (serviceId: string) => {
  expandedService.value = expandedService.value === serviceId ? null : serviceId
}

const addModel = (service: any) => {
  showAddModal.value = true
  // 重置表单
  serverForm.pid = service.id
  serverForm.enabled = true

}

const toggleModel = (service: any, model: any) => {
  model.enabled = !model.enabled
  message.success(`模型 ${model.name} 已${model.enabled ? '启用' : '禁用'}`)
}

const removeModel = (service: any, index: number) => {
  const model = service.models[index]
  if (confirm(`确定要删除模型 "${model.name}" 吗？`)) {
    service.models.splice(index, 1)
    message.success('模型删除成功')
  }
}

const testConnection = async (service: any) => {
  message.loading('正在测试连接...', 2)
  // 模拟测试连接
  setTimeout(() => {
    message.success(`${service.name} 连接测试成功`)
  }, 2000)
}

const saveServiceConfig = (service: any) => {
  // 保存配置到本地存储
  saveToLocalStorage()
  message.success(`${service.name} 配置保存成功`)
}

// 本地存储相关方法
const saveToLocalStorage = () => {
  try {
    modelServiceStore.selectModelServices(modelServices.value)
    console.log('模型服务配置已保存到本地存储')
  } catch (error) {
    console.error('保存配置到本地存储失败:', error)
    message.error('保存配置失败')
  }
}

const loadFromLocalStorage = () => {
  try {
    if (modelServiceStore.modelServices) {
      const configData = modelServiceStore.modelServices
      if (configData.services && Array.isArray(configData.services)) {
        // 合并保存的配置和默认配置
        configData.services.forEach((savedService: any) => {
          const existingServiceIndex = modelServices.value.findIndex(
            service => service.id === savedService.id,
          )
          if (existingServiceIndex !== -1) {
            // 更新现有服务的配置
            modelServices.value[existingServiceIndex] = {
              ...modelServices.value[existingServiceIndex],
              ...savedService,
            }
          } else {
            // 添加新的自定义服务
            modelServices.value.push(savedService)
          }
        })
        console.log('从本地存储加载模型服务配置成功')
      }
    }
  } catch (error) {
    console.error('从本地存储加载配置失败:', error)
    message.warning('加载保存的配置失败，使用默认配置')
  }
}

const clearLocalStorage = () => {
  try {
    modelServiceStore.deleteModelServices()
    message.success('本地配置已清除')
  } catch (error) {
    console.error('清除本地存储失败:', error)
    message.error('清除配置失败')
  }
}

const handleClearConfig = () => {
  if (confirm('确定要清除所有模型服务配置吗？此操作不可撤销。')) {
    // 重置所有服务配置
    modelServices.value.forEach(service => {
      service.enabled = false
      service.apiKey = ''
      service.apiUrl = service.id === 'friday' ? 'https://aigc.sankuai.com/v1/openai/native/chat/completions' : ''
      // service.models = service.id === 'friday' ? [{
      //   name: 'Friday',
      //   description: '通用对话模型',
      //   enabled: true,
      //   color: '#3b82f6',
      // }] : []
    })

    // 清除本地存储
    clearLocalStorage()

    // 重置展开状态
    expandedService.value = null

    message.success('所有配置已重置')
  }
}

// 组件挂载时加载配置
onMounted(() => {
  loadFromLocalStorage()
})

// 监听配置变化，自动保存
watch(
  modelServices,
  () => {
    saveToLocalStorage()
  },
  { deep: true },
)
</script>
