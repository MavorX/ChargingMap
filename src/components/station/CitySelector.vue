<template>
  <div class="flex min-w-0 items-center gap-1.5 rounded-xl p-2" role="group" aria-label="演示城市">
    <button
      v-for="city in CITIES"
      :key="city.id"
      class="min-h-10 rounded-lg px-3 text-xs font-semibold transition-colors"
      :class="
        stations.activeCityId === city.id
          ? 'bg-primary-600 text-white'
          : 'text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800'
      "
      :aria-label="`浏览${city.shortName}模拟站点`"
      :aria-pressed="stations.activeCityId === city.id"
      @click="stations.browseCity(city.id)"
    >
      {{ city.shortName }}
    </button>
    <span class="text-[10px] text-surface-500 dark:text-surface-400">模拟站点</span>
    <button
      class="ml-auto flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-surface-800"
      :aria-label="`返回${stations.activeCity.shortName}演示视野`"
      @click="stations.browseCity(stations.activeCityId)"
    >
      <i class="fa fa-crosshairs" aria-hidden="true"></i>回到{{ stations.activeCity.shortName }}
    </button>
  </div>
</template>

<script setup>
import { CITIES } from '../../constants/cities'
import { useStationsStore } from '../../store/modules/stations'
const stations = useStationsStore()
</script>
