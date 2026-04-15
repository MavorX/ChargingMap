<template>
  <div class="panel-overlay">
    <div class="panel-backdrop" @click="$emit('close')"></div>
    <div class="panel-content">
    <div class="glass-effect border-b border-surface-200/50 dark:border-surface-700/50 p-4 flex justify-between items-center flex-shrink-0 z-10">
      <button class="icon-button" @click="$emit('close')">
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">预约充电桩</h2>
      <div class="w-10"></div>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div class="premium-card p-5 mb-6 animate-in">
        <div class="flex items-start space-x-3">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center shadow-md flex-shrink-0">
            <i class="fa fa-map-marker text-white text-lg" aria-hidden="true"></i>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-surface-900 dark:text-surface-100 text-base mb-1">{{ currentStation?.stationName }}</h3>
            <p class="text-sm text-surface-500 dark:text-surface-400 truncate">{{ currentStation?.address }}</p>
          </div>
        </div>
      </div>

      <div class="mb-6 animate-in delay-100">
        <label class="block section-title">
          <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-warning-400 to-orange-500 flex items-center justify-center mr-2.5 shadow-md">
            <i class="fa fa-bolt text-white text-xs" aria-hidden="true"></i>
          </div>
          选择充电桩
        </label>
        <div class="space-y-2.5">
          <div v-for="(connector, index) in availableConnectors" :key="connector.id"
               class="group relative overflow-hidden premium-card p-4 cursor-pointer transition-all duration-300 animate-in"
               :class="selectedConnector === connector.id ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-surface-900 shadow-glow-primary' : 'hover:shadow-soft-md hover:-translate-y-0.5'"
               :style="{ animationDelay: `${index * 80}ms` }"
               @click="selectedConnector = connector.id">
            <div class="flex items-center justify-between relative z-10">
              <div class="flex items-center flex-1 min-w-0">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-400 to-emerald-500 flex items-center justify-center mr-3.5 shadow-md group-hover:scale-105 transition-transform duration-300">
                  <i class="fa fa-bolt text-white text-lg" aria-hidden="true"></i>
                </div>
                <div class="min-w-0">
                  <h4 class="font-bold text-surface-800 dark:text-surface-200 text-sm mb-0.5">{{ connector.connectorName }}</h4>
                  <p class="text-xs text-surface-500 dark:text-surface-400">{{ connector.power }}kW · {{ connector.connectorType }}</p>
                </div>
              </div>
              <div v-if="selectedConnector === connector.id"
                   class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md animate-scale-in">
                <i class="fa fa-check text-white text-sm" aria-hidden="true"></i>
              </div>
            </div>
          </div>
          <div v-if="availableConnectors.length === 0" class="text-center py-10 animate-in">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
              <i class="fa fa-bolt text-surface-400 text-2xl" aria-hidden="true"></i>
            </div>
            <p class="text-sm font-medium text-surface-600 dark:text-surface-300">当前没有可用的充电桩</p>
          </div>
        </div>
      </div>

      <div class="mb-6 animate-in delay-200">
        <label class="block section-title">
          <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-400 to-blue-500 flex items-center justify-center mr-2.5 shadow-md">
            <i class="fa fa-calendar text-white text-xs" aria-hidden="true"></i>
          </div>
          选择日期
        </label>
        <div class="flex space-x-3 overflow-x-auto pb-2 -mx-1 px-1">
          <button v-for="(date, index) in dateOptions" :key="index"
                  class="group flex-shrink-0 px-5 py-4 rounded-xl border-2 text-center min-w-[90px] transition-all duration-300 hover:-translate-y-0.5"
                  :class="selectedDate === date.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-glow-primary' : 'border-surface-200 dark:border-surface-700 glass-card'"
                  @click="selectedDate = date.value">
            <p class="text-[10px] font-medium uppercase tracking-wide mb-1.5" :class="selectedDate === date.value ? 'text-primary-600' : 'text-surface-500'">{{ date.label }}</p>
            <p class="text-lg font-bold" :class="selectedDate === date.value ? 'gradient-text' : 'text-surface-800 dark:text-surface-200'">{{ date.day }}</p>
          </button>
        </div>
      </div>

      <div class="mb-6 animate-in delay-300">
        <label class="block section-title">
          <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-400 to-purple-500 flex items-center justify-center mr-2.5 shadow-md">
            <i class="fa fa-clock-o text-white text-xs" aria-hidden="true"></i>
          </div>
          选择时间段
        </label>
        <div class="grid grid-cols-3 gap-2.5">
          <button v-for="(slot, index) in timeSlots" :key="slot.value"
                  class="relative overflow-hidden p-4 rounded-xl border-2 transition-all duration-300 group"
                  :class="getTimeSlotClass(slot)"
                  @click="selectedTimeSlot = slot.value"
                  :disabled="!slot.available">
            <div class="relative z-10">
              <p class="font-bold text-sm mb-1" :class="slot.available ? (selectedTimeSlot === slot.value ? 'text-primary-600' : 'text-surface-800 dark:text-surface-200') : 'text-surface-400'">{{ slot.label }}</p>
              <p class="text-[10px] font-bold uppercase tracking-wide" :class="slot.available ? 'text-secondary-500' : 'text-surface-400'">
                {{ slot.available ? '可预约' : '已满' }}
              </p>
            </div>
            <div v-if="!slot.available" class="absolute inset-0 bg-surface-50/50 dark:bg-surface-900/30 backdrop-blur-[1px]"></div>
          </button>
        </div>
      </div>

      <div class="mb-6 animate-in delay-400">
        <label class="block section-title">
          <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-secondary-400 to-teal-500 flex items-center justify-center mr-2.5 shadow-md">
            <i class="fa fa-car text-white text-xs" aria-hidden="true"></i>
          </div>
          选择车辆
        </label>
        <div class="space-y-2.5">
          <div v-for="(vehicle, index) in vehicles" :key="vehicle.id"
               class="group premium-card p-4 cursor-pointer transition-all duration-300 animate-in"
               :class="selectedVehicle === vehicle.id ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-surface-900' : 'hover:shadow-soft-md hover:-translate-y-0.5'"
               :style="{ animationDelay: `${index * 80}ms` }"
               @click="selectedVehicle = vehicle.id">
            <div class="flex items-center justify-between">
              <div class="flex items-center flex-1 min-w-0">
                <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-400 to-cyan-500 flex items-center justify-center mr-3.5 shadow-md group-hover:scale-105 transition-transform duration-300">
                  <i class="fa fa-car text-white text-lg" aria-hidden="true"></i>
                </div>
                <div class="min-w-0">
                  <p class="font-bold text-surface-800 dark:text-surface-200 text-sm">{{ vehicle.model }}</p>
                  <p class="text-xs text-surface-500 dark:text-surface-400">{{ vehicle.connectorType }}</p>
                </div>
              </div>
              <div v-if="selectedVehicle === vehicle.id"
                   class="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md animate-scale-in">
                <i class="fa fa-check text-white text-xs" aria-hidden="true"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-6 animate-in delay-500">
        <label class="block section-title">
          <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-warning-400 to-amber-500 flex items-center justify-center mr-2.5 shadow-md">
            <i class="fa fa-battery-three-quarters text-white text-xs" aria-hidden="true"></i>
          </div>
          预计充电量
        </label>
        <div class="premium-card p-5">
          <div class="flex items-center space-x-4">
            <button
              class="w-[3.25rem] h-[3.25rem] rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center hover:bg-surface-200 dark:hover:bg-surface-700 active:scale-90 transition-all duration-200 shadow-inner-soft group"
              @click="chargeAmount = Math.max(10, chargeAmount - 10)">
              <i class="fa fa-minus text-surface-600 group-hover:text-danger-500 transition-colors duration-200" aria-hidden="true"></i>
            </button>

            <div class="flex-1 text-center py-3">
              <div class="inline-flex items-baseline space-x-2 px-8 py-4 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 border-2 border-primary-200 dark:border-primary-800">
                <span class="text-4xl font-black gradient-text">{{ chargeAmount }}</span>
                <span class="text-lg font-bold text-surface-500">kWh</span>
              </div>
            </div>

            <button
              class="w-[3.25rem] h-[3.25rem] rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center hover:bg-surface-200 dark:hover:bg-surface-700 active:scale-90 transition-all duration-200 shadow-inner-soft group"
              @click="chargeAmount = Math.min(100, chargeAmount + 10)">
              <i class="fa fa-plus text-surface-600 group-hover:text-secondary-500 transition-colors duration-200" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="premium-card p-5 space-y-3 animate-in delay-500">
        <div class="flex justify-between items-center pb-3 border-b border-surface-100 dark:border-surface-700/50">
          <span class="text-sm font-medium text-surface-600 dark:text-surface-400">充电站</span>
          <span class="font-bold text-surface-900 dark:text-surface-100 text-sm">{{ currentStation?.stationName }}</span>
        </div>
        <div class="flex justify-between items-center pb-3 border-b border-surface-100 dark:border-surface-700/50">
          <span class="text-sm font-medium text-surface-600 dark:text-surface-400">预约时间</span>
          <span class="font-bold text-surface-900 dark:text-surface-100 text-sm">{{ selectedDate }} {{ selectedTimeSlot }}</span>
        </div>
        <div class="flex justify-between items-center pb-3 border-b border-surface-100 dark:border-surface-700/50">
          <span class="text-sm font-medium text-surface-600 dark:text-surface-400">预计充电量</span>
          <span class="font-bold text-surface-900 dark:text-surface-100 text-sm">{{ chargeAmount }} kWh</span>
        </div>
        <div class="flex justify-between items-center pb-3 border-b border-surface-100 dark:border-surface-700/50">
          <span class="text-sm font-medium text-surface-600 dark:text-surface-400">当前电价</span>
          <span class="font-bold text-primary-600 text-base">¥{{ currentStation?.currentPrice.toFixed(2) }}/度</span>
        </div>
        <div class="pt-2 flex justify-between items-center">
          <span class="text-base font-bold text-surface-900 dark:text-surface-100">预计费用</span>
          <span class="text-2xl font-black gradient-text">¥{{ estimatedCost.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <div class="flex-shrink-0 glass-effect border-t border-surface-200/50 dark:border-surface-700/50 p-4 lg:p-5">
      <button
        class="group w-full relative overflow-hidden bg-gradient-to-r from-warning-400 via-yellow-500 to-amber-500 text-white py-4 rounded-2xl font-bold shadow-xl shadow-warning-500/25 hover:shadow-2xl hover:shadow-warning-500/35 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        @click="submitReservation"
        :disabled="!canSubmit">
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
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
import { ref, computed, inject, watch } from 'vue'
import { useStationsStore } from '../../store/modules/stations'
import { useReservationStore } from '../../store/modules/reservation'
import { useUserStore } from '../../store/modules/user'

const emit = defineEmits(['close', 'reservation-success'])
const stationsStore = useStationsStore()
const reservationStore = useReservationStore()
const userStore = useUserStore()
const showToast = inject('showToast')
const setLoading = inject('setLoading')

const currentStation = computed(() => stationsStore.currentStation)
const vehicles = computed(() => userStore.vehicles)

const availableConnectors = computed(() => {
  if (!currentStation.value?.details?.fastConnectors) return []
  return currentStation.value.details.fastConnectors.filter(c => c.status === 1)
})

const selectedConnector = ref('')
const selectedDate = ref('')
const selectedTimeSlot = ref('')
const selectedVehicle = ref(vehicles.value.length > 0 ? vehicles.value[0].id : '')
const chargeAmount = ref(50)

watch(availableConnectors, (connectors) => {
  if (connectors.length > 0 && !connectors.find(c => c.id === selectedConnector.value)) {
    selectedConnector.value = connectors[0].id
  }
}, { immediate: true })

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
  if (!selectedDate.value && options.length > 0) {
    selectedDate.value = options[0].value
  }
  return options
})

const timeSlots = [
  { value: '08:00-10:00', label: '08:00-10:00', available: true },
  { value: '10:00-12:00', label: '10:00-12:00', available: true },
  { value: '12:00-14:00', label: '12:00-14:00', available: false },
  { value: '14:00-16:00', label: '14:00-16:00', available: true },
  { value: '16:00-18:00', label: '16:00-18:00', available: true },
  { value: '18:00-20:00', label: '18:00-20:00', available: false },
]

const estimatedCost = computed(() => {
  if (!currentStation.value) return 0
  return chargeAmount.value * currentStation.value.currentPrice
})

const canSubmit = computed(() => {
  return selectedConnector.value && selectedDate.value && selectedTimeSlot.value && selectedVehicle.value
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

  const connector = availableConnectors.value.find(c => c.id === selectedConnector.value)
  const vehicle = vehicles.value.find(v => v.id === selectedVehicle.value)

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
  } catch (err) {
    showToast('预约失败，请重试', 'error')
  } finally {
    setLoading(false)
  }
}
</script>
