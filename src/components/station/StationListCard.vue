<template>
  <div
    class="group cursor-pointer bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900"
    :class="cardClass"
    :style="{ animationDelay: `${Math.min(index, 10) * delayStep}ms` }"
    role="button"
    tabindex="0"
    @click="emit('select', station)"
    @keydown.enter.self.prevent="emit('select', station)"
    @keydown.space.self.prevent="emit('select', station)"
  >
    <div class="flex items-start justify-between" :class="compact ? 'mb-2' : 'mb-3'">
      <div class="min-w-0 flex-1" :class="compact ? 'pr-2' : 'pr-3'">
        <h3
          class="truncate font-bold text-surface-900 transition-colors duration-200 group-hover:text-primary-600 dark:text-surface-100 dark:group-hover:text-primary-400"
          :class="compact ? 'mb-0.5 text-sm' : 'mb-1 text-base'"
        >
          {{ station.stationName }}
        </h3>
        <p v-if="compact" class="truncate text-xs text-surface-500 dark:text-surface-400">
          <i class="fa fa-map-marker mr-1 flex-shrink-0 text-surface-400" aria-hidden="true"></i>
          {{ station.address }}
        </p>
        <p v-else class="flex items-center truncate text-xs text-surface-500 dark:text-surface-400">
          <i class="fa fa-map-marker mr-1.5 flex-shrink-0 text-surface-400" aria-hidden="true"></i>
          <span class="truncate">{{ station.address }}</span>
        </p>
      </div>
      <div
        class="flex flex-shrink-0 flex-col items-end"
        :class="compact ? 'space-y-1' : 'space-y-1.5'"
      >
        <span
          v-if="canReserve"
          class="status-badge-warning"
          :class="compact ? 'text-[9px]' : 'text-[10px]'"
          >可预约</span
        >
        <span
          class="status-badge"
          :class="[status.tone, compact ? 'text-[10px]' : 'text-[11px]']"
          >{{ status.text }}</span
        >
      </div>
    </div>

    <div class="grid grid-cols-3" :class="compact ? 'mb-2 gap-2' : 'mb-3 gap-2.5'">
      <div v-for="metric in metrics" :key="metric.key" :class="metric.tileClass">
        <div v-if="!compact" :class="metric.iconWrapClass">
          <i :class="[metric.icon, metric.iconClass]" aria-hidden="true"></i>
        </div>
        <i v-else :class="[metric.icon, metric.iconClass]" aria-hidden="true"></i>
        <div v-if="!compact" class="min-w-0">
          <p class="text-[9px] font-medium uppercase tracking-wide text-surface-500">
            {{ metric.label }}
          </p>
          <p :class="metric.valueClass">{{ metric.value }}</p>
        </div>
        <span v-else :class="metric.valueClass">{{ metric.value }}</span>
      </div>
    </div>

    <div
      class="flex items-center justify-between border-t border-surface-100 dark:border-surface-700/50"
      :class="compact ? 'pt-2' : 'pt-3'"
    >
      <div class="flex items-center" :class="compact ? 'space-x-1' : 'space-x-1.5'">
        <div class="rating-stars flex">
          <span
            v-for="i in 5"
            :key="i"
            class="star"
            :class="[
              compact ? 'text-[10px]' : 'text-xs',
              i <= Math.round(station.stationGradeScore) ? 'active' : ''
            ]"
          >
            <i class="fa fa-star" aria-hidden="true"></i>
          </span>
        </div>
        <span class="text-xs font-bold text-warning-600" :class="{ 'ml-1': !compact }">{{
          station.stationGradeScore
        }}</span>
      </div>
      <div
        class="flex items-center font-bold text-primary-600 transition-transform duration-200 group-hover:translate-x-1 dark:text-primary-400"
        :class="compact ? 'text-xs' : 'text-sm'"
      >
        <i
          class="fa fa-location-arrow"
          :class="compact ? 'mr-1 text-[10px]' : 'mr-1.5 text-xs'"
          aria-hidden="true"
        ></i>
        {{ formatDistance(station.distance) }}
        <i
          v-if="!compact"
          class="fa fa-chevron-right ml-1.5 text-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          aria-hidden="true"
        ></i>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { formatDistance, formatPrice } from '../../utils/format'
import { stationStatus } from '../../utils/stationStatus'

const DENSITIES = ['comfortable', 'compact']

const props = defineProps({
  station: {
    type: Object,
    required: true
  },
  density: {
    type: String,
    default: 'comfortable'
  },
  index: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['select'])

const compact = computed(() => props.density === 'compact')
const delayStep = computed(() => (compact.value ? 60 : 80))

// Unknown densities fall back to the comfortable layout instead of silently
// rendering an unstyled card.
watch(
  () => props.density,
  (value) => {
    if (!DENSITIES.includes(value)) {
      console.warn(`[StationListCard] 未知 density "${value}"，已回退 comfortable`)
    }
  },
  { immediate: true }
)

const cardClass = computed(() =>
  compact.value
    ? 'rounded-xl p-3.5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-md'
    : 'animate-in rounded-2xl p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-lg'
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

const metrics = computed(() => {
  const station = props.station
  const values = {
    quick: `${station.quickAvailableNum}/${station.quickChargeNum}`,
    slow: `${station.slowAvailableNum}/${station.slowChargeNum}`
  }

  if (compact.value) {
    return [
      {
        key: 'quick',
        label: '快充',
        icon: 'fa fa-bolt',
        iconClass: 'text-[10px] text-secondary-500',
        valueClass: 'text-xs font-bold text-secondary-600',
        tileClass:
          'flex items-center space-x-1.5 rounded-lg bg-secondary-50 p-2 dark:bg-secondary-900/20',
        value: values.quick
      },
      {
        key: 'slow',
        label: '慢充',
        icon: 'fa fa-plug',
        iconClass: 'text-[10px] text-primary-500',
        valueClass: 'text-xs font-bold text-primary-600',
        tileClass:
          'flex items-center space-x-1.5 rounded-lg bg-primary-50 p-2 dark:bg-primary-900/20',
        value: values.slow
      },
      {
        key: 'price',
        label: '电价',
        icon: 'fa fa-rmb',
        iconClass: 'text-[10px] text-warning-500',
        valueClass: 'text-xs font-bold text-warning-600',
        tileClass:
          'flex items-center space-x-1.5 rounded-lg bg-warning-50 p-2 dark:bg-warning-900/20',
        value: formatPrice(station.currentPrice)
      }
    ]
  }

  return [
    {
      key: 'quick',
      label: '快充',
      icon: 'fa fa-bolt',
      iconClass: 'text-xs text-secondary-500',
      iconWrapClass:
        'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-secondary-100 dark:bg-secondary-900/40',
      valueClass: 'text-xs font-bold text-secondary-600',
      tileClass:
        'flex items-center space-x-2 rounded-xl border border-secondary-100 bg-secondary-50 p-2.5 dark:border-secondary-900/30 dark:bg-secondary-900/20',
      value: values.quick
    },
    {
      key: 'slow',
      label: '慢充',
      icon: 'fa fa-plug',
      iconClass: 'text-xs text-primary-500',
      iconWrapClass:
        'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/40',
      valueClass: 'text-xs font-bold text-primary-600',
      tileClass:
        'flex items-center space-x-2 rounded-xl border border-primary-100 bg-primary-50 p-2.5 dark:border-primary-900/30 dark:bg-primary-900/20',
      value: values.slow
    },
    {
      key: 'price',
      label: '电价',
      icon: 'fa fa-rmb',
      iconClass: 'text-xs text-warning-500',
      iconWrapClass:
        'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-warning-100 dark:bg-warning-900/40',
      valueClass: 'text-xs font-bold text-warning-600',
      tileClass:
        'flex items-center space-x-2 rounded-xl border border-warning-100 bg-warning-50 p-2.5 dark:border-warning-900/30 dark:bg-warning-900/20',
      value: formatPrice(station.currentPrice)
    }
  ]
})
</script>
