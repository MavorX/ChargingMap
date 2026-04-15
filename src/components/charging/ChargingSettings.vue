<template>
  <div class="panel-overlay">
    <div class="panel-backdrop" @click="$emit('close')"></div>
    <div class="panel-content">
    <div class="glass-effect border-b border-surface-200/50 dark:border-surface-700/50 p-4 flex justify-between items-center flex-shrink-0 z-10">
      <button class="icon-button" @click="$emit('close')">
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">充电设置</h2>
      <div class="w-10"></div>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div class="mb-5 bg-gradient-to-br from-secondary-50 to-emerald-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-5">
        <h3 class="font-bold text-surface-800 dark:text-surface-200 mb-1">{{ currentStation?.stationName }}</h3>
        <p class="text-sm text-surface-500 dark:text-surface-400">{{ currentStation?.address }}</p>
      </div>

      <div class="mb-6">
        <label class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-3">选择充电桩</label>
        <div class="space-y-2.5">
          <div v-for="connector in availableConnectors" :key="connector.id"
            class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-4 cursor-pointer transition-all duration-300"
            :class="selectedConnector === connector.id ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-surface-900 shadow-glow-primary' : 'hover:shadow-soft-md hover:-translate-y-0.5'"
            @click="selectedConnector = connector.id">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary-400 to-emerald-500 flex items-center justify-center mr-3 shadow-md flex-shrink-0">
                  <i class="fa fa-bolt text-white" aria-hidden="true"></i>
                </div>
                <div>
                  <p class="font-bold text-sm text-surface-800 dark:text-surface-200">{{ connector.connectorName }}</p>
                  <p class="text-xs text-surface-500 dark:text-surface-400">{{ connector.power }}kW · {{ connector.connectorType }}</p>
                </div>
              </div>
              <div v-if="selectedConnector === connector.id" class="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md animate-scale-in">
                <i class="fa fa-check text-white text-xs" aria-hidden="true"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-6">
        <label class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-3">目标电量</label>
        <div class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm text-surface-500 dark:text-surface-400">充电至</span>
            <span class="text-2xl font-black gradient-text">{{ settings.targetBattery }}%</span>
          </div>
          <input type="range" min="50" max="100" step="5" v-model.number="settings.targetBattery"
            class="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-500">
          <div class="flex justify-between text-xs text-surface-400 mt-2">
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <div class="mb-6">
        <label class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-3">充电模式</label>
        <div class="grid grid-cols-2 gap-3">
          <div class="p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 text-center"
            :class="!settings.smartCharge ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-glow-primary' : 'border-surface-200 dark:border-surface-700 hover:border-primary-300'"
            @click="settings.smartCharge = false">
            <div class="w-12 h-12 mx-auto mb-2.5 rounded-xl flex items-center justify-center shadow-md" :class="!settings.smartCharge ? 'bg-gradient-to-br from-primary-400 to-blue-500' : 'bg-surface-200 dark:bg-surface-700'">
              <i class="fa fa-bolt text-xl" :class="!settings.smartCharge ? 'text-white' : 'text-surface-400'" aria-hidden="true"></i>
            </div>
            <p class="font-bold text-sm text-surface-800 dark:text-surface-200">即时充电</p>
            <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">立即开始充电</p>
          </div>
          <div class="p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 text-center"
            :class="settings.smartCharge ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-glow-primary' : 'border-surface-200 dark:border-surface-700 hover:border-primary-300'"
            @click="settings.smartCharge = true">
            <div class="w-12 h-12 mx-auto mb-2.5 rounded-xl flex items-center justify-center shadow-md" :class="settings.smartCharge ? 'bg-gradient-to-br from-accent-400 to-purple-500' : 'bg-surface-200 dark:bg-surface-700'">
              <i class="fa fa-magic text-xl" :class="settings.smartCharge ? 'text-white' : 'text-surface-400'" aria-hidden="true"></i>
            </div>
            <p class="font-bold text-sm text-surface-800 dark:text-surface-200">智能充电</p>
            <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">低谷时段自动充电</p>
          </div>
        </div>
      </div>

      <div class="mb-6">
        <label class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-3">通知设置</label>
        <div class="space-y-3">
          <div class="flex items-center justify-between p-4 bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft">
            <div class="flex items-center min-w-0 flex-1 mr-3">
              <div class="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mr-3 flex-shrink-0">
                <i class="fa fa-bell text-primary-500 text-sm" aria-hidden="true"></i>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-surface-800 dark:text-surface-200">充电完成通知</p>
                <p class="text-xs text-surface-500 dark:text-surface-400">达到目标电量时提醒</p>
              </div>
            </div>
            <button class="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0" :class="settings.notifyFull ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'" @click="settings.notifyFull = !settings.notifyFull">
              <span class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200" :class="settings.notifyFull ? 'left-[22px]' : 'left-0.5'"></span>
            </button>
          </div>
          <div class="flex items-center justify-between p-4 bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft">
            <div class="flex items-center min-w-0 flex-1 mr-3">
              <div class="w-9 h-9 rounded-xl bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center mr-3 flex-shrink-0">
                <i class="fa fa-rmb text-warning-500 text-sm" aria-hidden="true"></i>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-surface-800 dark:text-surface-200">费用提醒</p>
                <p class="text-xs text-surface-500 dark:text-surface-400">超过设定金额时提醒</p>
              </div>
            </div>
            <button class="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0" :class="settings.notifyCost ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'" @click="settings.notifyCost = !settings.notifyCost">
              <span class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200" :class="settings.notifyCost ? 'left-[22px]' : 'left-0.5'"></span>
            </button>
          </div>
          <div v-if="settings.notifyCost" class="flex items-center space-x-3 px-4">
            <span class="text-sm text-surface-500">¥</span>
            <input type="number" v-model.number="settings.costThreshold" min="10" max="500" step="10"
              class="input-premium flex-1">
            <span class="text-sm text-surface-500">元</span>
          </div>
        </div>
      </div>

      <div class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-5 space-y-3">
        <div class="flex justify-between text-sm">
          <span class="text-surface-500 dark:text-surface-400">当前电价</span>
          <span class="font-bold text-primary-600">¥{{ currentStation?.currentPrice.toFixed(2) }}/度</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-surface-500 dark:text-surface-400">预计充电量</span>
          <span class="font-bold text-surface-800 dark:text-surface-200">{{ estimatedEnergy.toFixed(1) }} kWh</span>
        </div>
        <div class="border-t border-surface-100 dark:border-surface-700/50 pt-3 flex justify-between">
          <span class="font-bold text-surface-900 dark:text-surface-100">预计费用</span>
          <span class="text-xl font-black gradient-text">¥{{ estimatedCost.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <div class="flex-shrink-0 glass-effect border-t border-surface-200/50 dark:border-surface-700/50 p-4 lg:p-5">
      <button
        class="group w-full relative overflow-hidden bg-gradient-to-r from-secondary-500 via-emerald-500 to-teal-500 text-white py-4 rounded-2xl font-bold shadow-xl shadow-secondary-500/25 hover:shadow-2xl hover:shadow-secondary-500/35 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        @click="startCharging" :disabled="!selectedConnector">
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        <span class="relative z-10 flex items-center justify-center space-x-2.5 text-base">
          <i class="fa fa-bolt text-lg" aria-hidden="true"></i>
          <span>开始充电</span>
        </span>
      </button>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, reactive, watch } from 'vue'
import { useStationsStore } from '../../store/modules/stations'
import { useChargingStore } from '../../store/modules/charging'

const emit = defineEmits(['close', 'start-charging'])
const stationsStore = useStationsStore()
const chargingStore = useChargingStore()
const showToast = inject('showToast')

const currentStation = computed(() => stationsStore.currentStation)

const availableConnectors = computed(() => {
  if (!currentStation.value?.details?.fastConnectors) return []
  return currentStation.value.details.fastConnectors.filter(c => c.status === 1)
})

const selectedConnector = ref('')

watch(availableConnectors, (connectors) => {
  if (connectors.length > 0 && !connectors.find(c => c.id === selectedConnector.value)) {
    selectedConnector.value = connectors[0].id
  }
}, { immediate: true })

const settings = reactive({
  targetBattery: chargingStore.settings.targetBattery,
  notifyFull: chargingStore.settings.notifyFull,
  notifyCost: chargingStore.settings.notifyCost,
  costThreshold: chargingStore.settings.costThreshold,
  smartCharge: chargingStore.settings.smartCharge
})

const estimatedEnergy = computed(() => {
  return ((settings.targetBattery - 35) / 100) * 60
})

const estimatedCost = computed(() => {
  if (!currentStation.value) return 0
  return estimatedEnergy.value * currentStation.value.currentPrice
})

const startCharging = () => {
  if (!selectedConnector.value) {
    showToast('请选择充电桩', 'error')
    return
  }
  chargingStore.updateSettings({
    targetBattery: settings.targetBattery,
    notifyFull: settings.notifyFull,
    notifyCost: settings.notifyCost,
    costThreshold: settings.costThreshold,
    smartCharge: settings.smartCharge
  })
  emit('start-charging')
}
</script>
