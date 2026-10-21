import { computed } from 'vue'
import { useStationsStore } from '../store/modules/stations'

/**
 * Toggle chips shared by the mobile sheet and the desktop sidebar.
 * Single source of truth: the two list shells only differ in chrome.
 */
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

/**
 * Shared state + pagination math for the station list shells.
 *
 * Keeps every list surface reading the same store getters so search, filters
 * and the "加载更多 (还有 N 个)" counter can never drift apart.
 */
export function useStationList() {
  const stationsStore = useStationsStore()

  const searchQuery = computed({
    get: () => stationsStore.searchQuery,
    set: (value) => stationsStore.setSearchQuery(value)
  })

  const filters = computed(() => stationsStore.filters)
  const activeFilterCount = computed(() => stationsStore.activeFilterCount)
  const displayedStations = computed(() => stationsStore.pagedStations)
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

  return {
    stationsStore,
    filterButtons,
    searchQuery,
    filters,
    activeFilterCount,
    displayedStations,
    hasMore,
    remainingCount,
    loadMore,
    resetFilters
  }
}
