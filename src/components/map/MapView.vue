<template>
  <div class="relative h-full w-full">
    <div
      v-if="stationsStore.error"
      class="absolute left-1/2 top-24 z-20 w-[min(92%,28rem)] -translate-x-1/2"
      role="alert"
    >
      <div
        class="glass-card flex items-center gap-3 border border-danger-200 p-3 shadow-soft-lg dark:border-danger-800/60"
      >
        <i class="fa fa-exclamation-circle text-lg text-danger-500" aria-hidden="true"></i>
        <p class="flex-1 text-sm font-medium text-surface-800 dark:text-surface-100">
          {{ stationsStore.error }}
        </p>
        <button
          class="rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="stationsStore.isLoading"
          @click="loadStations"
        >
          重试
        </button>
      </div>
    </div>
    <div id="map-container" class="relative isolate h-full w-full"></div>
    <div
      v-if="isMapLoading"
      class="absolute inset-0 z-10 flex items-center justify-center"
      role="status"
      aria-label="正在加载地图"
    >
      <span
        class="glass-card flex items-center gap-3 px-5 py-3 text-sm text-surface-600 dark:text-surface-300"
        ><i class="fa fa-circle-o-notch fa-spin text-primary-500" aria-hidden="true"></i
        >正在加载地图…</span
      >
    </div>
    <div
      v-if="mapError"
      class="absolute inset-0 z-10 flex items-center justify-center bg-surface-100/80 p-6 backdrop-blur-sm dark:bg-surface-900/80"
      role="alert"
      data-testid="map-fallback"
    >
      <div class="glass-card w-[min(92%,24rem)] min-w-0 p-6 text-center">
        <div
          class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/30"
        >
          <i class="fa fa-map-marked-alt text-2xl text-primary-500" aria-hidden="true"></i>
        </div>
        <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">地图加载失败</h2>
        <p class="mt-2 break-words text-sm leading-relaxed text-surface-500 dark:text-surface-400">
          {{ mapError }}
        </p>
        <button
          class="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isMapLoading"
          @click="retryMap"
        >
          <i
            :class="isMapLoading ? 'fa fa-spinner fa-spin' : 'fa fa-rotate-right'"
            aria-hidden="true"
          ></i>
          {{ isMapLoading ? '正在重新加载…' : '重新加载' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, watch, inject, ref } from 'vue'
import { useStationsStore } from '../../store/modules/stations'
import { useUserStore } from '../../store/modules/user'
import mapManager from '../../services/mapService'
import { amapLoader } from '../../services/amapLoader'

const stationsStore = useStationsStore()
const userStore = useUserStore()
const showToast = inject('showToast')

const mapError = ref(null)
const isMapLoading = ref(false)

let map = null
let isUnmounted = false

const initMap = async () => {
  isMapLoading.value = true
  mapError.value = null

  try {
    await amapLoader.load()
    if (isUnmounted) return

    map = new AMap.Map('map-container', {
      zoom: 13,
      resizeEnable: true,
      viewMode: '3D',
      mapStyle: userStore.isDarkMode ? 'amap://styles/dark' : 'amap://styles/whitesmoke',
      center: [117.283042, 31.86119]
    })

    mapManager.setMap(map)
    map.on('click', () => {
      mapManager.closeInfoWindow()
      window.dispatchEvent(new CustomEvent('mapClickClose'))
    })

    map.on('moveend', onMapViewportChange)
    map.on('zoomend', onMapViewportChange)

    onMapViewportChange()
    doInitialGeolocation()
  } catch (err) {
    console.error('[MapView] Map init error:', err)
    if (map) {
      map.destroy()
      map = null
    }
    mapError.value = err?.message || '地图初始化失败，请稍后重试'
  } finally {
    isMapLoading.value = false
  }
}

const retryMap = () => {
  if (isMapLoading.value) return
  amapLoader.reset()
  initMap()
}

// One 150ms debounce drives the whole viewport pipeline (bounds + markers).
// `pendingBounds` marks that the viewport actually moved, so filter/search
// refreshes reuse the same timer without rewriting identical bounds.
let viewportTimer = null
let pendingBounds = false

const flushViewportUpdate = () => {
  viewportTimer = null
  if (!map) return

  if (pendingBounds) {
    pendingBounds = false
    const bounds = map.getBounds()
    if (!bounds) return

    const ne = bounds.getNorthEast()
    const sw = bounds.getSouthWest()

    stationsStore.setViewportBounds({
      north: ne.lat,
      south: sw.lat,
      east: ne.lng,
      west: sw.lng
    })
  }

  mapManager.updateMarkers(stationsStore.viewportStations)
}

const debouncedUpdateMarkers = () => {
  if (viewportTimer) clearTimeout(viewportTimer)
  viewportTimer = setTimeout(flushViewportUpdate, 150)
}

const onMapViewportChange = () => {
  if (!map) return
  pendingBounds = true
  debouncedUpdateMarkers()
}

const doInitialGeolocation = () => {
  mapManager
    .locateUser()
    .then((loc) => {
      stationsStore.userLocation = loc
      stationsStore.recalculateDistances()
    })
    .catch(() => {
      if (map) map.setCenter([117.283042, 31.86119])
    })
}

const loadStations = async () => {
  try {
    await stationsStore.loadStations()
    // The store records the failure in `error` (shown as the retry banner);
    // do not treat an empty/failed result as a successful refresh.
    if (stationsStore.error) return
    mapManager.setStations(stationsStore.stations)
    onMapViewportChange()
  } catch (err) {
    console.error('[MapView] Load stations error:', err)
    showToast('加载站点数据失败', 'error')
  }
}

watch(
  () => stationsStore.stations,
  (stations) => {
    mapManager.setStations(stations)
    debouncedUpdateMarkers()
  }
)

watch(
  // Shallow signature: stringify compares filter values without a deep watcher
  // traversing the whole object graph on every reactive tick.
  () => JSON.stringify(stationsStore.filters),
  () => {
    debouncedUpdateMarkers()
  }
)

watch(
  () => stationsStore.searchQuery,
  () => {
    debouncedUpdateMarkers()
  }
)

watch(
  () => userStore.isDarkMode,
  (isDark) => {
    if (map) {
      map.setMapStyle(isDark ? 'amap://styles/dark' : 'amap://styles/whitesmoke')
    }
  }
)

onMounted(() => {
  initMap()
  loadStations()
})

onUnmounted(() => {
  isUnmounted = true
  if (viewportTimer) clearTimeout(viewportTimer)
  mapManager.destroy()
  if (map) {
    map.destroy()
  }
})
</script>
