<template>
  <PanelShell title="充电记录" @close="$emit('close')">
    <div
      class="glass-effect z-10 flex flex-shrink-0 items-center justify-between border-b border-surface-200/50 p-4 dark:border-surface-700/50"
    >
      <button class="icon-button" aria-label="返回" @click="$emit('close')">
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">充电记录</h2>
      <div class="w-10"></div>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div
        v-if="chargingHistory.length > 0"
        class="mb-6 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 p-5 shadow-soft dark:from-surface-800 dark:to-surface-900"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-surface-500 dark:text-surface-400">累计充电</p>
            <p class="gradient-text mt-1 text-2xl font-black">
              {{ totalEnergy }}<span class="ml-1 text-sm font-normal text-surface-500">kWh</span>
            </p>
          </div>
          <div
            class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-blue-500 shadow-md"
          >
            <i class="fa fa-bolt text-2xl text-white" aria-hidden="true"></i>
          </div>
        </div>
        <div
          class="mt-3 flex items-center space-x-4 border-t border-primary-100 pt-3 dark:border-surface-700/50"
        >
          <div class="flex items-center">
            <i class="fa fa-clock mr-1.5 text-xs text-primary-500" aria-hidden="true"></i>
            <span class="text-xs text-surface-600 dark:text-surface-300"
              >{{ chargingHistory.length }}次充电</span
            >
          </div>
          <div class="flex items-center">
            <i class="fa fa-yen mr-1.5 text-xs text-warning-500" aria-hidden="true"></i>
            <span class="text-xs text-surface-600 dark:text-surface-300"
              >总计 {{ formatPrice(totalCost) }}</span
            >
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <div
          v-for="record in chargingHistory"
          :key="record.id"
          class="rounded-2xl bg-gradient-to-br from-white to-surface-50 p-4 shadow-soft transition-all hover:shadow-soft-md dark:from-surface-800 dark:to-surface-900"
        >
          <div class="mb-3 flex items-start justify-between">
            <div class="flex items-center">
              <div
                class="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-blue-500 shadow-md"
              >
                <i class="fa fa-bolt text-sm text-white" aria-hidden="true"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold text-surface-800 dark:text-surface-200">
                  {{ record.stationName }}
                </h3>
                <p class="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
                  {{ record.stationAddress }}
                </p>
              </div>
            </div>
            <span
              v-if="record.status === 'completed'"
              class="rounded-full bg-secondary-100 px-2 py-0.5 text-[10px] font-bold text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400"
              >已完成</span
            >
            <span
              v-else-if="record.status === 'refunded'"
              class="rounded-full bg-warning-100 px-2 py-0.5 text-[10px] font-bold text-warning-600 dark:bg-warning-900/30 dark:text-warning-400"
              >已退款</span
            >
          </div>
          <div
            class="flex items-center justify-between border-t border-surface-100 pt-3 dark:border-surface-700/50"
          >
            <div class="flex items-center space-x-4">
              <div class="flex items-center">
                <i class="fa fa-calendar mr-1.5 text-xs text-surface-400" aria-hidden="true"></i>
                <span class="text-xs text-surface-500 dark:text-surface-400">{{
                  record.date
                }}</span>
              </div>
              <div class="flex items-center">
                <i class="fa fa-clock-o mr-1.5 text-xs text-surface-400" aria-hidden="true"></i>
                <span class="text-xs text-surface-500 dark:text-surface-400">{{
                  record.duration
                }}</span>
              </div>
            </div>
            <div class="text-right">
              <p
                class="text-sm font-black"
                :class="
                  record.status === 'refunded'
                    ? 'text-warning-500'
                    : 'text-surface-800 dark:text-surface-200'
                "
              >
                {{ record.status === 'refunded' ? '+' : '-' }}{{ formatPrice(record.cost) }}
              </p>
              <p class="text-[10px] text-surface-400">
                {{ record.energy }} · {{ record.vehicleModel }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="chargingHistory.length === 0" class="animate-in py-16 text-center">
        <div
          class="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800"
        >
          <i
            class="fa fa-history text-3xl text-surface-300 dark:text-surface-600"
            aria-hidden="true"
          ></i>
        </div>
        <p class="mb-2 font-bold text-surface-800 dark:text-surface-200">暂无充电记录</p>
        <p class="text-sm text-surface-500 dark:text-surface-400">您的充电记录将显示在这里</p>
      </div>
    </div>
  </PanelShell>
</template>

<script setup>
import PanelShell from '../common/PanelShell.vue'
import { computed } from 'vue'
import { useUserStore } from '../../store/modules/user'
import { formatPrice } from '../../utils/format'

defineEmits(['close'])

const userStore = useUserStore()
const chargingHistory = computed(() => userStore.chargingHistory)

const totalEnergy = computed(() => {
  return chargingHistory.value
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + parseFloat(r.energy), 0)
    .toFixed(1)
})

const totalCost = computed(() => {
  return chargingHistory.value
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + r.cost, 0)
})
</script>
