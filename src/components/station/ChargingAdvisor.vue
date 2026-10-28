<template>
  <section
    class="charging-advisor mb-5 space-y-4"
    :aria-label="t('车辆补能建议')"
    data-testid="charging-advisor"
  >
    <div
      class="rounded-2xl border border-primary-200 bg-primary-50/60 p-4 dark:border-primary-800 dark:bg-primary-900/15"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p
            class="mb-1 text-[10px] font-bold tracking-[0.14em] text-primary-700 dark:text-primary-300"
          >
            CHARGE, WITH A PLAN
          </p>
          <h3 class="text-base font-bold">{{ t('为这次补能，选对一站') }}</h3>
        </div>
        <button
          v-if="!editing"
          class="shrink-0 rounded-lg px-2 py-2 text-xs font-semibold text-primary-700 dark:text-primary-300"
          :aria-expanded="editing"
          @click="editGoal"
        >
          {{ t('调整目标') }}
        </button>
      </div>

      <form v-if="editing" class="mt-4" @submit.prevent="analyze">
        <fieldset class="min-w-0 space-y-3" :disabled="advisor.status === 'loading'">
          <div>
            <div class="mb-1.5 flex items-center justify-between gap-2 text-xs">
              <label :for="`${id}-vehicle`" class="font-semibold">{{ t('充电车辆') }}</label>
              <button
                type="button"
                class="min-h-8 text-primary-700 dark:text-primary-300"
                @click="emit('show-vehicles')"
              >
                {{ t(user.vehicles.length ? '管理车辆' : '添加车辆') }}
              </button>
            </div>
            <select
              :id="`${id}-vehicle`"
              :value="advisor.vehicle?.id || ''"
              class="input-premium advisor-field"
              @change="advisor.updateGoal({ vehicleId: $event.target.value })"
            >
              <option value="" disabled>{{ t('请选择车辆') }}</option>
              <option v-for="vehicle in user.vehicles" :key="vehicle.id" :value="vehicle.id">
                {{ dataText(vehicle.model) }} · {{ vehicle.connectorType }}
              </option>
            </select>
            <p
              v-if="advisor.vehicle"
              class="mt-1 text-[11px] text-surface-500 dark:text-surface-400"
            >
              {{
                t('{capacity} kWh · 最高 {power} kW', {
                  capacity: advisor.vehicle.batteryCapacityKwh || '—',
                  power: advisor.vehicle.maxPower || '—'
                })
              }}
            </p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label :for="`${id}-initial`" class="mb-1.5 block text-xs font-semibold">{{
                t('当前电量（%）')
              }}</label>
              <input
                :id="`${id}-initial`"
                :value="advisor.goal.initialBattery"
                class="input-premium advisor-field"
                data-testid="advisor-initial"
                type="number"
                min="0"
                max="99"
                step="1"
                required
                @input="setNumber('initialBattery', $event)"
              />
            </div>
            <div>
              <label :for="`${id}-target`" class="mb-1.5 block text-xs font-semibold">{{
                t('目标电量（%）')
              }}</label>
              <input
                :id="`${id}-target`"
                :value="advisor.goal.targetBattery"
                class="input-premium advisor-field"
                data-testid="advisor-target"
                type="number"
                min="1"
                max="100"
                step="1"
                required
                @input="setNumber('targetBattery', $event)"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2" role="group" :aria-label="t('推荐偏好')">
            <button
              v-for="preference in RECOMMENDATION_PREFERENCES"
              :key="preference.id"
              type="button"
              class="filter-chip"
              :class="
                advisor.goal.preference === preference.id
                  ? 'filter-chip-active'
                  : 'filter-chip-idle'
              "
              :aria-pressed="advisor.goal.preference === preference.id"
              :disabled="preference.id === 'nearest' && !stations.userLocation"
              @click="advisor.updateGoal({ preference: preference.id })"
            >
              <i class="fa text-[11px]" :class="preference.icon" aria-hidden="true"></i
              >{{ t(preference.label) }}
            </button>
          </div>
          <p
            v-if="advisor.validationError"
            class="text-xs leading-5 text-danger-700 dark:text-danger-300"
            role="status"
          >
            {{ t(advisor.validationError) }}
          </p>
          <p
            v-if="!stations.userLocation"
            class="text-[11px] leading-5 text-surface-500 dark:text-surface-400"
          >
            {{ t('定位后可按距离推荐；暂不估算行车时间。') }}
          </p>
          <button
            type="submit"
            class="action-primary"
            :disabled="
              !!advisor.validationError ||
              !advisor.candidates.length ||
              stations.isLoading ||
              !!stations.error
            "
            data-testid="analyze-stations"
          >
            <i
              class="fa"
              :class="
                advisor.status === 'loading'
                  ? 'fa-circle-o-notch fa-spin'
                  : 'fa-wand-magic-sparkles'
              "
              aria-hidden="true"
            ></i
            >{{ t(advisor.status === 'loading' ? '正在核对兼容枪位…' : '分析适合我的站') }}
          </button>
        </fieldset>
        <p class="mt-2 text-[11px] leading-5 text-surface-500 dark:text-surface-400">
          {{ t('电量由你填写，不读取车辆；站点与分析均为模拟演示。') }}
        </p>
      </form>
      <div v-else class="mt-3">
        <p class="break-words text-sm font-semibold">
          {{ dataText(advisor.vehicle?.model) || t('请选择车辆') }}
          <span class="font-normal text-surface-500 dark:text-surface-400"
            >· {{ advisor.goal.initialBattery }}% → {{ advisor.goal.targetBattery }}%</span
          >
        </p>
        <div
          class="mt-2 flex flex-wrap items-center gap-2 text-xs text-primary-800 dark:text-primary-200"
        >
          <span class="rounded-md bg-white/80 px-2 py-1 dark:bg-surface-800">{{
            t(preferenceLabel)
          }}</span>
          <span v-if="goalEnergy != null">{{
            t('计划补入 {energy} kWh', { energy: goalEnergy.toFixed(1) })
          }}</span>
        </div>
      </div>
    </div>

    <p
      v-if="!stations.viewportBounds"
      class="text-[11px] leading-5 text-surface-500 dark:text-surface-400"
    >
      {{ t('地图范围不可用：分析全部筛选结果，不代表附近或剩余续航可达。') }}
    </p>

    <p v-if="advisor.status === 'loading'" class="account-caption" role="status">
      {{
        t('已核对 {count} / {total} 个站点', {
          count: advisor.checkedCount,
          total: advisor.candidates.length
        })
      }}
    </p>
    <div
      v-else-if="advisor.status === 'error' || (advisor.status === 'ready' && !advisor.isCurrent)"
      class="rounded-xl border border-surface-200 p-3 dark:border-surface-700"
      role="status"
    >
      <p class="account-caption">
        {{
          t(
            advisor.status === 'error'
              ? '枪位详情暂时无法核对，请重试分析。'
              : '地图范围或筛选已变化，请重新分析当前结果。'
          )
        }}
      </p>
      <button
        class="mt-2 min-h-10 text-sm font-semibold text-primary-700 dark:text-primary-300"
        :disabled="!!advisor.validationError || !advisor.candidates.length"
        @click="analyze"
      >
        {{ t('重新分析') }}
      </button>
    </div>
    <p v-else-if="!editing && advisor.validationError" class="account-caption" role="status">
      {{ t(advisor.validationError) }}
    </p>

    <template v-if="advisor.isCurrent && !advisor.validationError">
      <p ref="resultSummary" class="account-caption" role="status" tabindex="-1">
        {{
          t('已核对 {checked} 个站点，{matched} 个适合本次车辆与目标', {
            checked: advisor.checkedCount,
            matched: advisor.ranked.length
          })
        }}<span v-if="advisor.failedCount">
          · {{ t('{count} 个站点详情失败，未参与推荐', { count: advisor.failedCount }) }}</span
        >
      </p>
      <p
        v-if="!stations.userLocation"
        class="text-[11px] leading-5 text-surface-500 dark:text-surface-400"
      >
        {{ t('未获得定位：不计距离，不估算行车时间。') }}
      </p>
      <p
        v-if="advisor.goal.initialBattery <= 20"
        class="rounded-xl bg-warning-50 p-3 text-xs leading-5 text-warning-800 dark:bg-warning-900/20 dark:text-warning-200"
      >
        {{ t('电量较低，请优先确认站点距离；此分析不保证剩余续航可达。') }}
        <span
          v-if="stations.userLocation && advisor.goal.preference === 'balanced'"
          class="mt-1 block"
          >{{ t('综合推荐已提高距离权重，优先考虑就近补能。') }}</span
        >
      </p>
      <article
        v-if="best"
        class="recommendation-feature overflow-hidden rounded-2xl border border-surface-700 bg-surface-900 p-4 text-white dark:bg-surface-950"
        data-testid="recommended-station"
      >
        <div class="mb-3 flex flex-wrap items-center gap-2">
          <span
            class="inline-flex items-center gap-1.5 rounded-md bg-accent-500 px-2 py-1 text-[11px] font-bold text-surface-950"
            ><i class="fa fa-bolt" aria-hidden="true"></i>{{ t('本次推荐') }}</span
          >
          <span v-if="best.isCheapest" class="text-[11px] text-surface-200">{{
            t('费用更优')
          }}</span>
          <span v-if="best.isFastest" class="text-[11px] text-surface-200">{{
            t('补能更快')
          }}</span>
          <span v-if="best.isNearest" class="text-[11px] text-surface-200">{{
            t('距离更近')
          }}</span>
        </div>
        <h4 class="break-words text-lg font-bold leading-7">
          {{ stationName(best.station.stationName) }}
        </h4>
        <p class="mt-1 text-xs leading-5 text-surface-300">
          {{ stationAddress(best.station.address) }}
        </p>
        <dl class="my-4 grid grid-cols-2 gap-3 border-y border-white/15 py-4">
          <div>
            <dt class="text-xs text-surface-300">{{ t('预计充电时长') }}</dt>
            <dd class="mt-1 text-2xl font-bold tabular-nums">
              {{ Math.ceil(best.durationSeconds / 60)
              }}<span class="ml-1 text-xs font-normal">{{ t('分钟') }}</span>
            </dd>
          </div>
          <div>
            <dt class="text-xs text-surface-300">{{ t('预计费用') }}</dt>
            <dd class="mt-1 text-2xl font-bold tabular-nums">
              {{ formatPrice(best.totalAmount) }}
            </dd>
          </div>
        </dl>
        <p class="mb-3 rounded-lg bg-white/10 p-3 text-xs leading-5 text-surface-100">
          {{ recommendationReason }}
        </p>
        <ul class="space-y-2 text-xs leading-5 text-surface-200">
          <li>
            <i class="fa fa-check mr-1.5 text-accent-500" aria-hidden="true"></i
            >{{
              t('{type} 接口匹配，{count} 把兼容枪可用', {
                type: advisor.vehicle.connectorType,
                count: best.compatibleAvailable
              })
            }}
          </li>
          <li>{{ t('车辆与枪位共同限功率，最高 {power} kW', { power: best.model.powerKw }) }}</li>
          <li v-if="best.distance != null">
            {{ t('直线距离 {distance}，非行车里程', { distance: formatDistance(best.distance) }) }}
          </li>
        </ul>
        <div class="mt-4 flex gap-2">
          <button class="action-primary flex-1" @click="emit('select', best.station)">
            {{ t('查看推荐站') }}<i class="fa fa-arrow-right" aria-hidden="true"></i>
          </button>
          <button
            class="min-h-11 shrink-0 rounded-xl border border-white/30 px-3 text-xs font-semibold disabled:opacity-40"
            :aria-label="t('对比站点：{name}', { name: stationName(best.station.stationName) })"
            :aria-pressed="isCompared(best)"
            :disabled="compareDisabled(best)"
            @click="advisor.toggleComparison(best.station.stationId)"
          >
            {{ t(isCompared(best) ? '已选对比' : '加入对比') }}
          </button>
        </div>
      </article>
      <div v-if="alternatives.length" class="space-y-2">
        <div
          v-for="entry in alternatives"
          :key="entry.station.stationId"
          class="rounded-xl border border-surface-200 bg-white p-3 dark:border-surface-700 dark:bg-surface-900"
        >
          <button class="block w-full text-left" @click="emit('select', entry.station)">
            <span
              class="mb-1 block text-[10px] font-semibold text-primary-700 dark:text-primary-300"
              >{{
                t(entry.isCheapest ? '省钱备选' : entry.isFastest ? '快速备选' : '兼容备选')
              }}</span
            ><span class="block break-words text-sm font-semibold">{{
              stationName(entry.station.stationName)
            }}</span>
          </button>
          <div class="mt-2 flex flex-wrap items-center justify-between gap-1 text-xs">
            <span class="tabular-nums"
              >{{ t('约 {minutes} 分钟', { minutes: Math.ceil(entry.durationSeconds / 60) }) }} ·
              {{ formatPrice(entry.totalAmount) }}</span
            ><button
              class="min-h-9 rounded-lg px-2 font-semibold text-primary-700 disabled:opacity-40 dark:text-primary-300"
              :aria-label="t('对比站点：{name}', { name: stationName(entry.station.stationName) })"
              :aria-pressed="isCompared(entry)"
              :disabled="compareDisabled(entry)"
              @click="advisor.toggleComparison(entry.station.stationId)"
            >
              {{ t(isCompared(entry) ? '已选对比' : '加入对比') }}
            </button>
          </div>
        </div>
      </div>
      <div v-if="!best" class="account-empty py-5" role="status">
        <i class="fa fa-plug text-2xl text-surface-400" aria-hidden="true"></i>
        <p class="text-sm font-semibold">{{ t('当前没有适合这辆车的可用站点') }}</p>
        <p class="account-caption">
          {{ t('请移动地图或调整筛选；维护、休息、无兼容空闲枪或费率未知的站点不会推荐。') }}
        </p>
      </div>
      <StationComparison v-if="advisor.comparison.length" @select="emit('select', $event)" />
      <details class="text-[11px] leading-5 text-surface-500 dark:text-surface-400">
        <summary class="min-h-9 cursor-pointer py-2 font-semibold">{{ t('推荐怎么算？') }}</summary>
        <p>
          {{
            t(
              '综合比较费用、充电时长、直线距离和兼容余位；偏好会改变权重，不代表站点可达性或排队预测。'
            )
          }}
        </p>
        <p class="mt-2">
          {{ t('时长采用车辆与枪位较低功率，并模拟 60% 后逐渐降功率；不含行车、排队和接枪时间。') }}
        </p>
        <p class="mt-2">
          {{
            t(
              '费用按当前分时电价锁定估算，含 10% 演示服务费，不含停车费和优惠；实际以所选枪位及账单为准。'
            )
          }}
        </p>
      </details>
    </template>
  </section>
</template>

<script setup>
import { computed, nextTick, ref, useId } from 'vue'
import { t } from '../../i18n'
import { dataText, stationAddress, stationName } from '../../i18n/data'
import { useRecommendationsStore } from '../../store/modules/recommendations'
import { useStationsStore } from '../../store/modules/stations'
import { useUserStore } from '../../store/modules/user'
import { RECOMMENDATION_PREFERENCES } from '../../utils/stationRecommendations'
import { formatDistance, formatPrice } from '../../utils/format'
import StationComparison from './StationComparison.vue'

const emit = defineEmits(['select', 'show-vehicles'])
const advisor = useRecommendationsStore()
const stations = useStationsStore()
const user = useUserStore()
const id = useId()
const resultSummary = ref(null)
const editing = ref(advisor.status === 'idle' || !!advisor.validationError)
const best = computed(() => advisor.ranked[0])
const alternatives = computed(() => advisor.ranked.slice(1, 3))
const recommendationReason = computed(() => {
  const selected = best.value
  if (!selected) return ''
  if (advisor.goal.preference === 'nearest') return t('本次候选中距离最近，仍需核对实际行车路线。')
  if (selected.isCheapest && selected.isFastest)
    return t('同一补能目标下，同时达到候选中的最低预计费用与最短充电时长。')
  const cheapest = advisor.ranked.find((entry) => entry.isCheapest)
  const fastest = advisor.ranked.find((entry) => entry.isFastest)
  if (selected.isCheapest && fastest && selected.durationSeconds - fastest.durationSeconds >= 60)
    return t('比最快方案少花 {cost}，充电约多用 {minutes} 分钟。', {
      cost: formatPrice(fastest.totalAmount - selected.totalAmount),
      minutes: Math.round((selected.durationSeconds - fastest.durationSeconds) / 60)
    })
  if (cheapest && cheapest.durationSeconds - selected.durationSeconds >= 60)
    return t('比最低费用方案多花 {cost}，充电约少用 {minutes} 分钟。', {
      cost: formatPrice(selected.totalAmount - cheapest.totalAmount),
      minutes: Math.round((cheapest.durationSeconds - selected.durationSeconds) / 60)
    })
  return t('在费用、充电时长与兼容余位之间更均衡；未提供行车和排队预测。')
})
const preferenceLabel = computed(
  () =>
    RECOMMENDATION_PREFERENCES.find((item) => item.id === advisor.goal.preference)?.label ||
    '综合推荐'
)
const goalEnergy = computed(() =>
  advisor.validationError
    ? null
    : (advisor.vehicle.batteryCapacityKwh *
        (advisor.goal.targetBattery - advisor.goal.initialBattery)) /
      100
)
const setNumber = (key, event) =>
  advisor.updateGoal({ [key]: event.target.value === '' ? '' : Number(event.target.value) })
const isCompared = (entry) =>
  advisor.comparison.some((item) => item.station.stationId === entry.station.stationId)
const compareDisabled = (entry) => advisor.comparison.length >= 2 && !isCompared(entry)
const analyze = async () => {
  await advisor.analyze()
  if (advisor.status === 'ready' && advisor.isCurrent) {
    editing.value = false
    await nextTick()
    resultSummary.value?.focus({ preventScroll: true })
  }
}
const editGoal = async () => {
  editing.value = true
  await nextTick()
  document.getElementById(`${id}-vehicle`)?.focus({ preventScroll: true })
}
</script>

<style scoped>
.advisor-field {
  padding: 0.625rem 0.75rem;
  font-size: 16px;
}
</style>
