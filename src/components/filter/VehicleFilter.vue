<template>
  <div class="panel-overlay">
    <div class="panel-backdrop" @click="$emit('close')"></div>
    <div id="vehicle-filter-panel" class="panel-content">
      <div
        class="glass-effect z-10 flex flex-shrink-0 items-center justify-between border-b border-surface-200/50 p-4 dark:border-surface-700/50"
      >
        <button id="back-from-vehicle-filter" class="icon-button" @click="$emit('close')">
          <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
        </button>
        <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">筛选条件</h2>
        <button
          id="reset-vehicle-filter"
          class="rounded-xl px-3 py-1.5 text-sm font-semibold text-primary-600 transition-all duration-200 hover:bg-primary-50 active:scale-95 dark:text-primary-400 dark:hover:bg-primary-900/20"
          @click="resetFilters"
        >
          重置
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-5">
        <div class="mb-6">
          <label class="mb-3 block text-sm font-bold text-surface-700 dark:text-surface-300"
            >充电公司</label
          >
          <div class="grid grid-cols-3 gap-2.5">
            <button
              v-for="brand in chargingBrands"
              :key="brand.value"
              class="rounded-xl border-2 py-2.5 text-sm font-bold transition-all duration-300 active:scale-95"
              :class="
                selectedBrand === brand.value
                  ? 'border-primary-500 bg-primary-50 text-primary-600 shadow-glow-primary dark:bg-primary-900/20 dark:text-primary-400'
                  : 'border-surface-200 text-surface-600 hover:border-primary-300 dark:border-surface-700 dark:text-surface-300'
              "
              @click="selectedBrand = selectedBrand === brand.value ? '' : brand.value"
            >
              {{ brand.label }}
            </button>
          </div>
        </div>

        <div class="mb-6">
          <label class="mb-3 block text-sm font-bold text-surface-700 dark:text-surface-300"
            >充电接口类型</label
          >
          <div class="grid grid-cols-2 gap-2.5">
            <label
              v-for="connector in connectorTypes"
              :key="connector.value"
              class="flex cursor-pointer items-center rounded-xl border-2 p-3.5 transition-all duration-300"
              :class="
                selectedConnectors.includes(connector.value)
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-surface-200 hover:border-primary-300 dark:border-surface-700'
              "
            >
              <input
                type="checkbox"
                class="sr-only"
                :checked="selectedConnectors.includes(connector.value)"
                @change="toggleConnector(connector.value)"
              />
              <div
                class="mr-2.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors"
                :class="
                  selectedConnectors.includes(connector.value)
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-surface-300 dark:border-surface-600'
                "
              >
                <i
                  v-if="selectedConnectors.includes(connector.value)"
                  class="fa fa-check text-xs text-white"
                  aria-hidden="true"
                ></i>
              </div>
              <span class="text-sm font-medium text-surface-700 dark:text-surface-300">{{
                connector.label
              }}</span>
            </label>
          </div>
        </div>

        <div class="mb-6">
          <label class="mb-3 block text-sm font-bold text-surface-700 dark:text-surface-300"
            >最大充电功率</label
          >
          <div
            class="rounded-2xl bg-gradient-to-br from-white to-surface-50 p-5 shadow-soft dark:from-surface-800 dark:to-surface-900"
          >
            <div class="mb-3 flex items-center justify-between">
              <span class="text-sm text-surface-500 dark:text-surface-400">最低功率</span>
              <span class="gradient-text text-lg font-black">{{ selectedPower }}kW</span>
            </div>
            <input
              v-model.number="selectedPower"
              type="range"
              min="50"
              max="300"
              step="50"
              class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-200 accent-primary-500 dark:bg-surface-700"
            />
            <div class="mt-2 flex justify-between text-xs text-surface-400">
              <span>50kW</span>
              <span>150kW</span>
              <span>300kW</span>
            </div>
          </div>
        </div>
      </div>

      <div
        class="glass-effect flex-shrink-0 border-t border-surface-200/50 p-4 dark:border-surface-700/50 lg:p-5"
      >
        <button
          id="apply-vehicle-filter"
          class="group relative w-full transform overflow-hidden rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500 py-3.5 font-bold text-white shadow-xl shadow-primary-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-primary-500/35 active:translate-y-0"
          @click="applyFilters"
        >
          <div
            class="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]"
          ></div>
          <span class="relative z-10 flex items-center justify-center space-x-2">
            <i class="fa fa-filter" aria-hidden="true"></i>
            <span>应用筛选</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'
import { useStationsStore } from '../../store/modules/stations'

const emit = defineEmits(['close'])

const stationsStore = useStationsStore()
const showToast = inject('showToast')

const chargingBrands = [
  { label: '国家电网', value: 'sgcc' },
  { label: '特来电', value: 'teld' },
  { label: '星星充电', value: 'star' },
  { label: '小桔充电', value: 'xiaoju' },
  { label: '云快充', value: 'yun' },
  { label: '其他', value: 'other' }
]

const connectorTypes = [
  { label: 'CCS Combo', value: 'CCS' },
  { label: 'GB/T', value: 'GB/T' },
  { label: 'CHAdeMO', value: 'CHAdeMO' },
  { label: 'Type 2', value: 'Type 2' }
]

const selectedBrand = ref(stationsStore.filters.brand)
const selectedConnectors = ref([...stationsStore.filters.connectors])
const selectedPower = ref(stationsStore.filters.power)

const toggleConnector = (value) => {
  const index = selectedConnectors.value.indexOf(value)
  if (index > -1) {
    selectedConnectors.value.splice(index, 1)
  } else {
    selectedConnectors.value.push(value)
  }
}

const resetFilters = () => {
  selectedBrand.value = ''
  selectedConnectors.value = ['CCS', 'GB/T', 'CHAdeMO', 'Type 2']
  selectedPower.value = 50
}

const applyFilters = () => {
  stationsStore.updateFilters({
    brand: selectedBrand.value,
    connectors: selectedConnectors.value,
    power: selectedPower.value
  })
  showToast('筛选条件已应用', 'success')
  emit('close')
}
</script>
