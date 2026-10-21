<template>
  <PanelShell title="我的钱包" @close="$emit('close')">
    <div
      class="glass-effect z-10 flex flex-shrink-0 items-center justify-between border-b border-surface-200/50 p-4 dark:border-surface-700/50"
    >
      <button class="icon-button" @click="$emit('close')">
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">我的钱包</h2>
      <div class="w-10"></div>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div
        class="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 p-6 shadow-xl"
      >
        <div class="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-white/10"></div>
        <div class="absolute bottom-0 left-0 h-24 w-24 rounded-tr-full bg-white/5"></div>
        <p class="relative z-10 mb-1 text-sm text-white/70">账户余额</p>
        <p class="relative z-10 text-3xl font-black text-white">
          {{ formatPrice(userInfo.balance) }}
        </p>
        <div class="relative z-10 mt-4 flex items-center border-t border-white/20 pt-4">
          <div class="flex-1">
            <p class="text-xs text-white/60">会员等级</p>
            <p class="mt-0.5 text-sm font-bold text-white">{{ userInfo.level }}</p>
          </div>
          <div class="flex-1">
            <p class="text-xs text-white/60">可用积分</p>
            <p class="mt-0.5 text-sm font-bold text-white">{{ userInfo.points }}</p>
          </div>
        </div>
      </div>

      <div class="mb-6 grid grid-cols-3 gap-3">
        <button
          class="group rounded-2xl bg-gradient-to-br from-white to-surface-50 p-3 text-center shadow-soft transition-all duration-300 hover:-translate-y-1 active:scale-95 dark:from-surface-800 dark:to-surface-900"
          @click="showRechargeModal = true"
        >
          <div
            class="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-blue-500 shadow-md transition-transform duration-300 group-hover:scale-110"
          >
            <i class="fa fa-plus text-sm text-white" aria-hidden="true"></i>
          </div>
          <p class="text-xs font-bold text-surface-700 dark:text-surface-300">充值</p>
        </button>
        <button
          class="group rounded-2xl bg-gradient-to-br from-white to-surface-50 p-3 text-center shadow-soft transition-all duration-300 hover:-translate-y-1 active:scale-95 dark:from-surface-800 dark:to-surface-900"
          @click="showWithdrawModal = true"
        >
          <div
            class="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-secondary-400 to-emerald-500 shadow-md transition-transform duration-300 group-hover:scale-110"
          >
            <i class="fa fa-arrow-down text-sm text-white" aria-hidden="true"></i>
          </div>
          <p class="text-xs font-bold text-surface-700 dark:text-surface-300">提现</p>
        </button>
        <button
          class="group rounded-2xl bg-gradient-to-br from-white to-surface-50 p-3 text-center shadow-soft transition-all duration-300 hover:-translate-y-1 active:scale-95 dark:from-surface-800 dark:to-surface-900"
          @click="showToast('账单详情功能开发中', 'info')"
        >
          <div
            class="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400 to-purple-500 shadow-md transition-transform duration-300 group-hover:scale-110"
          >
            <i class="fa fa-file-text text-sm text-white" aria-hidden="true"></i>
          </div>
          <p class="text-xs font-bold text-surface-700 dark:text-surface-300">账单</p>
        </button>
      </div>

      <h3 class="mb-3 font-bold text-surface-800 dark:text-surface-200">交易记录</h3>
      <div class="space-y-2.5">
        <div
          v-for="tx in walletTransactions"
          :key="tx.id"
          class="flex items-center justify-between rounded-xl bg-gradient-to-br from-white to-surface-50 p-3.5 shadow-soft dark:from-surface-800 dark:to-surface-900"
        >
          <div class="flex items-center">
            <div
              class="mr-3 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl shadow-sm"
              :class="getTransactionIconClass(tx.type)"
            >
              <i
                :class="getTransactionIcon(tx.type)"
                class="text-sm text-white"
                aria-hidden="true"
              ></i>
            </div>
            <div>
              <p class="text-sm font-bold text-surface-800 dark:text-surface-200">
                {{ tx.description }}
              </p>
              <p class="mt-0.5 text-[10px] text-surface-400">{{ tx.date }}</p>
            </div>
          </div>
          <div class="text-right">
            <p
              class="text-sm font-black"
              :class="
                tx.amount >= 0 ? 'text-secondary-500' : 'text-surface-800 dark:text-surface-200'
              "
            >
              {{ tx.amount >= 0 ? '+' : '' }}{{ formatPrice(Math.abs(tx.amount)) }}
            </p>
            <p class="text-[10px] text-surface-400">余额 {{ formatPrice(tx.balance) }}</p>
          </div>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div
        v-if="showRechargeModal"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm"
        @click.self="showRechargeModal = false"
      >
        <div
          class="w-full max-w-sm animate-scale-in rounded-2xl bg-white p-6 shadow-2xl dark:bg-surface-800"
        >
          <h3 class="mb-4 text-lg font-bold text-surface-900 dark:text-surface-100">充值金额</h3>
          <div class="mb-4 grid grid-cols-3 gap-2.5">
            <button
              v-for="amount in rechargeAmounts"
              :key="amount"
              class="rounded-xl border-2 py-3 text-sm font-bold transition-all duration-300 active:scale-95"
              :class="
                selectedRechargeAmount === amount
                  ? 'border-primary-500 bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'border-surface-200 text-surface-600 hover:border-primary-300 dark:border-surface-700 dark:text-surface-300'
              "
              @click="selectedRechargeAmount = amount"
            >
              ¥{{ amount }}
            </button>
          </div>
          <div class="mb-4">
            <input
              v-model.number="customAmount"
              type="number"
              placeholder="自定义金额"
              class="input-premium"
              min="1"
            />
          </div>
          <div class="flex space-x-3">
            <button
              class="flex-1 rounded-xl border-2 border-surface-200 py-3 font-bold text-surface-600 transition-all duration-200 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
              @click="showRechargeModal = false"
            >
              取消
            </button>
            <button
              class="flex-1 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 py-3 font-bold text-white transition-all duration-200 hover:shadow-lg active:scale-95"
              @click="handleRecharge"
            >
              确认充值
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div
        v-if="showWithdrawModal"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm"
        @click.self="showWithdrawModal = false"
      >
        <div
          class="w-full max-w-sm animate-scale-in rounded-2xl bg-white p-6 shadow-2xl dark:bg-surface-800"
        >
          <h3 class="mb-2 text-lg font-bold text-surface-900 dark:text-surface-100">提现</h3>
          <p class="mb-4 text-sm text-surface-500 dark:text-surface-400">
            可提现余额：{{ formatPrice(userInfo.balance) }}
          </p>
          <div class="mb-4">
            <input
              v-model.number="withdrawAmount"
              type="number"
              placeholder="请输入提现金额"
              class="input-premium"
              min="1"
              :max="userInfo.balance"
            />
          </div>
          <div class="flex space-x-3">
            <button
              class="flex-1 rounded-xl border-2 border-surface-200 py-3 font-bold text-surface-600 transition-all duration-200 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
              @click="showWithdrawModal = false"
            >
              取消
            </button>
            <button
              class="flex-1 rounded-xl bg-gradient-to-r from-secondary-400 to-emerald-500 py-3 font-bold text-white transition-all duration-200 hover:shadow-lg active:scale-95"
              @click="handleWithdraw"
            >
              确认提现
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </PanelShell>
</template>

<script setup>
import PanelShell from '../common/PanelShell.vue'
import { ref, computed, inject } from 'vue'
import { useUserStore } from '../../store/modules/user'
import { formatPrice } from '../../utils/format'

defineEmits(['close'])

const userStore = useUserStore()
const showToast = inject('showToast')

const userInfo = computed(() => userStore.userInfo)
const walletTransactions = computed(() => userStore.walletTransactions)

const showRechargeModal = ref(false)
const showWithdrawModal = ref(false)
const selectedRechargeAmount = ref(50)
const customAmount = ref(null)
const withdrawAmount = ref(null)

const rechargeAmounts = [30, 50, 100, 200, 300, 500]

const getTransactionIconClass = (type) => {
  switch (type) {
    case 'recharge':
      return 'bg-gradient-to-br from-secondary-400 to-emerald-500'
    case 'payment':
      return 'bg-gradient-to-br from-primary-400 to-blue-500'
    case 'refund':
      return 'bg-gradient-to-br from-warning-400 to-orange-500'
    case 'withdraw':
      return 'bg-gradient-to-br from-accent-400 to-purple-500'
    default:
      return 'bg-gradient-to-br from-surface-400 to-surface-500'
  }
}

const getTransactionIcon = (type) => {
  switch (type) {
    case 'recharge':
      return 'fa fa-arrow-down'
    case 'payment':
      return 'fa fa-arrow-up'
    case 'refund':
      return 'fa fa-undo'
    case 'withdraw':
      return 'fa fa-arrow-up'
    default:
      return 'fa fa-exchange'
  }
}

const handleRecharge = () => {
  const amount = customAmount.value || selectedRechargeAmount.value
  if (!amount || amount <= 0) {
    showToast('请输入有效的充值金额', 'warning')
    return
  }
  userStore.addWalletTransaction({
    type: 'recharge',
    amount
  })
  showToast(`成功充值${formatPrice(amount)}`, 'success')
  showRechargeModal.value = false
  customAmount.value = null
  selectedRechargeAmount.value = 50
}

const handleWithdraw = () => {
  if (!withdrawAmount.value || withdrawAmount.value <= 0) {
    showToast('请输入有效的提现金额', 'warning')
    return
  }
  if (withdrawAmount.value > userStore.userInfo.balance) {
    showToast('提现金额不能超过余额', 'warning')
    return
  }
  const amount = -withdrawAmount.value
  userStore.addWalletTransaction({
    type: 'withdraw',
    amount
  })
  showToast(`成功提现 ${formatPrice(Math.abs(amount))}`, 'success')
  showWithdrawModal.value = false
  withdrawAmount.value = null
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
