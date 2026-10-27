<template>
  <PanelShell title="筛选条件" content-id="vehicle-filter-panel" @close="$emit('close')">
    <div
      class="glass-effect z-10 flex flex-shrink-0 items-center justify-between border-b border-surface-200/50 p-4 dark:border-surface-700/50"
    >
      <button
        id="back-from-vehicle-filter"
        class="icon-button"
        :aria-label="t('返回')"
        @click="$emit('close')"
      >
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">{{ t('筛选条件') }}</h2>
      <button
        id="reset-vehicle-filter"
        class="rounded-xl px-3 py-1.5 text-sm font-semibold text-primary-600 transition-all duration-200 hover:bg-primary-50 active:scale-95 dark:text-primary-400 dark:hover:bg-primary-900/20"
        @click="resetFilters"
      >
        {{ t('重置') }}
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div class="mb-6">
        <label class="mb-3 block text-sm font-bold text-surface-700 dark:text-surface-300">{{
          t('充电公司')
        }}</label>
        <div class="grid grid-cols-3 gap-2.5">
          <button
            v-for="brand in chargingBrands"
            :key="brand.value"
            class="rounded-xl border px-2 py-2.5 text-sm font-semibold transition-colors"
            :class="
              selectedBrand === brand.value
                ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                : 'border-surface-200 text-surface-600 hover:border-primary-300 dark:border-surface-700 dark:text-surface-300'
            "
            :aria-pressed="selectedBrand === brand.value"
            @click="selectedBrand = selectedBrand === brand.value ? '' : brand.value"
          >
            {{ t(brand.label) }}
          </button>
        </div>
      </div>

      <div class="mb-6">
        <label class="mb-3 block text-sm font-bold text-surface-700 dark:text-surface-300">{{
          t('充电接口类型')
        }}</label>
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
              class="peer sr-only"
              :checked="selectedConnectors.includes(connector.value)"
              @change="toggleConnector(connector.value)"
            />
            <div
              class="mr-2.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500"
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
        <label class="mb-3 block text-sm font-bold text-surface-700 dark:text-surface-300">{{
          t('最大充电功率')
        }}</label>
        <div
          class="rounded-2xl border border-surface-200 bg-surface-50 p-5 dark:border-surface-700 dark:bg-surface-800"
        >
          <div class="mb-3 flex items-center justify-between">
            <span class="text-sm text-surface-500 dark:text-surface-400">{{ t('最低功率') }}</span>
            <span class="gradient-text text-lg font-black">{{ selectedPower }}kW</span>
          </div>
          <input
            v-model.number="selectedPower"
            :aria-label="t('最低功率')"
            type="range"
            min="50"
            max="300"
            step="50"
            class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-200 accent-primary-600 dark:bg-surface-700"
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
      <button id="apply-vehicle-filter" class="action-primary" @click="applyFilters">
        <i class="fa fa-filter" aria-hidden="true"></i>
        <span>{{ t('应用筛选') }}</span>
      </button>
    </div>
  </PanelShell>
</template>

<script setup>
import PanelShell from '../common/PanelShell.vue'
import { ref, inject } from 'vue'
import { t } from '../../i18n'
import { useStationsStore } from '../../store/modules/stations'

const emit = defineEmits(['close'])

const stationsStore = useStationsStore()
const showToast = inject('showToast')

const chargingBrands = [
  { label: '国家电网', value: '国家电网' },
  { label: '特来电', value: '特来电' },
  { label: '星星充电', value: '星星充电' },
  { label: '小桔充电', value: '小桔充电' },
  { label: '云快充', value: '云快充' }
]

const connectorTypes = [
  { label: 'CCS Combo', value: 'CCS Combo' },
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
  selectedConnectors.value = ['CCS Combo', 'GB/T', 'CHAdeMO', 'Type 2']
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
