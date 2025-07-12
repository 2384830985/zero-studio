<!-- 选择模式 -->
<script setup lang="ts">
import {SettingOutlined} from '@ant-design/icons-vue'
import { useChatStore, IUsePlanMode  } from '@/store'
import {computed, ref} from 'vue'
const chatStore = useChatStore()

const showUsePlanMode = ref(false)

const usePlanModeName = computed(() => chatStore.usePlanModeName)
const UsePlanModeList = computed(() => chatStore.UsePlanModeList)

/**
 * 选择当前的模式
 * @param item
 */
const selectUsePlanMode = (item: IUsePlanMode) => {
  showUsePlanMode.value = false
  chatStore.selectUsePlanMode(item.value)
}

</script>

<template>
  <a-dropdown
    v-model:open="showUsePlanMode"
    placement="bottomLeft"
    :trigger="['click']"
    @click.prevent
  >
    <a-button size="small">
      <template #icon>
        <SettingOutlined />
      </template>
      {{ usePlanModeName }}
    </a-button>
    <template #overlay>
      <a-menu
        class="max-h-80 overflow-y-auto"
      >
        <template
          v-for="usePlanModeItem in UsePlanModeList"
          :key="usePlanModeItem.value"
        >
          <a-menu-item @click="selectUsePlanMode(usePlanModeItem)">
            <div class="flex items-center space-x-3">
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-gray-900 truncate">
                  {{ usePlanModeItem.name }}
                </div>
              </div>
            </div>
          </a-menu-item>
        </template>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<style scoped>

</style>
