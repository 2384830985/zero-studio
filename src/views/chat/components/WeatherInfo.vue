<template>
  <div class="bg-blue-50 rounded p-1.5 border border-blue-100">
    <div class="flex items-center gap-2 text-xs">
      <div class="flex items-center gap-1 text-blue-700">
        <FireOutlined class="text-xs" />
        <span>{{ weather.temperature }}</span>
      </div>
      <div class="flex items-center gap-1 text-blue-600">
        <CloudOutlined class="text-xs" />
        <span>{{ weather.humidity }}</span>
      </div>
      <div class="flex items-center gap-1 text-blue-600">
        <SendOutlined class="text-xs" />
        <span>{{ weather.wind }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  FireOutlined,
  CloudOutlined,
  SendOutlined,
} from '@ant-design/icons-vue'

interface WeatherData {
  temperature: string
  humidity: string
  wind: string
}

interface Props {
  weather: WeatherData
}

defineProps<Props>()
</script>
