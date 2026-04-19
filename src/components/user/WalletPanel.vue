<template>
  <div class="panel-overlay">
    <div class="panel-backdrop" @click="$emit('close')"></div>
    <div class="panel-content">
    <div class="glass-effect border-b border-surface-200/50 dark:border-surface-700/50 p-4 flex justify-between items-center flex-shrink-0 z-10">
      <button class="icon-button" @click="$emit('close')">
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">我的钱包</h2>
      <div class="w-10"></div>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div class="bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 rounded-2xl shadow-xl p-6 mb-6 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full"></div>
        <div class="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-tr-full"></div>
        <p class="text-white/70 text-sm mb-1 relative z-10">账户余额</p>
        <p class="text-3xl font-black text-white relative z-10">¥{{ userInfo.balance.toFixed(2) }}</p>
        <div class="flex items-center mt-4 pt-4 border-t border-white/20 relative z-10">
          <div class="flex-1">
            <p class="text-white/60 text-xs">会员等级</p>
            <p class="text-white font-bold text-sm mt-0.5">{{ userInfo.level }}</p>
          </div>
          <div class="flex-1">
            <p class="text-white/60 text-xs">可用积分</p>
            <p class="text-white font-bold text-sm mt-0.5">{{ userInfo.points }}</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-3 mb-6">
        <button class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-3 text-center group hover:-translate-y-1 transition-all duration-300 active:scale-95"
          @click="showRechargeModal = true">
          <div class="w-9 h-9 mx-auto mb-2 rounded-xl bg-gradient-to-br from-primary-400 to-blue-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
            <i class="fa fa-plus text-white text-sm" aria-hidden="true"></i>
          </div>
          <p class="text-xs font-bold text-surface-700 dark:text-surface-300">充值</p>
        </button>
        <button class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-3 text-center group hover:-translate-y-1 transition-all duration-300 active:scale-95"
          @click="showWithdrawModal = true">
          <div class="w-9 h-9 mx-auto mb-2 rounded-xl bg-gradient-to-br from-secondary-400 to-emerald-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
            <i class="fa fa-arrow-down text-white text-sm" aria-hidden="true"></i>
          </div>
          <p class="text-xs font-bold text-surface-700 dark:text-surface-300">提现</p>
        </button>
        <button class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-3 text-center group hover:-translate-y-1 transition-all duration-300 active:scale-95"
          @click="showToast('账单详情功能开发中', 'info')">
          <div class="w-9 h-9 mx-auto mb-2 rounded-xl bg-gradient-to-br from-accent-400 to-purple-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
            <i class="fa fa-file-text text-white text-sm" aria-hidden="true"></i>
          </div>
          <p class="text-xs font-bold text-surface-700 dark:text-surface-300">账单</p>
        </button>
      </div>

      <h3 class="font-bold text-surface-800 dark:text-surface-200 mb-3">交易记录</h3>
      <div class="space-y-2.5">
        <div v-for="tx in walletTransactions" :key="tx.id"
          class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-xl shadow-soft p-3.5 flex items-center justify-between">
          <div class="flex items-center">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center mr-3 shadow-sm flex-shrink-0"
              :class="getTransactionIconClass(tx.type)">
              <i :class="getTransactionIcon(tx.type)" class="text-white text-sm" aria-hidden="true"></i>
            </div>
            <div>
              <p class="font-bold text-sm text-surface-800 dark:text-surface-200">{{ tx.description }}</p>
              <p class="text-[10px] text-surface-400 mt-0.5">{{ tx.date }}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-black text-sm" :class="tx.amount >= 0 ? 'text-secondary-500' : 'text-surface-800 dark:text-surface-200'">
              {{ tx.amount >= 0 ? '+' : '' }}¥{{ Math.abs(tx.amount).toFixed(2) }}
            </p>
            <p class="text-[10px] text-surface-400">余额 ¥{{ tx.balance.toFixed(2) }}</p>
          </div>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="showRechargeModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-6" @click.self="showRechargeModal = false">
        <div class="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
          <h3 class="font-bold text-lg text-surface-900 dark:text-surface-100 mb-4">充值金额</h3>
          <div class="grid grid-cols-3 gap-2.5 mb-4">
            <button v-for="amount in rechargeAmounts" :key="amount"
              class="py-3 rounded-xl text-sm font-bold border-2 transition-all duration-300 active:scale-95"
              :class="selectedRechargeAmount === amount ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-primary-300'"
              @click="selectedRechargeAmount = amount">
              ¥{{ amount }}
            </button>
          </div>
          <div class="mb-4">
            <input type="number" v-model.number="customAmount" placeholder="自定义金额"
              class="input-premium" min="1">
          </div>
          <div class="flex space-x-3">
            <button class="flex-1 py-3 rounded-xl font-bold border-2 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-all duration-200" @click="showRechargeModal = false">
              取消
            </button>
            <button class="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:shadow-lg transition-all duration-200 active:scale-95" @click="handleRecharge">
              确认充值</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="showWithdrawModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-6" @click.self="showWithdrawModal = false">
        <div class="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
          <h3 class="font-bold text-lg text-surface-900 dark:text-surface-100 mb-2">提现</h3>
          <p class="text-sm text-surface-500 dark:text-surface-400 mb-4">可提现余额：¥{{ userInfo.balance.toFixed(2) }}</p>
          <div class="mb-4">
            <input type="number" v-model.number="withdrawAmount" placeholder="请输入提现金额"
              class="input-premium" min="1" :max="userInfo.balance">
          </div>
          <div class="flex space-x-3">
            <button class="flex-1 py-3 rounded-xl font-bold border-2 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-all duration-200" @click="showWithdrawModal = false">
              取消
            </button>
            <button class="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-secondary-400 to-emerald-500 text-white hover:shadow-lg transition-all duration-200 active:scale-95" @click="handleWithdraw">
              确认提现
            </button>
          </div>
        </div>
      </div>
    </Transition>
      </div>
</div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useUserStore } from '../../store/modules/user'

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
    case 'recharge': return 'bg-gradient-to-br from-secondary-400 to-emerald-500'
    case 'payment': return 'bg-gradient-to-br from-primary-400 to-blue-500'
    case 'refund': return 'bg-gradient-to-br from-warning-400 to-orange-500'
    case 'withdraw': return 'bg-gradient-to-br from-accent-400 to-purple-500'
    default: return 'bg-gradient-to-br from-surface-400 to-surface-500'
  }
}

const getTransactionIcon = (type) => {
  switch (type) {
    case 'recharge': return 'fa fa-arrow-down'
    case 'payment': return 'fa fa-arrow-up'
    case 'refund': return 'fa fa-undo'
    case 'withdraw': return 'fa fa-arrow-up'
    default: return 'fa fa-exchange'
  }
}

const handleRecharge = () => {
  const amount = customAmount.value || selectedRechargeAmount.value
  if (!amount || amount <= 0) {
    showToast('请输入有效的充值金额', 'warning')
    return
  }
  userStore.addWalletTransaction({ type: 'recharge', amount, balance: userStore.userInfo.balance + amount })
  showToast(`成功充值¥${amount.toFixed(2)}`, 'success')
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
  userStore.addWalletTransaction({ type: 'withdraw', amount, balance: userStore.userInfo.balance + amount })
  showToast(`成功提现 ¥${Math.abs(amount).toFixed(2)}`, 'success')
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
