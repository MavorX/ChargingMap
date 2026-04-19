<template>
  <div class="panel-overlay">
    <div class="panel-backdrop" @click="$emit('close')"></div>
    <div id="vehicle-filter-panel" class="panel-content">
    <div class="glass-effect border-b border-surface-200/50 dark:border-surface-700/50 p-4 flex justify-between items-center flex-shrink-0 z-10">
      <button id="back-from-vehicle-filter" class="icon-button" @click="$emit('close')">
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">筛选条件</h2>
      <button id="reset-vehicle-filter" class="px-3 py-1.5 rounded-xl text-primary-600 dark:text-primary-400 font-semibold text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200 active:scale-95" @click="resetFilters">重置</button>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div class="mb-6">
        <label class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-3">充电公司</label>
        <div class="grid grid-cols-3 gap-2.5">
          <button v-for="brand in chargingBrands" :key="brand.value"
            class="py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-300 active:scale-95"
            :class="selectedBrand === brand.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-glow-primary' : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-primary-300'"
            @click="selectedBrand = selectedBrand === brand.value ? '' : brand.value">
            {{ brand.label }}
          </button>
        </div>
      </div>

      <div class="mb-6">
        <label class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-3">充电接口类型</label>
        <div class="grid grid-cols-2 gap-2.5">
          <label v-for="connector in connectorTypes" :key="connector.value"
            class="flex items-center p-3.5 border-2 rounded-xl cursor-pointer transition-all duration-300"
            :class="selectedConnectors.includes(connector.value) ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-surface-200 dark:border-surface-700 hover:border-primary-300'">
            <input type="checkbox" class="sr-only" :checked="selectedConnectors.includes(connector.value)" @change="toggleConnector(connector.value)">
            <div class="w-5 h-5 rounded border-2 flex items-center justify-center mr-2.5 transition-colors flex-shrink-0"
              :class="selectedConnectors.includes(connector.value) ? 'border-primary-500 bg-primary-500' : 'border-surface-300 dark:border-surface-600'">
              <i v-if="selectedConnectors.includes(connector.value)" class="fa fa-check text-white text-xs" aria-hidden="true"></i>
            </div>
            <span class="text-sm font-medium text-surface-700 dark:text-surface-300">{{ connector.label }}</span>
          </label>
        </div>
      </div>

      <div class="mb-6">
        <label class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-3">最大充电功率</label>
        <div class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm text-surface-500 dark:text-surface-400">最低功率</span>
            <span class="text-lg font-black gradient-text">{{ selectedPower }}kW</span>
          </div>
          <input type="range" min="50" max="300" step="50" v-model.number="selectedPower"
            class="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-500">
          <div class="flex justify-between text-xs text-surface-400 mt-2">
            <span>50kW</span>
            <span>150kW</span>
            <span>300kW</span>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-shrink-0 glass-effect border-t border-surface-200/50 dark:border-surface-700/50 p-4 lg:p-5">
      <button id="apply-vehicle-filter"
        class="group w-full relative overflow-hidden bg-gradient-to-r from-primary-500 to-accent-500 text-white py-3.5 rounded-2xl font-bold shadow-xl shadow-primary-500/25 hover:shadow-2xl hover:shadow-primary-500/35 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
        @click="applyFilters">
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
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
import { ref, inject } from 'vue';
import { useStationsStore } from '../../store/modules/stations';

const emit = defineEmits(['close']);

const stationsStore = useStationsStore();
const showToast = inject('showToast');

const chargingBrands = [
  { label: '国家电网', value: 'sgcc' },
  { label: '特来电', value: 'teld' },
  { label: '星星充电', value: 'star' },
  { label: '小桔充电', value: 'xiaoju' },
  { label: '云快充', value: 'yun' },
  { label: '其他', value: 'other' }
];

const connectorTypes = [
  { label: 'CCS Combo', value: 'CCS' },
  { label: 'GB/T', value: 'GB/T' },
  { label: 'CHAdeMO', value: 'CHAdeMO' },
  { label: 'Type 2', value: 'Type 2' }
];

const selectedBrand = ref(stationsStore.filters.brand);
const selectedConnectors = ref([...stationsStore.filters.connectors]);
const selectedPower = ref(stationsStore.filters.power);

const toggleConnector = (value) => {
  const index = selectedConnectors.value.indexOf(value);
  if (index > -1) {
    selectedConnectors.value.splice(index, 1);
  } else {
    selectedConnectors.value.push(value);
  }
};

const resetFilters = () => {
  selectedBrand.value = '';
  selectedConnectors.value = ['CCS', 'GB/T', 'CHAdeMO', 'Type 2'];
  selectedPower.value = 50;
};

const applyFilters = () => {
  stationsStore.updateFilters({
    brand: selectedBrand.value,
    connectors: selectedConnectors.value,
    power: selectedPower.value
  });
  showToast('筛选条件已应用', 'success');
  emit('close');
};
</script>
