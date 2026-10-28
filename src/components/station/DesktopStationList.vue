<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="space-y-3 px-5 pb-4">
      <StationListControls density="compact" />
      <div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-1">
        <p class="text-xs text-surface-500 dark:text-surface-400" aria-live="polite">
          <span class="font-semibold text-surface-800 dark:text-surface-200">{{
            t('{count} 个站点', { count: stationsStore.viewportStationCount })
          }}</span>
          <span class="mx-1 text-surface-300 dark:text-surface-600">/</span
          >{{
            t(
              advisor.ranked.length
                ? '补能推荐优先'
                : stationsStore.userLocation
                  ? '距离优先'
                  : '当前地图范围'
            )
          }}
        </p>
        <div class="flex items-center gap-2">
          <button
            v-if="activeFilterCount > 0 || stationsStore.searchQuery"
            class="text-xs text-surface-500 hover:text-primary-600 dark:text-surface-400"
            @click="resetFilters"
          >
            {{ t('重置') }}
          </button>
          <button
            class="flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-surface-800"
            @click="emit('show-filter')"
          >
            <i class="fa fa-sliders" aria-hidden="true"></i>{{ t('高级筛选') }}
          </button>
        </div>
      </div>
    </div>
    <div
      ref="resultsRef"
      class="min-h-0 flex-1 overflow-y-auto border-t border-surface-100 bg-surface-50/70 px-5 py-4 dark:border-surface-800 dark:bg-surface-950/30"
    >
      <ChargingAdvisor
        @select="emit('select-station', $event)"
        @show-vehicles="emit('show-vehicles')"
      />
      <StationListState />
      <div v-if="!stationsStore.isLoading && !stationsStore.error" class="space-y-3">
        <h3
          v-if="advisor.isCurrent"
          class="pb-1 text-xs font-semibold text-surface-500 dark:text-surface-400"
        >
          {{ t('全部匹配站点') }}
        </h3>
        <StationResultCard
          v-for="(station, index) in displayedStations"
          :key="station.stationId"
          :station="station"
          :index="index"
          density="compact"
          @select="emit('select-station', $event)"
        />
        <button
          v-if="hasMore"
          class="w-full rounded-xl border border-surface-200 bg-white py-3 text-xs font-medium text-surface-600 transition-colors hover:border-primary-300 hover:text-primary-600 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300"
          @click="loadMore"
        >
          {{ t('加载更多 · 还有 {count} 个站点', { count: remainingCount })
          }}<i class="fa fa-angle-down ml-2" aria-hidden="true"></i>
        </button>
        <p
          v-else-if="displayedStations.length"
          class="py-2 text-center text-[11px] text-surface-400"
        >
          {{ t('已展示当前范围内的全部站点') }}
        </p>
      </div>
    </div>
    <ComparisonBar @show="showComparison" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { t } from '../../i18n'
import { useStationList } from '../../composables/useStationList'
import StationResultCard from './StationResultCard.vue'
import ChargingAdvisor from './ChargingAdvisor.vue'
import ComparisonBar from './ComparisonBar.vue'
import { useRecommendationsStore } from '../../store/modules/recommendations'
import StationListControls from './StationListControls.vue'
import StationListState from './StationListState.vue'

const emit = defineEmits(['select-station', 'show-filter', 'show-vehicles'])
const advisor = useRecommendationsStore()
const resultsRef = ref(null)
const showComparison = () =>
  resultsRef.value
    ?.querySelector('[data-testid="station-comparison"]')
    ?.scrollIntoView({ block: 'nearest' })
const {
  stationsStore,
  activeFilterCount,
  displayedStations,
  hasMore,
  remainingCount,
  loadMore,
  resetFilters
} = useStationList()
</script>
