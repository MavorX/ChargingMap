<template>
  <PanelShell title="优惠券" @close="$emit('close')">
    <div
      class="glass-effect z-10 flex flex-shrink-0 items-center justify-between border-b border-surface-200/50 p-4 dark:border-surface-700/50"
    >
      <button class="icon-button" aria-label="返回" @click="$emit('close')">
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">优惠券</h2>
      <div class="w-10"></div>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div class="mb-5 flex space-x-2">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="rounded-xl px-4 py-2 text-sm font-bold transition-all duration-300"
          :class="
            activeTab === tab.value
              ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-md'
              : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300'
          "
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
          <span
            v-if="tab.count > 0"
            class="ml-1 rounded-full px-1.5 py-0.5 text-[10px]"
            :class="
              activeTab === tab.value
                ? 'bg-white/20'
                : 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
            "
          >
            {{ tab.count }}
          </span>
        </button>
      </div>

      <div class="space-y-3">
        <div
          v-for="coupon in filteredCoupons"
          :key="coupon.id"
          class="relative overflow-hidden rounded-2xl shadow-soft transition-all hover:shadow-soft-md"
          :class="coupon.used ? 'opacity-60' : ''"
        >
          <div class="flex">
            <div
              class="relative flex w-24 flex-shrink-0 flex-col items-center justify-center py-4"
              :class="
                coupon.used ? 'bg-surface-200 dark:bg-surface-700' : getCouponBgClass(coupon.type)
              "
            >
              <p
                class="text-2xl font-black"
                :class="coupon.used ? 'text-surface-400' : 'text-white'"
              >
                <span v-if="coupon.type === 'discount'">¥{{ coupon.value }}</span>
                <span v-else-if="coupon.type === 'percent'">{{ coupon.percent / 10 }}折</span>
                <span v-else>{{ coupon.freeMinutes }}分钟</span>
              </p>
              <p
                class="mt-1 text-[10px]"
                :class="coupon.used ? 'text-surface-400' : 'text-white/80'"
              >
                {{
                  coupon.type === 'discount'
                    ? '满减券'
                    : coupon.type === 'percent'
                      ? '折扣券'
                      : '免费券'
                }}
              </p>
            </div>
            <div
              class="relative flex flex-1 flex-col justify-between bg-white p-4 dark:bg-surface-800"
              style="border-left: 2px dashed rgba(0, 0, 0, 0.08)"
            >
              <div>
                <h3
                  class="text-sm font-bold text-surface-800 dark:text-surface-200"
                  :class="{ 'line-through': coupon.used }"
                >
                  {{ coupon.title }}
                </h3>
                <p class="mt-1 text-xs text-surface-500 dark:text-surface-400">
                  {{ coupon.description }}
                </p>
              </div>
              <div class="mt-3 flex items-center justify-between">
                <span class="text-[10px] text-surface-400">有效期至 {{ coupon.expiryDate }}</span>
                <button
                  v-if="!coupon.used && activeTab === 'available'"
                  class="rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 px-3 py-1 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
                  @click="handleUseCoupon(coupon.id)"
                >
                  去使用
                </button>
                <span v-else-if="coupon.used" class="text-xs font-bold text-surface-400"
                  >已使用</span
                >
              </div>
            </div>
          </div>
          <div v-if="coupon.used" class="absolute right-2 top-2">
            <div
              class="flex h-10 w-10 rotate-12 transform items-center justify-center rounded-full bg-surface-300/30 dark:bg-surface-600/30"
            >
              <span class="text-[10px] font-bold text-surface-400">已用</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="filteredCoupons.length === 0" class="animate-in py-16 text-center">
        <div
          class="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800"
        >
          <i
            class="fa fa-ticket text-3xl text-surface-300 dark:text-surface-600"
            aria-hidden="true"
          ></i>
        </div>
        <p class="mb-2 font-bold text-surface-800 dark:text-surface-200">
          {{ activeTab === 'available' ? '暂无可用优惠券' : '暂无已使用优惠券' }}
        </p>
        <p class="text-sm text-surface-500 dark:text-surface-400">
          {{ activeTab === 'available' ? '参与活动获取更多优惠' : '使用优惠券后这里会显示记录' }}
        </p>
      </div>
    </div>
  </PanelShell>
</template>

<script setup>
import PanelShell from '../common/PanelShell.vue'
import { ref, computed, inject } from 'vue'
import { useUserStore } from '../../store/modules/user'

defineEmits(['close'])

const userStore = useUserStore()
const showToast = inject('showToast')

const activeTab = ref('available')

const coupons = computed(() => userStore.coupons)

const tabs = computed(() => [
  { label: '可使用', value: 'available', count: coupons.value.filter((c) => !c.used).length },
  { label: '已使用', value: 'used', count: coupons.value.filter((c) => c.used).length }
])

const filteredCoupons = computed(() => {
  if (activeTab.value === 'available') return coupons.value.filter((c) => !c.used)
  return coupons.value.filter((c) => c.used)
})

const getCouponBgClass = (type) => {
  switch (type) {
    case 'discount':
      return 'bg-gradient-to-br from-warning-400 to-orange-500'
    case 'percent':
      return 'bg-gradient-to-br from-pink-400 to-rose-500'
    case 'free':
      return 'bg-gradient-to-br from-secondary-400 to-emerald-500'
    default:
      return 'bg-gradient-to-br from-primary-400 to-accent-500'
  }
}

const handleUseCoupon = (_couponId) => {
  showToast('请前往充电站使用此优惠券', 'info')
}
</script>
