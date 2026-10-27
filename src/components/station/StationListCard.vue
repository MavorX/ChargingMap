<template>
  <div
    class="station-card group cursor-pointer rounded-2xl border border-surface-200 bg-white transition-colors duration-200 hover:border-primary-300 hover:bg-primary-50/30 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-primary-600 dark:hover:bg-surface-800"
    :class="compact ? 'p-4' : 'p-5'"
    role="button"
    tabindex="0"
    @click="emit('select', station)"
    @keydown.enter.self.prevent="emit('select', station)"
    @keydown.space.self.prevent="emit('select', station)"
  >
    <div class="mb-3 flex items-center justify-between gap-2">
      <span
        class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium"
        :class="status.tone"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-current"></span>{{ t(status.text) }}
      </span>
      <span class="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
        <i class="fa fa-location-arrow text-[10px]" aria-hidden="true"></i
        >{{ Number.isFinite(station.distance) ? formatDistance(station.distance) : t('待定位') }}
      </span>
    </div>

    <h3
      class="mb-1 line-clamp-2 text-[15px] font-bold leading-relaxed text-surface-900 group-hover:text-primary-600 dark:text-surface-100 dark:group-hover:text-primary-400"
    >
      {{ stationName(station.stationName) }}
    </h3>
    <p
      class="truncate text-xs leading-5 text-surface-500 dark:text-surface-400"
      :title="stationAddress(station.address)"
    >
      {{ stationAddress(station.address) }}
    </p>

    <div class="my-4 flex items-end justify-between gap-2">
      <div class="flex items-baseline gap-1 text-primary-600 dark:text-primary-400">
        <span class="sr-only">{{ t('当前电价') }}</span>
        <span class="text-2xl font-bold tabular-nums leading-none tracking-tight">{{
          formatPrice(station.currentPrice)
        }}</span>
        <span class="text-xs text-surface-500 dark:text-surface-400">{{ t('/度') }}</span>
      </div>
      <span class="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
        <i class="fa fa-star text-warning-500" aria-hidden="true"></i>
        <span class="font-semibold text-surface-700 dark:text-surface-200">{{
          station.stationGradeScore
        }}</span
        >{{ t('评分') }}
      </span>
    </div>

    <div
      class="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-surface-100 pt-3 text-xs dark:border-surface-800"
    >
      <span
        class="flex items-center gap-1.5 text-surface-500 dark:text-surface-400"
        :aria-label="
          t('快充空闲 {available} 个，共 {total} 个', {
            available: station.quickAvailableNum,
            total: station.quickChargeNum
          })
        "
      >
        <i class="fa fa-bolt text-secondary-600 dark:text-secondary-400" aria-hidden="true"></i
        >{{ t('快充') }}
        <span class="font-semibold tabular-nums text-surface-800 dark:text-surface-100"
          >{{ station.quickAvailableNum }}/{{ station.quickChargeNum }}</span
        >
      </span>
      <span
        class="flex items-center gap-1.5 text-surface-500 dark:text-surface-400"
        :aria-label="
          t('慢充空闲 {available} 个，共 {total} 个', {
            available: station.slowAvailableNum,
            total: station.slowChargeNum
          })
        "
      >
        <i class="fa fa-plug text-surface-400" aria-hidden="true"></i>{{ t('慢充') }}
        <span class="font-semibold tabular-nums text-surface-800 dark:text-surface-100"
          >{{ station.slowAvailableNum }}/{{ station.slowChargeNum }}</span
        >
      </span>
      <span v-if="canReserve" class="ml-auto text-primary-600 dark:text-primary-400">{{
        t('可预约')
      }}</span>
      <span v-else class="ml-auto text-surface-400"
        ><i class="fa fa-angle-right" aria-hidden="true"></i
      ></span>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { t } from '../../i18n'
import { stationName, stationAddress } from '../../i18n/data'
import { formatDistance, formatPrice } from '../../utils/format'
import { stationStatus } from '../../utils/stationStatus'

const props = defineProps({
  station: { type: Object, required: true },
  density: { type: String, default: 'comfortable' },
  index: { type: Number, default: 0 }
})
const emit = defineEmits(['select'])
const compact = computed(() => props.density === 'compact')
watch(
  () => props.density,
  (value) => {
    if (!['comfortable', 'compact'].includes(value)) {
      console.warn(`[StationListCard] 未知 density "${value}"，已回退 comfortable`)
    }
  },
  { immediate: true }
)
const status = computed(() => stationStatus(props.station))
const canReserve = computed(() => {
  const station = props.station
  return (
    station.reservationAvailable &&
    station.openStatus === 1 &&
    (station.quickAvailableNum > 0 || station.slowAvailableNum > 0)
  )
})
</script>
