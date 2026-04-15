<template>
  <div class="panel-overlay">
    <div class="panel-backdrop" @click="$emit('close')"></div>
    <div class="panel-content">
    <div class="glass-effect border-b border-surface-200/50 dark:border-surface-700/50 p-4 flex justify-between items-center flex-shrink-0 z-10">
      <button class="icon-button" @click="$emit('close')">
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">充电记录</h2>
      <div class="w-10"></div>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div v-if="chargingHistory.length > 0" class="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-5 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-surface-500 dark:text-surface-400">累计充电</p>
            <p class="text-2xl font-black gradient-text mt-1">{{ totalEnergy }}<span class="text-sm font-normal text-surface-500 ml-1">kWh</span></p>
          </div>
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-blue-500 flex items-center justify-center shadow-md">
            <i class="fa fa-bolt text-white text-2xl" aria-hidden="true"></i>
          </div>
        </div>
        <div class="flex items-center mt-3 pt-3 border-t border-primary-100 dark:border-surface-700/50 space-x-4">
          <div class="flex items-center">
            <i class="fa fa-clock text-primary-500 text-xs mr-1.5" aria-hidden="true"></i>
            <span class="text-xs text-surface-600 dark:text-surface-300">{{ chargingHistory.length }}次充电</span>
          </div>
          <div class="flex items-center">
            <i class="fa fa-yen text-warning-500 text-xs mr-1.5" aria-hidden="true"></i>
            <span class="text-xs text-surface-600 dark:text-surface-300">总计 ¥{{ totalCost.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <div v-for="record in chargingHistory" :key="record.id"
          class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-4 transition-all hover:shadow-soft-md">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-blue-500 flex items-center justify-center mr-3 shadow-md flex-shrink-0">
                <i class="fa fa-bolt text-white text-sm" aria-hidden="true"></i>
              </div>
              <div>
                <h3 class="font-bold text-sm text-surface-800 dark:text-surface-200">{{ record.stationName }}</h3>
                <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{{ record.stationAddress }}</p>
              </div>
            </div>
            <span v-if="record.status === 'completed'" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400">已完成</span>
            <span v-else-if="record.status === 'refunded'" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400">已退款</span>
          </div>
          <div class="flex items-center justify-between pt-3 border-t border-surface-100 dark:border-surface-700/50">
            <div class="flex items-center space-x-4">
              <div class="flex items-center">
                <i class="fa fa-calendar text-surface-400 text-xs mr-1.5" aria-hidden="true"></i>
                <span class="text-xs text-surface-500 dark:text-surface-400">{{ record.date }}</span>
              </div>
              <div class="flex items-center">
                <i class="fa fa-clock-o text-surface-400 text-xs mr-1.5" aria-hidden="true"></i>
                <span class="text-xs text-surface-500 dark:text-surface-400">{{ record.duration }}</span>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-black" :class="record.status === 'refunded' ? 'text-warning-500' : 'text-surface-800 dark:text-surface-200'">
                {{ record.status === 'refunded' ? '+' : '-' }}¥{{ record.cost.toFixed(2) }}
              </p>
              <p class="text-[10px] text-surface-400">{{ record.energy }} · {{ record.vehicleModel }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="chargingHistory.length === 0" class="text-center py-16 animate-in">
        <div class="w-20 h-20 mx-auto mb-5 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
          <i class="fa fa-history text-surface-300 dark:text-surface-600 text-3xl" aria-hidden="true"></i>
        </div>
        <p class="font-bold text-surface-800 dark:text-surface-200 mb-2">暂无充电记录</p>
        <p class="text-sm text-surface-500 dark:text-surface-400">您的充电记录将显示在这里</p>
      </div>
    </div>
      </div>
</div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '../../store/modules/user'

defineEmits(['close'])

const userStore = useUserStore()
const chargingHistory = computed(() => userStore.chargingHistory)

const totalEnergy = computed(() => {
  return chargingHistory.value
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + parseFloat(r.energy), 0)
    .toFixed(1)
})

const totalCost = computed(() => {
  return chargingHistory.value
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + r.cost, 0)
})
</script>
