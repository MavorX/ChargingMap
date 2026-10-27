<template>
  <PanelShell title="充电中" :busy="store.phase === 'stopping'" @close="emit('close')">
    <div class="glass-effect flex shrink-0 items-center justify-between p-4">
      <button
        class="icon-button"
        :aria-label="t('返回地图')"
        :disabled="store.phase === 'stopping'"
        @click="emit('close')"
      >
        <i class="fa fa-arrow-left" aria-hidden="true"></i>
      </button>
      <h2 class="text-base font-bold">{{ t(phaseLabel) }}</h2>
      <span class="w-10"></span>
    </div>
    <div class="flex-1 space-y-5 overflow-y-auto p-5">
      <div class="space-y-1 text-center">
        <p class="break-words text-sm font-semibold">
          {{ stationName(store.sessionStation?.stationName) || t('暂无充电记录') }}
        </p>
        <p class="text-xs text-surface-500 dark:text-surface-400">
          {{ dataText(store.sessionConnector?.connectorName) || t('未选择充电桩') }} ·
          {{ dataText(store.sessionVehicle?.model) || t('未选择车辆') }}
        </p>
        <p class="break-all font-mono text-[11px] text-surface-400">
          {{ store.sessionConnector?.id }}
        </p>
      </div>
      <div class="relative mx-auto h-48 w-48">
        <svg class="h-full w-full -rotate-90" viewBox="0 0 200 200" aria-hidden="true">
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke="currentColor"
            stroke-width="10"
            class="text-surface-100 dark:text-surface-800"
          />
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke="currentColor"
            stroke-width="10"
            stroke-linecap="round"
            class="text-primary-600 transition-[stroke-dashoffset] duration-700 dark:text-primary-400"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="circumference * (1 - battery / 100)"
          />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-xs text-surface-500 dark:text-surface-400">{{ t('当前电量') }}</span
          ><strong class="my-2 text-4xl tabular-nums"
            >{{ Number.isFinite(data.battery) ? data.battery.toFixed(1) : '—'
            }}<span class="ml-1 text-lg">%</span></strong
          ><span class="text-xs text-surface-500 dark:text-surface-400">{{
            t('目标 {battery}%', { battery: store.sessionModel?.targetBattery ?? '—' })
          }}</span>
        </div>
      </div>
      <p class="text-center text-xs text-surface-500 dark:text-surface-400">
        <i
          class="fa fa-circle mr-1.5 text-[8px]"
          :class="store.isCharging ? 'text-secondary-500' : 'text-surface-400'"
          aria-hidden="true"
        ></i
        >{{
          store.isCharging
            ? t('充电枪已连接 · {power}', { power: formatPower(data.speed) })
            : t('输出已停止')
        }}
      </p>
      <dl class="grid grid-cols-1 gap-3 min-[380px]:grid-cols-3">
        <div class="info-row min-w-0 flex-col gap-2 p-3 text-center">
          <dt class="text-xs text-surface-500 dark:text-surface-400">{{ t('充电时长') }}</dt>
          <dd class="text-sm font-semibold tabular-nums">
            {{ formatDuration(Math.floor(data.duration), 'hms') }}
          </dd>
        </div>
        <div class="info-row min-w-0 flex-col gap-2 p-3 text-center">
          <dt class="text-xs text-surface-500 dark:text-surface-400">{{ t('已充电量') }}</dt>
          <dd class="text-sm font-semibold tabular-nums">{{ data.energy.toFixed(2) }} kWh</dd>
        </div>
        <div class="info-row min-w-0 flex-col gap-2 p-3 text-center">
          <dt class="text-xs text-surface-500 dark:text-surface-400">{{ t('当前费用') }}</dt>
          <dd class="text-sm font-semibold tabular-nums">{{ formatPrice(data.cost) }}</dd>
        </div>
      </dl>
      <p
        v-if="store.phase === 'charging'"
        class="info-row justify-center text-sm text-surface-500 dark:text-surface-400"
      >
        {{ t('预计还需 {minutes} 分钟达到目标电量', { minutes: remainingMinutes }) }}
      </p>
      <p v-if="store.phase === 'stopping'" class="info-row text-sm leading-6" role="status">
        {{ t('正在停止输出，请稍候。停止完成前，请勿拔出充电枪。') }}
      </p>
      <div
        v-if="store.phase === 'awaiting_unplug'"
        class="rounded-xl bg-secondary-50 p-4 text-sm leading-6 text-secondary-800 dark:bg-secondary-900/20 dark:text-secondary-300"
        role="status"
      >
        <p class="font-semibold">{{ t('充电已结束，可以拔枪了') }}</p>
        <p class="mt-1">{{ t('请拔下充电枪并放回枪座，再驶离车位。') }}</p>
      </div>
      <p
        v-if="store.failure"
        class="rounded-xl bg-danger-50 p-4 text-sm leading-6 text-danger-700 dark:bg-danger-900/20 dark:text-danger-300"
        role="alert"
      >
        {{ t(store.failure) }}
      </p>
      <p class="text-center text-[11px] leading-5 text-surface-400">
        {{ t('模拟充电')
        }}{{
          t(
            store.sessionModel?.clockScale === 60
              ? ' · 60× 演示速度，1 秒对应 1 分钟'
              : ' · 正常速度'
          )
        }}<br />{{ t('返回地图可继续查看站点，不会结束充电。') }}
      </p>
    </div>
    <div class="glass-effect shrink-0 border-t p-4">
      <button
        v-if="store.isCharging"
        class="action-primary bg-danger-600 hover:bg-danger-700"
        :disabled="store.phase === 'stopping'"
        @click="requestStop"
      >
        {{
          t(
            store.phase === 'stopping'
              ? '正在结束充电…'
              : store.phase === 'stop_failed'
                ? '重试结束充电'
                : '结束充电'
          )
        }}
      </button>
      <button
        v-else-if="store.phase === 'awaiting_unplug'"
        ref="unplugRef"
        class="action-primary"
        @click="unplug"
      >
        {{ t('已拔枪，查看账单') }}
      </button>
      <button v-else-if="store.phase === 'interrupted'" class="action-primary" @click="archive">
        {{ t('结束中断演示，查看账单') }}
      </button>
      <button
        v-else-if="store.paymentPending"
        class="action-primary"
        @click="emit('charging-complete')"
      >
        {{ t('查看账单') }}
      </button>
      <button v-else class="action-primary" @click="emit('close')">{{ t('返回地图') }}</button>
    </div>
    <DialogModal
      v-if="showStopConfirm"
      title="结束本次充电？"
      :busy="store.phase === 'stopping'"
      @close="showStopConfirm = false"
    >
      <p class="mb-5 text-sm leading-7 text-surface-600 dark:text-surface-300">
        {{
          t('已充入 {energy} kWh，当前费用 {cost}。结束后将停止输出，请等待停止完成再拔枪。', {
            energy: data.energy.toFixed(2),
            cost: formatPrice(data.cost)
          })
        }}
      </p>
      <div class="flex gap-3">
        <button
          class="choice-card flex-1 justify-center p-3 text-sm"
          :disabled="store.phase === 'stopping'"
          @click="showStopConfirm = false"
        >
          {{ t('继续充电') }}</button
        ><button
          class="action-primary flex-1 bg-danger-600 hover:bg-danger-700"
          :disabled="store.phase === 'stopping'"
          @click="stop"
        >
          {{ t(store.phase === 'stopping' ? '正在停止…' : '确认结束') }}
        </button>
      </div>
    </DialogModal>
  </PanelShell>
</template>
<script setup>
import { computed, inject, nextTick, ref, watch } from 'vue'
import { t } from '../../i18n'
import { stationName, dataText } from '../../i18n/data'
import PanelShell from '../common/PanelShell.vue'
import DialogModal from '../common/DialogModal.vue'
import { useChargingStore } from '../../store/modules/charging'
import { formatDuration, formatPrice, formatPower } from '../../utils/format'
const emit = defineEmits(['close', 'charging-complete'])
const store = useChargingStore()
const toast = inject('showToast')
const data = computed(() => store.chargingData)
const circumference = 2 * Math.PI * 88
const battery = computed(() => Math.max(0, Math.min(100, data.value.battery || 0)))
const showStopConfirm = ref(false)
const unplugRef = ref(null)
// A confirmation is a view of the session, not a frozen copy of its old phase.
watch(
  () => [store.phase, store.sessionId],
  async () => {
    if (!store.isCharging && showStopConfirm.value) {
      showStopConfirm.value = false
      await nextTick()
      unplugRef.value?.focus({ preventScroll: true })
    }
  }
)
const phaseLabel = computed(
  () =>
    ({
      charging: '充电中',
      stopping: '正在结束充电',
      stop_failed: '充电尚未结束',
      awaiting_unplug: '充电完成',
      interrupted: '演示已中断',
      finished: '充电完成'
    })[store.phase] || '充电详情'
)
const remainingMinutes = computed(() =>
  Math.max(
    0,
    Math.ceil(
      (((store.sessionModel?.targetEnergy || 0) - data.value.energy) /
        (store.sessionModel?.powerKw || 1)) *
        60
    )
  )
)
const requestStop = () => {
  if (!store.isCharging || store.phase === 'stopping') return
  if (store.phase === 'stop_failed') {
    store.recoverDeviceResponse()
    stop()
  } else showStopConfirm.value = true
}
const stop = async () => {
  if (!store.isCharging) {
    showStopConfirm.value = false
    await nextTick()
    unplugRef.value?.focus({ preventScroll: true })
    return
  }
  if (store.phase === 'stopping') return
  try {
    await store.stopCharging()
  } catch (error) {
    toast(error.message, 'error')
  } finally {
    showStopConfirm.value = false
  }
}
const unplug = () => {
  try {
    store.disconnectPlug()
    emit('charging-complete')
  } catch (error) {
    toast(error.message, 'error')
  }
}
const archive = () => {
  store.acknowledgeInterruption()
  emit('charging-complete')
}
</script>
