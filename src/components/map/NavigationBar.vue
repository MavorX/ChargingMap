<template>
  <div class="absolute bottom-0 left-0 right-0 z-fab" role="region" :aria-label="t('导航路线概览')">
    <div class="glass-effect border-t border-surface-200/50 dark:border-surface-700/50">
      <div class="px-5 py-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))]">
        <div
          class="flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between"
        >
          <div class="flex min-w-0 items-center gap-3 min-[480px]:flex-1">
            <div
              class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 shadow-lg shadow-primary-500/25"
            >
              <i class="fa fa-location-arrow text-lg text-white" aria-hidden="true"></i>
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-bold text-surface-900 dark:text-surface-100">
                {{ stationName(routeInfo?.station?.stationName) || t('导航中') }}
              </p>
              <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span
                  class="flex items-center whitespace-nowrap text-xs font-semibold text-primary-600 dark:text-primary-400"
                >
                  <i class="fa fa-road mr-1" aria-hidden="true"></i>
                  {{ routeInfo?.distance || '0' }} {{ t('公里') }}
                </span>
                <span
                  class="flex items-center whitespace-nowrap text-xs font-semibold text-secondary-600 dark:text-secondary-400"
                >
                  <i class="fa fa-clock-o mr-1" aria-hidden="true"></i>
                  {{ durationText }}
                </span>
              </div>
              <p
                v-if="routeInfo?.origin?.quality === 'approximate'"
                class="mt-1 text-xs text-warning-700 dark:text-warning-400"
              >
                {{ t('起点为估算位置') }} · {{ locationAccuracyText(routeInfo.origin) }}
              </p>
            </div>
          </div>
          <button
            class="w-full shrink-0 rounded-xl border border-danger-200 bg-danger-50 px-4 py-2.5 text-sm font-semibold text-danger-700 transition-colors hover:bg-danger-100 dark:border-danger-800 dark:bg-danger-900/30 dark:text-danger-300 min-[480px]:w-auto"
            @click="$emit('cancel')"
          >
            <i class="fa fa-times mr-1.5" aria-hidden="true"></i>
            {{ t('取消导航') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { t } from '../../i18n'
import { stationName } from '../../i18n/data'
import { useStationsStore } from '../../store/modules/stations'
import { formatDuration } from '../../utils/format'
import { locationAccuracyText } from '../../utils/location'

defineEmits(['cancel'])

const stationsStore = useStationsStore()
const routeInfo = computed(() => stationsStore.routeInfo)

const durationText = computed(() => {
  const duration = routeInfo.value?.duration
  return formatDuration((duration || 0) * 60, 'hm')
})
</script>
