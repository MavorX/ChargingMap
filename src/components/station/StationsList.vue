<template>
  <PanelShell title="站点列表" placement="sheet" content-id="stations-list" @close="emit('close')">
    <div
      class="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-surface-300 dark:bg-surface-600"
      aria-hidden="true"
    ></div>
    <div class="flex shrink-0 items-center justify-between px-5 pb-3 pt-3">
      <div>
        <h2 class="text-xl font-bold tracking-tight text-surface-900 dark:text-surface-100">
          {{ t('附近充电站') }}
        </h2>
        <p class="mt-1 text-xs text-surface-500 dark:text-surface-400" aria-live="polite">
          {{ t('当前视野内 {count} 个站点', { count: stationsStore.viewportStationCount }) }}
        </p>
        <p class="mt-1 text-[11px] text-surface-400">{{ t('演示数据') }}</p>
      </div>
      <button
        id="close-list"
        class="icon-button text-surface-500"
        :aria-label="t('关闭列表')"
        @click="emit('close')"
      >
        <i class="fa fa-times" aria-hidden="true"></i>
      </button>
    </div>
    <div class="shrink-0 space-y-3 px-5 pb-3">
      <StationListControls density="comfortable" />
      <div class="flex items-center justify-between text-xs">
        <span class="text-surface-500 dark:text-surface-400">{{
          t(
            advisor.ranked.length
              ? '补能推荐优先'
              : stationsStore.userLocation
                ? '距离优先'
                : '当前地图范围'
          )
        }}</span>
        <div class="flex items-center gap-3">
          <button
            v-if="activeFilterCount > 0 || stationsStore.searchQuery"
            class="min-h-8 text-surface-500 dark:text-surface-400"
            @click="resetFilters"
          >
            {{ t('清除筛选') }}
          </button>
          <button
            class="flex min-h-8 items-center gap-1.5 font-medium text-primary-600 dark:text-primary-400"
            @click="emit('show-filter')"
          >
            <i class="fa fa-sliders" aria-hidden="true"></i>{{ t('高级筛选') }}
          </button>
        </div>
      </div>
    </div>
    <div
      id="stations-container"
      ref="resultsRef"
      class="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-surface-100 bg-surface-50/70 p-4 dark:border-surface-800 dark:bg-surface-950/30"
    >
      <ChargingAdvisor @select="selectStation" @show-vehicles="emit('show-vehicles')" />
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
          @select="selectStation"
        />
        <button
          v-if="hasMore"
          class="w-full rounded-xl border border-surface-200 bg-white py-3 text-xs font-medium text-surface-600 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300"
          @click="loadMore"
        >
          {{ t('加载更多 · 还有 {count} 个站点', { count: remainingCount })
          }}<i class="fa fa-angle-down ml-2" aria-hidden="true"></i>
        </button>
      </div>
    </div>
    <ComparisonBar @show="showComparison" />
  </PanelShell>
</template>

<script setup>
import { ref } from 'vue'
import { t } from '../../i18n'
import PanelShell from '../common/PanelShell.vue'
import { useStationList } from '../../composables/useStationList'
import StationResultCard from './StationResultCard.vue'
import ChargingAdvisor from './ChargingAdvisor.vue'
import ComparisonBar from './ComparisonBar.vue'
import { useRecommendationsStore } from '../../store/modules/recommendations'
import { useChargingStore } from '../../store/modules/charging'
import StationListControls from './StationListControls.vue'
import StationListState from './StationListState.vue'

const emit = defineEmits(['close', 'show-filter', 'show-vehicles'])
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
const selectStation = (station) => {
  const draft = advisor.setupForStation(station.stationId)
  if (draft && !useChargingStore().isCharging && !useChargingStore().paymentPending)
    useChargingStore().setupDraft = draft
  stationsStore.setCurrentStation(station)
  emit('close')
}
</script>
