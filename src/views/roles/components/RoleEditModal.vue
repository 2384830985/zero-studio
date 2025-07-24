<template>
  <a-modal
    :visible="visible"
    :title="isEditing ? '编辑角色' : '创建角色'"
    :width="600"
    @ok="handleSave"
    @cancel="handleCancel"
  >
    <a-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      layout="vertical"
    >
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item
            label="角色名称"
            name="name"
          >
            <a-input
              v-model:value="formData.name"
              placeholder="请输入角色名称"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item
            label="分类"
            name="category"
          >
            <a-select
              v-model:value="formData.category"
              placeholder="选择分类"
            >
              <a-select-option
                v-for="category in categories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.icon }} {{ category.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>

      <a-form-item
        label="角色描述"
        name="description"
      >
        <a-textarea
          v-model:value="formData.description"
          placeholder="请输入角色描述"
          :rows="3"
        />
      </a-form-item>

      <a-form-item
        label="系统提示词"
        name="systemPrompt"
      >
        <a-textarea
          v-model:value="formData.systemPrompt"
          placeholder="请输入系统提示词，这将定义AI的行为和回答风格"
          :rows="6"
        />
      </a-form-item>

      <a-form-item
        label="标签"
        name="tags"
      >
        <div class="space-y-2">
          <div class="flex flex-wrap gap-2">
            <a-tag
              v-for="(tag, index) in formData.tags"
              :key="index"
              closable
              @close="removeTag(index)"
            >
              {{ tag }}
            </a-tag>
          </div>
          <div class="flex gap-2">
            <a-input
              v-model:value="newTag"
              placeholder="添加标签"
              size="small"
              class="flex-1"
              @keydown.enter="addTag"
            />
            <a-button
              size="small"
              @click="addTag"
            >
              添加
            </a-button>
          </div>
        </div>
      </a-form-item>

      <a-form-item
        label="头像"
        name="avatar"
      >
        <a-input
          v-model:value="formData.avatar"
          placeholder="输入emoji或单个字符作为头像"
          :maxlength="2"
        />
      </a-form-item>

      <a-form-item name="isEnabled">
        <a-checkbox v-model:checked="formData.isEnabled">
          启用此角色
        </a-checkbox>
      </a-form-item>
    </a-form>

    <template #footer>
      <a-button @click="handleCancel">
        取消
      </a-button>
      <a-button
        type="primary"
        :loading="saving"
        @click="handleSave"
      >
        {{ isEditing ? '保存' : '创建' }}
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { FormInstance } from 'ant-design-vue'
import { useRoleStore } from '@/store'
import type { AIRole } from '@/types/role'

interface Props {
  visible: boolean
  role?: AIRole | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'save': []
}>()

const roleStore = useRoleStore()
const formRef = ref<FormInstance>()
const saving = ref(false)
const newTag = ref('')

// 计算属性
const isEditing = computed(() => !!props.role)
const categories = computed(() => roleStore.categories)

// 表单数据
const formData = ref({
  name: '',
  description: '',
  systemPrompt: '',
  category: 'assistant',
  tags: [] as string[],
  avatar: '',
  isEnabled: true,
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 20, message: '角色名称长度应在2-20个字符之间', trigger: 'blur' },
  ],
  description: [
    { required: true, message: '请输入角色描述', trigger: 'blur' },
    { min: 10, max: 200, message: '角色描述长度应在10-200个字符之间', trigger: 'blur' },
  ],
  systemPrompt: [
    { required: true, message: '请输入系统提示词', trigger: 'blur' },
    { min: 20, max: 2000, message: '系统提示词长度应在20-2000个字符之间', trigger: 'blur' },
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' },
  ],
}

// 重置表单
const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    systemPrompt: '',
    category: 'assistant',
    tags: [],
    avatar: '',
    isEnabled: true,
  }
  formRef.value?.resetFields()
}

// 监听角色变化，更新表单数据
watch(
  () => props.role,
  (role) => {
    if (role && role.name) {
      formData.value = {
        name: role.name,
        description: role.description,
        systemPrompt: role.systemPrompt,
        category: role.category,
        tags: [...role.tags],
        avatar: role.avatar || '',
        isEnabled: role.isEnabled,
      }
    } else {
      resetForm()
    }
  },
  { immediate: true },
)

// 添加标签
const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !formData.value.tags.includes(tag)) {
    formData.value.tags.push(tag)
    newTag.value = ''
  }
}

// 移除标签
const removeTag = (index: number) => {
  formData.value.tags.splice(index, 1)
}

// 处理保存
const handleSave = async () => {
  try {
    await formRef.value?.validate()
    saving.value = true

    if (isEditing.value && props.role) {
      // 编辑现有角色
      roleStore.updateRole(props.role.id, {
        name: formData.value.name,
        description: formData.value.description,
        systemPrompt: formData.value.systemPrompt,
        category: formData.value.category,
        tags: formData.value.tags,
        avatar: formData.value.avatar,
        isEnabled: formData.value.isEnabled,
      })
    } else {
      console.log('22222')
      // 创建新角色
      roleStore.addRole({
        name: formData.value.name,
        description: formData.value.description,
        systemPrompt: formData.value.systemPrompt,
        category: formData.value.category,
        tags: formData.value.tags,
        avatar: formData.value.avatar,
        isEnabled: formData.value.isEnabled,
      })
    }

    emit('save')
    emit('update:visible', false)
  } catch (error) {
    console.error('Form validation failed:', error)
  } finally {
    saving.value = false
  }
}

// 处理取消
const handleCancel = () => {
  emit('update:visible', false)
}
</script>
