<template>
  <div id="stations-list" class="fixed bottom-0 left-0 right-0 lg:left-1/2 lg:transform lg:-translate-x-1/2 lg:max-w-lg glass-card rounded-t-3xl z-40 max-h-[75vh] overflow-y-auto shadow-2xl">
    <div class="glass-effect border-b border-surface-200/50 dark:border-surface-700/50 p-5 flex justify-between items-center sticky top-0 z-10">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center shadow-md">
          <i class="fa fa-map-marker text-white" aria-hidden="true"></i>
        </div>
        <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">附近充电站</h2>
        <span class="text-xs text-surface-400 dark:text-surface-500">{{ viewportStationCount }}个在视野内</span>
      </div>
      <div class="flex items-center space-x-2.5">
        <button
                class="group px-3 py-1.5 rounded-full glass-card text-surface-600 dark:text-surface-300 font-semibold text-xs hover:border-primary-300 transition-all duration-200 active:scale-95"
                @click="emit('show-filter')">
          <span class="flex items-center space-x-1.5">
            <i class="fa fa-sliders text-primary-500" aria-hidden="true"></i>
            <span>筛选</span>
          </span>
        </button>
        <button v-if="activeFilterCount > 0"
                class="group px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold text-xs hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-all duration-200 active:scale-95"
                @click="resetFilters">
          <span>清除筛选</span>
          <span class="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-500 text-white text-[10px]">{{ activeFilterCount }}</span>
        </button>
        <button id="close-list" class="icon-button" @click="$emit('close')">
          <i class="fa fa-times text-surface-500 hover:text-danger-500 transition-colors duration-200" aria-hidden="true"></i>
        </button>
      </div>
    </div>

    <div class="p-5 space-y-4">
      <div class="relative group">
        <input
          type="text"
          id="search-station"
          placeholder="搜索充电站名称或地址..."
          class="input-premium pl-12 pr-4 py-3.5"
          v-model="searchQuery"
        />
        <i class="fa fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-surface-400 group-focus-within:text-primary-500 transition-colors duration-300" aria-hidden="true"></i>
      </div>

      <div class="flex flex-wrap gap-2.5">
        <button
          v-for="(filter, key) in filterButtons"
          :key="key"
          :class="[
            'group relative overflow-hidden px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 active:scale-95',
            filters[key]
              ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-glow-primary hover:shadow-lg'
              : 'glass-card text-surface-600 dark:text-surface-300 hover:border-primary-300'
          ]"
          @click="stationsStore.toggleFilter(key)">
          <span class="relative z-10 flex items-center space-x-1.5">
            <i :class="filter.icon" aria-hidden="true"></i>
            <span>{{ filter.label }}</span>
          </span>
          <div v-if="filters[key]" class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        </button>
      </div>

      <div id="stations-container" class="space-y-3.5">
        <div v-if="displayedStations.length === 0" class="text-center py-16 animate-in">
          <div class="w-20 h-20 mx-auto mb-5 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
            <i class="fa fa-search text-surface-300 dark:text-surface-600 text-3xl" aria-hidden="true"></i>
          </div>
          <h3 class="text-base font-bold text-surface-800 dark:text-surface-200 mb-2">没有找到匹配的充电站</h3>
          <p class="text-sm text-surface-500 dark:text-surface-400 mb-5">尝试调整筛选条件或搜索关键词</p>
          <button id="reset-filters"
                  class="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold text-sm hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-all duration-200 active:scale-95"
                  @click="resetFilters">
            <i class="fa fa-refresh" aria-hidden="true"></i>
            <span>重置筛选条件</span>
          </button>
        </div>

        <div
          v-for="(station, index) in displayedStations"
          :key="station.stationId"
          class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-5 cursor-pointer group hover:shadow-soft-lg hover:-translate-y-0.5 transition-all duration-300 animate-in"
          :style="{ animationDelay: `${Math.min(index, 10) * 80}ms` }"
          @click="selectStation(station)">
          <div class="flex justify-between items-start mb-3">
            <div class="flex-1 min-w-0 pr-3">
              <h3 class="font-bold text-surface-900 dark:text-surface-100 text-base mb-1 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">{{ station.stationName }}</h3>
              <p class="text-xs text-surface-500 dark:text-surface-400 truncate flex items-center">
                <i class="fa fa-map-marker mr-1.5 text-surface-400 flex-shrink-0" aria-hidden="true"></i>
                <span class="truncate">{{ station.address }}</span>
              </p>
            </div>
            <div class="flex flex-col items-end space-y-1.5 flex-shrink-0">
              <span v-if="station.reservationAvailable && station.openStatus === 1 && (station.quickAvailableNum > 0 || station.slowAvailableNum > 0)" class="status-badge-warning text-[10px]">可预约</span>
              <span class="status-badge text-[11px]" :class="getStationStatusClass(station)">{{ getStationStatusText(station) }}</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2.5 mb-3">
            <div class="flex items-center space-x-2 p-2.5 rounded-xl bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-100 dark:border-secondary-900/30">
              <div class="w-7 h-7 rounded-lg bg-secondary-100 dark:bg-secondary-900/40 flex items-center justify-center flex-shrink-0">
                <i class="fa fa-bolt text-secondary-500 text-xs" aria-hidden="true"></i>
              </div>
              <div class="min-w-0">
                <p class="text-[9px] font-medium text-surface-500 uppercase tracking-wide">快充</p>
                <p class="text-xs font-bold text-secondary-600">{{ station.quickAvailableNum }}/{{ station.quickChargeNum }}</p>
              </div>
            </div>

            <div class="flex items-center space-x-2 p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-900/30">
              <div class="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                <i class="fa fa-plug text-primary-500 text-xs" aria-hidden="true"></i>
              </div>
              <div class="min-w-0">
                <p class="text-[9px] font-medium text-surface-500 uppercase tracking-wide">慢充</p>
                <p class="text-xs font-bold text-primary-600">{{ station.slowAvailableNum }}/{{ station.slowChargeNum }}</p>
              </div>
            </div>

            <div class="flex items-center space-x-2 p-2.5 rounded-xl bg-warning-50 dark:bg-warning-900/20 border border-warning-100 dark:border-warning-900/30">
              <div class="w-7 h-7 rounded-lg bg-warning-100 dark:bg-warning-900/40 flex items-center justify-center flex-shrink-0">
                <i class="fa fa-rmb text-warning-500 text-xs" aria-hidden="true"></i>
              </div>
              <div class="min-w-0">
                <p class="text-[9px] font-medium text-surface-500 uppercase tracking-wide">电价</p>
                <p class="text-xs font-bold text-warning-600">¥{{ station.currentPrice.toFixed(2) }}</p>
              </div>
            </div>
          </div>

          <div class="flex justify-between items-center pt-3 border-t border-surface-100 dark:border-surface-700/50">
            <div class="flex items-center space-x-1.5">
              <div class="rating-stars flex">
                <span v-for="i in 5" :key="i" class="star text-xs" :class="i <= Math.round(station.stationGradeScore) ? 'active' : ''">
                  <i class="fa fa-star" aria-hidden="true"></i>
                </span>
              </div>
              <span class="text-xs font-bold text-warning-600 ml-1">{{ station.stationGradeScore }}</span>
            </div>
            <div class="flex items-center text-primary-600 dark:text-primary-400 font-bold text-sm group-hover:translate-x-1 transition-transform duration-200">
              <i class="fa fa-location-arrow mr-1.5 text-xs" aria-hidden="true"></i>
              {{ (station.distance / 1000).toFixed(1) }} km
              <i class="fa fa-chevron-right ml-1.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200" aria-hidden="true"></i>
            </div>
          </div>
        </div>

        <div v-if="hasMore" class="text-center py-4">
          <button
            class="px-6 py-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold text-sm hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all duration-200 active:scale-95"
            @click="loadMore">
            <i class="fa fa-angle-down mr-1.5" aria-hidden="true"></i>
            加载更多 (还有 {{ remainingCount }} 个)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStationsStore } from '../../store/modules/stations';

const emit = defineEmits(['close', 'show-filter']);

const stationsStore = useStationsStore();
const searchQuery = computed({
  get: () => stationsStore.searchQuery,
  set: (val) => stationsStore.setSearchQuery(val)
});
const filters = computed(() => stationsStore.filters);
const activeFilterCount = computed(() => stationsStore.activeFilterCount);
const viewportStationCount = computed(() => stationsStore.viewportStationCount);

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

const selectStation = (station) => {
  stationsStore.setCurrentStation(station);
  emit('close');
};

const getStationStatusClass = (station) => {
  if (station.openStatus === 0) {
    return 'bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400'
  }
  if (station.quickAvailableNum > 0 || station.slowAvailableNum > 0) {
    return 'status-badge-success';
  }
  return 'status-badge-danger';
};

const getStationStatusText = (station) => {
  if (station.openStatus === 0) {
    return '维护中'
  }
  if (station.quickAvailableNum > 0 || station.slowAvailableNum > 0) {
    return '有可用';
  }
  return '已满';
};
</script>
