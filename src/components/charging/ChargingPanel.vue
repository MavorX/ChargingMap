<template>
  <PanelShell
    :title="phaseLabel"
    content-class="charging-workspace"
    :busy="store.phase === 'stopping'"
    @close="emit('close')"
  >
    <div class="account-header">
      <button
        class="icon-button"
        :aria-label="t('返回地图')"
        :disabled="store.phase === 'stopping'"
        @click="emit('close')"
      >
        <i class="fa fa-arrow-left" aria-hidden="true"></i>
      </button>
      <div class="min-w-0 flex-1">
        <p
          class="text-[10px] font-semibold tracking-[0.16em] text-primary-700 dark:text-primary-300"
        >
          YOUR ENERGY SESSION
        </p>
        <h2 class="mt-1 text-base font-bold">{{ t(phaseLabel) }}</h2>
      </div>
      <span
        class="rounded-lg bg-primary-50 px-2 py-1 text-[11px] font-semibold text-primary-800 dark:bg-primary-900/30 dark:text-primary-200"
        >{{ t(store.sessionModel?.clockScale === 60 ? '60× 演示' : '模拟充电') }}</span
      >
    </div>
    <div class="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
      <div class="space-y-1">
        <p class="break-words text-sm font-semibold">
          {{ stationName(store.sessionStation?.stationName) || t('暂无充电记录') }}
        </p>
        <p class="text-xs text-surface-500 dark:text-surface-400">
          {{ dataText(store.sessionConnector?.connectorName) || t('未选择充电桩') }} ·
          {{ dataText(store.sessionVehicle?.model) || t('未选择车辆') }}
        </p>
      </div>
      <ol class="grid grid-cols-4 gap-2" :aria-label="t('本次充电流程')">
        <li
          v-for="(step, index) in flowSteps"
          :key="step"
          class="min-w-0 border-t-2 pt-2 text-[11px] leading-5"
          :class="
            index <= flowIndex
              ? 'border-primary-600 text-primary-800 dark:border-primary-400 dark:text-primary-200'
              : 'border-surface-200 text-surface-400 dark:border-surface-700'
          "
          :aria-current="index === flowIndex ? 'step' : undefined"
        >
          <span class="mr-1 font-mono">0{{ index + 1 }}</span
          >{{ t(step) }}
        </li>
      </ol>
      <div class="grid gap-5 lg:grid-cols-2">
        <section
          class="overflow-hidden rounded-2xl border border-surface-700 bg-surface-900 p-5 text-white dark:bg-surface-900"
        >
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span class="text-surface-300">{{ t('电量进度') }}</span
            ><span class="inline-flex items-center gap-1.5 text-accent-500"
              ><span class="h-1.5 w-1.5 rounded-full bg-current"></span>{{ t(outputLabel) }}</span
            >
          </div>
          <div
            class="relative mx-auto h-48 w-48"
            role="progressbar"
            :aria-label="t('当前电量')"
            :aria-valuenow="
              Number.isFinite(data.battery) ? Number(data.battery.toFixed(1)) : undefined
            "
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <svg class="h-full w-full -rotate-90" viewBox="0 0 200 200" aria-hidden="true">
              <circle
                cx="100"
                cy="100"
                r="88"
                fill="none"
                stroke="currentColor"
                stroke-width="10"
                class="text-white/10"
              />
              <circle
                cx="100"
                cy="100"
                r="88"
                fill="none"
                stroke="currentColor"
                stroke-width="10"
                stroke-linecap="round"
                class="text-accent-500 transition-[stroke-dashoffset] duration-700"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="circumference * (1 - battery / 100)"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-xs text-surface-300">{{ t('当前电量') }}</span
              ><strong class="my-2 text-4xl tabular-nums"
                >{{ Number.isFinite(data.battery) ? data.battery.toFixed(1) : '—'
                }}<span class="ml-1 text-lg">%</span></strong
              ><span class="text-xs text-surface-300">{{
                t('目标 {battery}%', { battery: store.sessionModel?.targetBattery ?? '—' })
              }}</span>
            </div>
          </div>
          <div
            class="mt-3 flex justify-between border-t border-white/10 pt-3 text-[11px] text-surface-300"
          >
            <span>{{
              t('起始 {battery}%', { battery: store.sessionModel?.initialBattery ?? '—' })
            }}</span
            ><span>{{
              t('目标 {battery}%', { battery: store.sessionModel?.targetBattery ?? '—' })
            }}</span>
          </div>
          <ChargingEnergyFlow
            class="mt-3 text-primary-300"
            :connected="store.plugConnected"
            :active="store.isCharging && data.speed > 0"
            :battery="battery"
          />
          <div class="mt-2 text-center">
            <p v-if="store.phase === 'charging'" class="text-sm font-semibold">
              {{ t('预计还需 {minutes} 分钟达到目标电量', { minutes: remainingMinutes }) }}
            </p>
            <p v-else class="text-sm font-semibold">{{ t(phaseLabel) }}</p>
            <p
              v-if="store.phase === 'charging' && store.sessionModel?.clockScale === 60"
              class="mt-2 text-[11px] text-surface-300"
            >
              {{
                t('按当前演示速度约 {seconds} 秒', { seconds: Math.ceil(remainingSeconds / 60) })
              }}
            </p>
          </div>
        </section>
        <div class="min-w-0 space-y-4">
          <dl class="grid grid-cols-2 gap-3">
            <div class="account-card p-3">
              <dt class="text-xs text-surface-500 dark:text-surface-400">{{ t('当前功率') }}</dt>
              <dd
                class="mt-2 text-xl font-bold tabular-nums text-primary-700 dark:text-primary-300"
              >
                {{ formatPower(data.speed) }}
              </dd>
            </div>
            <div class="account-card p-3">
              <dt class="text-xs text-surface-500 dark:text-surface-400">{{ t('已充电量') }}</dt>
              <dd class="mt-2 text-xl font-bold tabular-nums">
                {{ data.energy.toFixed(2) }}<span class="ml-1 text-xs font-normal">kWh</span>
              </dd>
            </div>
            <div class="account-card p-3">
              <dt class="text-xs text-surface-500 dark:text-surface-400">{{ t('充电时长') }}</dt>
              <dd class="mt-2 text-lg font-bold tabular-nums">
                {{ formatDuration(Math.floor(data.duration), 'hms') }}
              </dd>
            </div>
            <div class="account-card p-3">
              <dt class="text-xs text-surface-500 dark:text-surface-400">{{ t('当前费用') }}</dt>
              <dd class="mt-2 text-lg font-bold tabular-nums">{{ formatPrice(data.cost) }}</dd>
            </div>
          </dl>
          <section v-if="store.sessionModel" class="account-card p-4">
            <h3 class="mb-3 text-sm font-bold">{{ t('功率与充电阶段') }}</h3>
            <ChargingCurve
              :model="store.sessionModel"
              :elapsed-seconds="data.duration"
              :stopped="!store.isCharging"
            />
            <div class="mt-4 border-t border-surface-100 pt-3 dark:border-surface-700">
              <p class="text-xs font-semibold text-primary-800 dark:text-primary-200">
                {{ t(stageTitle) }}
              </p>
              <p class="mt-1 text-xs leading-5 text-surface-500 dark:text-surface-400">
                {{ t(stageDescription) }}
              </p>
            </div>
          </section>
        </div>
      </div>
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
        <p v-if="store.stopReason === 'target'" class="mt-2 text-xs">
          {{ t('已达到目标电量，输出已自动停止，不再增加费用。') }}
        </p>
      </div>
      <p
        v-if="store.failure"
        class="rounded-xl bg-danger-50 p-4 text-sm leading-6 text-danger-700 dark:bg-danger-900/20 dark:text-danger-300"
        role="alert"
      >
        {{ t(store.failure) }}
      </p>
      <section v-if="store.sessionModel" class="account-card space-y-3 text-xs">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="font-bold">{{ t('本次补能计划') }}</h3>
          <span class="text-surface-500 dark:text-surface-400">{{
            t('计划补入 {energy} kWh', { energy: store.sessionModel.targetEnergy.toFixed(1) })
          }}</span>
        </div>
        <dl class="grid grid-cols-2 gap-3">
          <div>
            <dt class="text-surface-500 dark:text-surface-400">{{ t('有效功率上限') }}</dt>
            <dd class="mt-1 font-semibold">{{ store.sessionModel.powerKw }} kW</dd>
          </div>
          <div>
            <dt class="text-surface-500 dark:text-surface-400">{{ t('预计目标费用') }}</dt>
            <dd class="mt-1 font-semibold">{{ formatPrice(targetCost) }}</dd>
          </div>
        </dl>
        <p class="leading-5 text-surface-500 dark:text-surface-400">
          {{
            t('本次锁定电价 {price}/kWh，费用含 10% 演示服务费；停车费及优惠另计。', {
              price: formatPrice(store.sessionStation?.currentPrice)
            })
          }}
        </p>
        <details class="text-surface-500 dark:text-surface-400">
          <summary class="min-h-8 cursor-pointer py-1">{{ t('车辆与枪位参数') }}</summary>
          <p class="mt-1 leading-5">
            {{
              t('车辆上限 {vehicle} kW · 枪位上限 {connector} kW', {
                vehicle: store.sessionVehicle?.maxPower ?? '—',
                connector: store.sessionConnector?.power ?? '—'
              })
            }}
          </p>
          <p class="mt-1 break-all font-mono">{{ store.sessionConnector?.id }}</p>
        </details>
      </section>
      <p class="text-center text-[11px] leading-5 text-surface-400">
        {{ t('模拟充电')
        }}{{
          t(
            store.sessionModel?.clockScale === 60
              ? ' · 60× 演示速度，1 秒对应 1 分钟'
              : ' · 正常速度'
          )
        }}<br />{{ t('返回地图可继续查看站点，不会结束充电。') }} <br />{{
          t('曲线与计量来自同一模拟模型，不是车辆遥测数据。')
        }}
      </p>
    </div>
    <div class="glass-effect shrink-0 border-t p-4">
      <button
        v-if="store.isCharging"
        class="action-secondary w-full border-danger-200 text-danger-700 hover:bg-danger-50 dark:border-danger-800 dark:text-danger-300 dark:hover:bg-danger-900/20"
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
import { chargingDurationSeconds, POWER_CURVE_VERSION } from '../../utils/chargingModel'
import { energyAmounts } from '../../utils/chargingCost'
import ChargingCurve from './ChargingCurve.vue'
import ChargingEnergyFlow from './ChargingEnergyFlow.vue'
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
const remainingSeconds = computed(() =>
  Math.max(0, chargingDurationSeconds(store.sessionModel) - data.value.duration)
)
const remainingMinutes = computed(() => Math.ceil(remainingSeconds.value / 60))
const targetCost = computed(
  () =>
    energyAmounts(store.sessionModel?.targetEnergy || 0, store.sessionStation?.currentPrice || 0)
      .totalAmount
)
const flowSteps = ['已连接', '充电', '停止输出', '拔枪归位']
const flowIndex = computed(() =>
  ['finished', 'paid'].includes(store.phase)
    ? 3
    : ['awaiting_unplug', 'interrupted'].includes(store.phase)
      ? 2
      : store.sessionModel
        ? 1
        : 0
)
const outputLabel = computed(() =>
  store.phase === 'stopping'
    ? '等待停止应答'
    : store.isCharging && data.value.speed > 0
      ? '正在补能'
      : '输出已停止'
)
const stageTitle = computed(() => {
  if (!store.isCharging) return '输出已停止'
  if (store.phase === 'stopping') return '等待停止应答'
  if (data.value.speed === 0) return '目标已到，等待停止确认'
  if (store.sessionModel?.powerCurve !== POWER_CURVE_VERSION || battery.value < 60)
    return '稳定补能阶段'
  return battery.value < 85 ? '逐步降功率阶段' : '接近目标，温和补能'
})
const stageDescription = computed(() => {
  if (!store.isCharging) return '已记录的电量与费用保持不变；虚线仅为原目标预测。'
  if (store.phase === 'stopping') return '正在等待设备确认停止；确认完成前请勿拔枪。'
  if (data.value.speed === 0) return '已达到所选目标，不再增加电量与费用；仍须等待设备停止后拔枪。'
  if (store.sessionModel?.powerCurve !== POWER_CURVE_VERSION)
    return '此历史会话沿用原有恒功率模型，保持计量一致。'
  return battery.value < 60
    ? '当前按车辆与枪位中较低的功率上限补能，60% 后将模拟逐渐降功率。'
    : '模拟电量升高后的降功率过程，剩余时间已按曲线重新计算，不是设备故障。'
})
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
