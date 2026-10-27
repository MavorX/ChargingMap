<template>
  <PanelShell title="确认支付" :busy="isPaying" @close="emit('close')">
    <div class="glass-effect flex shrink-0 items-center justify-between p-4">
      <button
        class="icon-button"
        :aria-label="t('返回')"
        :disabled="isPaying"
        @click="emit('close')"
      >
        <i class="fa fa-arrow-left" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold">{{ t('确认支付') }}</h2>
      <span class="w-10"></span>
    </div>
    <div class="flex-1 space-y-6 overflow-y-auto p-5">
      <p class="text-xs text-surface-400">{{ t('演示结算，不会产生实际扣款') }}</p>
      <div class="premium-card p-4">
        <span class="status-badge-success mb-3">{{ t('充电已完成') }}</span>
        <h3 class="mb-1 break-words font-bold">
          {{ stationName(currentStation?.stationName) || t('暂无可结算站点') }}
        </h3>
        <p class="break-words text-xs leading-6 text-surface-500 dark:text-surface-400">
          {{ stationAddress(currentStation?.address) }}
        </p>
      </div>
      <section>
        <h3 class="section-title">{{ t('充电详情') }}</h3>
        <dl class="premium-card space-y-3 p-4 text-sm">
          <div class="flex flex-wrap justify-between gap-2">
            <dt class="text-surface-500">{{ t('充电时长') }}</dt>
            <dd>{{ formatDuration(chargingData.duration, 'hm-verbose') }}</dd>
          </div>
          <div class="flex flex-wrap justify-between gap-2">
            <dt class="text-surface-500">{{ t('充电电量') }}</dt>
            <dd>{{ chargingData.energy.toFixed(1) }} kWh</dd>
          </div>
          <div class="flex flex-wrap justify-between gap-2">
            <dt class="text-surface-500">{{ t('电价') }}</dt>
            <dd>{{ formatPrice(currentStation?.currentPrice) }}{{ t('/度') }}</dd>
          </div>
          <div class="flex flex-wrap justify-between gap-2">
            <dt class="text-surface-500">{{ t('充电服务费（10%）') }}</dt>
            <dd>{{ formatPrice(amounts.serviceFee) }}</dd>
          </div>
        </dl>
      </section>
      <fieldset :disabled="isPaying" class="min-w-0 space-y-6">
        <section>
          <h3 class="section-title">{{ t('优惠券') }}</h3>
          <button
            class="premium-card flex w-full items-center justify-between gap-3 p-4 text-left text-sm"
            :aria-expanded="showCouponList"
            aria-controls="payment-coupons"
            @click="showCouponList = !showCouponList"
          >
            <span class="min-w-0 break-words">{{ t(selectedCoupon?.title || '选择优惠券') }}</span>
            <span class="shrink-0 text-primary-600 dark:text-primary-400"
              >{{
                selectedCoupon
                  ? `-${formatPrice(amounts.couponDiscount)}`
                  : t('{count} 张可用', { count: coupons.length })
              }}
              <i class="fa fa-angle-down" aria-hidden="true"></i
            ></span>
          </button>
          <div v-if="showCouponList" id="payment-coupons" class="mt-3 space-y-2">
            <p v-if="!coupons.length" class="p-3 text-xs text-surface-500" role="status">
              {{ t('暂无满足本次订单条件的优惠券') }}
            </p>
            <button
              v-for="coupon in coupons"
              :key="coupon.id"
              class="premium-card choice-card"
              :aria-pressed="selectedCouponId === coupon.id"
              @click="selectCoupon(coupon.id)"
            >
              <span class="min-w-0 flex-1"
                ><span class="block text-sm font-semibold">{{ t(coupon.title) }}</span
                ><span class="mt-1 block text-xs text-surface-500">{{
                  t('有效期至 {date}', { date: coupon.expiryDate || t('长期有效') })
                }}</span></span
              >
              <span class="shrink-0 text-sm font-bold text-primary-600 dark:text-primary-400"
                >-{{ formatPrice(discountFor(coupon)) }}</span
              >
            </button>
            <button class="min-h-11 w-full text-sm text-surface-500" @click="selectCoupon(null)">
              {{ t('不使用优惠券') }}
            </button>
          </div>
        </section>
        <section>
          <h3 class="section-title">{{ t('支付方式') }}</h3>
          <div class="space-y-2" role="group" :aria-label="t('支付方式')">
            <button
              v-for="method in paymentMethods"
              :key="method.id"
              class="choice-card disabled:cursor-not-allowed disabled:opacity-50"
              :aria-pressed="selectedPaymentMethod === method.id"
              :disabled="method.id === 'wallet' && insufficientBalance"
              @click="selectedPaymentMethod = method.id"
            >
              <i
                :class="method.icon"
                class="w-6 shrink-0 text-center text-lg"
                aria-hidden="true"
              ></i>
              <span class="min-w-0 flex-1"
                ><span class="block text-sm font-semibold">{{ t(method.name) }}</span
                ><span
                  class="mt-1 block break-words text-xs text-surface-500 dark:text-surface-400"
                  >{{ t(method.desc) }}</span
                ></span
              >
              <i
                v-if="selectedPaymentMethod === method.id"
                class="fa fa-check shrink-0 text-primary-500"
                aria-hidden="true"
              ></i>
            </button>
          </div>
        </section>
      </fieldset>
      <div class="premium-card space-y-3 p-4 text-sm">
        <div class="flex justify-between gap-3">
          <span class="text-surface-500">{{ t('充电费用') }}</span
          ><span>{{ formatPrice(amounts.chargeCost) }}</span>
        </div>
        <div class="flex justify-between gap-3">
          <span class="text-surface-500">{{ t('服务费') }}</span
          ><span>{{ formatPrice(amounts.serviceFee) }}</span>
        </div>
        <div v-if="selectedCoupon" class="flex justify-between gap-3">
          <span class="text-surface-500">{{ t('优惠券抵扣') }}</span
          ><span>-{{ formatPrice(amounts.couponDiscount) }}</span>
        </div>
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-t border-surface-200 pt-3 dark:border-surface-700"
        >
          <span class="font-semibold">{{ t('实付金额') }}</span
          ><span class="text-2xl font-bold tabular-nums text-primary-600 dark:text-primary-400">{{
            formatPrice(finalAmount)
          }}</span>
        </div>
      </div>
      <p class="text-xs leading-6 text-surface-500 dark:text-surface-400">
        {{ t('当前为演示支付，不会发起真实扣款。关闭面板后，可通过地图上的「去结算」继续。') }}
      </p>
    </div>
    <div class="glass-effect shrink-0 border-t p-4">
      <button
        class="action-primary"
        :disabled="isPaying || !canPay"
        :aria-busy="isPaying"
        @click="handlePayment"
      >
        <i v-if="isPaying" class="fa fa-circle-o-notch fa-spin" aria-hidden="true"></i
        >{{
          isPaying
            ? t('正在处理，请稍候…')
            : t('确认支付 {amount}', { amount: formatPrice(finalAmount) })
        }}
      </button>
    </div>
  </PanelShell>
</template>

<script setup>
import { ref, computed, inject, watch, onBeforeUnmount } from 'vue'
import { t } from '../../i18n'
import { stationName, stationAddress } from '../../i18n/data'
import PanelShell from '../common/PanelShell.vue'
import { useStationsStore } from '../../store/modules/stations'
import {
  calculatePaymentAmounts,
  isCouponUsable,
  useChargingStore
} from '../../store/modules/charging'
import { useUserStore } from '../../store/modules/user'
import { processPayment } from '../../services/api'
import { formatDuration, formatPrice } from '../../utils/format'
import { useNow } from '../../composables/useNow'

const emit = defineEmits(['close', 'payment-success'])
const stationsStore = useStationsStore()
const chargingStore = useChargingStore()
const userStore = useUserStore()
const showToast = inject('showToast')
const now = useNow()
const currentStation = computed(() => chargingStore.sessionStation || stationsStore.currentStation)
const chargingData = computed(() => chargingStore.chargingData)
const isPaying = ref(false)
const showCouponList = ref(false)
const selectedPaymentMethod = ref('wechat')
const selectedCouponId = ref(chargingStore.preferredCouponId)
const selectedCoupon = computed(
  () => userStore.coupons.find((coupon) => coupon.id === selectedCouponId.value) || null
)
const baseAmounts = computed(() =>
  calculatePaymentAmounts({
    energy: chargingData.value.energy,
    price: currentStation.value?.currentPrice
  })
)
const discountFor = (coupon) =>
  calculatePaymentAmounts({
    energy: chargingData.value.energy,
    price: currentStation.value?.currentPrice,
    coupon
  }).couponDiscount
const coupons = computed(() =>
  userStore.coupons.filter(
    (coupon) =>
      isCouponUsable(coupon, baseAmounts.value.totalAmount, now.value) && discountFor(coupon) > 0
  )
)
const amounts = computed(() =>
  calculatePaymentAmounts({
    energy: chargingData.value.energy,
    price: currentStation.value?.currentPrice,
    coupon: selectedCoupon.value
  })
)
const finalAmount = computed(() => amounts.value.finalAmount)
const insufficientBalance = computed(() => finalAmount.value > userStore.userInfo.balance)
const canPay = computed(
  () =>
    !chargingStore.isCharging &&
    chargingStore.phase === 'finished' &&
    chargingStore.paymentPending &&
    !!chargingStore.sessionId &&
    chargingStore.sessionStation?.dataSource === 'sandbox' &&
    Number.isFinite(currentStation.value?.currentPrice) &&
    currentStation.value.currentPrice >= 0
)
const paymentMethods = computed(() => [
  { id: 'wechat', name: '微信支付', desc: '演示支付', icon: 'fab fa-weixin text-secondary-600' },
  { id: 'alipay', name: '支付宝', desc: '演示支付', icon: 'fab fa-alipay text-primary-600' },
  {
    id: 'wallet',
    name: '钱包余额',
    desc: `${t('余额 {amount}', { amount: formatPrice(userStore.userInfo.balance) })}${insufficientBalance.value ? t(' · 余额不足') : ''}`,
    icon: 'fa fa-credit-card text-primary-600'
  }
])
watch(
  [coupons, isPaying],
  ([available]) => {
    if (
      !isPaying.value &&
      selectedCouponId.value &&
      !available.some((coupon) => coupon.id === selectedCouponId.value)
    )
      selectedCouponId.value = null
  },
  { immediate: true }
)
const selectCoupon = (id) => {
  selectedCouponId.value = id
  showCouponList.value = false
}
let mounted = true
onBeforeUnmount(() => {
  mounted = false
})
const handlePayment = async () => {
  if (isPaying.value || !canPay.value) return
  if (selectedPaymentMethod.value === 'wallet' && insufficientBalance.value) {
    showToast('钱包余额不足，请选择其他支付方式', 'error')
    return
  }
  const method = selectedPaymentMethod.value
  const couponId = selectedCouponId.value
  const order = {
    sessionId: chargingStore.sessionId,
    amount: finalAmount.value,
    method,
    couponId,
    stationId: currentStation.value.stationId,
    energy: chargingData.value.energy
  }
  isPaying.value = true
  try {
    const result = await processPayment(order)
    if (!result?.success) throw new Error('支付未成功，请重试；订单尚未结算')
    if (chargingStore.sessionId !== order.sessionId)
      throw new Error('订单状态已变化，请重新打开账单核对')
    const receipt = chargingStore.settlePayment({ couponId, method })
    if (mounted) {
      showToast('演示支付成功', 'success')
      emit('payment-success', receipt)
    }
  } catch (error) {
    if (mounted) showToast(error.message || '支付失败，请重试', 'error')
  } finally {
    isPaying.value = false
  }
}
</script>
