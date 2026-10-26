<template>
  <PanelShell title="充电设置" :busy="isConnecting" @close="close">
    <div class="glass-effect flex shrink-0 items-center justify-between p-4">
      <button class="icon-button" aria-label="返回" :disabled="isConnecting" @click="close">
        <i class="fa fa-arrow-left" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold">充电设置</h2>
      <span class="w-10"></span>
    </div>
    <div class="flex-1 space-y-5 overflow-y-auto p-5">
      <div class="space-y-1">
        <p class="text-xs font-medium text-primary-600 dark:text-primary-400">
          选择充电桩 → 连接充电枪 → 开始充电
        </p>
        <h3 class="break-words text-base font-bold">
          {{ station?.stationName || '请先选择充电站' }}
        </h3>
        <p class="text-xs leading-5 text-surface-500">{{ station?.address }}</p>
      </div>
      <fieldset
        class="min-w-0 space-y-5"
        :disabled="showConnectionPrompt || store.isCharging || store.paymentPending"
      >
        <section>
          <h3 id="connector-heading" class="section-title">选择充电桩</h3>
          <div
            class="grid gap-2 min-[380px]:grid-cols-2"
            role="group"
            aria-labelledby="connector-heading"
          >
            <button
              v-for="connector in connectors"
              :key="connector.id"
              type="button"
              class="choice-card min-w-0 p-3"
              :aria-pressed="connectorId === connector.id"
              @click="connectorId = connector.id"
            >
              <i
                class="fa fa-bolt shrink-0 text-primary-600 dark:text-primary-400"
                aria-hidden="true"
              ></i>
              <span class="min-w-0 flex-1"
                ><span class="block break-words text-sm font-semibold">{{
                  connector.connectorName
                }}</span
                ><span class="mt-1 block text-xs text-surface-500"
                  >{{ connector.power }} kW · {{ connector.connectorType }}</span
                ></span
              >
              <i
                v-if="connectorId === connector.id"
                class="fa fa-check text-primary-600"
                aria-hidden="true"
              ></i>
            </button>
          </div>
          <p v-if="!connectors.length" class="info-row text-sm text-surface-500" role="status">
            {{
              station?.detailsLoaded
                ? '当前没有可用的充电桩，请返回选择其他站点。'
                : '正在加载充电桩信息…'
            }}
          </p>
          <p v-else class="mt-2 text-xs leading-5 text-surface-500">
            请选择车位旁对应的充电桩，确认接口与车辆匹配。
          </p>
        </section>
        <section>
          <label for="charging-vehicle" class="mb-2 block text-sm font-semibold">充电车辆</label>
          <select id="charging-vehicle" v-model="vehicleId" class="input-premium">
            <option value="">请选择车辆</option>
            <option v-for="vehicle in user.vehicles" :key="vehicle.id" :value="vehicle.id">
              {{ vehicle.model }} · {{ vehicle.connectorType }}
            </option>
          </select>
          <div class="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span class="text-surface-500">{{
              selectedVehicle?.batteryCapacityKwh
                ? `${selectedVehicle.batteryCapacityKwh} kWh · 最高 ${selectedVehicle.maxPower || '—'} kW`
                : '可在我的车辆中完善电池容量与功率'
            }}</span>
            <button
              class="min-h-10 font-semibold text-primary-600 dark:text-primary-400"
              @click="emit('show-vehicles')"
            >
              {{ user.vehicles.length ? '管理车辆' : '添加车辆' }}
            </button>
          </div>
        </section>
        <section class="grid grid-cols-2 gap-3">
          <div>
            <label for="initial-soc" class="mb-2 block text-sm font-semibold">当前电量（%）</label
            ><input
              id="initial-soc"
              v-model.number="initialBattery"
              class="input-premium"
              type="number"
              min="0"
              max="99"
            />
          </div>
          <div>
            <label for="target-soc" class="mb-2 block text-sm font-semibold">目标电量（%）</label
            ><input
              id="target-soc"
              v-model.number="targetBattery"
              class="input-premium"
              type="number"
              min="1"
              max="100"
            />
          </div>
        </section>
        <dl v-if="model" class="premium-card space-y-3 p-4 text-sm">
          <div class="flex justify-between gap-2">
            <dt class="text-surface-500">预计充入</dt>
            <dd class="font-semibold tabular-nums">{{ model.targetEnergy.toFixed(1) }} kWh</dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-surface-500">预计费用<span class="text-xs">（含服务费）</span></dt>
            <dd class="font-semibold tabular-nums">{{ formatPrice(estimatedCost) }}</dd>
          </div>
          <p class="text-xs leading-5 text-surface-500">
            按 {{ model.powerKw }} kW 估算，约
            {{ Math.ceil((model.targetEnergy / model.powerKw) * 60) }} 分钟，以结束时的电量结算。
          </p>
        </dl>
        <div
          class="flex items-center justify-between gap-3 rounded-xl bg-surface-50 p-3 text-xs dark:bg-surface-800/60"
        >
          <span class="leading-5 text-surface-500"
            >演示进度<br />{{
              clockScale === 60 ? '1 秒演示 1 分钟充电过程' : '按正常时间演示充电过程'
            }}</span
          >
          <select
            id="demo-speed"
            v-model.number="clockScale"
            aria-label="演示速度"
            class="rounded-lg border border-surface-200 bg-white p-2 font-semibold dark:border-surface-700 dark:bg-surface-900"
          >
            <option :value="60">60× 加速</option>
            <option :value="1">正常速度</option>
          </select>
        </div>
      </fieldset>
    </div>
    <div class="glass-effect shrink-0 space-y-2 border-t p-4">
      <p v-if="validationError" class="text-xs leading-5 text-surface-500" role="status">
        {{ validationError }}
      </p>
      <button
        class="action-primary"
        :disabled="!model || showConnectionPrompt || store.isCharging || store.paymentPending"
        @click="requestConnection"
      >
        下一步 · 连接充电枪
      </button>
    </div>
    <DialogModal
      v-if="showConnectionPrompt"
      :title="isConnecting ? '正在检测连接' : connectionError ? '连接未完成' : '请插好充电枪'"
      :busy="isConnecting"
      @close="cancelConnection"
    >
      <div class="mb-4 flex justify-center" aria-hidden="true">
        <span
          class="flex h-20 w-20 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
          ><i
            :class="isConnecting ? 'fa fa-circle-o-notch fa-spin' : 'fa fa-plug'"
            class="text-3xl"
          ></i
        ></span>
      </div>
      <p class="mb-3 text-center text-sm leading-6 text-surface-600 dark:text-surface-300">
        请停稳车辆，将下方充电枪插入车辆充电口并确认插紧。
      </p>
      <div class="mb-4 space-y-1 rounded-xl bg-surface-50 p-3 text-sm dark:bg-surface-800">
        <p class="font-semibold">
          {{ store.preparation?.connector.connectorName }} · {{ store.preparation?.vehicle.model }}
        </p>
        <p class="break-all font-mono text-xs text-surface-500">
          {{ store.preparation?.connector.id }}
        </p>
      </div>
      <ol v-if="isConnecting" class="mb-4 space-y-3 text-sm" role="status" aria-live="polite">
        <li class="flex items-center gap-3">
          <i
            :class="
              store.phase === 'starting'
                ? 'fa fa-check-circle text-secondary-600'
                : 'fa fa-circle-o-notch fa-spin text-primary-600'
            "
            aria-hidden="true"
          ></i
          >{{ store.phase === 'starting' ? '充电枪连接正常' : '正在检测充电枪连接…' }}
        </li>
        <li class="flex items-center gap-3">
          <i
            :class="
              store.phase === 'starting'
                ? 'fa fa-circle-o-notch fa-spin text-primary-600'
                : 'fa fa-circle-o text-surface-400'
            "
            aria-hidden="true"
          ></i
          >{{
            store.phase === 'starting' ? '车辆通信正常，正在启动充电…' : '等待车辆通信与充电启动'
          }}
        </li>
      </ol>
      <p
        v-if="connectionError"
        class="mb-4 rounded-xl bg-danger-50 p-3 text-sm leading-6 text-danger-700 dark:bg-danger-900/20 dark:text-danger-300"
        role="alert"
      >
        {{ connectionError }}
      </p>
      <button class="action-primary" :disabled="isConnecting" @click="confirmConnection">
        {{ isConnecting ? '检测中，请稍候…' : connectionError ? '重新检测' : '已插好，开始检测' }}
      </button>
      <button
        class="mt-2 min-h-11 w-full text-sm text-surface-500"
        :disabled="isConnecting"
        @click="cancelConnection"
      >
        {{ connectionError ? '返回选择充电桩' : '暂未插好，返回' }}
      </button>
      <p class="mt-3 text-center text-[11px] text-surface-400">演示流程，不连接真实设备</p>
    </DialogModal>
  </PanelShell>
</template>

<script setup>
import { computed, inject, onBeforeUnmount, ref, watch } from 'vue'
import PanelShell from '../common/PanelShell.vue'
import DialogModal from '../common/DialogModal.vue'
import { useStationsStore } from '../../store/modules/stations'
import { useChargingStore, calculatePaymentAmounts } from '../../store/modules/charging'
import { useUserStore } from '../../store/modules/user'
import { useAvailableConnectors } from '../../composables/useAvailableConnectors'
import { validateChargingSetup } from '../../utils/chargingModel'
import { formatPrice } from '../../utils/format'

const emit = defineEmits(['close', 'start-charging', 'show-vehicles'])
const stations = useStationsStore()
const store = useChargingStore()
const user = useUserStore()
const toast = inject('showToast')
const station = computed(() => stations.currentStation)
const connectors = useAvailableConnectors(station)
const draft = store.setupDraft?.stationId === station.value?.stationId ? store.setupDraft : null
const connectorId = ref(draft?.connectorId || '')
const vehicleId = ref(
  draft?.vehicleId ||
    user.vehicles.find((vehicle) =>
      connectors.value.some((connector) => connector.connectorType === vehicle.connectorType)
    )?.id ||
    user.vehicles[0]?.id ||
    ''
)
const initialBattery = ref(draft?.initialBattery ?? 35)
const targetBattery = ref(draft?.targetBattery ?? store.settings.targetBattery)
const clockScale = ref(draft?.clockScale ?? 60)
const showConnectionPrompt = ref(false)
const isConnecting = ref(false)
const connectionError = ref('')
const selectedConnector = computed(() =>
  connectors.value.find((connector) => connector.id === connectorId.value)
)
const selectedVehicle = computed(() =>
  user.vehicles.find((vehicle) => vehicle.id === vehicleId.value)
)
const setup = computed(() => ({
  station: station.value,
  connector: selectedConnector.value,
  vehicle: selectedVehicle.value,
  initialBattery: initialBattery.value,
  targetBattery: targetBattery.value,
  clockScale: clockScale.value
}))
const validationError = computed(() => {
  if (!station.value) return '请先选择充电站'
  if (!selectedConnector.value) return '请选择一个可用的充电桩，再连接对应的充电枪'
  try {
    validateChargingSetup(setup.value)
    return ''
  } catch (error) {
    return error.message
  }
})
const model = computed(() => (validationError.value ? null : validateChargingSetup(setup.value)))
const estimatedCost = computed(() =>
  model.value
    ? calculatePaymentAmounts({
        energy: model.value.targetEnergy,
        price: station.value.currentPrice
      }).totalAmount
    : 0
)
watch(
  connectors,
  (list) => {
    if (!list.some((connector) => connector.id === connectorId.value)) connectorId.value = ''
  },
  { immediate: true }
)
watch(
  () => user.vehicles.map((vehicle) => vehicle.id),
  (ids) => {
    if (!ids.includes(vehicleId.value)) vehicleId.value = ''
  }
)
watch(
  [connectorId, vehicleId, initialBattery, targetBattery, clockScale],
  () => {
    store.setupDraft = {
      stationId: station.value?.stationId,
      connectorId: connectorId.value,
      vehicleId: vehicleId.value,
      initialBattery: initialBattery.value,
      targetBattery: targetBattery.value,
      clockScale: clockScale.value
    }
  },
  { immediate: true }
)
const requestConnection = () => {
  if (!model.value || showConnectionPrompt.value || store.isCharging || store.paymentPending) return
  try {
    store.prepareSession({
      connectorId: connectorId.value,
      vehicleId: vehicleId.value,
      initialBattery: initialBattery.value,
      targetBattery: targetBattery.value,
      clockScale: clockScale.value
    })
    connectionError.value = ''
    showConnectionPrompt.value = true
  } catch (error) {
    toast(error.message, 'error')
  }
}
const confirmConnection = async () => {
  if (isConnecting.value) return
  isConnecting.value = true
  connectionError.value = ''
  try {
    if (store.phase === 'fault') store.recoverDeviceResponse()
    store.connectPlug()
    store.identifyConnector(store.preparation.connector.id)
    await store.checkReadiness()
    await store.startCharging()
    showConnectionPrompt.value = false
    emit('start-charging')
  } catch (error) {
    connectionError.value = error.message
  } finally {
    isConnecting.value = false
  }
}
const cancelConnection = () => {
  if (isConnecting.value) return
  store.cancelPreparation()
  showConnectionPrompt.value = false
  connectionError.value = ''
}
const close = () => {
  if (isConnecting.value) return
  if (showConnectionPrompt.value) cancelConnection()
  emit('close')
}
onBeforeUnmount(() => {
  if (store.preparation && !store.isCharging && !store.paymentPending) store.abortConnection()
})
</script>
