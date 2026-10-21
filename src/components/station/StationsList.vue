<template>
  <div
    id="stations-list"
    class="glass-card fixed bottom-0 left-0 right-0 z-panel max-h-[75vh] overflow-y-auto rounded-t-3xl shadow-2xl lg:left-1/2 lg:max-w-lg lg:-translate-x-1/2 lg:transform"
  >
    <div
      class="glass-effect sticky top-0 z-10 flex items-center justify-between border-b border-surface-200/50 p-5 dark:border-surface-700/50"
    >
      <div class="flex items-center space-x-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 shadow-md"
        >
          <i class="fa fa-map-marker text-white" aria-hidden="true"></i>
        </div>
        <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">附近充电站</h2>
        <span class="text-xs text-surface-400 dark:text-surface-500"
          >{{ stationsStore.viewportStationCount }}个在视野内</span
        >
      </div>
      <div class="flex items-center space-x-2.5">
        <button
          class="glass-card group rounded-full px-3 py-1.5 text-xs font-semibold text-surface-600 transition-all duration-200 hover:border-primary-300 active:scale-95 dark:text-surface-300"
          @click="emit('show-filter')"
        >
          <span class="flex items-center space-x-1.5">
            <i class="fa fa-sliders text-primary-500" aria-hidden="true"></i>
            <span>筛选</span>
          </span>
        </button>
        <button
          v-if="activeFilterCount > 0"
          class="group rounded-full bg-primary-100 px-3 py-1.5 text-xs font-semibold text-primary-600 transition-all duration-200 hover:bg-primary-200 active:scale-95 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50"
          @click="resetFilters"
        >
          <span>清除筛选</span>
          <span
            class="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] text-white"
            >{{ activeFilterCount }}</span
          >
        </button>
        <button id="close-list" class="icon-button" aria-label="关闭列表" @click="emit('close')">
          <i
            class="fa fa-times text-surface-500 transition-colors duration-200 hover:text-danger-500"
            aria-hidden="true"
          ></i>
        </button>
      </div>
    </div>
    <div class="space-y-4 p-5">
      <StationListControls density="comfortable" />
      <div id="stations-container" class="space-y-3.5">
        <div v-if="displayedStations.length === 0" class="animate-in py-16 text-center">
          <div
            class="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800"
          >
            <i
              class="fa fa-search text-3xl text-surface-300 dark:text-surface-600"
              aria-hidden="true"
            ></i>
          </div>
          <h3 class="mb-2 text-base font-bold text-surface-800 dark:text-surface-200">
            没有找到匹配的充电站
          </h3>
          <p class="mb-5 text-sm text-surface-500 dark:text-surface-400">
            尝试调整筛选条件或搜索关键词
          </p>
          <button
            id="reset-filters"
            class="inline-flex items-center space-x-2 rounded-xl bg-primary-100 px-5 py-2.5 text-sm font-semibold text-primary-600 transition-all duration-200 hover:bg-primary-200 active:scale-95 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50"
            @click="resetFilters"
          >
            <i class="fa fa-refresh" aria-hidden="true"></i>
            <span>重置筛选条件</span>
          </button>
        </div>

        <StationListCard
          v-for="(station, index) in displayedStations"
          :key="station.stationId"
          :station="station"
          :index="index"
          density="comfortable"
          @select="selectStation"
        />
        <div v-if="hasMore" class="py-4 text-center">
          <button
            class="rounded-xl bg-primary-50 px-6 py-2.5 text-sm font-semibold text-primary-600 transition-all duration-200 hover:bg-primary-100 active:scale-95 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/40"
            @click="loadMore"
          >
            <i class="fa fa-angle-down mr-1.5" aria-hidden="true"></i>
            加载更多 (还有 {{ remainingCount }} 个)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useStationList } from '../../composables/useStationList'
import StationListCard from './StationListCard.vue'
import StationListControls from './StationListControls.vue'

const emit = defineEmits(['close', 'show-filter'])

const {
  stationsStore,
  activeFilterCount,
  displayedStations,
  hasMore,
  remainingCount,
  loadMore,
  resetFilters
} = useStationList()

const selectStation = (station) => {
  stationsStore.setCurrentStation(station)
  emit('close')
}
</script>
