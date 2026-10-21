<template>
  <div
    id="stations-list"
    class="glass-card fixed bottom-0 left-0 right-0 z-40 max-h-[75vh] overflow-y-auto rounded-t-3xl shadow-2xl lg:left-1/2 lg:max-w-lg lg:-translate-x-1/2 lg:transform"
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
          >{{ viewportStationCount }}个在视野内</span
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
        <button id="close-list" class="icon-button" @click="$emit('close')">
          <i
            class="fa fa-times text-surface-500 transition-colors duration-200 hover:text-danger-500"
            aria-hidden="true"
          ></i>
        </button>
      </div>
    </div>

    <div class="space-y-4 p-5">
      <div class="group relative">
        <input
          id="search-station"
          v-model="searchQuery"
          type="text"
          placeholder="搜索充电站名称或地址..."
          class="input-premium py-3.5 pl-12 pr-4"
        />
        <i
          class="fa fa-search absolute left-4 top-1/2 -translate-y-1/2 transform text-surface-400 transition-colors duration-300 group-focus-within:text-primary-500"
          aria-hidden="true"
        ></i>
      </div>

      <div class="flex flex-wrap gap-2.5">
        <button
          v-for="(filter, key) in filterButtons"
          :key="key"
          :class="[
            'group relative overflow-hidden rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300 active:scale-95',
            filters[key]
              ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-glow-primary hover:shadow-lg'
              : 'glass-card text-surface-600 hover:border-primary-300 dark:text-surface-300'
          ]"
          @click="stationsStore.toggleFilter(key)"
        >
          <span class="relative z-10 flex items-center space-x-1.5">
            <i :class="filter.icon" aria-hidden="true"></i>
            <span>{{ filter.label }}</span>
          </span>
          <div
            v-if="filters[key]"
            class="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]"
          ></div>
        </button>
      </div>

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

        <div
          v-for="(station, index) in displayedStations"
          :key="station.stationId"
          class="animate-in group cursor-pointer rounded-2xl bg-gradient-to-br from-white to-surface-50 p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-lg dark:from-surface-800 dark:to-surface-900"
          :style="{ animationDelay: `${Math.min(index, 10) * 80}ms` }"
          @click="selectStation(station)"
        >
          <div class="mb-3 flex items-start justify-between">
            <div class="min-w-0 flex-1 pr-3">
              <h3
                class="mb-1 truncate text-base font-bold text-surface-900 transition-colors duration-200 group-hover:text-primary-600 dark:text-surface-100 dark:group-hover:text-primary-400"
              >
                {{ station.stationName }}
              </h3>
              <p class="flex items-center truncate text-xs text-surface-500 dark:text-surface-400">
                <i
                  class="fa fa-map-marker mr-1.5 flex-shrink-0 text-surface-400"
                  aria-hidden="true"
                ></i>
                <span class="truncate">{{ station.address }}</span>
              </p>
            </div>
            <div class="flex flex-shrink-0 flex-col items-end space-y-1.5">
              <span
                v-if="
                  station.reservationAvailable &&
                  station.openStatus === 1 &&
                  (station.quickAvailableNum > 0 || station.slowAvailableNum > 0)
                "
                class="status-badge-warning text-[10px]"
                >可预约</span
              >
              <span class="status-badge text-[11px]" :class="getStationStatusClass(station)">{{
                getStationStatusText(station)
              }}</span>
            </div>
          </div>

          <div class="mb-3 grid grid-cols-3 gap-2.5">
            <div
              class="flex items-center space-x-2 rounded-xl border border-secondary-100 bg-secondary-50 p-2.5 dark:border-secondary-900/30 dark:bg-secondary-900/20"
            >
              <div
                class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-secondary-100 dark:bg-secondary-900/40"
              >
                <i class="fa fa-bolt text-xs text-secondary-500" aria-hidden="true"></i>
              </div>
              <div class="min-w-0">
                <p class="text-[9px] font-medium uppercase tracking-wide text-surface-500">快充</p>
                <p class="text-xs font-bold text-secondary-600">
                  {{ station.quickAvailableNum }}/{{ station.quickChargeNum }}
                </p>
              </div>
            </div>

            <div
              class="flex items-center space-x-2 rounded-xl border border-primary-100 bg-primary-50 p-2.5 dark:border-primary-900/30 dark:bg-primary-900/20"
            >
              <div
                class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/40"
              >
                <i class="fa fa-plug text-xs text-primary-500" aria-hidden="true"></i>
              </div>
              <div class="min-w-0">
                <p class="text-[9px] font-medium uppercase tracking-wide text-surface-500">慢充</p>
                <p class="text-xs font-bold text-primary-600">
                  {{ station.slowAvailableNum }}/{{ station.slowChargeNum }}
                </p>
              </div>
            </div>

            <div
              class="flex items-center space-x-2 rounded-xl border border-warning-100 bg-warning-50 p-2.5 dark:border-warning-900/30 dark:bg-warning-900/20"
            >
              <div
                class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-warning-100 dark:bg-warning-900/40"
              >
                <i class="fa fa-rmb text-xs text-warning-500" aria-hidden="true"></i>
              </div>
              <div class="min-w-0">
                <p class="text-[9px] font-medium uppercase tracking-wide text-surface-500">电价</p>
                <p class="text-xs font-bold text-warning-600">
                  ¥{{ station.currentPrice.toFixed(2) }}
                </p>
              </div>
            </div>
          </div>

          <div
            class="flex items-center justify-between border-t border-surface-100 pt-3 dark:border-surface-700/50"
          >
            <div class="flex items-center space-x-1.5">
              <div class="rating-stars flex">
                <span
                  v-for="i in 5"
                  :key="i"
                  class="star text-xs"
                  :class="i <= Math.round(station.stationGradeScore) ? 'active' : ''"
                >
                  <i class="fa fa-star" aria-hidden="true"></i>
                </span>
              </div>
              <span class="ml-1 text-xs font-bold text-warning-600">{{
                station.stationGradeScore
              }}</span>
            </div>
            <div
              class="flex items-center text-sm font-bold text-primary-600 transition-transform duration-200 group-hover:translate-x-1 dark:text-primary-400"
            >
              <i class="fa fa-location-arrow mr-1.5 text-xs" aria-hidden="true"></i>
              {{ (station.distance / 1000).toFixed(1) }} km
              <i
                class="fa fa-chevron-right ml-1.5 text-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                aria-hidden="true"
              ></i>
            </div>
          </div>
        </div>

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
import { computed } from 'vue'
import { useStationsStore } from '../../store/modules/stations'

const emit = defineEmits(['close', 'show-filter'])

const stationsStore = useStationsStore()
const searchQuery = computed({
  get: () => stationsStore.searchQuery,
  set: (val) => stationsStore.setSearchQuery(val)
})
const filters = computed(() => stationsStore.filters)
const activeFilterCount = computed(() => stationsStore.activeFilterCount)
const viewportStationCount = computed(() => stationsStore.viewportStationCount)

const filterButtons = {
  quickAvailable: {
    label: '快充可用',
    icon: 'fa fa-bolt'
  },
  slowAvailable: {
    label: '慢充可用',
    icon: 'fa fa-plug'
  },
  open24h: {
    label: '24小时',
    icon: 'fa fa-clock-o'
  },
  reservable: {
    label: '可预约',
    icon: 'fa fa-calendar-check-o'
  }
}

const displayedStations = computed(() => {
  return stationsStore.pagedStations
})

const hasMore = computed(() => stationsStore.hasMoreStations)
const remainingCount = computed(() => {
  const total = stationsStore.viewportStationCount
  const loaded = stationsStore.listPage * stationsStore.listPageSize
  return Math.max(0, total - loaded)
})

const loadMore = () => {
  stationsStore.listPage++
}

const resetFilters = () => {
  stationsStore.resetFilters()
}

const selectStation = (station) => {
  stationsStore.setCurrentStation(station)
  emit('close')
}

const getStationStatusClass = (station) => {
  if (station.openStatus === 0) {
    return 'bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400'
  }
  if (station.quickAvailableNum > 0 || station.slowAvailableNum > 0) {
    return 'status-badge-success'
  }
  return 'status-badge-danger'
}

const getStationStatusText = (station) => {
  if (station.openStatus === 0) {
    return '维护中'
  }
  if (station.quickAvailableNum > 0 || station.slowAvailableNum > 0) {
    return '有可用'
  }
  return '已满'
}
</script>
