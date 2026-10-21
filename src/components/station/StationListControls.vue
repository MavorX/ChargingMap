<template>
  <div class="group relative">
    <input
      :id="isCompact ? undefined : 'search-station'"
      v-model="searchQuery"
      type="text"
      placeholder="搜索充电站名称或地址..."
      aria-label="搜索充电站名称或地址"
      class="input-premium"
      :class="isCompact ? 'py-3 pl-11 pr-4 text-sm' : 'py-3.5 pl-12 pr-4'"
    />
    <i
      class="fa fa-search absolute top-1/2 -translate-y-1/2 transform text-surface-400 transition-colors duration-300 group-focus-within:text-primary-500"
      :class="isCompact ? 'left-3.5 text-sm' : 'left-4'"
      aria-hidden="true"
    ></i>
  </div>

  <div class="flex flex-wrap" :class="isCompact ? 'gap-2' : 'gap-2.5'">
    <button
      v-for="(filter, key) in filterButtons"
      :key="key"
      :class="buttonClass(filters[key])"
      @click="stationsStore.toggleFilter(key)"
    >
      <span
        class="flex items-center"
        :class="isCompact ? 'space-x-1' : 'relative z-10 space-x-1.5'"
      >
        <i :class="filter.icon" aria-hidden="true"></i>
        <span>{{ filter.label }}</span>
      </span>
      <div
        v-if="!isCompact && filters[key]"
        class="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]"
      ></div>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStationList } from '../../composables/useStationList'

const props = defineProps({
  density: {
    type: String,
    default: 'comfortable'
  }
})

const isCompact = computed(() => props.density === 'compact')

const { stationsStore, filterButtons, searchQuery, filters } = useStationList()

const buttonClass = (active) => {
  if (isCompact.value) {
    return [
      'rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 active:scale-95',
      active
        ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-glow-primary'
        : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700'
    ]
  }

  return [
    'group relative overflow-hidden rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300 active:scale-95',
    active
      ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-glow-primary hover:shadow-lg'
      : 'glass-card text-surface-600 hover:border-primary-300 dark:text-surface-300'
  ]
}
</script>
