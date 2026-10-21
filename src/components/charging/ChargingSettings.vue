<template>
  <PanelShell title="充电设置" @close="$emit('close')">
    <div
      class="glass-effect z-10 flex flex-shrink-0 items-center justify-between border-b border-surface-200/50 p-4 dark:border-surface-700/50"
    >
      <button class="icon-button" aria-label="返回" @click="$emit('close')">
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">充电设置</h2>
      <div class="w-10"></div>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div
        class="mb-5 rounded-2xl bg-gradient-to-br from-secondary-50 to-emerald-50 p-5 shadow-soft dark:from-surface-800 dark:to-surface-900"
      >
        <h3 class="mb-1 font-bold text-surface-800 dark:text-surface-200">
          {{ currentStation?.stationName }}
        </h3>
        <p class="text-sm text-surface-500 dark:text-surface-400">
          {{ currentStation?.address }}
        </p>
      </div>

      <div class="mb-6">
        <label class="mb-3 block text-sm font-bold text-surface-700 dark:text-surface-300"
          >选择充电桩</label
        >
        <div class="space-y-2.5">
          <div
            v-for="connector in availableConnectors"
            :key="connector.id"
            class="cursor-pointer rounded-2xl bg-gradient-to-br from-white to-surface-50 p-4 shadow-soft transition-all duration-300 dark:from-surface-800 dark:to-surface-900"
            :class="
              selectedConnector === connector.id
                ? 'shadow-glow-primary ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-surface-900'
                : 'hover:-translate-y-0.5 hover:shadow-soft-md'
            "
            @click="selectedConnector = connector.id"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div
                  class="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-secondary-400 to-emerald-500 shadow-md"
                >
                  <i class="fa fa-bolt text-white" aria-hidden="true"></i>
                </div>
                <div>
                  <p class="text-sm font-bold text-surface-800 dark:text-surface-200">
                    {{ connector.connectorName }}
                  </p>
                  <p class="text-xs text-surface-500 dark:text-surface-400">
                    {{ connector.power }}kW · {{ connector.connectorType }}
                  </p>
                </div>
              </div>
              <div
                v-if="selectedConnector === connector.id"
                class="flex h-7 w-7 animate-scale-in items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 shadow-md"
              >
                <i class="fa fa-check text-xs text-white" aria-hidden="true"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-6">
        <label class="mb-3 block text-sm font-bold text-surface-700 dark:text-surface-300"
          >目标电量</label
        >
        <div
          class="rounded-2xl bg-gradient-to-br from-white to-surface-50 p-5 shadow-soft dark:from-surface-800 dark:to-surface-900"
        >
          <div class="mb-3 flex items-center justify-between">
            <span class="text-sm text-surface-500 dark:text-surface-400">充电至</span>
            <span class="gradient-text text-2xl font-black">{{ settings.targetBattery }}%</span>
          </div>
          <input
            v-model.number="settings.targetBattery"
            type="range"
            min="50"
            max="100"
            step="5"
            class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-200 accent-primary-500 dark:bg-surface-700"
          />
          <div class="mt-2 flex justify-between text-xs text-surface-400">
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <div class="mb-6">
        <label class="mb-3 block text-sm font-bold text-surface-700 dark:text-surface-300"
          >充电模式</label
        >
        <div class="grid grid-cols-2 gap-3">
          <div
            class="cursor-pointer rounded-2xl border-2 p-4 text-center transition-all duration-300"
            :class="
              !settings.smartCharge
                ? 'border-primary-500 bg-primary-50 shadow-glow-primary dark:bg-primary-900/20'
                : 'border-surface-200 hover:border-primary-300 dark:border-surface-700'
            "
            @click="settings.smartCharge = false"
          >
            <div
              class="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-xl shadow-md"
              :class="
                !settings.smartCharge
                  ? 'bg-gradient-to-br from-primary-400 to-blue-500'
                  : 'bg-surface-200 dark:bg-surface-700'
              "
            >
              <i
                class="fa fa-bolt text-xl"
                :class="!settings.smartCharge ? 'text-white' : 'text-surface-400'"
                aria-hidden="true"
              ></i>
            </div>
            <p class="text-sm font-bold text-surface-800 dark:text-surface-200">即时充电</p>
            <p class="mt-1 text-xs text-surface-500 dark:text-surface-400">立即开始充电</p>
          </div>
          <div
            class="cursor-pointer rounded-2xl border-2 p-4 text-center transition-all duration-300"
            :class="
              settings.smartCharge
                ? 'border-primary-500 bg-primary-50 shadow-glow-primary dark:bg-primary-900/20'
                : 'border-surface-200 hover:border-primary-300 dark:border-surface-700'
            "
            @click="settings.smartCharge = true"
          >
            <div
              class="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-xl shadow-md"
              :class="
                settings.smartCharge
                  ? 'bg-gradient-to-br from-accent-400 to-purple-500'
                  : 'bg-surface-200 dark:bg-surface-700'
              "
            >
              <i
                class="fa fa-magic text-xl"
                :class="settings.smartCharge ? 'text-white' : 'text-surface-400'"
                aria-hidden="true"
              ></i>
            </div>
            <p class="text-sm font-bold text-surface-800 dark:text-surface-200">智能充电</p>
            <p class="mt-1 text-xs text-surface-500 dark:text-surface-400">低谷时段自动充电</p>
          </div>
        </div>
      </div>

      <div class="mb-6">
        <label class="mb-3 block text-sm font-bold text-surface-700 dark:text-surface-300"
          >通知设置</label
        >
        <div class="space-y-3">
          <div
            class="flex items-center justify-between rounded-2xl bg-gradient-to-br from-white to-surface-50 p-4 shadow-soft dark:from-surface-800 dark:to-surface-900"
          >
            <div class="mr-3 flex min-w-0 flex-1 items-center">
              <div
                class="mr-3 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30"
              >
                <i class="fa fa-bell text-sm text-primary-500" aria-hidden="true"></i>
              </div>
              <div class="min-w-0">
                <p
                  id="charging-notify-full-label"
                  class="text-sm font-bold text-surface-800 dark:text-surface-200"
                >
                  充电完成通知
                </p>
                <p class="text-xs text-surface-500 dark:text-surface-400">达到目标电量时提醒</p>
              </div>
            </div>
            <ToggleSwitch
              size="sm"
              label-id="charging-notify-full-label"
              :model-value="settings.notifyFull"
              @update:model-value="settings.notifyFull = !settings.notifyFull"
            />
          </div>
          <div
            class="flex items-center justify-between rounded-2xl bg-gradient-to-br from-white to-surface-50 p-4 shadow-soft dark:from-surface-800 dark:to-surface-900"
          >
            <div class="mr-3 flex min-w-0 flex-1 items-center">
              <div
                class="mr-3 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-warning-100 dark:bg-warning-900/30"
              >
                <i class="fa fa-rmb text-sm text-warning-500" aria-hidden="true"></i>
              </div>
              <div class="min-w-0">
                <p
                  id="charging-notify-cost-label"
                  class="text-sm font-bold text-surface-800 dark:text-surface-200"
                >
                  费用提醒
                </p>
                <p class="text-xs text-surface-500 dark:text-surface-400">超过设定金额时提醒</p>
              </div>
            </div>
            <ToggleSwitch
              size="sm"
              label-id="charging-notify-cost-label"
              :model-value="settings.notifyCost"
              @update:model-value="settings.notifyCost = !settings.notifyCost"
            />
          </div>
          <div v-if="settings.notifyCost" class="flex items-center space-x-3 px-4">
            <span class="text-sm text-surface-500">¥</span>
            <input
              v-model.number="settings.costThreshold"
              type="number"
              min="10"
              max="500"
              step="10"
              class="input-premium flex-1"
            />
            <span class="text-sm text-surface-500">元</span>
          </div>
        </div>
      </div>

      <div
        class="space-y-3 rounded-2xl bg-gradient-to-br from-white to-surface-50 p-5 shadow-soft dark:from-surface-800 dark:to-surface-900"
      >
        <div class="flex justify-between text-sm">
          <span class="text-surface-500 dark:text-surface-400">当前电价</span>
          <span class="font-bold text-primary-600"
            >{{ formatPrice(currentStation?.currentPrice) }}/度</span
          >
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-surface-500 dark:text-surface-400">预计充电量</span>
          <span class="font-bold text-surface-800 dark:text-surface-200"
            >{{ estimatedEnergy.toFixed(1) }} kWh</span
          >
        </div>
        <div
          class="flex justify-between border-t border-surface-100 pt-3 dark:border-surface-700/50"
        >
          <span class="font-bold text-surface-900 dark:text-surface-100">预计费用</span>
          <span class="gradient-text text-xl font-black">{{ formatPrice(estimatedCost) }}</span>
        </div>
      </div>
    </div>

    <div
      class="glass-effect flex-shrink-0 border-t border-surface-200/50 p-4 dark:border-surface-700/50 lg:p-5"
    >
      <button
        class="group relative w-full transform overflow-hidden rounded-2xl bg-gradient-to-r from-secondary-500 via-emerald-500 to-teal-500 py-4 font-bold text-white shadow-xl shadow-secondary-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-secondary-500/35 active:translate-y-0 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!selectedConnector"
        @click="startCharging"
      >
        <div
          class="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]"
        ></div>
        <span class="relative z-10 flex items-center justify-center space-x-2.5 text-base">
          <i class="fa fa-bolt text-lg" aria-hidden="true"></i>
          <span>开始充电</span>
        </span>
      </button>
    </div>
  </PanelShell>
</template>

<script setup>
import PanelShell from '../common/PanelShell.vue'
import ToggleSwitch from '../common/ToggleSwitch.vue'
import { ref, computed, inject, reactive, watch } from 'vue'
import { useStationsStore } from '../../store/modules/stations'
import { useChargingStore } from '../../store/modules/charging'
import { useAvailableConnectors } from '../../composables/useAvailableConnectors'
import { formatPrice } from '../../utils/format'

const emit = defineEmits(['close', 'start-charging'])
const stationsStore = useStationsStore()
const chargingStore = useChargingStore()
const showToast = inject('showToast')

const currentStation = computed(() => stationsStore.currentStation)

const availableConnectors = useAvailableConnectors(currentStation)

const selectedConnector = ref('')

watch(
  availableConnectors,
  (connectors) => {
    if (connectors.length > 0 && !connectors.find((c) => c.id === selectedConnector.value)) {
      selectedConnector.value = connectors[0].id
    }
  },
  { immediate: true }
)

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
