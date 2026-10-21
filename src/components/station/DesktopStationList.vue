<template>
  <div class="space-y-3 p-4">
    <div class="group relative">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索充电站名称或地址..."
        class="input-premium py-3 pl-11 pr-4 text-sm"
      />
      <i
        class="fa fa-search absolute left-3.5 top-1/2 -translate-y-1/2 transform text-sm text-surface-400 transition-colors duration-300 group-focus-within:text-primary-500"
        aria-hidden="true"
      ></i>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="(filter, key) in filterButtons"
        :key="key"
        :class="[
          'rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 active:scale-95',
          filters[key]
            ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-glow-primary'
            : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700'
        ]"
        @click="stationsStore.toggleFilter(key)"
      >
        <span class="flex items-center space-x-1">
          <i :class="filter.icon" aria-hidden="true"></i>
          <span>{{ filter.label }}</span>
        </span>
      </button>
    </div>

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

      <div
        v-for="(station, index) in displayedStations"
        :key="station.stationId"
        class="group cursor-pointer rounded-xl bg-gradient-to-br from-white to-surface-50 p-3.5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-md dark:from-surface-800 dark:to-surface-900"
        :style="{ animationDelay: `${Math.min(index, 10) * 60}ms` }"
        @click="$emit('select-station', station)"
      >
        <div class="mb-2 flex items-start justify-between">
          <div class="min-w-0 flex-1 pr-2">
            <h3
              class="mb-0.5 truncate text-sm font-bold text-surface-900 transition-colors duration-200 group-hover:text-primary-600 dark:text-surface-100 dark:group-hover:text-primary-400"
            >
              {{ station.stationName }}
            </h3>
            <p class="truncate text-xs text-surface-500 dark:text-surface-400">
              <i
                class="fa fa-map-marker mr-1 flex-shrink-0 text-surface-400"
                aria-hidden="true"
              ></i>
              {{ station.address }}
            </p>
          </div>
          <div class="flex flex-shrink-0 flex-col items-end space-y-1">
            <span
              v-if="
                station.reservationAvailable &&
                station.openStatus === 1 &&
                (station.quickAvailableNum > 0 || station.slowAvailableNum > 0)
              "
              class="status-badge-warning text-[9px]"
              >可预约</span
            >
            <span class="status-badge text-[10px]" :class="stationStatus(station).tone">{{
              stationStatus(station).text
            }}</span>
          </div>
        </div>

        <div class="mb-2 grid grid-cols-3 gap-2">
          <div
            class="flex items-center space-x-1.5 rounded-lg bg-secondary-50 p-2 dark:bg-secondary-900/20"
          >
            <i class="fa fa-bolt text-[10px] text-secondary-500" aria-hidden="true"></i>
            <span class="text-xs font-bold text-secondary-600"
              >{{ station.quickAvailableNum }}/{{ station.quickChargeNum }}</span
            >
          </div>
          <div
            class="flex items-center space-x-1.5 rounded-lg bg-primary-50 p-2 dark:bg-primary-900/20"
          >
            <i class="fa fa-plug text-[10px] text-primary-500" aria-hidden="true"></i>
            <span class="text-xs font-bold text-primary-600"
              >{{ station.slowAvailableNum }}/{{ station.slowChargeNum }}</span
            >
          </div>
          <div
            class="flex items-center space-x-1.5 rounded-lg bg-warning-50 p-2 dark:bg-warning-900/20"
          >
            <i class="fa fa-rmb text-[10px] text-warning-500" aria-hidden="true"></i>
            <span class="text-xs font-bold text-warning-600"
              >{{ formatPrice(station.currentPrice) }}</span
            >
          </div>
        </div>

        <div
          class="flex items-center justify-between border-t border-surface-100 pt-2 dark:border-surface-700/50"
        >
          <div class="flex items-center space-x-1">
            <div class="rating-stars flex">
              <span
                v-for="i in 5"
                :key="i"
                class="star text-[10px]"
                :class="i <= Math.round(station.stationGradeScore) ? 'active' : ''"
              >
                <i class="fa fa-star" aria-hidden="true"></i>
              </span>
            </div>
            <span class="text-xs font-bold text-warning-600">{{ station.stationGradeScore }}</span>
          </div>
          <div
            class="flex items-center text-xs font-bold text-primary-600 transition-transform duration-200 group-hover:translate-x-1 dark:text-primary-400"
          >
            <i class="fa fa-location-arrow mr-1 text-[10px]" aria-hidden="true"></i>
            {{
              formatDistance(station.distance)
            }}
          </div>
        </div>
      </div>

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
import { computed } from 'vue'
import { useStationsStore } from '../../store/modules/stations'
import { formatDistance, formatPrice } from '../../utils/format'
import { stationStatus } from '../../utils/stationStatus'

defineEmits(['select-station'])

const stationsStore = useStationsStore()
const searchQuery = computed({
  get: () => stationsStore.searchQuery,
  set: (val) => stationsStore.setSearchQuery(val)
})
const filters = computed(() => stationsStore.filters)
const activeFilterCount = computed(() => stationsStore.activeFilterCount)

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
</script>
