<template>
  <div class="directory-manager">
    <!-- 目录路径输入框 -->
    <a-input
      v-model:value="currentPath"
      placeholder="请输入文件夹路径"
      size="small"
      style="width: 200px"
    >
      <template #prefix>
        <FolderOutlined />
      </template>
      <template #suffix>
        <a-button
          type="text"
          size="small"
          title="选择文件夹"
          @click="selectDirectory"
        >
          <template #icon>
            <SearchOutlined />
          </template>
        </a-button>
      </template>
    </a-input>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  FolderOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue'

// 响应式数据
const currentPath = ref('')

const selectDirectory = async () => {
  try {
    // 调用 Electron 的目录选择器
    if (window.electronAPI && window.electronAPI.fs) {
      const result = await window.electronAPI.fs.selectDirectory()

      if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        return
      }

      const selectedPath = result.filePaths[0]

      // 检查目录权限
      const hasPermission = await checkDirectoryPermissions(selectedPath)

      if (hasPermission) {
        currentPath.value = selectedPath

        // 设置为当前工作目录
        await setWorkingDirectory(selectedPath)
      } else {
        message.error('所选目录没有读写权限，请选择其他目录')
      }
    } else {
      message.error('Electron API 不可用')
    }
  } catch (error) {
    message.error('选择目录失败')
    console.error('Select directory error:', error)
  }
}

// 检查目录权限
const checkDirectoryPermissions = async (path: string): Promise<boolean> => {
  try {
    if (window.electronAPI && window.electronAPI.fs) {
      return await window.electronAPI.fs.checkDirectoryPermissions(path)
    }
    return false
  } catch (error) {
    console.error('Check permissions error:', error)
    return false
  }
}

// 设置工作目录
const setWorkingDirectory = async (path: string): Promise<void> => {
  try {
    if (window.electronAPI && window.electronAPI.fs) {
      await window.electronAPI.fs.setWorkingDirectory(path)
      message.success('工作目录设置成功')
    }
  } catch (error) {
    message.error('设置工作目录失败')
    console.error('Set working directory error:', error)
  }
}

// 获取当前工作目录
const getCurrentWorkingDirectory = async () => {
  try {
    if (window.electronAPI && window.electronAPI.fs) {
      const result = await window.electronAPI.fs.getWorkingDirectory()
      if (result.success) {
        currentPath.value = result.path
      }
    }
  } catch (error) {
    console.error('Get current working directory error:', error)
  }
}

// 组件挂载时获取当前工作目录
onMounted(() => {
  getCurrentWorkingDirectory()
})
</script>

<style scoped>
.directory-manager {
  display: inline-block;
}
</style>
