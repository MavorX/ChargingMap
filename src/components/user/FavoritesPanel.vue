<template>
  <AccountPanel
    title="我的收藏"
    :subtitle="`${favorites.length} 个常用站点`"
    @close="emit('close')"
  >
    <div v-for="station in favorites" :key="station.id" class="account-group">
      <div class="flex items-stretch">
        <button class="account-row min-w-0 flex-1" @click="viewStation(station.id)">
          <span class="account-icon"><i class="fa fa-map-marker" aria-hidden="true"></i></span
          ><span class="min-w-0 flex-1"
            ><strong class="block break-words text-sm">{{ station.name }}</strong
            ><span class="account-caption mt-1 block">{{ station.address }}</span></span
          ><i class="fa fa-angle-right shrink-0 text-surface-400" aria-hidden="true"></i></button
        ><button
          class="icon-button my-3 mr-2 shrink-0 self-start text-danger-500"
          :aria-label="`取消收藏 ${station.name}`"
          @click="requestRemove(station.id)"
        >
          <i class="fa fa-heart" aria-hidden="true"></i>
        </button>
      </div>
      <div
        class="flex flex-wrap gap-x-4 gap-y-2 px-4 py-3 text-xs text-surface-500 dark:text-surface-400"
      >
        <span>{{ station.availableConnectors }}/{{ station.totalConnectors }} 空闲</span
        ><span>{{ station.power ? `${station.power} kW` : '功率未提供' }}</span
        ><span>{{ station.distance == null ? '待定位' : `${station.distance} km` }}</span>
      </div>
    </div>
    <div v-if="!favorites.length" class="account-empty">
      <span class="account-icon"><i class="fa fa-heart-o" aria-hidden="true"></i></span>
      <h3 class="text-sm font-semibold">暂无收藏站点</h3>
      <p class="account-caption">在站点详情中点击收藏，下次可从这里快速打开。</p>
      <button class="action-secondary" @click="emit('explore')">去找充电站</button>
    </div>
    <template #dialogs
      ><DialogModal
        v-if="removingStation"
        title="取消收藏"
        role="alertdialog"
        @close="removingId = null"
        ><p class="mb-5 text-sm leading-7">
          确定取消收藏「{{ removingStation.name }}」？以后仍可从地图重新收藏。
        </p>
        <div class="flex gap-3">
          <button class="action-secondary flex-1" @click="removingId = null">再想想</button
          ><button
            class="action-primary flex-1 bg-danger-600 hover:bg-danger-700"
            @click="confirmRemove"
          >
            取消收藏
          </button>
        </div></DialogModal
      ></template
    >
  </AccountPanel>
</template>
<script setup>
import { computed, inject, ref } from 'vue'
import AccountPanel from './AccountPanel.vue'
import DialogModal from '../common/DialogModal.vue'
import { useStationsStore } from '../../store/modules/stations'
const emit = defineEmits(['close', 'view-station', 'explore'])
const stations = useStationsStore(),
  toast = inject('showToast'),
  removingId = ref(null)
const favorites = computed(() => stations.favoriteStationsList)
const removingStation = computed(() =>
  favorites.value.find((station) => station.id === removingId.value)
)
const viewStation = (id) => {
  const station = stations.stations.find((item) => item.stationId === id)
  if (station) emit('view-station', station)
  else toast('站点暂不可用，请刷新列表后重试', 'info')
}
const requestRemove = (id) => {
  removingId.value = id
}
const confirmRemove = () => {
  const station = stations.stations.find((item) => item.stationId === removingId.value)
  if (station?.isFavorite) {
    stations.toggleFavorite(station.stationId)
    toast('已取消收藏', 'success')
  }
  removingId.value = null
}
</script>
