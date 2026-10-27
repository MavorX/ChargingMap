<template>
  <AccountPanel title="我的钱包" subtitle="演示资金，不涉及真实收付款" @close="emit('close')">
    <section class="account-card">
      <p class="account-caption">{{ t('可用余额') }}</p>
      <p class="mt-2 break-all text-3xl font-bold tabular-nums">
        {{ formatPrice(user.userInfo.balance) }}
      </p>
      <div class="mt-5 grid grid-cols-2 gap-3">
        <button class="action-primary" @click="showRechargeModal = true">
          <i class="fa fa-plus" aria-hidden="true"></i>{{ t('充值') }}</button
        ><button
          class="action-secondary"
          :disabled="user.userInfo.balance <= 0"
          @click="showWithdrawModal = true"
        >
          {{ t('提现') }}
        </button>
      </div>
      <p v-if="user.userInfo.balance <= 0" class="account-caption mt-3">
        {{ t('暂无可提现余额，可先体验演示充值。') }}
      </p>
    </section>
    <section>
      <div class="mb-3 flex items-center justify-between gap-2">
        <h3 ref="transactionsRef" tabindex="-1" class="text-sm font-semibold">
          {{ t('交易记录') }}
        </h3>
        <button
          class="text-xs font-semibold text-primary-600 dark:text-primary-400"
          @click="showTransactions"
        >
          {{ t('查看全部账单') }}
        </button>
      </div>
      <div class="segmented-control mb-3" role="group" :aria-label="t('交易类型')">
        <button
          v-for="filter in filters"
          :key="filter.value"
          class="segmented-item"
          :aria-pressed="activeFilter === filter.value"
          @click="activeFilter = filter.value"
        >
          {{ t(filter.label) }}
        </button>
      </div>
      <div v-if="transactions.length" class="account-group">
        <article v-for="tx in transactions" :key="tx.id" class="flex min-w-0 items-start gap-3 p-4">
          <span class="account-icon"
            ><i :class="isIncome(tx) ? 'fa fa-arrow-down' : 'fa fa-arrow-up'" aria-hidden="true"></i
          ></span>
          <div class="min-w-0 flex-1">
            <p class="break-words text-sm font-semibold">
              {{ dataText(tx.description || typeLabels[tx.type] || '钱包交易') }}
            </p>
            <p class="account-caption mt-1">{{ dataText(tx.date) }}</p>
            <p
              v-if="tx.type === 'payment' && tx.method && tx.method !== 'wallet'"
              class="account-caption"
            >
              {{
                t('{method}演示支付 · 不扣钱包', {
                  method: t(tx.method === 'wechat' ? '微信' : '支付宝')
                })
              }}
            </p>
          </div>
          <div class="min-w-0 text-right">
            <p
              class="break-all text-sm font-semibold tabular-nums"
              :class="isIncome(tx) ? 'text-secondary-700 dark:text-secondary-400' : ''"
            >
              {{ isIncome(tx) ? '+' : '−' }}{{ formatPrice(Math.abs(tx.amount)) }}
            </p>
            <p class="account-caption mt-1">
              {{ t('余额 {amount}', { amount: formatPrice(tx.balance) }) }}
            </p>
          </div>
        </article>
      </div>
      <div v-else class="account-empty">
        <span class="account-icon"><i class="fa fa-file-text-o" aria-hidden="true"></i></span>
        <h3 class="text-sm font-semibold">
          {{ t(user.walletTransactions.length ? '此分类暂无交易' : '暂无交易记录') }}
        </h3>
        <p class="account-caption">{{ t('充值、提现或完成充电结算后会显示在这里。') }}</p>
        <button
          v-if="activeFilter !== 'all'"
          class="action-secondary"
          @click="activeFilter = 'all'"
        >
          {{ t('查看全部') }}
        </button>
      </div>
    </section>
    <template #dialogs>
      <DialogModal
        v-if="showRechargeModal"
        title="充值金额（演示）"
        @close="showRechargeModal = false"
        ><div class="mb-4 grid grid-cols-3 gap-2">
          <button
            v-for="amount in rechargeAmounts"
            :key="amount"
            class="choice-card justify-center px-2 py-3 text-sm font-semibold"
            :aria-pressed="!hasCustomAmount && selectedRechargeAmount === amount"
            @click="selectRechargeAmount(amount)"
          >
            ¥{{ amount }}
          </button>
        </div>
        <label for="wallet-recharge" class="mb-2 block text-sm font-semibold">{{
          t('自定义金额')
        }}</label
        ><input
          id="wallet-recharge"
          v-model.number="customAmount"
          type="number"
          min="0.01"
          max="100000"
          step="0.01"
          :placeholder="t('最多 100000 元，支持两位小数')"
          :aria-label="t('自定义充值金额')"
          class="input-premium"
          @input="customAmountActive = true"
          @keydown.enter.prevent="handleRecharge"
        />
        <p v-if="rechargeError" class="mt-2 text-xs text-danger-600" role="status">
          {{ t(rechargeError) }}
        </p>
        <div class="mt-5 flex gap-3">
          <button class="action-secondary flex-1" @click="showRechargeModal = false">
            {{ t('取消') }}</button
          ><button
            class="action-primary flex-1"
            :disabled="!!rechargeError"
            @click="handleRecharge"
          >
            {{ t('确认充值') }}
          </button>
        </div></DialogModal
      >
      <DialogModal v-if="showWithdrawModal" title="提现（演示）" @close="showWithdrawModal = false"
        ><p class="account-caption mb-3">
          {{
            t('可提现余额 {amount}，仅模拟减少钱包余额。', {
              amount: formatPrice(user.userInfo.balance)
            })
          }}
        </p>
        <label for="wallet-withdraw" class="mb-2 block text-sm font-semibold">{{
          t('提现金额')
        }}</label
        ><input
          id="wallet-withdraw"
          v-model.number="withdrawAmount"
          type="number"
          min="0.01"
          :max="user.userInfo.balance"
          step="0.01"
          :placeholder="t('输入提现金额')"
          :aria-label="t('提现金额')"
          class="input-premium"
          @keydown.enter.prevent="handleWithdraw"
        />
        <p v-if="withdrawError" class="mt-2 text-xs text-danger-600" role="status">
          {{ t(withdrawError) }}
        </p>
        <div class="mt-5 flex gap-3">
          <button class="action-secondary flex-1" @click="showWithdrawModal = false">
            {{ t('取消') }}</button
          ><button
            class="action-primary flex-1"
            :disabled="!!withdrawError"
            @click="handleWithdraw"
          >
            {{ t('确认提现') }}
          </button>
        </div></DialogModal
      >
    </template>
  </AccountPanel>
</template>
<script setup>
import { computed, inject, ref, watch } from 'vue'
import { t } from '../../i18n'
import { dataText } from '../../i18n/data'
import AccountPanel from './AccountPanel.vue'
import DialogModal from '../common/DialogModal.vue'
import { useUserStore } from '../../store/modules/user'
import { createRecordId } from '../../utils/id'
import { formatPrice } from '../../utils/format'
const emit = defineEmits(['close'])
const user = useUserStore(),
  toast = inject('showToast')
const activeFilter = ref('all'),
  transactionsRef = ref(null)
const filters = [
  { label: '全部', value: 'all' },
  { label: '收入', value: 'income' },
  { label: '支出', value: 'expense' }
]
const typeLabels = {
  recharge: '钱包充值',
  payment: '充电支付',
  withdraw: '钱包提现',
  refund: '订单退款'
}
const isIncome = (tx) =>
  tx.amount > 0 || (tx.amount === 0 && ['recharge', 'refund'].includes(tx.type))
const transactions = computed(() =>
  user.walletTransactions.filter(
    (tx) =>
      activeFilter.value === 'all' ||
      (activeFilter.value === 'income' ? isIncome(tx) : !isIncome(tx))
  )
)
const showTransactions = () => {
  activeFilter.value = 'all'
  transactionsRef.value?.scrollIntoView?.({
    block: 'start',
    behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  })
  transactionsRef.value?.focus({ preventScroll: true })
}
const showRechargeModal = ref(false),
  showWithdrawModal = ref(false)
const rechargeAmounts = [30, 50, 100, 200, 300, 500]
const selectedRechargeAmount = ref(50),
  customAmount = ref(null),
  customAmountActive = ref(false),
  withdrawAmount = ref(null)
const operationId = ref('')
const hasCustomAmount = computed(
  () => customAmountActive.value || (customAmount.value !== null && customAmount.value !== '')
)
const validAmount = (amount) =>
  typeof amount === 'number' &&
  Number.isFinite(amount) &&
  amount > 0 &&
  amount <= 100000 &&
  Math.abs(amount * 100 - Math.round(amount * 100)) < 1e-6
const rechargeValue = computed(() =>
  hasCustomAmount.value ? customAmount.value : selectedRechargeAmount.value
)
const rechargeError = computed(() =>
  validAmount(rechargeValue.value) ? '' : '请输入 0.01–100000 元，最多两位小数'
)
const withdrawError = computed(() =>
  !validAmount(withdrawAmount.value)
    ? '请输入有效金额，最多两位小数'
    : withdrawAmount.value > user.userInfo.balance
      ? '提现金额不能超过当前余额'
      : ''
)
const selectRechargeAmount = (amount) => {
  selectedRechargeAmount.value = amount
  customAmount.value = null
  customAmountActive.value = false
}
watch(showRechargeModal, (open) => {
  if (open) {
    selectRechargeAmount(50)
    operationId.value = createRecordId()
  }
})
watch(showWithdrawModal, (open) => {
  if (open) {
    withdrawAmount.value = null
    operationId.value = createRecordId()
  }
})
const handleRecharge = () => {
  if (!showRechargeModal.value || rechargeError.value) return
  const amount = rechargeValue.value
  try {
    user.addWalletTransaction({ type: 'recharge', amount, operationId: operationId.value })
    showRechargeModal.value = false
    toast(t('成功充值 {amount}（演示）', { amount: formatPrice(amount) }), 'success')
  } catch (error) {
    toast(error.message, 'error')
  }
}
const handleWithdraw = () => {
  if (!showWithdrawModal.value || withdrawError.value) return
  const amount = withdrawAmount.value
  try {
    user.addWalletTransaction({ type: 'withdraw', amount: -amount, operationId: operationId.value })
    showWithdrawModal.value = false
    toast(t('成功提现 {amount}（演示）', { amount: formatPrice(amount) }), 'success')
  } catch (error) {
    toast(error.message, 'error')
  }
}
</script>
