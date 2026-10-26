<template>
  <div
    id="stations-list"
    class="fixed inset-x-0 bottom-0 z-panel flex max-h-[78vh] flex-col overflow-hidden rounded-t-3xl border-t border-surface-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-soft-lg supports-[height:100dvh]:max-h-[78dvh] dark:border-surface-700 dark:bg-surface-900 lg:left-1/2 lg:max-w-lg lg:-translate-x-1/2"
    role="region"
    aria-label="站点列表"
  >
    <div
      class="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-surface-300 dark:bg-surface-600"
      aria-hidden="true"
    ></div>
    <div class="flex shrink-0 items-center justify-between px-5 pb-3 pt-3">
      <div>
        <h2 class="text-xl font-bold tracking-tight text-surface-900 dark:text-surface-100">
          附近充电站
        </h2>
        <p class="mt-1 text-xs text-surface-500 dark:text-surface-400" aria-live="polite">
          当前视野内 {{ stationsStore.viewportStationCount }} 个站点
        </p>
      </div>
      <button
        id="close-list"
        class="icon-button text-surface-500"
        aria-label="关闭列表"
        @click="emit('close')"
      >
        <i class="fa fa-times" aria-hidden="true"></i>
      </button>
    </div>
    <div class="shrink-0 space-y-3 px-5 pb-3">
      <StationListControls density="comfortable" />
      <div class="flex items-center justify-between text-xs">
        <span class="text-surface-500 dark:text-surface-400">{{
          stationsStore.userLocation ? '距离优先' : '当前地图范围'
        }}</span>
        <div class="flex items-center gap-3">
          <button
            v-if="activeFilterCount > 0 || stationsStore.searchQuery"
            class="min-h-8 text-surface-500 dark:text-surface-400"
            @click="resetFilters"
          >
            清除筛选
          </button>
          <button
            class="flex min-h-8 items-center gap-1.5 font-medium text-primary-600 dark:text-primary-400"
            @click="emit('show-filter')"
          >
            <i class="fa fa-sliders" aria-hidden="true"></i>高级筛选
          </button>
        </div>
      </div>
    </div>
    <div
      id="stations-container"
      class="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-surface-100 bg-surface-50/70 p-4 dark:border-surface-800 dark:bg-surface-950/30"
    >
      <StationListState />
      <div v-if="!stationsStore.isLoading && !stationsStore.error" class="space-y-3">
        <StationListCard
          v-for="(station, index) in displayedStations"
          :key="station.stationId"
          :station="station"
          :index="index"
          @select="selectStation"
        />
        <button
          v-if="hasMore"
          class="w-full rounded-xl border border-surface-200 bg-white py-3 text-xs font-medium text-surface-600 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300"
          @click="loadMore"
        >
          加载更多 · 还有 {{ remainingCount }} 个站点<i
            class="fa fa-angle-down ml-2"
            aria-hidden="true"
          ></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useStationList } from '../../composables/useStationList'
import StationListCard from './StationListCard.vue'
import StationListControls from './StationListControls.vue'
import StationListState from './StationListState.vue'

const emit = defineEmits(['close', 'show-filter'])
const handleKeydown = (event) => {
  if (event.key === 'Escape') emit('close')
}
onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
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
