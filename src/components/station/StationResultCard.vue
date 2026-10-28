<template>
  <div class="min-w-0">
    <StationListCard
      :station="station"
      :density="density"
      :class="entry ? 'border-primary-200 dark:border-primary-800' : ''"
      @select="emit('select', $event)"
    />
    <div
      v-if="entry"
      class="mx-1 flex flex-wrap items-center justify-between gap-1 rounded-b-xl border border-t-0 border-primary-200 bg-primary-50/50 px-3 py-1 text-[11px] dark:border-primary-800 dark:bg-primary-900/15"
    >
      <span class="tabular-nums text-primary-800 dark:text-primary-200"
        >{{ t('本次补能') }} ·
        {{ t('约 {minutes} 分钟', { minutes: Math.ceil(entry.durationSeconds / 60) }) }} ·
        {{ formatPrice(entry.totalAmount) }}</span
      >
      <button
        class="min-h-9 px-1 font-semibold text-primary-700 disabled:opacity-40 dark:text-primary-300"
        :aria-label="t('对比站点：{name}', { name: stationName(station.stationName) })"
        :aria-pressed="compared"
        :disabled="advisor.comparison.length >= 2 && !compared"
        @click="advisor.toggleComparison(station.stationId)"
      >
        {{ t(compared ? '已选对比' : '加入对比') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { t } from '../../i18n'
import { stationName } from '../../i18n/data'
import { formatPrice } from '../../utils/format'
import { useRecommendationsStore } from '../../store/modules/recommendations'
import StationListCard from './StationListCard.vue'
const props = defineProps({
  station: { type: Object, required: true },
  density: { type: String, default: 'comfortable' }
})
const emit = defineEmits(['select'])
const advisor = useRecommendationsStore()
const entry = computed(() => advisor.entryById[props.station.stationId])
const compared = computed(() =>
  advisor.comparison.some((item) => item.station.stationId === props.station.stationId)
)
</script>
