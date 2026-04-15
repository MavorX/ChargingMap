<template>
  <div class="fixed inset-0 bg-white dark:bg-surface-900 z-50 flex flex-col items-center justify-center p-6">
    <div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-secondary-400 to-emerald-500 flex items-center justify-center mb-6 shadow-xl shadow-secondary-500/30 animate-scale-in">
      <i class="fa fa-check text-5xl text-white" aria-hidden="true"></i>
    </div>
    <h2 class="text-2xl font-black text-surface-900 dark:text-surface-100 mb-2">支付成功</h2>
    <p class="text-surface-500 dark:text-surface-400 mb-2 text-center">感谢使用充电桩服务</p>
    <div class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-5 mb-8 w-full max-w-sm space-y-3">
      <div class="flex justify-between text-sm">
        <span class="text-surface-500 dark:text-surface-400">充电电量</span>
        <span class="font-bold text-surface-800 dark:text-surface-200">{{ chargingData.energy.toFixed(1) }} kWh</span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-surface-500 dark:text-surface-400">充电时长</span>
        <span class="font-bold text-surface-800 dark:text-surface-200">{{ formatDuration(chargingData.duration) }}</span>
      </div>
      <div class="border-t border-surface-100 dark:border-surface-700/50 pt-3 flex justify-between">
        <span class="font-bold text-surface-900 dark:text-surface-100">支付金额</span>
        <span class="text-xl font-black gradient-text">¥{{ paidAmount.toFixed(2) }}</span>
      </div>
    </div>
    <button
      class="w-full max-w-sm group relative overflow-hidden bg-gradient-to-r from-primary-500 to-accent-500 text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary-500/25 hover:shadow-2xl hover:shadow-primary-500/35 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
      @click="$emit('close')">
      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
      <span class="relative z-10">返回地图</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useChargingStore } from '../../store/modules/charging'
import { useStationsStore } from '../../store/modules/stations'

defineEmits(['close'])

const props = defineProps({
  amount: {
    type: Number,
    default: 0
  }
})

const chargingStore = useChargingStore()
const stationsStore = useStationsStore()
const chargingData = computed(() => chargingStore.chargingData)

const paidAmount = computed(() => {
  if (props.amount > 0) return props.amount
  const station = stationsStore.currentStation
  const chargeCost = station ? chargingData.value.energy * station.currentPrice : 0
  const serviceFee = chargeCost * 0.1
  return chargeCost + serviceFee
})

const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}小时${m}分钟`
  return `${m}分钟`
}
</script>
