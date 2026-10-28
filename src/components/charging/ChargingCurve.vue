<template>
  <figure class="min-w-0" data-testid="charging-curve">
    <div
      class="mb-2 flex items-center justify-between gap-2 text-[11px] text-surface-500 dark:text-surface-400"
    >
      <span>{{ model.powerKw }} kW</span><span>{{ t('功率随补能进度变化') }}</span>
    </div>
    <svg
      viewBox="0 0 320 136"
      class="block w-full overflow-visible"
      role="img"
      :aria-label="
        t('充电功率曲线，预计总时长 {minutes} 分钟，已充 {elapsed} 分钟', {
          minutes: Math.ceil(total / 60),
          elapsed: Math.floor(duration / 60)
        })
      "
    >
      <path
        d="M0 12H320M0 64H320M0 116H320"
        fill="none"
        stroke="currentColor"
        stroke-width="1"
        class="text-surface-200 dark:text-surface-700"
        stroke-dasharray="3 5"
      />
      <path
        :d="forecast"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-dasharray="5 5"
        class="text-surface-400 dark:text-surface-500"
      />
      <path v-if="duration > 0" :d="area" fill="currentColor" class="text-primary-500/10" />
      <path
        v-if="duration > 0"
        :d="delivered"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="text-primary-600 dark:text-primary-400"
      />
      <circle
        v-if="duration > 0"
        :cx="point.x"
        :cy="point.y"
        r="4"
        fill="currentColor"
        stroke="var(--map-marker-bg, white)"
        stroke-width="2"
        class="text-primary-600 dark:text-primary-400"
      />
    </svg>
    <div
      class="-mt-2 flex justify-between text-[11px] tabular-nums text-surface-500 dark:text-surface-400"
    >
      <span>0</span><span>{{ t('{minutes} 分钟', { minutes: Math.ceil(total / 60) }) }}</span>
    </div>
    <figcaption
      class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-surface-500 dark:text-surface-400"
    >
      <span class="inline-flex items-center gap-1.5"
        ><span class="w-4 border-t-2 border-dashed border-surface-400"></span
        >{{ t('目标预测') }}</span
      ><span v-if="duration > 0" class="inline-flex items-center gap-1.5"
        ><span class="w-4 border-t-2 border-primary-600 dark:border-primary-400"></span
        >{{ t('已充过程') }}</span
      >
    </figcaption>
  </figure>
</template>

<script setup>
import { computed } from 'vue'
import { t } from '../../i18n'
import { chargingCurve, chargingDurationSeconds, meterAt } from '../../utils/chargingModel'

const props = defineProps({
  model: { type: Object, required: true },
  elapsedSeconds: { type: Number, default: 0 },
  stopped: { type: Boolean, default: false }
})
const total = computed(() => chargingDurationSeconds(props.model))
const duration = computed(() => Math.max(0, Math.min(props.elapsedSeconds, total.value)))
const samples = computed(() => chargingCurve(props.model))
const coordinate = (sample) => ({
  x: Math.min(320, (sample.seconds / (total.value || 1)) * 320),
  y: 116 - Math.max(0, Math.min(1, sample.power / (props.model.powerKw || 1))) * 104
})
const path = (points) =>
  points
    .map((sample, index) => {
      const p = coordinate(sample)
      return `${index ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`
    })
    .join(' ')
const forecast = computed(() => path(samples.value))
const current = computed(() => {
  const data = meterAt({ ...props.model, clockScale: 1 }, duration.value)
  return { seconds: duration.value, power: props.stopped ? 0 : data.speed }
})
const point = computed(() => coordinate(current.value))
const delivered = computed(() =>
  path([...samples.value.filter((sample) => sample.seconds < duration.value), current.value])
)
const area = computed(() => `${delivered.value} L${point.value.x.toFixed(2)},116 L0,116 Z`)
</script>
