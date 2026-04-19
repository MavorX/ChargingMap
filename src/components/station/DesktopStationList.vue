<template>
  <div class="p-4 space-y-3">
    <div class="relative group">
      <input
        type="text"
        placeholder="搜索充电站名称或地址..."
        class="input-premium pl-11 pr-4 py-3 text-sm"
        v-model="searchQuery"
      />
      <i class="fa fa-search absolute left-3.5 top-1/2 transform -translate-y-1/2 text-surface-400 group-focus-within:text-primary-500 transition-colors duration-300 text-sm" aria-hidden="true"></i>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="(filter, key) in filterButtons"
        :key="key"
        :class="[
          'px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95',
          filters[key]
            ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-glow-primary'
            : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'
        ]"
        @click="stationsStore.toggleFilter(key)">
        <span class="flex items-center space-x-1">
          <i :class="filter.icon" aria-hidden="true"></i>
          <span>{{ filter.label }}</span>
        </span>
      </button>
    </div>

    <div v-if="activeFilterCount > 0" class="flex items-center justify-between">
      <span class="text-xs text-surface-500">已筛选出 {{ displayedStations.length }} 个站点</span>
      <button
        class="px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-semibold hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all duration-200"
        @click="resetFilters">
        清除筛选
      </button>
    </div>

    <div class="space-y-2.5">
      <div v-if="displayedStations.length === 0" class="text-center py-12">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
          <i class="fa fa-search text-surface-300 dark:text-surface-600 text-2xl" aria-hidden="true"></i>
        </div>
        <h3 class="text-sm font-bold text-surface-800 dark:text-surface-200 mb-1">没有找到匹配的充电站</h3>
        <p class="text-xs text-surface-500 dark:text-surface-400">尝试调整筛选条件</p>
      </div>

      <div
        v-for="(station, index) in displayedStations"
        :key="station.stationId"
        class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-xl shadow-soft p-3.5 cursor-pointer group hover:shadow-soft-md hover:-translate-y-0.5 transition-all duration-200"
        :style="{ animationDelay: `${Math.min(index, 10) * 60}ms` }"
        @click="$emit('select-station', station)">
        <div class="flex justify-between items-start mb-2">
          <div class="flex-1 min-w-0 pr-2">
            <h3 class="font-bold text-surface-900 dark:text-surface-100 text-sm mb-0.5 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">{{ station.stationName }}</h3>
            <p class="text-xs text-surface-500 dark:text-surface-400 truncate">
              <i class="fa fa-map-marker mr-1 text-surface-400 flex-shrink-0" aria-hidden="true"></i>
              {{ station.address }}
            </p>
          </div>
          <div class="flex flex-col items-end space-y-1 flex-shrink-0">
            <span v-if="station.reservationAvailable && station.openStatus === 1 && (station.quickAvailableNum > 0 || station.slowAvailableNum > 0)" class="status-badge-warning text-[9px]">可预约</span>
            <span class="status-badge text-[10px]" :class="getStationStatusClass(station)">{{ getStationStatusText(station) }}</span>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 mb-2">
          <div class="flex items-center space-x-1.5 p-2 rounded-lg bg-secondary-50 dark:bg-secondary-900/20">
            <i class="fa fa-bolt text-secondary-500 text-[10px]" aria-hidden="true"></i>
            <span class="text-xs font-bold text-secondary-600">{{ station.quickAvailableNum }}/{{ station.quickChargeNum }}</span>
          </div>
          <div class="flex items-center space-x-1.5 p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
            <i class="fa fa-plug text-primary-500 text-[10px]" aria-hidden="true"></i>
            <span class="text-xs font-bold text-primary-600">{{ station.slowAvailableNum }}/{{ station.slowChargeNum }}</span>
          </div>
          <div class="flex items-center space-x-1.5 p-2 rounded-lg bg-warning-50 dark:bg-warning-900/20">
            <i class="fa fa-rmb text-warning-500 text-[10px]" aria-hidden="true"></i>
            <span class="text-xs font-bold text-warning-600">¥{{ station.currentPrice.toFixed(2) }}</span>
          </div>
        </div>

        <div class="flex justify-between items-center pt-2 border-t border-surface-100 dark:border-surface-700/50">
          <div class="flex items-center space-x-1">
            <div class="rating-stars flex">
              <span v-for="i in 5" :key="i" class="star text-[10px]" :class="i <= Math.round(station.stationGradeScore) ? 'active' : ''">
                <i class="fa fa-star" aria-hidden="true"></i>
              </span>
            </div>
            <span class="text-xs font-bold text-warning-600">{{ station.stationGradeScore }}</span>
          </div>
          <div class="flex items-center text-primary-600 dark:text-primary-400 font-bold text-xs group-hover:translate-x-1 transition-transform duration-200">
            <i class="fa fa-location-arrow mr-1 text-[10px]" aria-hidden="true"></i>
            {{ (station.distance / 1000).toFixed(1) }} km
          </div>
        </div>
      </div>

      <div v-if="hasMore" class="text-center py-3">
        <button
          class="px-5 py-2 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold text-xs hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all duration-200 active:scale-95"
          @click="loadMore">
          <i class="fa fa-angle-down mr-1" aria-hidden="true"></i>
          加载更多 (还有 {{ remainingCount }} 个)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStationsStore } from '../../store/modules/stations';

const emit = defineEmits(['select-station']);

const stationsStore = useStationsStore();
const searchQuery = computed({
  get: () => stationsStore.searchQuery,
  set: (val) => stationsStore.setSearchQuery(val)
});
const filters = computed(() => stationsStore.filters);
const activeFilterCount = computed(() => stationsStore.activeFilterCount);

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
};

const displayedStations = computed(() => {
  return stationsStore.pagedStations;
});

const hasMore = computed(() => stationsStore.hasMoreStations);
const remainingCount = computed(() => {
  const total = stationsStore.viewportStationCount;
  const loaded = stationsStore.listPage * stationsStore.listPageSize;
  return Math.max(0, total - loaded);
});

const loadMore = () => {
  stationsStore.listPage++;
};

const resetFilters = () => {
  stationsStore.resetFilters();
};

const getStationStatusClass = (station) => {
  if (station.openStatus === 0) {
    return 'bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400';
  }
  if (station.quickAvailableNum > 0 || station.slowAvailableNum > 0) {
    return 'status-badge-success';
  }
  return 'status-badge-danger';
};

const getStationStatusText = (station) => {
  if (station.openStatus === 0) {
    return '维护中';
  }
  if (station.quickAvailableNum > 0 || station.slowAvailableNum > 0) {
    return '有可用';
  }
  return '已满';
};
</script>
