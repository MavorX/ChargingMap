<template>
  <div class="panel-overlay">
    <div class="panel-backdrop" @click="$emit('close')"></div>
    <div class="panel-content">
    <div class="glass-effect border-b border-surface-200/50 dark:border-surface-700/50 p-4 flex justify-between items-center flex-shrink-0 z-10">
      <button class="icon-button" @click="$emit('close')">
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">确认支付</h2>
      <div class="w-10"></div>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div class="premium-card p-5 mb-6 animate-in relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary-500/10 to-transparent rounded-bl-full"></div>
        <div class="flex items-start justify-between mb-3 relative z-10">
          <div class="flex items-start space-x-3 flex-1 min-w-0">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-400 to-emerald-500 flex items-center justify-center shadow-md flex-shrink-0">
              <i class="fa fa-check text-white text-xl" aria-hidden="true"></i>
            </div>
            <div class="min-w-0">
              <h3 class="font-bold text-surface-900 dark:text-surface-100 text-base mb-1">{{ currentStation?.stationName }}</h3>
              <p class="text-sm text-surface-500 dark:text-surface-400 truncate">{{ currentStation?.address }}</p>
            </div>
          </div>
          <span class="status-badge-success text-[11px] font-bold">充电完成</span>
        </div>
      </div>

      <div class="mb-6 animate-in delay-100">
        <h3 class="section-title">
          <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-400 to-blue-500 flex items-center justify-center mr-2.5 shadow-md">
            <i class="fa fa-file-text-o text-white text-xs" aria-hidden="true"></i>
          </div>
          充电详情
        </h3>
        <div class="premium-card p-5 space-y-4">
          <div class="flex justify-between items-center pb-3 border-b border-surface-100 dark:border-surface-700/50">
            <div class="flex items-center space-x-2.5">
              <i class="fa fa-clock-o text-primary-500"></i>
              <span class="text-sm font-medium text-surface-600 dark:text-surface-400">充电时长</span>
            </div>
            <span class="font-bold text-surface-900 dark:text-surface-100">{{ formatDuration(chargingData.duration) }}</span>
          </div>
          <div class="flex justify-between items-center pb-3 border-b border-surface-100 dark:border-surface-700/50">
            <div class="flex items-center space-x-2.5">
              <i class="fa fa-bolt text-secondary-500"></i>
              <span class="text-sm font-medium text-surface-600 dark:text-surface-400">充电电量</span>
            </div>
            <span class="font-bold text-surface-900 dark:text-surface-100">{{ chargingData.energy.toFixed(1) }} kWh</span>
          </div>
          <div class="flex justify-between items-center pb-3 border-b border-surface-100 dark:border-surface-700/50">
            <div class="flex items-center space-x-2.5">
              <i class="fa fa-rmb text-warning-500"></i>
              <span class="text-sm font-medium text-surface-600 dark:text-surface-400">电价</span>
            </div>
            <span class="font-bold text-surface-900 dark:text-surface-100">¥{{ currentStation?.currentPrice.toFixed(2) }}/度</span>
          </div>
          <div class="flex justify-between items-center pb-3 border-b border-surface-100 dark:border-surface-700/50">
            <div class="flex items-center space-x-2.5">
              <i class="fa fa-percent text-accent-500"></i>
              <span class="text-sm font-medium text-surface-600 dark:text-surface-400">充电服务费</span>
            </div>
            <span class="font-bold text-surface-900 dark:text-surface-100">¥{{ serviceFee.toFixed(2) }}</span>
          </div>
          <div class="pt-3 flex justify-between items-center">
            <span class="text-base font-bold text-surface-900 dark:text-surface-100">合计</span>
            <span class="text-2xl font-black gradient-text">¥{{ totalAmount.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <div class="mb-6 animate-in delay-200">
        <h3 class="section-title">
          <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-warning-400 to-orange-500 flex items-center justify-center mr-2.5 shadow-md">
            <i class="fa fa-ticket text-white text-xs" aria-hidden="true"></i>
          </div>
          优惠券
        </h3>
        <button
          class="w-full premium-card p-4 hover:shadow-soft-md transition-all duration-300 group"
          @click="showCouponList = !showCouponList">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-warning-400 to-amber-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                <i class="fa fa-ticket text-white" aria-hidden="true"></i>
              </div>
              <span class="font-medium text-sm text-surface-800 dark:text-surface-200">{{ selectedCoupon ? selectedCoupon.name : '选择优惠券' }}</span>
            </div>
            <div class="flex items-center space-x-2">
              <span v-if="selectedCoupon" class="text-sm font-black text-danger-500">-¥{{ selectedCoupon.discount.toFixed(2) }}</span>
              <i class="fa fa-chevron-down text-surface-400 transition-transform duration-300" :class="{ 'rotate-180': showCouponList }" aria-hidden="true"></i>
            </div>
          </div>
        </button>

        <Transition name="slide-up-fade">
          <div v-if="showCouponList" class="mt-3 space-y-2.5">
            <div v-for="coupon in coupons" :key="coupon.id"
                 class="premium-card p-4 cursor-pointer transition-all duration-300 group"
                 :class="selectedCoupon?.id === coupon.id ? 'ring-2 ring-warning-500 ring-offset-2 dark:ring-offset-surface-900' : 'hover:shadow-soft-md hover:-translate-y-0.5'"
                 @click="selectCoupon(coupon)">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-bold text-surface-800 dark:text-surface-200 text-sm mb-1">{{ coupon.name }}</p>
                  <p class="text-xs text-surface-500 dark:text-surface-400">有效期至 {{ coupon.expiry }}</p>
                </div>
                <span class="text-lg font-black text-danger-500">-¥{{ coupon.discount.toFixed(2) }}</span>
              </div>
            </div>
            <button class="w-full py-3 text-sm font-medium text-surface-500 hover:text-primary-500 transition-colors duration-200" @click="selectedCoupon = null; showCouponList = false">
              不使用优惠券
            </button>
          </div>
        </Transition>
      </div>

      <div class="mb-6 animate-in delay-300">
        <h3 class="section-title">
          <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-secondary-400 to-teal-500 flex items-center justify-center mr-2.5 shadow-md">
            <i class="fa fa-credit-card text-white text-xs" aria-hidden="true"></i>
          </div>
          支付方式
        </h3>
        <div class="space-y-2.5">
          <div v-for="(method, index) in paymentMethods" :key="method.id"
               class="group premium-card p-4 cursor-pointer transition-all duration-300 animate-in"
               :class="selectedPaymentMethod === method.id ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-surface-900 shadow-glow-primary' : 'hover:shadow-soft-md hover:-translate-y-0.5'"
               :style="{ animationDelay: `${index * 80}ms` }"
               @click="selectedPaymentMethod = method.id">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3 flex-1 min-w-0">
                <div class="w-11 h-11 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300" :class="method.bgClass">
                  <i :class="method.icon" aria-hidden="true"></i>
                </div>
                <div class="min-w-0">
                  <p class="font-bold text-surface-800 dark:text-surface-200 text-sm">{{ method.name }}</p>
                  <p class="text-xs text-surface-500 dark:text-surface-400 truncate">{{ method.desc }}</p>
                </div>
              </div>
              <div v-if="selectedPaymentMethod === method.id"
                   class="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md animate-scale-in">
                <i class="fa fa-check text-white text-xs" aria-hidden="true"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="premium-card p-5 space-y-3 animate-in delay-400">
        <div class="flex justify-between items-center pb-3 border-b border-surface-100 dark:border-surface-700/50">
          <span class="text-sm font-medium text-surface-600 dark:text-surface-400">充电费用</span>
          <span class="font-bold text-surface-900 dark:text-surface-100">¥{{ chargeCost.toFixed(2) }}</span>
        </div>
        <div class="flex justify-between items-center pb-3 border-b border-surface-100 dark:border-surface-700/50">
          <span class="text-sm font-medium text-surface-600 dark:text-surface-400">服务费</span>
          <span class="font-bold text-surface-900 dark:text-surface-100">¥{{ serviceFee.toFixed(2) }}</span>
        </div>
        <div v-if="selectedCoupon" class="flex justify-between items-center pb-3 border-b border-surface-100 dark:border-surface-700/50">
          <span class="text-sm font-medium text-surface-600 dark:text-surface-400">优惠券抵扣</span>
          <span class="font-bold text-danger-500">-¥{{ selectedCoupon.discount.toFixed(2) }}</span>
        </div>
        <div class="pt-3 flex justify-between items-center">
          <span class="text-base font-bold text-surface-900 dark:text-surface-100">实付金额</span>
          <span class="text-3xl font-black gradient-text">¥{{ finalAmount.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <div class="flex-shrink-0 glass-effect border-t border-surface-200/50 dark:border-surface-700/50 p-4 lg:p-5">
      <button
        class="group w-full relative overflow-hidden bg-gradient-to-r from-primary-500 via-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary-500/25 hover:shadow-2xl hover:shadow-primary-500/35 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        @click="handlePayment"
        :disabled="isPaying">
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        <span class="relative z-10 flex items-center justify-center space-x-2.5 text-base">
          <div v-if="isPaying" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <i v-else class="fa fa-shield text-lg" aria-hidden="true"></i>
          <span>{{ isPaying ? '支付中...' : `确认支付 ¥${finalAmount.toFixed(2)}` }}</span>
        </span>
      </button>
    </div>
      </div>
</div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useStationsStore } from '../../store/modules/stations'
import { useChargingStore } from '../../store/modules/charging'
import { useUserStore } from '../../store/modules/user'
import { processPayment } from '../../services/api'

const emit = defineEmits(['close', 'payment-success'])
const stationsStore = useStationsStore()
const chargingStore = useChargingStore()
const userStore = useUserStore()
const showToast = inject('showToast')
const setLoading = inject('setLoading')

const currentStation = computed(() => stationsStore.currentStation)
const chargingData = computed(() => chargingStore.chargingData)

const isPaying = ref(false)
const showCouponList = ref(false)
const selectedPaymentMethod = ref('wechat')
const selectedCoupon = ref(null)

const chargeCost = computed(() => {
  if (!currentStation.value) return 0
  return chargingData.value.energy * currentStation.value.currentPrice
})

const serviceFee = computed(() => {
  return chargeCost.value * 0.1
})

const totalAmount = computed(() => {
  return chargeCost.value + serviceFee.value
})

const finalAmount = computed(() => {
  let amount = totalAmount.value
  if (selectedCoupon.value) {
    amount -= selectedCoupon.value.discount
  }
  return Math.max(0, amount)
})

const coupons = computed(() => {
  return userStore.coupons
    .filter(c => !c.used)
    .map(c => {
      let discount = 0
      if (c.type === 'discount') {
        discount = c.value
      } else if (c.type === 'percent') {
        discount = Math.min(Math.round(totalAmount.value * (1 - c.percent / 100) * 100) / 100, c.value)
      } else if (c.type === 'free') {
        discount = c.value
      }
      return {
        id: c.id,
        name: c.title,
        discount,
        expiry: c.expiryDate
      }
    })
    .filter(c => c.discount > 0)
})

const paymentMethods = computed(() => [
  { id: 'wechat', name: '微信支付', desc: '推荐使用', icon: 'fab fa-weixin text-green-500 text-lg', bgClass: 'bg-green-100 dark:bg-green-900/30' },
  { id: 'alipay', name: '支付宝', desc: '快捷支付', icon: 'fab fa-alipay text-blue-500 text-lg', bgClass: 'bg-blue-100 dark:bg-blue-900/30' },
  { id: 'wallet', name: '钱包余额', desc: `余额 ¥${userStore.userInfo.balance.toFixed(2)}`, icon: 'fa fa-credit-card text-primary-500 text-lg', bgClass: 'bg-primary-100 dark:bg-primary-900/30' },
])

const selectCoupon = (coupon) => {
  selectedCoupon.value = coupon
  showCouponList.value = false
}

const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}小时${m}分钟`
  return `${m}分钟`
}

const handlePayment = async () => {
  if (selectedPaymentMethod.value === 'wallet' && finalAmount.value > userStore.userInfo.balance) {
    showToast('钱包余额不足，请选择其他支付方式', 'error')
    return
  }
  isPaying.value = true
  setLoading(true)
  try {
    await processPayment({
      amount: finalAmount.value,
      method: selectedPaymentMethod.value,
      couponId: selectedCoupon.value?.id || null,
      stationId: currentStation.value?.stationId,
      energy: chargingData.value.energy
    })
    if (selectedCoupon.value) {
      userStore.useCoupon(selectedCoupon.value.id)
    }
    if (selectedPaymentMethod.value === 'wallet') {
      userStore.userInfo.balance -= finalAmount.value
    }
    showToast('支付成功', 'success')
    emit('payment-success', finalAmount.value)
  } catch (err) {
    showToast('支付失败，请重试', 'error')
  } finally {
    isPaying.value = false
    setLoading(false)
  }
}
</script>

<style scoped>
.slide-up-fade-enter-active,
.slide-up-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-up-fade-enter-from,
.slide-up-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
