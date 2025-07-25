<template>
  <div class="bg-orange-50 rounded p-1.5 border border-orange-100">
    <div class="flex items-center gap-2 text-xs">
      <div class="flex items-center gap-1 text-orange-700">
        <ClockCircleOutlined class="text-xs" />
        <span>{{ ping.latency }}ms</span>
      </div>
      <div class="flex items-center gap-1 text-orange-600">
        <WifiOutlined class="text-xs" />
        <span>{{ ping.packetLoss }}% 丢包</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ClockCircleOutlined,
  WifiOutlined,
} from '@ant-design/icons-vue'

interface PingData {
  latency: number
  packetLoss: number
}

interface Props {
  ping: PingData
}

defineProps<Props>()
</script>
