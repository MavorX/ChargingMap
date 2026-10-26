<template>
  <PanelShell title="预约充电桩" :busy="isSubmitting" @close="emit('close')">
    <div class="glass-effect flex shrink-0 items-center justify-between p-4">
      <button class="icon-button" aria-label="返回" :disabled="isSubmitting" @click="emit('close')">
        <i class="fa fa-arrow-left" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold">预约充电桩</h2>
      <span class="w-10"></span>
    </div>
    <div class="flex-1 space-y-6 overflow-y-auto p-5">
      <p class="text-xs text-surface-400">模拟预约，不涉及真实枪位</p>
      <div class="premium-card p-4">
        <h3 class="mb-1 break-words font-bold">
          {{ currentStation?.stationName || '请先选择站点' }}
        </h3>
        <p class="text-xs leading-6 text-surface-500 dark:text-surface-400">
          {{ currentStation?.address }}
        </p>
      </div>
      <p
        v-if="currentStation && !currentStation.reservationAvailable"
        class="text-sm text-surface-500"
        role="status"
      >
        该站点暂不支持预约，请返回选择其他站点。
      </p>
      <fieldset class="min-w-0 space-y-6" :disabled="isSubmitting">
        <section>
          <h3 class="section-title">选择充电桩</h3>
          <div class="space-y-2" role="group" aria-label="选择充电桩">
            <button
              v-for="connector in availableConnectors"
              :key="connector.id"
              class="choice-card"
              :aria-pressed="selectedConnector === connector.id"
              @click="selectedConnector = connector.id"
            >
              <i class="fa fa-bolt shrink-0 text-secondary-600" aria-hidden="true"></i
              ><span class="min-w-0 flex-1"
                ><span class="block break-words text-sm font-semibold">{{
                  connector.connectorName
                }}</span
                ><span class="mt-1 block text-xs text-surface-500"
                  >{{ connector.power }} kW · {{ connector.connectorType }}</span
                ></span
              ><i
                v-if="selectedConnector === connector.id"
                class="fa fa-check shrink-0 text-primary-500"
                aria-hidden="true"
              ></i>
            </button>
            <p
              v-if="!availableConnectors.length"
              class="info-row text-sm text-surface-500"
              role="status"
            >
              当前没有可用的充电桩，请返回站点详情检查。
            </p>
          </div>
        </section>
        <section>
          <h3 class="section-title">选择日期</h3>
          <div class="flex gap-2 overflow-x-auto p-1 pb-3" role="group" aria-label="选择日期">
            <button
              v-for="date in dateOptions"
              :key="date.value"
              class="shrink-0 rounded-xl border px-4 py-3 text-center text-xs transition-colors"
              :class="
                selectedDate === date.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'border-surface-200 dark:border-surface-700'
              "
              :aria-pressed="selectedDate === date.value"
              @click="selectedDate = date.value"
            >
              <span class="block">{{ date.label }}</span
              ><span class="mt-1 block text-sm font-semibold">{{ date.day }}</span>
            </button>
          </div>
        </section>
        <section>
          <h3 class="section-title">选择时间段</h3>
          <div class="grid grid-cols-2 gap-2" role="group" aria-label="选择时间段">
            <button
              v-for="slot in timeSlots"
              :key="slot.value"
              class="rounded-xl border px-2 py-3 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              :class="
                selectedTimeSlot === slot.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                  : 'border-surface-200 dark:border-surface-700'
              "
              :aria-pressed="selectedTimeSlot === slot.value"
              :disabled="!slot.available"
              @click="selectedTimeSlot = slot.value"
            >
              <span class="block text-sm font-semibold tabular-nums">{{ slot.value }}</span
              ><span class="mt-1 block text-xs text-surface-500">{{ slot.reason }}</span>
            </button>
          </div>
          <p
            v-if="timeSlots.every((slot) => !slot.available)"
            class="mt-3 text-xs leading-6 text-surface-500"
            role="status"
          >
            该日期暂无可预约时段，请选择其他日期。
          </p>
        </section>
        <section>
          <h3 class="section-title">选择车辆</h3>
          <div class="space-y-2" role="group" aria-label="选择车辆">
            <button
              v-for="vehicle in vehicles"
              :key="vehicle.id"
              class="choice-card"
              :aria-pressed="selectedVehicle === vehicle.id"
              @click="selectedVehicle = vehicle.id"
            >
              <i class="fa fa-car shrink-0 text-primary-500" aria-hidden="true"></i
              ><span class="min-w-0 flex-1"
                ><span class="block break-words text-sm font-semibold">{{ vehicle.model }}</span
                ><span class="mt-1 block text-xs text-surface-500">{{
                  vehicle.connectorType
                }}</span></span
              ><i
                v-if="selectedVehicle === vehicle.id"
                class="fa fa-check shrink-0 text-primary-500"
                aria-hidden="true"
              ></i>
            </button>
          </div>
          <div v-if="!vehicles.length" class="info-row flex-col items-start gap-3 text-sm">
            <p>预约前需要先添加车辆。</p>
            <button class="text-primary-600 dark:text-primary-400" @click="emit('show-vehicles')">
              前往添加车辆<i class="fa fa-angle-right ml-2" aria-hidden="true"></i>
            </button>
          </div>
        </section>
        <section>
          <h3 class="section-title">预计充电量</h3>
          <div class="premium-card flex min-w-0 items-center gap-3 p-4">
            <button
              class="icon-button shrink-0 bg-surface-100 dark:bg-surface-800"
              aria-label="减少充电量"
              :disabled="chargeAmount <= 10"
              @click="chargeAmount -= 10"
            >
              <i class="fa fa-minus" aria-hidden="true"></i></button
            ><output
              class="min-w-0 flex-1 text-center text-2xl font-bold tabular-nums text-primary-600 dark:text-primary-400"
              >{{ chargeAmount
              }}<span class="ml-1 text-xs font-normal text-surface-500">kWh</span></output
            ><button
              class="icon-button shrink-0 bg-surface-100 dark:bg-surface-800"
              aria-label="增加充电量"
              :disabled="chargeAmount >= 100"
              @click="chargeAmount += 10"
            >
              <i class="fa fa-plus" aria-hidden="true"></i>
            </button>
          </div>
        </section>
      </fieldset>
      <dl class="premium-card space-y-3 p-4 text-sm">
        <div class="flex flex-wrap justify-between gap-2">
          <dt class="text-surface-500">预约日期</dt>
          <dd>{{ selectedDate }}</dd>
        </div>
        <div class="flex flex-wrap justify-between gap-2">
          <dt class="text-surface-500">时间段</dt>
          <dd>{{ selectedTimeSlot || '请选择时间段' }}</dd>
        </div>
        <div class="flex flex-wrap justify-between gap-2">
          <dt class="text-surface-500">预计费用（含 10% 服务费）</dt>
          <dd class="font-bold text-primary-600 dark:text-primary-400">
            {{ formatPrice(estimatedCost) }}
          </dd>
        </div>
      </dl>
      <p class="text-xs leading-6 text-surface-500">
        当前为本地预约演示，不会锁定真实充电桩；已开始的时段不可预约。
      </p>
    </div>
    <div class="glass-effect shrink-0 border-t p-4">
      <button
        class="action-primary"
        :disabled="!canSubmit || isSubmitting"
        :aria-busy="isSubmitting"
        @click="submitReservation"
      >
        <i v-if="isSubmitting" class="fa fa-circle-o-notch fa-spin" aria-hidden="true"></i
        >{{ isSubmitting ? '正在预约…' : '确认预约' }}
      </button>
    </div>
  </PanelShell>
</template>

<script setup>
import PanelShell from '../common/PanelShell.vue'
import { ref, computed, inject, watch, onMounted, onUnmounted } from 'vue'
import { useStationsStore } from '../../store/modules/stations'
import { useReservationStore } from '../../store/modules/reservation'
import { useUserStore } from '../../store/modules/user'
import { calculatePaymentAmounts } from '../../store/modules/charging'
import { useAvailableConnectors } from '../../composables/useAvailableConnectors'
import { reservationDateValue, reservationSlotsFor } from '../../utils/reservationSlots'
import { formatPrice } from '../../utils/format'
const emit = defineEmits(['close', 'reservation-success', 'show-vehicles'])
const stationsStore = useStationsStore()
const reservationStore = useReservationStore()
const userStore = useUserStore()
const showToast = inject('showToast')
const currentStation = computed(() => stationsStore.currentStation)
const vehicles = computed(() => userStore.vehicles)
const availableConnectors = useAvailableConnectors(currentStation)
const selectedConnector = ref('')
const selectedDate = ref('')
const selectedTimeSlot = ref('')
const selectedVehicle = ref('')
const chargeAmount = ref(50)
const isSubmitting = ref(false)
const now = ref(new Date())
let clock
onMounted(() => {
  clock = setInterval(() => {
    now.value = new Date()
  }, 30000)
})
onUnmounted(() => clearInterval(clock))
watch(
  availableConnectors,
  (connectors) => {
    if (!connectors.some((connector) => connector.id === selectedConnector.value))
      selectedConnector.value = connectors[0]?.id || ''
  },
  { immediate: true }
)
watch(
  vehicles,
  (list) => {
    if (!list.some((vehicle) => vehicle.id === selectedVehicle.value))
      selectedVehicle.value = list[0]?.id || ''
  },
  { immediate: true, deep: true }
)
const dateOptions = computed(() =>
  Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.value)
    date.setDate(date.getDate() + index)
    return {
      value: reservationDateValue(date),
      label:
        index === 0
          ? '今天'
          : index === 1
            ? '明天'
            : ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()],
      day: `${date.getMonth() + 1}/${date.getDate()}`
    }
  })
)
watch(
  dateOptions,
  (dates) => {
    if (!dates.some((date) => date.value === selectedDate.value))
      selectedDate.value = dates[0].value
  },
  { immediate: true }
)
const timeSlots = computed(() => reservationSlotsFor(selectedDate.value, now.value))
watch(timeSlots, (slots) => {
  if (!slots.some((slot) => slot.available && slot.value === selectedTimeSlot.value))
    selectedTimeSlot.value = ''
})
const estimatedCost = computed(
  () =>
    calculatePaymentAmounts({
      energy: chargeAmount.value,
      price: currentStation.value?.currentPrice
    }).totalAmount
)
const canSubmit = computed(
  () =>
    currentStation.value?.openStatus === 1 &&
    currentStation.value.reservationAvailable &&
    Number.isFinite(currentStation.value.currentPrice) &&
    availableConnectors.value.some((connector) => connector.id === selectedConnector.value) &&
    vehicles.value.some((vehicle) => vehicle.id === selectedVehicle.value) &&
    timeSlots.value.some((slot) => slot.available && slot.value === selectedTimeSlot.value)
)
const submitReservation = async () => {
  now.value = new Date()
  if (isSubmitting.value || !canSubmit.value) return
  isSubmitting.value = true
  const station = currentStation.value
  const connector = availableConnectors.value.find((item) => item.id === selectedConnector.value)
  const vehicle = vehicles.value.find((item) => item.id === selectedVehicle.value)
  try {
    await reservationStore.createReservation({
      stationId: station.stationId,
      stationName: station.stationName,
      stationAddress: station.address,
      date: selectedDate.value,
      timeSlot: selectedTimeSlot.value,
      connectorId: connector.id,
      connectorName: connector.connectorName,
      vehicleModel: vehicle.model,
      chargeAmount: chargeAmount.value
    })
    emit('reservation-success')
  } catch (error) {
    showToast(error.message || '预约失败，请重试', 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>
