<template>
  <PanelShell title="支付成功" @close="$emit('close')">
    <div class="glass-effect flex shrink-0 items-center justify-between p-4">
      <span class="w-10"></span>
      <h2 class="text-lg font-bold">{{ t('支付结果') }}</h2>
      <button class="icon-button" :aria-label="t('关闭支付结果')" @click="$emit('close')">
        <i class="fa fa-times" aria-hidden="true"></i>
      </button>
    </div>
    <div class="flex-1 overflow-y-auto p-5">
      <div class="flex min-h-full flex-col justify-center py-4 text-center">
        <div
          class="mx-auto mb-5 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-secondary-50 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400"
        >
          <i class="fa fa-check text-3xl" aria-hidden="true"></i>
        </div>
        <h3 class="mb-2 text-2xl font-bold">{{ t('支付成功') }}</h3>
        <p class="mb-6 text-sm text-surface-500 dark:text-surface-400">
          {{ t('感谢使用充电服务') }}
        </p>
        <dl class="premium-card space-y-4 p-4 text-sm">
          <div class="flex flex-wrap justify-between gap-2">
            <dt class="text-surface-500 dark:text-surface-400">{{ t('充电电量') }}</dt>
            <dd>{{ chargingData.energy.toFixed(1) }} kWh</dd>
          </div>
          <div class="flex flex-wrap justify-between gap-2">
            <dt class="text-surface-500 dark:text-surface-400">{{ t('充电时长') }}</dt>
            <dd>{{ formatDuration(chargingData.duration, 'hm-verbose') }}</dd>
          </div>
          <div
            class="flex flex-wrap items-center justify-between gap-2 border-t border-surface-200 pt-4 dark:border-surface-700"
          >
            <dt>{{ t('支付金额') }}</dt>
            <dd class="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {{ formatPrice(paidAmount) }}
            </dd>
          </div>
        </dl>
      </div>
    </div>
    <div class="glass-effect shrink-0 space-y-2 border-t p-4">
      <button class="action-primary" @click="$emit('close')">{{ t('返回地图') }}</button
      ><button
        v-if="!chargingStore.reviewSubmitted"
        class="min-h-11 w-full text-sm font-semibold text-primary-600 dark:text-primary-400"
        @click="$emit('review')"
      >
        {{ t('评价本次充电') }}
      </button>
    </div>
  </PanelShell>
</template>

<script setup>
import { t } from '../../i18n'
import PanelShell from '../common/PanelShell.vue'
import { computed } from 'vue'
import { useChargingStore } from '../../store/modules/charging'
import { formatDuration, formatPrice } from '../../utils/format'
defineEmits(['close', 'review'])
const props = defineProps({ amount: { type: Number, default: null } })
const chargingStore = useChargingStore()
const chargingData = computed(() => chargingStore.lastReceipt || chargingStore.chargingData)
const paidAmount = computed(
  () =>
    props.amount ??
    chargingStore.lastReceipt?.finalAmount ??
    chargingStore.quotePayment().finalAmount
)
</script>
