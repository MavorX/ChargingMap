<template>
  <section
    class="rounded-2xl border border-primary-200 bg-white p-3 dark:border-primary-800 dark:bg-surface-900"
    :aria-label="t('站点对比')"
    data-testid="station-comparison"
  >
    <div class="mb-3 flex items-center justify-between gap-2">
      <h4 class="text-sm font-bold">{{ t('这两站，怎么选') }}</h4>
      <button
        class="min-h-9 text-xs text-surface-500 dark:text-surface-400"
        @click="advisor.comparisonIds = []"
      >
        {{ t('清空对比') }}
      </button>
    </div>
    <p
      v-if="advisor.comparison.length < 2"
      class="mb-3 text-xs leading-5 text-surface-500 dark:text-surface-400"
    >
      {{ t('再选择一个站点，比较同一补能目标下的费用与时间。') }}
    </p>
    <div class="grid grid-cols-2 gap-2">
      <article
        v-for="(entry, index) in advisor.comparison"
        :key="entry.station.stationId"
        class="min-w-0 rounded-xl bg-surface-50 p-3 dark:bg-surface-800/60"
      >
        <div class="flex items-start justify-between gap-1">
          <span class="mb-2 text-xs font-bold text-primary-700 dark:text-primary-300">{{
            index === 0 ? 'A' : 'B'
          }}</span
          ><button
            class="min-h-8 min-w-8 text-surface-500"
            :aria-label="t('移除对比：{name}', { name: stationName(entry.station.stationName) })"
            @click="advisor.toggleComparison(entry.station.stationId)"
          >
            <i class="fa fa-times" aria-hidden="true"></i>
          </button>
        </div>
        <h5 class="mb-4 break-words text-xs font-semibold leading-5">
          {{ stationName(entry.station.stationName) }}
        </h5>
        <dl class="space-y-3 text-xs">
          <div>
            <dt class="text-surface-500 dark:text-surface-400">{{ t('预计费用') }}</dt>
            <dd
              class="mt-1 text-base font-bold tabular-nums text-primary-700 dark:text-primary-300"
            >
              {{ formatPrice(entry.totalAmount) }}
            </dd>
          </div>
          <div>
            <dt class="text-surface-500 dark:text-surface-400">{{ t('预计充电时长') }}</dt>
            <dd class="mt-1 font-semibold">
              {{ t('约 {minutes} 分钟', { minutes: Math.ceil(entry.durationSeconds / 60) }) }}
            </dd>
          </div>
          <div>
            <dt class="text-surface-500 dark:text-surface-400">{{ t('有效功率上限') }}</dt>
            <dd class="mt-1 font-semibold">{{ entry.model.powerKw }} kW</dd>
          </div>
          <div>
            <dt class="text-surface-500 dark:text-surface-400">{{ t('兼容空闲枪') }}</dt>
            <dd class="mt-1 font-semibold">{{ entry.compatibleAvailable }}</dd>
          </div>
          <div>
            <dt class="text-surface-500 dark:text-surface-400">{{ t('直线距离') }}</dt>
            <dd class="mt-1 font-semibold">
              {{ entry.distance == null ? t('待定位') : formatDistance(entry.distance) }}
            </dd>
          </div>
          <div>
            <dt class="text-surface-500 dark:text-surface-400">{{ t('停车规则（另计）') }}</dt>
            <dd class="mt-1 break-words leading-5">{{ dataText(entry.station.parkFee) || '—' }}</dd>
          </div>
        </dl>
        <button
          class="action-secondary mt-4 w-full px-2 text-xs"
          @click="emit('select', entry.station)"
        >
          {{ t('查看此站') }}
        </button>
      </article>
      <div
        v-if="advisor.comparison.length === 1"
        class="flex min-w-0 items-center justify-center rounded-xl border border-dashed border-surface-300 p-3 text-center text-xs leading-6 text-surface-500 dark:border-surface-700 dark:text-surface-400"
      >
        {{ t('在推荐卡片或列表中点击「加入对比」') }}
      </div>
    </div>
    <p
      v-if="difference"
      class="mt-3 text-xs leading-5 text-primary-800 dark:text-primary-200"
      role="status"
    >
      {{ difference }}
    </p>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { t } from '../../i18n'
import { dataText, stationName } from '../../i18n/data'
import { useRecommendationsStore } from '../../store/modules/recommendations'
import { formatDistance, formatPrice } from '../../utils/format'

const emit = defineEmits(['select'])
const advisor = useRecommendationsStore()
const difference = computed(() => {
  const [a, b] = advisor.comparison
  if (!a || !b) return ''
  const cost = Math.abs(a.totalAmount - b.totalAmount)
  const minutes = Math.round(Math.abs(a.durationSeconds - b.durationSeconds) / 60)
  if (cost < 0.005 && minutes === 0) return t('费用与预计时长相同，可结合距离和停车规则选择。')
  if (minutes === 0)
    return t('{station} 站少花 {cost}，两站预计充电时长相近。', {
      station: a.totalAmount <= b.totalAmount ? 'A' : 'B',
      cost: formatPrice(cost)
    })
  if (cost < 0.005)
    return t('费用相同，{station} 站充电约快 {minutes} 分钟。', {
      station: a.durationSeconds <= b.durationSeconds ? 'A' : 'B',
      minutes
    })
  const cheaper = a.totalAmount <= b.totalAmount ? 'A' : 'B'
  const faster = a.durationSeconds <= b.durationSeconds ? 'A' : 'B'
  return t('{cheaper} 站少花 {cost}；{faster} 站充电约快 {minutes} 分钟。', {
    cheaper,
    cost: formatPrice(cost),
    faster,
    minutes
  })
})
</script>
