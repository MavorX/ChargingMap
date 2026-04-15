<template>
  <div class="panel-overlay">
    <div class="panel-backdrop" @click="$emit('close')"></div>
    <div class="panel-content">
    <div class="glass-effect border-b border-surface-200/50 dark:border-surface-700/50 p-4 flex justify-between items-center flex-shrink-0 z-10">
      <button class="icon-button" @click="$emit('close')">
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">充电中</h2>
      <button
        class="px-4 py-2 rounded-xl bg-danger-500/10 text-danger-600 dark:text-danger-400 font-bold text-sm hover:bg-danger-500/20 transition-all duration-200 active:scale-95"
        @click="stopCharging">
        结束充电
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-6 flex flex-col items-center">
      <div class="mb-6 animate-in">
        <p class="text-sm font-medium text-surface-500 dark:text-surface-400 text-center">{{ currentStation?.stationName }}</p>
      </div>

      <div class="relative w-56 h-56 mb-10 animate-in delay-100">
        <svg class="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#10B981;stop-opacity:1" />
              <stop offset="50%" style="stop-color:#06B6D4;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#3B82F6;stop-opacity:1" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <circle cx="100" cy="100" r="85" fill="none" stroke-width="8"
                  class="stroke-surface-200 dark:stroke-surface-700" />

          <circle cx="100" cy="100" r="85" fill="none" stroke-width="8"
                  stroke-linecap="round"
                  filter="url(#glow)"
                  class="transition-all duration-1000 ease-out"
                  :stroke="'url(#progressGradient)'"
                  :stroke-dasharray="circumference"
                  :stroke-dashoffset="progressOffset" />

          <circle cx="100" cy="100" r="75" fill="none" stroke-width="1"
                  class="stroke-surface-300 dark:stroke-surface-600 opacity-30" />
        </svg>

        <div class="absolute inset-0 flex items-center justify-center flex-col">
          <div class="flex items-baseline mb-2">
            <span class="text-6xl font-black gradient-text">{{ Math.round(chargingData.battery) }}</span>
            <span class="text-2xl font-bold text-surface-400 ml-1.5">%</span>
          </div>
          <div class="flex items-center space-x-2 px-3 py-1 rounded-full bg-secondary-100 dark:bg-secondary-900/30">
            <div class="w-2 h-2 rounded-full bg-secondary-500 animate-pulse"></div>
            <span class="text-xs font-bold text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">电池电量</span>
          </div>
        </div>

        <div class="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br from-secondary-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-secondary-500/30 animate-bounce-soft">
          <i class="fa fa-bolt text-white text-lg"></i>
        </div>
      </div>

      <div class="w-full max-w-lg space-y-5 animate-in delay-200">
        <div class="grid grid-cols-3 gap-4">
          <div class="premium-card p-5 text-center group hover:-translate-y-1 transition-transform duration-300">
            <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <i class="fa fa-clock-o text-primary-500 text-xl" aria-hidden="true"></i>
            </div>
            <p class="text-[10px] font-medium text-surface-500 dark:text-surface-400 mb-1.5 uppercase tracking-wide">充电时长</p>
            <p class="text-2xl font-black text-surface-900 dark:text-surface-100">{{ formatTime(chargingData.duration) }}</p>
          </div>

          <div class="premium-card p-5 text-center group hover:-translate-y-1 transition-transform duration-300">
            <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <i class="fa fa-bolt text-secondary-500 text-xl" aria-hidden="true"></i>
            </div>
            <p class="text-[10px] font-medium text-surface-500 dark:text-surface-400 mb-1.5 uppercase tracking-wide">已充电量</p>
            <p class="text-2xl font-black text-surface-900 dark:text-surface-100">{{ chargingData.energy.toFixed(1) }}<span class="text-sm font-normal text-surface-400 ml-0.5">kWh</span></p>
          </div>

          <div class="premium-card p-5 text-center group hover:-translate-y-1 transition-transform duration-300">
            <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <i class="fa fa-rmb text-warning-500 text-xl" aria-hidden="true"></i>
            </div>
            <p class="text-[10px] font-medium text-surface-500 dark:text-surface-400 mb-1.5 uppercase tracking-wide">预计费用</p>
            <p class="text-2xl font-black text-warning-600">¥{{ chargingData.cost.toFixed(2) }}</p>
          </div>
        </div>

        <div class="premium-card p-5">
          <div class="flex justify-between items-center mb-4">
            <div class="flex items-center space-x-2.5">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-400 to-purple-500 flex items-center justify-center shadow-md">
                <i class="fa fa-tachometer text-white text-sm" aria-hidden="true"></i>
              </div>
              <span class="font-bold text-surface-800 dark:text-surface-200">充电功率</span>
            </div>
            <span class="text-2xl font-black gradient-text">{{ chargingData.speed }} kW</span>
          </div>

          <div class="relative">
            <div class="w-full h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden shadow-inner-soft">
              <div
                class="h-full rounded-full relative overflow-hidden transition-all duration-700 ease-out"
                :style="{ width: `${(chargingData.speed / 150) * 100}%` }">
                <div class="absolute inset-0 bg-gradient-to-r from-secondary-400 via-cyan-400 to-primary-500 animate-shimmer"
                     style="background-size: 200% 100%;"></div>
              </div>
            </div>
            <div class="flex justify-between mt-2">
              <span class="text-[10px] font-medium text-surface-500 uppercase tracking-wide">0 kW</span>
              <span class="text-[10px] font-medium text-surface-500 uppercase tracking-wide">150 kW</span>
            </div>
          </div>
        </div>

        <div class="relative overflow-hidden premium-card p-5 border-l-4 border-l-primary-500">
          <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-transparent rounded-bl-full"></div>
          <div class="flex items-start space-x-3 relative z-10">
            <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-400 to-cyan-500 flex items-center justify-center shadow-md flex-shrink-0 mt-0.5">
              <i class="fa fa-info-circle text-white text-lg" aria-hidden="true"></i>
            </div>
            <div class="flex-1">
              <p class="font-bold text-primary-600 dark:text-primary-400 mb-1.5 text-base">充电进行中</p>
              <p class="text-sm text-surface-600 dark:text-surface-300 leading-relaxed">
                目标电量 <span class="font-bold text-primary-600">{{ targetBattery }}%</span>，
                预计还需要<span class="font-bold text-primary-600">{{ estimatedTimeRemaining }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
      </div>
</div>
</template>

<script setup>
import { computed, onUnmounted, inject } from 'vue'
import { useChargingStore } from '../../store/modules/charging'
import { useStationsStore } from '../../store/modules/stations'

const emit = defineEmits(['close'])
const chargingStore = useChargingStore()
const stationsStore = useStationsStore()
const showToast = inject('showToast')

const chargingData = computed(() => chargingStore.chargingData)
const currentStation = computed(() => stationsStore.currentStation)
const targetBattery = computed(() => chargingStore.settings.targetBattery)

const circumference = 2 * Math.PI * 85
const progressOffset = computed(() => {
  const progress = Math.min(chargingData.value.battery / 100, 1)
  return circumference * (1 - progress)
})

const estimatedTimeRemaining = computed(() => {
  const remaining = targetBattery.value - chargingData.value.battery
  if (remaining <= 0) return '即将完成'
  const minutes = Math.ceil(remaining / 0.5)
  if (minutes < 60) return `${minutes}分钟`
  return `${Math.floor(minutes / 60)}小时${minutes % 60}分钟`
})

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

const stopCharging = () => {
  chargingStore.stopCharging()
  showToast('充电已结束', 'success')
  emit('close')
}

onUnmounted(() => {
  chargingStore.stopCharging()
})
</script>
