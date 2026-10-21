<template>
  <div class="animate-slide-up fixed bottom-0 left-0 right-0 z-50">
    <div class="glass-effect border-t border-surface-200/50 dark:border-surface-700/50">
      <div class="px-5 py-4">
        <div class="flex items-center justify-between">
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
            class="ml-4 flex-shrink-0 transform rounded-xl bg-gradient-to-r from-danger-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-danger-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-danger-500/30 active:translate-y-0"
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

<style scoped>
.animate-slide-up {
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
