<template>
  <div v-if="stationsStore.isLoading" class="space-y-3" role="status" aria-label="正在加载充电站">
    <div
      v-for="i in 3"
      :key="i"
      class="space-y-4 rounded-2xl border border-surface-200 bg-white p-5 dark:border-surface-700 dark:bg-surface-900"
      aria-hidden="true"
    >
      <div class="shimmer-bg h-4 w-20 rounded"></div>
      <div class="shimmer-bg h-5 w-3/4 rounded"></div>
      <div class="shimmer-bg h-7 w-1/3 rounded"></div>
      <div class="shimmer-bg h-4 w-full rounded"></div>
    </div>
    <span class="sr-only">正在加载充电站…</span>
  </div>
  <div v-else-if="stationsStore.error" class="py-12 text-center" role="status">
    <i class="fa fa-exclamation-circle mb-4 text-2xl text-surface-400" aria-hidden="true"></i>
    <h3 class="text-sm font-semibold text-surface-800 dark:text-surface-200">站点暂时无法加载</h3>
    <p class="mt-2 text-xs leading-6 text-surface-500 dark:text-surface-400">
      请检查网络，并点击地图上的「重试」
    </p>
  </div>
  <div v-else-if="stationsStore.viewportStationCount === 0" class="py-12 text-center" role="status">
    <div
      class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800"
    >
      <i class="fa fa-search text-xl text-surface-400" aria-hidden="true"></i>
    </div>
    <h3 class="text-sm font-semibold text-surface-800 dark:text-surface-200">
      这里还没有匹配的充电站
    </h3>
    <p class="mt-2 text-xs leading-6 text-surface-500 dark:text-surface-400">
      试试移动地图，或调整搜索与筛选条件
    </p>
    <button
      v-if="stationsStore.searchQuery || stationsStore.activeFilterCount"
      class="mt-4 rounded-lg bg-primary-50 px-4 py-2.5 text-xs font-semibold text-primary-700 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300"
      @click="stationsStore.resetFilters()"
    >
      重置筛选条件
    </button>
  </div>
</template>

<script setup>
import { useStationsStore } from '../../store/modules/stations'
const stationsStore = useStationsStore()
</script>
