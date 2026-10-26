<template>
  <div class="absolute bottom-0 left-0 right-0 z-fab">
    <div class="glass-effect border-t border-surface-200/50 dark:border-surface-700/50">
      <div class="px-5 py-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))]">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex min-w-0 flex-1 items-center space-x-4">
            <div
              class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 shadow-lg shadow-primary-500/25"
            >
              <i class="fa fa-location-arrow text-lg text-white" aria-hidden="true"></i>
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-bold text-surface-900 dark:text-surface-100">
                {{ routeInfo?.station?.stationName || '导航中' }}
              </p>
              <div class="mt-1 flex items-center space-x-3">
                <span
                  class="flex items-center text-xs font-semibold text-primary-600 dark:text-primary-400"
                >
                  <i class="fa fa-road mr-1" aria-hidden="true"></i>
                  {{ routeInfo?.distance || '0' }}公里
                </span>
                <span
                  class="flex items-center text-xs font-semibold text-secondary-600 dark:text-secondary-400"
                >
                  <i class="fa fa-clock-o mr-1" aria-hidden="true"></i>
                  {{ durationText }}
                </span>
              </div>
            </div>
          </div>
          <button
            class="shrink-0 rounded-xl border border-danger-200 bg-danger-50 px-4 py-2.5 text-sm font-semibold text-danger-700 transition-colors hover:bg-danger-100 dark:border-danger-800 dark:bg-danger-900/30 dark:text-danger-300"
            @click="$emit('cancel')"
          >
            <i class="fa fa-times mr-1.5" aria-hidden="true"></i>
            取消导航
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStationsStore } from '../../store/modules/stations'
import { formatDuration } from '../../utils/format'

defineEmits(['cancel'])

const stationsStore = useStationsStore()
const routeInfo = computed(() => stationsStore.routeInfo)

const durationText = computed(() => {
  const duration = routeInfo.value?.duration
  return formatDuration((duration || 0) * 60, 'hm')
})
</script>
