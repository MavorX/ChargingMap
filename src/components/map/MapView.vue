<template>
  <div class="h-full w-full relative">
    <div id="map-container" class="h-full w-full"></div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, watch, inject } from 'vue';
import { useStationsStore } from '../../store/modules/stations';
import { useUserStore } from '../../store/modules/user';
import mapManager from '../../services/mapService';

const stationsStore = useStationsStore();
const userStore = useUserStore();
const showToast = inject('showToast');
const setLoading = inject('setLoading');

let map = null;

const initMap = () => {
  try {
    if (typeof AMap === 'undefined') {
      showToast('地图SDK加载失败', 'error');
      return;
    }

    map = new AMap.Map('map-container', {
      zoom: 13,
      resizeEnable: true,
      viewMode: '3D',
      mapStyle: userStore.isDarkMode ? 'amap://styles/dark' : 'amap://styles/whitesmoke',
      center: [117.283042, 31.86119]
    });

    mapManager.setMap(map);
    map.on('click', () => {
      mapManager.closeInfoWindow();
      window.dispatchEvent(new CustomEvent('mapClickClose'));
    });

    map.on('moveend', onMapViewportChange);
    map.on('zoomend', onMapViewportChange);

    doInitialGeolocation();
  } catch (err) {
    console.error('[MapView] Map init error:', err);
    setLoading(false);
  }
};

const onMapViewportChange = () => {
  if (!map) return;
  const bounds = map.getBounds();
  if (!bounds) return;

  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();

  stationsStore.setViewportBounds({
    north: ne.lat,
    south: sw.lat,
    east: ne.lng,
    west: sw.lng
  });

  debouncedUpdateMarkers();
};

const doInitialGeolocation = () => {
  setLoading(true);
  mapManager.locateUser().then((loc) => {
    stationsStore.userLocation = loc;
    stationsStore.recalculateDistances();
  }).catch(() => {
    map.setCenter([117.283042, 31.86119]);
  }).finally(() => {
    setLoading(false);
  });
};

let updateTimer = null;
const debouncedUpdateMarkers = () => {
  if (updateTimer) clearTimeout(updateTimer);
  updateTimer = setTimeout(() => {
    const viewportStations = stationsStore.viewportStations;
    mapManager.updateMarkers(viewportStations);
  }, 150);
};

const loadStations = async () => {
  setLoading(true);
  try {
    await stationsStore.loadStations();
    mapManager.setStations(stationsStore.stations);
    onMapViewportChange();
  } catch (err) {
    console.error('[MapView] Load stations error:', err);
    showToast('加载站点数据失败', 'error');
  } finally {
    setLoading(false);
  }
};

watch(() => stationsStore.filters, () => {
  debouncedUpdateMarkers();
}, { deep: true });

watch(() => userStore.isDarkMode, (isDark) => {
  if (map) {
    map.setMapStyle(isDark ? 'amap://styles/dark' : 'amap://styles/whitesmoke');
  }
});

const handleStationClick = (event) => {
  const station = event.detail;
  stationsStore.setCurrentStation(station);
};

onMounted(() => {
  initMap();
  loadStations();
  window.addEventListener('stationClick', handleStationClick);
});

onUnmounted(() => {
  window.removeEventListener('stationClick', handleStationClick);
  if (updateTimer) clearTimeout(updateTimer);
  mapManager.destroy();
  if (map) {
    map.destroy();
  }
});
</script>
