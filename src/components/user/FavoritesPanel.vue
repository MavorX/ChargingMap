<template>
  <PanelShell title="我的收藏" @close="$emit('close')">
    <div
      class="glass-effect z-10 flex flex-shrink-0 items-center justify-between border-b border-surface-200/50 p-4 dark:border-surface-700/50"
    >
      <button class="icon-button" aria-label="返回" @click="$emit('close')">
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">我的收藏</h2>
      <div class="w-10"></div>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div
        v-if="favoriteStations.length > 0"
        class="mb-6 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 p-5 shadow-soft dark:from-surface-800 dark:to-surface-900"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-surface-500 dark:text-surface-400">收藏站点</p>
            <p class="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400">
              {{ favoriteStations.length
              }}<span class="ml-1 text-sm font-normal text-surface-500">个</span>
            </p>
          </div>
          <div
            class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 shadow-md"
          >
            <i class="fa fa-heart text-2xl text-white" aria-hidden="true"></i>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <div
          v-for="station in favoriteStations"
          :key="station.id"
          class="cursor-pointer rounded-2xl bg-gradient-to-br from-white to-surface-50 p-4 shadow-soft transition-all hover:shadow-soft-md dark:from-surface-800 dark:to-surface-900"
          @click="viewStationDetail(station.id)"
        >
          <div class="flex items-start justify-between">
            <div class="flex min-w-0 flex-1 items-start">
              <div
                class="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 shadow-md"
              >
                <i class="fa fa-heart text-sm text-white" aria-hidden="true"></i>
              </div>
              <div class="min-w-0">
                <h3 class="truncate text-sm font-bold text-surface-800 dark:text-surface-200">
                  {{ station.name }}
                </h3>
                <p class="mt-0.5 truncate text-xs text-surface-500 dark:text-surface-400">
                  {{ station.address }}
                </p>
              </div>
            </div>
            <button
              class="icon-button group flex-shrink-0 p-2"
              title="取消收藏"
              :aria-label="`取消收藏 ${station.name}`"
              @click.stop="handleRemove(station.id)"
            >
              <i
                class="fa fa-heart text-sm text-rose-400 transition-colors group-hover:text-rose-600"
                aria-hidden="true"
              ></i>
            </button>
          </div>
          <div
            class="mt-3 flex items-center space-x-4 border-t border-surface-100 pt-3 dark:border-surface-700/50"
          >
            <div class="flex items-center">
              <i class="fa fa-plug mr-1.5 text-xs text-primary-500" aria-hidden="true"></i>
              <span class="text-xs text-surface-600 dark:text-surface-300"
                >{{ station.availableConnectors }}/{{ station.totalConnectors }}可用</span
              >
            </div>
            <div class="flex items-center">
              <i class="fa fa-bolt mr-1.5 text-xs text-secondary-500" aria-hidden="true"></i>
              <span class="text-xs text-surface-600 dark:text-surface-300"
                >{{ station.power }}kW</span
              >
            </div>
            <div class="flex items-center">
              <i class="fa fa-location-arrow mr-1.5 text-xs text-accent-500" aria-hidden="true"></i>
              <span class="text-xs text-surface-600 dark:text-surface-300">{{
                station.distance == null ? '—' : station.distance + 'km'
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="favoriteStations.length === 0" class="animate-in py-16 text-center">
        <div
          class="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800"
        >
          <i
            class="fa fa-heart text-3xl text-surface-300 dark:text-surface-600"
            aria-hidden="true"
          ></i>
        </div>
        <p class="mb-2 font-bold text-surface-800 dark:text-surface-200">暂无收藏站点</p>
        <p class="text-sm text-surface-500 dark:text-surface-400">在站点详情页点击收藏即可添加</p>
      </div>
    </div>

    <Transition name="fade">
      <div
        v-if="showRemoveConfirm"
        class="fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm"
        @click.self="showRemoveConfirm = false"
      >
        <div
          class="w-full max-w-sm animate-scale-in rounded-2xl bg-white p-6 shadow-2xl dark:bg-surface-800"
        >
          <div class="mb-5 text-center">
            <div
              class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/30"
            >
              <i class="fa fa-heart-broken text-xl text-rose-500" aria-hidden="true"></i>
            </div>
            <h3 class="text-lg font-bold text-surface-900 dark:text-surface-100">取消收藏</h3>
            <p class="mt-2 text-sm text-surface-500 dark:text-surface-400">
              确定要取消收藏这个站点吗？
            </p>
          </div>
          <div class="flex space-x-3">
            <button
              class="flex-1 rounded-xl border-2 border-surface-200 py-3 font-bold text-surface-600 transition-all duration-200 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
              @click="showRemoveConfirm = false"
            >
              再想想
            </button>
            <button
              class="flex-1 rounded-xl bg-rose-500 py-3 font-bold text-white transition-colors duration-200 hover:bg-rose-600 active:scale-95"
              @click="confirmRemove"
            >
              取消收藏
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </PanelShell>
</template>

<script setup>
import PanelShell from '../common/PanelShell.vue'
import { ref, computed, inject } from 'vue'
import { useStationsStore } from '../../store/modules/stations'

const emit = defineEmits(['close', 'view-station'])

const stationsStore = useStationsStore()
const showToast = inject('showToast')

const favoriteStations = computed(() => stationsStore.favoriteStationsList)
const showRemoveConfirm = ref(false)
const removingStationId = ref(null)

const viewStationDetail = (stationId) => {
  const station = stationsStore.stations.find((s) => s.stationId === stationId)
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
