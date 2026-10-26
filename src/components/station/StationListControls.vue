<template>
  <StationSearch :input-id="isCompact ? '' : 'search-station'" />
  <div class="grid grid-cols-2 gap-2 min-[380px]:grid-cols-4" role="group" aria-label="快捷筛选">
    <button
      v-for="(filter, key) in filterButtons"
      :key="key"
      class="filter-chip"
      :class="filters[key] ? 'filter-chip-active' : 'filter-chip-idle'"
      :aria-pressed="filters[key]"
      @click="stationsStore.toggleFilter(key)"
    >
      <i :class="filter.icon" aria-hidden="true"></i>
      <span>{{ filter.label }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStationList } from '../../composables/useStationList'
import StationSearch from './StationSearch.vue'

const props = defineProps({ density: { type: String, default: 'comfortable' } })
const isCompact = computed(() => props.density === 'compact')
const { stationsStore, filterButtons, filters } = useStationList()
</script>
