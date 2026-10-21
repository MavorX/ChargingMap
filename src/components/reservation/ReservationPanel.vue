<template>
  <div class="panel-overlay">
    <div class="panel-backdrop" @click="$emit('close')"></div>
    <div class="panel-content">
      <div
        class="glass-effect z-10 flex flex-shrink-0 items-center justify-between border-b border-surface-200/50 p-4 dark:border-surface-700/50"
      >
        <button class="icon-button" @click="$emit('close')">
          <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
        </button>
        <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">预约充电桩</h2>
        <div class="w-10"></div>
      </div>

      <div class="flex-1 overflow-y-auto p-5">
        <div class="premium-card animate-in mb-6 p-5">
          <div class="flex items-start space-x-3">
            <div
              class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 shadow-md"
            >
              <i class="fa fa-map-marker text-lg text-white" aria-hidden="true"></i>
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="mb-1 text-base font-bold text-surface-900 dark:text-surface-100">
                {{ currentStation?.stationName }}
              </h3>
              <p class="truncate text-sm text-surface-500 dark:text-surface-400">
                {{ currentStation?.address }}
              </p>
            </div>
          </div>
        </div>

        <div class="animate-in mb-6 delay-100">
          <label class="section-title block">
            <div
              class="mr-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-warning-400 to-orange-500 shadow-md"
            >
              <i class="fa fa-bolt text-xs text-white" aria-hidden="true"></i>
            </div>
            选择充电桩
          </label>
          <div class="space-y-2.5">
            <div
              v-for="(connector, index) in availableConnectors"
              :key="connector.id"
              class="premium-card animate-in group relative cursor-pointer overflow-hidden p-4 transition-all duration-300"
              :class="
                selectedConnector === connector.id
                  ? 'shadow-glow-primary ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-surface-900'
                  : 'hover:-translate-y-0.5 hover:shadow-soft-md'
              "
              :style="{ animationDelay: `${index * 80}ms` }"
              @click="selectedConnector = connector.id"
            >
              <div class="relative z-10 flex items-center justify-between">
                <div class="flex min-w-0 flex-1 items-center">
                  <div
                    class="mr-3.5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-secondary-400 to-emerald-500 shadow-md transition-transform duration-300 group-hover:scale-105"
                  >
                    <i class="fa fa-bolt text-lg text-white" aria-hidden="true"></i>
                  </div>
                  <div class="min-w-0">
                    <h4 class="mb-0.5 text-sm font-bold text-surface-800 dark:text-surface-200">
                      {{ connector.connectorName }}
                    </h4>
                    <p class="text-xs text-surface-500 dark:text-surface-400">
                      {{ connector.power }}kW · {{ connector.connectorType }}
                    </p>
                  </div>
                </div>
                <div
                  v-if="selectedConnector === connector.id"
                  class="flex h-8 w-8 animate-scale-in items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 shadow-md"
                >
                  <i class="fa fa-check text-sm text-white" aria-hidden="true"></i>
                </div>
              </div>
            </div>
            <div v-if="availableConnectors.length === 0" class="animate-in py-10 text-center">
              <div
                class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800"
              >
                <i class="fa fa-bolt text-2xl text-surface-400" aria-hidden="true"></i>
              </div>
              <p class="text-sm font-medium text-surface-600 dark:text-surface-300">
                当前没有可用的充电桩
              </p>
            </div>
          </div>
        </div>

        <div class="animate-in mb-6 delay-200">
          <label class="section-title block">
            <div
              class="mr-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-blue-500 shadow-md"
            >
              <i class="fa fa-calendar text-xs text-white" aria-hidden="true"></i>
            </div>
            选择日期
          </label>
          <div class="-mx-1 flex space-x-3 overflow-x-auto px-1 pb-2">
            <button
              v-for="(date, index) in dateOptions"
              :key="index"
              class="group min-w-[90px] flex-shrink-0 rounded-xl border-2 px-5 py-4 text-center transition-all duration-300 hover:-translate-y-0.5"
              :class="
                selectedDate === date.value
                  ? 'border-primary-500 bg-primary-50 shadow-glow-primary dark:bg-primary-900/20'
                  : 'glass-card border-surface-200 dark:border-surface-700'
              "
              @click="selectedDate = date.value"
            >
              <p
                class="mb-1.5 text-[10px] font-medium uppercase tracking-wide"
                :class="selectedDate === date.value ? 'text-primary-600' : 'text-surface-500'"
              >
                {{ date.label }}
              </p>
              <p
                class="text-lg font-bold"
                :class="
                  selectedDate === date.value
                    ? 'gradient-text'
                    : 'text-surface-800 dark:text-surface-200'
                "
              >
                {{ date.day }}
              </p>
            </button>
          </div>
        </div>

        <div class="animate-in mb-6 delay-300">
          <label class="section-title block">
            <div
              class="mr-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-400 to-purple-500 shadow-md"
            >
              <i class="fa fa-clock-o text-xs text-white" aria-hidden="true"></i>
            </div>
            选择时间段
          </label>
          <div class="grid grid-cols-3 gap-2.5">
            <button
              v-for="slot in timeSlots"
              :key="slot.value"
              class="group relative overflow-hidden rounded-xl border-2 p-4 transition-all duration-300"
              :class="getTimeSlotClass(slot)"
              :disabled="!slot.available"
              @click="selectedTimeSlot = slot.value"
            >
              <div class="relative z-10">
                <p
                  class="mb-1 text-sm font-bold"
                  :class="
                    slot.available
                      ? selectedTimeSlot === slot.value
                        ? 'text-primary-600'
                        : 'text-surface-800 dark:text-surface-200'
                      : 'text-surface-400'
                  "
                >
                  {{ slot.label }}
                </p>
                <p
                  class="text-[10px] font-bold uppercase tracking-wide"
                  :class="slot.available ? 'text-secondary-500' : 'text-surface-400'"
                >
                  {{ slot.available ? '可预约' : '已满' }}
                </p>
              </div>
              <div
                v-if="!slot.available"
                class="absolute inset-0 bg-surface-50/50 backdrop-blur-[1px] dark:bg-surface-900/30"
              ></div>
            </button>
          </div>
        </div>

        <div class="animate-in delay-400 mb-6">
          <label class="section-title block">
            <div
              class="mr-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-secondary-400 to-teal-500 shadow-md"
            >
              <i class="fa fa-car text-xs text-white" aria-hidden="true"></i>
            </div>
            选择车辆
          </label>
          <div class="space-y-2.5">
            <div
              v-for="(vehicle, index) in vehicles"
              :key="vehicle.id"
              class="premium-card animate-in group cursor-pointer p-4 transition-all duration-300"
              :class="
                selectedVehicle === vehicle.id
                  ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-surface-900'
                  : 'hover:-translate-y-0.5 hover:shadow-soft-md'
              "
              :style="{ animationDelay: `${index * 80}ms` }"
              @click="selectedVehicle = vehicle.id"
            >
              <div class="flex items-center justify-between">
                <div class="flex min-w-0 flex-1 items-center">
                  <div
                    class="mr-3.5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-cyan-500 shadow-md transition-transform duration-300 group-hover:scale-105"
                  >
                    <i class="fa fa-car text-lg text-white" aria-hidden="true"></i>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-bold text-surface-800 dark:text-surface-200">
                      {{ vehicle.model }}
                    </p>
                    <p class="text-xs text-surface-500 dark:text-surface-400">
                      {{ vehicle.connectorType }}
                    </p>
                  </div>
                </div>
                <div
                  v-if="selectedVehicle === vehicle.id"
                  class="flex h-7 w-7 animate-scale-in items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 shadow-md"
                >
                  <i class="fa fa-check text-xs text-white" aria-hidden="true"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="animate-in mb-6 delay-500">
          <label class="section-title block">
            <div
              class="mr-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-warning-400 to-amber-500 shadow-md"
            >
              <i class="fa fa-battery-three-quarters text-xs text-white" aria-hidden="true"></i>
            </div>
            预计充电量
          </label>
          <div class="premium-card p-5">
            <div class="flex items-center space-x-4">
              <button
                class="group flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-xl bg-surface-100 shadow-inner-soft transition-all duration-200 hover:bg-surface-200 active:scale-90 dark:bg-surface-800 dark:hover:bg-surface-700"
                @click="chargeAmount = Math.max(10, chargeAmount - 10)"
              >
                <i
                  class="fa fa-minus text-surface-600 transition-colors duration-200 group-hover:text-danger-500"
                  aria-hidden="true"
                ></i>
              </button>

              <div class="flex-1 py-3 text-center">
                <div
                  class="inline-flex items-baseline space-x-2 rounded-2xl border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-accent-50 px-8 py-4 dark:border-primary-800 dark:from-primary-900/20 dark:to-accent-900/20"
                >
                  <span class="gradient-text text-4xl font-black">{{ chargeAmount }}</span>
                  <span class="text-lg font-bold text-surface-500">kWh</span>
                </div>
              </div>

              <button
                class="group flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-xl bg-surface-100 shadow-inner-soft transition-all duration-200 hover:bg-surface-200 active:scale-90 dark:bg-surface-800 dark:hover:bg-surface-700"
                @click="chargeAmount = Math.min(100, chargeAmount + 10)"
              >
                <i
                  class="fa fa-plus text-surface-600 transition-colors duration-200 group-hover:text-secondary-500"
                  aria-hidden="true"
                ></i>
              </button>
            </div>
          </div>
        </div>

        <div class="premium-card animate-in space-y-3 p-5 delay-500">
          <div
            class="flex items-center justify-between border-b border-surface-100 pb-3 dark:border-surface-700/50"
          >
            <span class="text-sm font-medium text-surface-600 dark:text-surface-400">充电站</span>
            <span class="text-sm font-bold text-surface-900 dark:text-surface-100">{{
              currentStation?.stationName
            }}</span>
          </div>
          <div
            class="flex items-center justify-between border-b border-surface-100 pb-3 dark:border-surface-700/50"
          >
            <span class="text-sm font-medium text-surface-600 dark:text-surface-400">预约时间</span>
            <span class="text-sm font-bold text-surface-900 dark:text-surface-100"
              >{{ selectedDate }} {{ selectedTimeSlot }}</span
            >
          </div>
          <div
            class="flex items-center justify-between border-b border-surface-100 pb-3 dark:border-surface-700/50"
          >
            <span class="text-sm font-medium text-surface-600 dark:text-surface-400"
              >预计充电量</span
            >
            <span class="text-sm font-bold text-surface-900 dark:text-surface-100"
              >{{ chargeAmount }} kWh</span
            >
          </div>
          <div
            class="flex items-center justify-between border-b border-surface-100 pb-3 dark:border-surface-700/50"
          >
            <span class="text-sm font-medium text-surface-600 dark:text-surface-400">当前电价</span>
            <span class="text-base font-bold text-primary-600"
              >{{ formatPrice(currentStation?.currentPrice) }}/度</span
            >
          </div>
          <div class="flex items-center justify-between pt-2">
            <span class="text-base font-bold text-surface-900 dark:text-surface-100">预计费用</span>
            <span class="gradient-text text-2xl font-black">{{ formatPrice(estimatedCost) }}</span>
          </div>
        </div>
      </div>

      <div
        class="glass-effect flex-shrink-0 border-t border-surface-200/50 p-4 dark:border-surface-700/50 lg:p-5"
      >
        <button
          class="group relative w-full transform overflow-hidden rounded-2xl bg-gradient-to-r from-warning-400 via-yellow-500 to-amber-500 py-4 font-bold text-white shadow-xl shadow-warning-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-warning-500/35 active:translate-y-0 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          :disabled="!canSubmit"
          @click="submitReservation"
        >
          <div
            class="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]"
          ></div>
          <span class="relative z-10 flex items-center justify-center space-x-2.5 text-base">
            <i class="fa fa-calendar-check-o text-lg" aria-hidden="true"></i>
            <span>确认预约</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, watch, watchEffect } from 'vue'
import { useStationsStore } from '../../store/modules/stations'
import { useReservationStore } from '../../store/modules/reservation'
import { useUserStore } from '../../store/modules/user'
import { useAvailableConnectors } from '../../composables/useAvailableConnectors'
import { formatPrice } from '../../utils/format'

const emit = defineEmits(['close', 'reservation-success'])
const stationsStore = useStationsStore()
const reservationStore = useReservationStore()
const userStore = useUserStore()
const showToast = inject('showToast')
const setLoading = inject('setLoading')

const currentStation = computed(() => stationsStore.currentStation)
const vehicles = computed(() => userStore.vehicles)

const availableConnectors = useAvailableConnectors(currentStation)

const selectedConnector = ref('')
const selectedDate = ref('')
const selectedTimeSlot = ref('')
const selectedVehicle = ref(vehicles.value.length > 0 ? vehicles.value[0].id : '')
const chargeAmount = ref(50)

watch(
  availableConnectors,
  (connectors) => {
    if (connectors.length > 0 && !connectors.find((c) => c.id === selectedConnector.value)) {
      selectedConnector.value = connectors[0].id
    }
  },
  { immediate: true }
)

const dateOptions = computed(() => {
  const options = []
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    options.push({
      value,
      label: i === 0 ? '今天' : i === 1 ? '明天' : dayNames[date.getDay()],
      day: `${date.getMonth() + 1}/${date.getDate()}`
    })
  }
  return options
})

watchEffect(() => {
  if (!selectedDate.value && dateOptions.value.length > 0) {
    selectedDate.value = dateOptions.value[0].value
  }
})

const timeSlots = [
  { value: '08:00-10:00', label: '08:00-10:00', available: true },
  { value: '10:00-12:00', label: '10:00-12:00', available: true },
  { value: '12:00-14:00', label: '12:00-14:00', available: false },
  { value: '14:00-16:00', label: '14:00-16:00', available: true },
  { value: '16:00-18:00', label: '16:00-18:00', available: true },
  { value: '18:00-20:00', label: '18:00-20:00', available: false }
]

const estimatedCost = computed(() => {
  if (!currentStation.value) return 0
  return chargeAmount.value * currentStation.value.currentPrice
})

const canSubmit = computed(() => {
  return (
    selectedConnector.value && selectedDate.value && selectedTimeSlot.value && selectedVehicle.value
  )
})

const getTimeSlotClass = (slot) => {
  if (!slot.available) {
    return 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 opacity-60 cursor-not-allowed'
  }
  return selectedTimeSlot.value === slot.value
    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-glow-primary'
    : 'border-surface-200 dark:border-surface-700 glass-card hover:border-primary-300'
}

const submitReservation = async () => {
  if (!canSubmit.value) {
    showToast('请完善预约信息', 'error')
    return
  }

  const connector = availableConnectors.value.find((c) => c.id === selectedConnector.value)
  const vehicle = vehicles.value.find((v) => v.id === selectedVehicle.value)

  setLoading(true)
  try {
    await reservationStore.createReservation({
      stationId: currentStation.value.stationId,
      stationName: currentStation.value.stationName,
      stationAddress: currentStation.value.address,
      date: selectedDate.value,
      timeSlot: selectedTimeSlot.value,
      connectorId: selectedConnector.value,
      connectorName: connector?.connectorName || '',
      vehicleModel: vehicle?.model || '',
      chargeAmount: chargeAmount.value
    })
    showToast('预约成功！请按时到达充电站', 'success')
    emit('reservation-success')
  } catch {
    showToast('预约失败，请重试', 'error')
  } finally {
    setLoading(false)
  }
}
</script>
