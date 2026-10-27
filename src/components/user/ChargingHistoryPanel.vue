<template>
  <AccountPanel title="充电记录" subtitle="订单、费用与充电明细" @close="emit('close')">
    <button
      v-if="charging.isCharging || charging.paymentPending"
      class="choice-card"
      @click="emit('resume-session')"
    >
      <span class="account-icon"><i class="fa fa-bolt" aria-hidden="true"></i></span
      ><span class="min-w-0 flex-1"
        ><strong class="block text-sm">{{
          t(charging.isCharging ? '当前正在充电' : '当前订单尚未结算')
        }}</strong
        ><span class="account-caption">{{
          stationName(charging.sessionStation?.stationName)
        }}</span></span
      ><i class="fa fa-angle-right text-surface-400" aria-hidden="true"></i>
    </button>
    <section class="account-card grid grid-cols-2 gap-4">
      <div>
        <p class="account-caption">{{ t('累计充电') }}</p>
        <p class="mt-1 text-lg font-bold tabular-nums">
          {{ totalEnergy }}<span class="ml-1 text-xs font-normal text-surface-500">kWh</span>
        </p>
      </div>
      <div>
        <p class="account-caption">{{ t('已完成订单费用') }}</p>
        <p class="mt-1 break-all text-lg font-bold tabular-nums">{{ formatPrice(totalCost) }}</p>
      </div>
    </section>
    <div class="space-y-3">
      <input
        v-model="search"
        class="input-premium"
        type="search"
        :aria-label="t('搜索充电记录')"
        :placeholder="t('搜索站点或车辆')"
      />
      <div class="segmented-control" role="group" :aria-label="t('订单状态')">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="segmented-item"
          :aria-pressed="filter === tab.value"
          @click="filter = tab.value"
        >
          {{ t(tab.label) }}
        </button>
      </div>
    </div>
    <button
      v-for="record in records"
      :key="record.id"
      class="account-card w-full text-left transition-colors hover:border-primary-300"
      @click="selectedId = record.id"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <h3 class="break-words text-sm font-bold">{{ stationName(record.stationName) }}</h3>
          <p class="account-caption mt-1">{{ dataText(record.date) }}</p>
        </div>
        <span
          :class="record.status === 'refunded' ? 'status-badge-warning' : 'status-badge-success'"
          class="shrink-0"
          >{{ t(record.status === 'refunded' ? '已退款' : '已完成') }}</span
        >
      </div>
      <div
        class="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-surface-100 pt-3 dark:border-surface-800"
      >
        <span class="account-caption"
          >{{ record.energy }} · {{ recordDuration(record) }}<br />{{
            dataText(record.vehicleModel)
          }}</span
        ><span class="text-right"
          ><strong class="block text-sm tabular-nums"
            >{{ record.status === 'refunded' ? '+' : '−' }}{{ formatPrice(record.cost) }}</strong
          ><span class="account-caption"
            >{{ t('查看明细') }} <i class="fa fa-angle-right" aria-hidden="true"></i></span
        ></span>
      </div>
    </button>
    <div v-if="!records.length" class="account-empty">
      <span class="account-icon"><i class="fa fa-history" aria-hidden="true"></i></span>
      <h3 class="text-sm font-semibold">
        {{ t(user.chargingHistory.length ? '没有匹配的记录' : '暂无充电记录') }}
      </h3>
      <p class="account-caption">{{ t('完成充电与结算后，记录会显示在这里。') }}</p>
      <button v-if="search || filter !== 'all'" class="action-secondary" @click="clearFilters">
        {{ t('清除筛选') }}</button
      ><button v-else class="action-secondary" @click="emit('explore')">
        {{ t('去找充电站') }}
      </button>
    </div>
    <template #dialogs
      ><DialogModal v-if="selectedRecord" title="充电明细" @close="selectedId = null"
        ><h3 class="text-base font-semibold">{{ stationName(selectedRecord.stationName) }}</h3>
        <p class="account-caption mt-1">{{ stationAddress(selectedRecord.stationAddress) }}</p>
        <dl class="my-5 space-y-3 text-sm">
          <div
            v-for="line in detailLines"
            :key="line.label"
            class="flex flex-wrap justify-between gap-2"
          >
            <dt class="text-surface-500">{{ t(line.label) }}</dt>
            <dd class="break-words text-right font-semibold">{{ dataText(line.value) }}</dd>
          </div>
        </dl>
        <button class="action-primary" @click="selectedId = null">
          {{ t('关闭明细') }}
        </button></DialogModal
      ></template
    >
  </AccountPanel>
</template>
<script setup>
import { computed, ref } from 'vue'
import { t } from '../../i18n'
import { stationName, stationAddress, dataText } from '../../i18n/data'
import AccountPanel from './AccountPanel.vue'
import DialogModal from '../common/DialogModal.vue'
import { useUserStore } from '../../store/modules/user'
import { useChargingStore } from '../../store/modules/charging'
import { formatDuration, formatPrice } from '../../utils/format'
const emit = defineEmits(['close', 'explore', 'resume-session'])
const user = useUserStore(),
  charging = useChargingStore()
const filter = ref('all'),
  search = ref(''),
  selectedId = ref(null)
const tabs = [
  { label: '全部', value: 'all' },
  { label: '已完成', value: 'completed' },
  { label: '已退款', value: 'refunded' }
]
const recordDuration = (record) =>
  Number.isFinite(record.durationSeconds)
    ? formatDuration(record.durationSeconds, 'hm-verbose')
    : dataText(record.duration)
const clearFilters = () => {
  search.value = ''
  filter.value = 'all'
}
const records = computed(() =>
  user.chargingHistory.filter(
    (record) =>
      (filter.value === 'all' || record.status === filter.value) &&
      `${record.stationName} ${stationName(record.stationName, 'en-US')} ${record.vehicleModel} ${dataText(record.vehicleModel)}`
        .toLowerCase()
        .includes(search.value.trim().toLowerCase())
  )
)
const completed = computed(() =>
  user.chargingHistory.filter((record) => record.status === 'completed')
)
const totalEnergy = computed(() =>
  completed.value.reduce((sum, record) => sum + (parseFloat(record.energy) || 0), 0).toFixed(1)
)
const totalCost = computed(() =>
  completed.value.reduce((sum, record) => sum + (Number(record.cost) || 0), 0)
)
const selectedRecord = computed(() =>
  user.chargingHistory.find((record) => record.id === selectedId.value)
)
const detailLines = computed(() =>
  selectedRecord.value
    ? [
        {
          label: '订单状态',
          value: selectedRecord.value.status === 'refunded' ? '已退款' : '已完成'
        },
        { label: '时间', value: selectedRecord.value.date },
        { label: '车辆', value: selectedRecord.value.vehicleModel },
        { label: '充电时长', value: recordDuration(selectedRecord.value) },
        { label: '充入电量', value: selectedRecord.value.energy },
        {
          label: selectedRecord.value.status === 'refunded' ? '退款金额' : '实付金额',
          value: formatPrice(selectedRecord.value.cost)
        }
      ]
    : []
)
</script>
