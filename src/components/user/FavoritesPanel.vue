<template>
  <div class="panel-overlay">
    <div class="panel-backdrop" @click="$emit('close')"></div>
    <div class="panel-content">
    <div class="glass-effect border-b border-surface-200/50 dark:border-surface-700/50 p-4 flex justify-between items-center flex-shrink-0 z-10">
      <button class="icon-button" @click="$emit('close')">
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">我的收藏</h2>
      <div class="w-10"></div>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div v-if="favoriteStations.length > 0" class="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-5 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-surface-500 dark:text-surface-400">收藏站点</p>
            <p class="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{{ favoriteStations.length }}<span class="text-sm font-normal text-surface-500 ml-1">个</span></p>
          </div>
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-md">
            <i class="fa fa-heart text-white text-2xl" aria-hidden="true"></i>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <div v-for="station in favoriteStations" :key="station.id"
          class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-4 transition-all hover:shadow-soft-md cursor-pointer"
          @click="viewStationDetail(station.id)">
          <div class="flex items-start justify-between">
            <div class="flex items-start flex-1 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center mr-3 shadow-md flex-shrink-0">
                <i class="fa fa-heart text-white text-sm" aria-hidden="true"></i>
              </div>
              <div class="min-w-0">
                <h3 class="font-bold text-sm text-surface-800 dark:text-surface-200 truncate">{{ station.name }}</h3>
                <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5 truncate">{{ station.address }}</p>
              </div>
            </div>
            <button class="icon-button p-2 group flex-shrink-0" @click.stop="handleRemove(station.id)" title="取消收藏">
              <i class="fa fa-heart text-rose-400 group-hover:text-rose-600 transition-colors text-sm" aria-hidden="true"></i>
            </button>
          </div>
          <div class="flex items-center mt-3 pt-3 border-t border-surface-100 dark:border-surface-700/50 space-x-4">
            <div class="flex items-center">
              <i class="fa fa-plug text-primary-500 text-xs mr-1.5" aria-hidden="true"></i>
              <span class="text-xs text-surface-600 dark:text-surface-300">{{ station.availableConnectors }}/{{ station.totalConnectors }}可用</span>
            </div>
            <div class="flex items-center">
              <i class="fa fa-bolt text-secondary-500 text-xs mr-1.5" aria-hidden="true"></i>
              <span class="text-xs text-surface-600 dark:text-surface-300">{{ station.power }}kW</span>
            </div>
            <div class="flex items-center">
              <i class="fa fa-location-arrow text-accent-500 text-xs mr-1.5" aria-hidden="true"></i>
              <span class="text-xs text-surface-600 dark:text-surface-300">{{ station.distance }}km</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="favoriteStations.length === 0" class="text-center py-16 animate-in">
        <div class="w-20 h-20 mx-auto mb-5 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
          <i class="fa fa-heart text-surface-300 dark:text-surface-600 text-3xl" aria-hidden="true"></i>
        </div>
        <p class="font-bold text-surface-800 dark:text-surface-200 mb-2">暂无收藏站点</p>
        <p class="text-sm text-surface-500 dark:text-surface-400">在站点详情页点击收藏即可添加</p>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="showRemoveConfirm" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-6" @click.self="showRemoveConfirm = false">
        <div class="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
          <div class="text-center mb-5">
            <div class="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-3">
              <i class="fa fa-heart-broken text-rose-500 text-xl" aria-hidden="true"></i>
            </div>
            <h3 class="font-bold text-lg text-surface-900 dark:text-surface-100">取消收藏</h3>
            <p class="text-sm text-surface-500 dark:text-surface-400 mt-2">确定要取消收藏这个站点吗？</p>
          </div>
          <div class="flex space-x-3">
            <button class="flex-1 py-3 rounded-xl font-bold border-2 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-all duration-200" @click="showRemoveConfirm = false">
              再想想            </button>
            <button class="flex-1 py-3 rounded-xl font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors duration-200 active:scale-95" @click="confirmRemove">
              取消收藏
            </button>
          </div>
        </div>
      </div>
    </Transition>
      </div>
</div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useStationsStore } from '../../store/modules/stations'

const emit = defineEmits(['close', 'view-station'])

const stationsStore = useStationsStore()
const showToast = inject('showToast')

const favoriteStations = computed(() => stationsStore.favoriteStationsList)
const showRemoveConfirm = ref(false)
const removingStationId = ref(null)

const viewStationDetail = (stationId) => {
  const station = stationsStore.stations.find(s => s.stationId === stationId)
  if (station) {
    stationsStore.setCurrentStation(station)
    emit('close')
  }
}

const handleRemove = (stationId) => {
  removingStationId.value = stationId
  showRemoveConfirm.value = true
}

const confirmRemove = () => {
  if (removingStationId.value) {
    stationsStore.toggleFavorite(removingStationId.value)
    showToast('已取消收藏', 'success')
  }
  showRemoveConfirm.value = false
  removingStationId.value = null
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
