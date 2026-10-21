<template>
  <PanelShell
    title="支付成功"
    fullscreen
    content-class="items-center justify-center p-6"
    @close="$emit('close')"
  >
    <div
      class="mb-6 flex h-24 w-24 animate-scale-in items-center justify-center rounded-2xl bg-gradient-to-br from-secondary-400 to-emerald-500 shadow-xl shadow-secondary-500/30"
    >
      <i class="fa fa-check text-5xl text-white" aria-hidden="true"></i>
    </div>
    <h2 class="mb-2 text-2xl font-black text-surface-900 dark:text-surface-100">支付成功</h2>
    <p class="mb-2 text-center text-surface-500 dark:text-surface-400">感谢使用充电桩服务</p>
    <div
      class="mb-8 w-full max-w-sm space-y-3 rounded-2xl bg-gradient-to-br from-white to-surface-50 p-5 shadow-soft dark:from-surface-800 dark:to-surface-900"
    >
      <div class="flex justify-between text-sm">
        <span class="text-surface-500 dark:text-surface-400">充电电量</span>
        <span class="font-bold text-surface-800 dark:text-surface-200"
          >{{ chargingData.energy.toFixed(1) }} kWh</span
        >
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-surface-500 dark:text-surface-400">充电时长</span>
        <span class="font-bold text-surface-800 dark:text-surface-200">{{
          formatDuration(chargingData.duration, 'hm-verbose')
        }}</span>
      </div>
      <div class="flex justify-between border-t border-surface-100 pt-3 dark:border-surface-700/50">
        <span class="font-bold text-surface-900 dark:text-surface-100">支付金额</span>
        <span class="gradient-text text-xl font-black">{{ formatPrice(paidAmount) }}</span>
      </div>
    </div>
    <button
      class="group relative w-full max-w-sm transform overflow-hidden rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500 py-4 font-bold text-white shadow-xl shadow-primary-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-primary-500/35 active:translate-y-0"
      @click="$emit('close')"
    >
      <div
        class="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]"
      ></div>
      <span class="relative z-10">返回地图</span>
    </button>
  </PanelShell>
</template>

<script setup>
import PanelShell from '../common/PanelShell.vue'
import { computed } from 'vue'
import { useChargingStore } from '../../store/modules/charging'
import { formatDuration, formatPrice } from '../../utils/format'

defineEmits(['close'])

const props = defineProps({
  amount: {
    type: Number,
    default: null
  }
})

const chargingStore = useChargingStore()
const chargingData = computed(() => chargingStore.chargingData)

const paidAmount = computed(() => props.amount ?? chargingStore.quotePayment().finalAmount)
</script>
