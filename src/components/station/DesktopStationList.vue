<template>
  <div class="space-y-3 p-4">
    <StationListControls density="compact" />

    <div v-if="activeFilterCount > 0" class="flex items-center justify-between">
      <span class="text-xs text-surface-500">已筛选出 {{ displayedStations.length }} 个站点</span>
      <button
        class="rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-600 transition-all duration-200 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/40"
        @click="resetFilters"
      >
        清除筛选
      </button>
    </div>

    <div class="space-y-2.5">
      <div v-if="displayedStations.length === 0" class="py-12 text-center">
        <div
          class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800"
        >
          <i
            class="fa fa-search text-2xl text-surface-300 dark:text-surface-600"
            aria-hidden="true"
          ></i>
        </div>
        <h3 class="mb-1 text-sm font-bold text-surface-800 dark:text-surface-200">
          没有找到匹配的充电站
        </h3>
        <p class="text-xs text-surface-500 dark:text-surface-400">尝试调整筛选条件</p>
      </div>

      <StationListCard
        v-for="(station, index) in displayedStations"
        :key="station.stationId"
        :station="station"
        :index="index"
        density="compact"
        @select="emit('select-station', $event)"
      />

      <div v-if="hasMore" class="py-3 text-center">
        <button
          class="rounded-xl bg-primary-50 px-5 py-2 text-xs font-semibold text-primary-600 transition-all duration-200 hover:bg-primary-100 active:scale-95 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/40"
          @click="loadMore"
        >
          <i class="fa fa-angle-down mr-1" aria-hidden="true"></i>
          加载更多 (还有 {{ remainingCount }} 个)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useStationList } from '../../composables/useStationList'
import StationListCard from './StationListCard.vue'
import StationListControls from './StationListControls.vue'

const emit = defineEmits(['select-station'])

const { activeFilterCount, displayedStations, hasMore, remainingCount, loadMore, resetFilters } =
  useStationList()
</script>
