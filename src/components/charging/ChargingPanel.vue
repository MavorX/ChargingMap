<template>
  <PanelShell title="充电中" @close="$emit('close')">
    <div
      class="glass-effect z-10 flex flex-shrink-0 items-center justify-between border-b border-surface-200/50 p-4 dark:border-surface-700/50"
    >
      <button class="icon-button" aria-label="返回" @click="$emit('close')">
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">充电中</h2>
      <div class="w-10"></div>
    </div>

    <div class="flex flex-1 flex-col items-center overflow-y-auto p-6">
      <div class="animate-in mb-6">
        <p class="text-center text-sm font-medium text-surface-500 dark:text-surface-400">
          {{ currentStation?.stationName }}
        </p>
      </div>

      <div class="animate-in relative mb-10 h-56 w-56 delay-100">
        <svg class="h-full w-full -rotate-90 transform" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color: #10b981; stop-opacity: 1" />
              <stop offset="50%" style="stop-color: #06b6d4; stop-opacity: 1" />
              <stop offset="100%" style="stop-color: #3b82f6; stop-opacity: 1" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle
            cx="100"
            cy="100"
            r="85"
            fill="none"
            stroke-width="8"
            class="stroke-surface-200 dark:stroke-surface-700"
          />

          <circle
            cx="100"
            cy="100"
            r="85"
            fill="none"
            stroke-width="8"
            stroke-linecap="round"
            filter="url(#glow)"
            class="transition-all duration-1000 ease-out"
            :stroke="'url(#progressGradient)'"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="progressOffset"
          />

          <circle
            cx="100"
            cy="100"
            r="75"
            fill="none"
            stroke-width="1"
            class="stroke-surface-300 opacity-30 dark:stroke-surface-600"
          />
        </svg>

        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <div class="mb-2 flex items-baseline">
            <span class="gradient-text text-6xl font-black">{{
              Math.round(chargingData.battery)
            }}</span>
            <span class="ml-1.5 text-2xl font-bold text-surface-400">%</span>
          </div>
          <div
            class="flex items-center space-x-2 rounded-full bg-secondary-100 px-3 py-1 dark:bg-secondary-900/30"
          >
            <div class="h-2 w-2 animate-pulse rounded-full bg-secondary-500"></div>
            <span
              class="text-xs font-bold uppercase tracking-wide text-secondary-600 dark:text-secondary-400"
              >电池电量</span
            >
          </div>
        </div>

        <div
          class="absolute -right-2 -top-2 flex h-12 w-12 animate-bounce-soft items-center justify-center rounded-full bg-gradient-to-br from-secondary-400 to-emerald-500 shadow-lg shadow-secondary-500/30"
        >
          <i class="fa fa-bolt text-lg text-white"></i>
        </div>
      </div>

      <div class="animate-in w-full max-w-lg space-y-5 delay-200">
        <div class="grid grid-cols-3 gap-4">
          <div
            class="premium-card group p-5 text-center transition-transform duration-300 hover:-translate-y-1"
          >
            <div
              class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 transition-transform duration-300 group-hover:scale-110 dark:bg-primary-900/30"
            >
              <i class="fa fa-clock-o text-xl text-primary-500" aria-hidden="true"></i>
            </div>
            <p
              class="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400"
            >
              充电时长
            </p>
            <p class="text-2xl font-black text-surface-900 dark:text-surface-100">
              {{ formatDuration(chargingData.duration, 'hms') }}
            </p>
          </div>

          <div
            class="premium-card group p-5 text-center transition-transform duration-300 hover:-translate-y-1"
          >
            <div
              class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-100 transition-transform duration-300 group-hover:scale-110 dark:bg-secondary-900/30"
            >
              <i class="fa fa-bolt text-xl text-secondary-500" aria-hidden="true"></i>
            </div>
            <p
              class="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400"
            >
              已充电量
            </p>
            <p class="text-2xl font-black text-surface-900 dark:text-surface-100">
              {{ chargingData.energy.toFixed(1)
              }}<span class="ml-0.5 text-sm font-normal text-surface-400">kWh</span>
            </p>
          </div>

          <div
            class="premium-card group p-5 text-center transition-transform duration-300 hover:-translate-y-1"
          >
            <div
              class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-warning-100 transition-transform duration-300 group-hover:scale-110 dark:bg-warning-900/30"
            >
              <i class="fa fa-rmb text-xl text-warning-500" aria-hidden="true"></i>
            </div>
            <p
              class="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400"
            >
              预计费用
            </p>
            <p class="text-2xl font-black text-warning-600">
              {{ formatPrice(chargingData.cost) }}
            </p>
          </div>
        </div>

        <div class="premium-card p-5">
          <div class="mb-4 flex items-center justify-between">
            <div class="flex items-center space-x-2.5">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-400 to-purple-500 shadow-md"
              >
                <i class="fa fa-tachometer text-sm text-white" aria-hidden="true"></i>
              </div>
              <span class="font-bold text-surface-800 dark:text-surface-200">充电功率</span>
            </div>
            <span class="gradient-text text-2xl font-black">{{ formatPower(displayedSpeed) }}</span>
          </div>

          <div class="relative">
            <div
              class="h-3 w-full overflow-hidden rounded-full bg-surface-200 shadow-inner-soft dark:bg-surface-700"
            >
              <div
                class="relative h-full overflow-hidden rounded-full"
                :style="{
                  width: `${(chargingData.speed / 150) * 100}%`,
                  transition: 'width 2s ease-in-out'
                }"
              >
                <div
                  class="absolute inset-0 animate-shimmer bg-gradient-to-r from-secondary-400 via-cyan-400 to-primary-500"
                  style="background-size: 200% 100%"
                ></div>
              </div>
            </div>
            <div class="mt-2 flex justify-between">
              <span class="text-[10px] font-medium uppercase tracking-wide text-surface-500"
                >0 kW</span
              >
              <span class="text-[10px] font-medium uppercase tracking-wide text-surface-500"
                >150 kW</span
              >
            </div>
          </div>
        </div>

        <div class="premium-card relative overflow-hidden border-l-4 border-l-primary-500 p-5">
          <div
            class="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-gradient-to-br from-primary-500/10 to-transparent"
          ></div>
          <div class="relative z-10 flex items-start space-x-3">
            <div
              class="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-cyan-500 shadow-md"
            >
              <i class="fa fa-info-circle text-lg text-white" aria-hidden="true"></i>
            </div>
            <div class="flex-1">
              <p class="mb-1.5 text-base font-bold text-primary-600 dark:text-primary-400">
                充电进行中
              </p>
              <p class="text-sm leading-relaxed text-surface-600 dark:text-surface-300">
                目标电量 <span class="font-bold text-primary-600">{{ targetBattery }}%</span>，
                预计还需要<span class="font-bold text-primary-600">{{
                  estimatedTimeRemaining
                }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="glass-effect flex-shrink-0 border-t border-surface-200/50 p-4 dark:border-surface-700/50 lg:p-5"
    >
      <button
        class="group relative w-full transform overflow-hidden rounded-2xl bg-gradient-to-r from-danger-500 via-red-600 to-rose-600 py-4 font-bold text-white shadow-xl shadow-danger-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-danger-500/35 active:translate-y-0"
        @click="stopCharging"
      >
        <div
          class="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]"
        ></div>
        <span class="relative z-10 flex items-center justify-center space-x-2.5 text-base">
          <i class="fa fa-stop-circle text-lg" aria-hidden="true"></i>
          <span>结束充电</span>
        </span>
      </button>
    </div>
  </PanelShell>
</template>

<script setup>
import PanelShell from '../common/PanelShell.vue'
import { ref, computed, watch, onMounted, onUnmounted, inject } from 'vue'
import { useChargingStore } from '../../store/modules/charging'
import { useStationsStore } from '../../store/modules/stations'
import { formatDuration, formatPower, formatPrice } from '../../utils/format'

const emit = defineEmits(['close'])
const chargingStore = useChargingStore()
const stationsStore = useStationsStore()
const showToast = inject('showToast')

const chargingData = computed(() => chargingStore.chargingData)
const currentStation = computed(() => stationsStore.currentStation)
const targetBattery = computed(() => chargingStore.settings.targetBattery)

const SETTLE_EPSILON = 0.05
const SETTLE_FRAMES = 60

const displayedSpeed = ref(0)
let rafId = null
let lastTime = 0
let settledFrames = 0

const stopAnimation = () => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

const startAnimation = () => {
  if (rafId !== null || document.hidden) return
  lastTime = 0
  settledFrames = 0
  rafId = requestAnimationFrame(animateLoop)
}

const animateLoop = (timestamp) => {
  rafId = null
  if (document.hidden) return

  if (!lastTime) lastTime = timestamp
  const delta = (timestamp - lastTime) / 1000
  lastTime = timestamp

  const targetSpeed = chargingData.value.speed
  const diff = targetSpeed - displayedSpeed.value

  if (Math.abs(diff) > SETTLE_EPSILON) {
    displayedSpeed.value += diff * (1 - Math.pow(0.03, delta))
    settledFrames = 0
    rafId = requestAnimationFrame(animateLoop)
    return
  }

  displayedSpeed.value = targetSpeed
  settledFrames += 1
  if (settledFrames < SETTLE_FRAMES) {
    rafId = requestAnimationFrame(animateLoop)
  }
}

const handleVisibilityChange = () => {
  if (document.hidden) {
    stopAnimation()
  } else {
    startAnimation()
  }
}

watch(
  () => chargingData.value.speed,
  () => {
    startAnimation()
  }
)

onMounted(() => {
  displayedSpeed.value = chargingData.value.speed
  document.addEventListener('visibilitychange', handleVisibilityChange)
  startAnimation()
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  stopAnimation()
})

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

const stopCharging = () => {
  chargingStore.stopCharging()
  showToast('充电已结束', 'success')
  emit('close')
}
</script>
