<template>
  <div class="panel-overlay">
    <div class="panel-backdrop" @click="$emit('close')"></div>
    <div class="panel-content">
    <div class="glass-effect border-b border-surface-200/50 dark:border-surface-700/50 p-4 flex justify-between items-center flex-shrink-0 z-10">
      <button class="icon-button" @click="$emit('close')">
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">优惠券</h2>
      <div class="w-10"></div>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div class="flex space-x-2 mb-5">
        <button v-for="tab in tabs" :key="tab.value"
          class="px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300"
          :class="activeTab === tab.value ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-md' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300'"
          @click="activeTab = tab.value">
          {{ tab.label }}
          <span v-if="tab.count > 0" class="ml-1 px-1.5 py-0.5 rounded-full text-[10px]"
            :class="activeTab === tab.value ? 'bg-white/20' : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'">
            {{ tab.count }}
          </span>
        </button>
      </div>

      <div class="space-y-3">
        <div v-for="coupon in filteredCoupons" :key="coupon.id"
          class="relative overflow-hidden rounded-2xl shadow-soft transition-all hover:shadow-soft-md"
          :class="coupon.used ? 'opacity-60' : ''">
          <div class="flex">
            <div class="w-24 flex-shrink-0 flex flex-col items-center justify-center py-4 relative"
              :class="coupon.used ? 'bg-surface-200 dark:bg-surface-700' : getCouponBgClass(coupon.type)">
              <p class="text-2xl font-black" :class="coupon.used ? 'text-surface-400' : 'text-white'">
                <span v-if="coupon.type === 'discount'">¥{{ coupon.value }}</span>
                <span v-else-if="coupon.type === 'percent'">{{ coupon.percent / 10 }}折</span>
                <span v-else>{{ coupon.freeMinutes }}分钟</span>
              </p>
              <p class="text-[10px] mt-1" :class="coupon.used ? 'text-surface-400' : 'text-white/80'">
                {{ coupon.type === 'discount' ? '满减券' : coupon.type === 'percent' ? '折扣券' : '免费券' }}
              </p>
            </div>
            <div class="flex-1 bg-white dark:bg-surface-800 p-4 flex flex-col justify-between relative"
              style="border-left: 2px dashed rgba(0,0,0,0.08);">
              <div>
                <h3 class="font-bold text-sm text-surface-800 dark:text-surface-200" :class="{ 'line-through': coupon.used }">{{ coupon.title }}</h3>
                <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">{{ coupon.description }}</p>
              </div>
              <div class="flex items-center justify-between mt-3">
                <span class="text-[10px] text-surface-400">有效期至 {{ coupon.expiryDate }}</span>
                <button v-if="!coupon.used && activeTab === 'available'"
                  class="px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-sm hover:shadow-md active:scale-95 transition-all duration-200"
                  @click="handleUseCoupon(coupon.id)">
                  去使用</button>
                <span v-else-if="coupon.used" class="text-xs font-bold text-surface-400">已使用</span>
              </div>
            </div>
          </div>
          <div v-if="coupon.used" class="absolute top-2 right-2">
            <div class="w-10 h-10 rounded-full bg-surface-300/30 dark:bg-surface-600/30 flex items-center justify-center transform rotate-12">
              <span class="text-[10px] font-bold text-surface-400">已用</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="filteredCoupons.length === 0" class="text-center py-16 animate-in">
        <div class="w-20 h-20 mx-auto mb-5 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
          <i class="fa fa-ticket text-surface-300 dark:text-surface-600 text-3xl" aria-hidden="true"></i>
        </div>
        <p class="font-bold text-surface-800 dark:text-surface-200 mb-2">{{ activeTab === 'available' ? '暂无可用优惠券' : '暂无已使用优惠券' }}</p>
        <p class="text-sm text-surface-500 dark:text-surface-400">{{ activeTab === 'available' ? '参与活动获取更多优惠' : '使用优惠券后这里会显示记录' }}</p>
      </div>
    </div>
      </div>
</div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useUserStore } from '../../store/modules/user'

defineEmits(['close'])

const userStore = useUserStore()
const showToast = inject('showToast')

const activeTab = ref('available')

const coupons = computed(() => userStore.coupons)

const tabs = computed(() => [
  { label: '可使用', value: 'available', count: coupons.value.filter(c => !c.used).length },
  { label: '已使用', value: 'used', count: coupons.value.filter(c => c.used).length }
])

const filteredCoupons = computed(() => {
  if (activeTab.value === 'available') return coupons.value.filter(c => !c.used)
  return coupons.value.filter(c => c.used)
})

const getCouponBgClass = (type) => {
  switch (type) {
    case 'discount': return 'bg-gradient-to-br from-warning-400 to-orange-500'
    case 'percent': return 'bg-gradient-to-br from-pink-400 to-rose-500'
    case 'free': return 'bg-gradient-to-br from-secondary-400 to-emerald-500'
    default: return 'bg-gradient-to-br from-primary-400 to-accent-500'
  }
}

const handleUseCoupon = (couponId) => {
  showToast('请前往充电站使用此优惠券', 'info')
}
</script>
