<template>
  <AccountPanel title="优惠券" subtitle="核对有效期与消费门槛，结算时抵扣" @close="emit('close')">
    <div class="segmented-control" role="group" :aria-label="t('优惠券状态')">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="segmented-item"
        :aria-pressed="activeTab === tab.value"
        @click="activeTab = tab.value"
      >
        {{ t(tab.label) }} · {{ tab.count }}
      </button>
    </div>
    <div v-for="coupon in filteredCoupons" :key="coupon.id" class="account-card">
      <div class="flex items-start gap-4">
        <div
          class="w-20 shrink-0 rounded-xl bg-primary-50 px-2 py-4 text-center text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
        >
          <strong class="text-xl tabular-nums">{{
            coupon.type === 'percent'
              ? t('{percent}折', { percent: coupon.percent / 10, discount: 100 - coupon.percent })
              : `¥${coupon.value}`
          }}</strong>
          <p class="mt-1 text-[11px]">{{ t(coupon.type === 'percent' ? '折扣券' : '抵扣额度') }}</p>
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-sm font-bold">{{ t(coupon.title) }}</h3>
          <p class="account-caption mt-1">{{ t(coupon.description) }}</p>
          <p class="account-caption mt-2">
            {{
              coupon.minSpend
                ? t('满 {amount} 元可用', { amount: coupon.minSpend })
                : t('无最低消费')
            }}{{
              coupon.type === 'percent'
                ? t(' · 最多抵扣 {amount} 元', { amount: coupon.value })
                : ''
            }}
          </p>
        </div>
      </div>
      <div
        class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-surface-100 pt-3 dark:border-surface-800"
      >
        <span class="account-caption">{{
          t('有效期至 {date}', { date: coupon.expiryDate || t('未指定') })
        }}</span
        ><button
          v-if="couponState(coupon, now) === 'available'"
          class="action-secondary min-h-10 px-3 py-2 text-xs text-primary-700 dark:text-primary-300"
          @click="useCoupon(coupon)"
        >
          {{ t('去使用') }}</button
        ><span v-else class="account-caption">{{
          t(couponState(coupon, now) === 'used' ? '已使用' : '已过期')
        }}</span>
      </div>
    </div>
    <div v-if="!filteredCoupons.length" class="account-empty">
      <span class="account-icon"><i class="fa fa-ticket" aria-hidden="true"></i></span>
      <h3 class="text-sm font-semibold">{{ t(emptyText) }}</h3>
      <p class="account-caption">
        {{
          t(
            activeTab === 'available'
              ? '优惠券不是开始充电的必要条件。'
              : '这里会保留对应的券状态。'
          )
        }}
      </p>
      <button class="action-secondary" @click="emit('explore')">{{ t('去找充电站') }}</button>
    </div>
  </AccountPanel>
</template>
<script setup>
import { computed, inject, ref } from 'vue'
import { t } from '../../i18n'
import AccountPanel from './AccountPanel.vue'
import { useUserStore } from '../../store/modules/user'
import { couponState } from '../../utils/coupons'
import { useNow } from '../../composables/useNow'
const emit = defineEmits(['close', 'use-coupon', 'explore'])
const user = useUserStore()
const toast = inject('showToast')
const now = useNow()
const activeTab = ref('available')
const tabs = computed(() =>
  [
    { label: '可使用', value: 'available' },
    { label: '已使用', value: 'used' },
    { label: '已过期', value: 'expired' }
  ].map((tab) => ({
    ...tab,
    count: user.coupons.filter((coupon) => couponState(coupon, now.value) === tab.value).length
  }))
)
const filteredCoupons = computed(() =>
  user.coupons.filter((coupon) => couponState(coupon, now.value) === activeTab.value)
)
const emptyText = computed(
  () =>
    ({ available: '暂无可用优惠券', used: '暂无已使用优惠券', expired: '暂无过期优惠券' })[
      activeTab.value
    ]
)
const useCoupon = (coupon) => {
  if (couponState(coupon) !== 'available') {
    toast('这张优惠券已不可用，请重新选择', 'info')
    return
  }
  emit('use-coupon', coupon.id)
}
</script>
