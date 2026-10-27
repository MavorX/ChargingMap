<template>
  <AccountPanel title="帮助中心" subtitle="找到操作方法，了解演示范围" @close="emit('close')">
    <div class="relative">
      <input
        ref="searchRef"
        v-model="search"
        type="search"
        :aria-label="t('搜索常见问题')"
        class="input-premium pr-12"
        :placeholder="t('搜索充电、支付或账户问题')"
      /><button
        v-if="search"
        class="icon-button absolute right-1 top-1"
        :aria-label="t('清除问题搜索')"
        @click="clearSearch"
      >
        <i class="fa fa-times" aria-hidden="true"></i>
      </button>
    </div>
    <div class="segmented-control" role="group" :aria-label="t('问题分类')">
      <button
        v-for="category in categories"
        :key="category"
        class="segmented-item"
        :aria-pressed="activeCategory === category"
        @click="activeCategory = category"
      >
        {{ t(category) }}
      </button>
    </div>
    <div v-for="faq in filteredFaqs" :key="faq.id" class="account-group">
      <button
        class="account-row"
        :aria-expanded="expandedId === faq.id"
        :aria-controls="`help-answer-${faq.id}`"
        @click="expandedId = expandedId === faq.id ? null : faq.id"
      >
        <span class="min-w-0 flex-1 text-sm font-semibold">{{ t(faq.question) }}</span
        ><i
          :class="expandedId === faq.id ? 'fa fa-angle-up' : 'fa fa-angle-down'"
          class="text-surface-400"
          aria-hidden="true"
        ></i>
      </button>
      <div
        v-if="expandedId === faq.id"
        :id="`help-answer-${faq.id}`"
        class="px-4 py-4 text-sm leading-7 text-surface-600 dark:text-surface-300"
      >
        {{ t(faq.answer) }}
      </div>
    </div>
    <div v-if="!filteredFaqs.length" class="account-empty">
      <span class="account-icon"><i class="fa fa-search" aria-hidden="true"></i></span>
      <h3 class="text-sm font-semibold">{{ t('未找到相关问题') }}</h3>
      <p class="account-caption">{{ t('换个关键词，或清除搜索与分类。') }}</p>
      <button class="action-secondary" @click="resetSearch">{{ t('查看全部问题') }}</button>
    </div>
    <section class="account-card">
      <h3 class="text-sm font-semibold">{{ t('关于这次体验') }}</h3>
      <p class="account-caption mt-2">
        {{
          t(
            '站点、枪位、充电与支付均为模拟；接枪与检测效果用于演示合理的操作顺序，不连接真实设备。没有在线客服或维修派单功能。'
          )
        }}
      </p>
    </section>
  </AccountPanel>
</template>
<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { t } from '../../i18n'
import AccountPanel from './AccountPanel.vue'
const emit = defineEmits(['close'])
const search = ref(''),
  searchRef = ref(null),
  activeCategory = ref('全部'),
  expandedId = ref(null)
const categories = ['全部', '充电', '支付', '账户']
const faqs = [
  {
    id: 'start',
    category: '充电',
    question: '如何开始充电？',
    answer:
      '选择站点后点击“选择充电桩”，明确选择可用桩位、兼容车辆和目标电量。下一步提示“请插好充电枪”，点击“已插好，开始检测”后，依次演示连接检测、车辆通信和启动过程，完成后才进入计量。未选桩或未确认接枪不会开始充电。'
  },
  {
    id: 'time',
    category: '充电',
    question: '充电需要多长时间？',
    answer:
      '按车辆容量、起始/目标电量及枪车较小功率估算。默认 60× 加速，1 秒对应演示充电 1 分钟；可在设置充电时改为正常速度。电量达到目标后会自动停止，再提醒拔枪。'
  },
  {
    id: 'stop',
    category: '充电',
    question: '结束确认弹窗打开时自动充满了怎么办？',
    answer:
      '确认界面会随充电状态更新。若已自动停止，旧的结束确认会收起，直接显示拔枪提醒，不需要再次结束；停止输出期间不要拔枪，停止后点击“已拔枪，查看账单”。'
  },
  {
    id: 'background',
    category: '充电',
    question: '返回地图会结束充电吗？',
    answer:
      '不会。返回地图只收起进度页，可从“正在充电 · 查看进度”或账户当前订单入口返回。刷新会恢复已保存进度并提示演示中断，不补记离线电量。'
  },
  {
    id: 'price',
    category: '支付',
    question: '充电费用如何计算？',
    answer:
      '演示费用按充电量 × 开始时的站点电价，再加 10% 服务费。浏览其他站点不会改变当前订单。账单列出优惠抵扣和实付，微信、支付宝与钱包均不涉及真实扣款。'
  },
  {
    id: 'wallet',
    category: '支付',
    question: '如何充值或提现？',
    answer:
      '我的钱包中可进行演示充值或提现，金额需为正数，最多两位小数，单次不超过 100000 元；提现不能超过余额。确认后写入本地交易记录。余额为零时不提供提现操作。'
  },
  {
    id: 'coupon',
    category: '支付',
    question: '如何使用优惠券？',
    answer:
      '优惠券分为可使用、已使用和已过期。点击“去使用”会进入当前订单或找站流程，结算时按有效期与消费门槛核对；不满足条件的券不抵扣，也不会被消耗。'
  },
  {
    id: 'profile',
    category: '账户',
    question: '如何修改个人信息？',
    answer:
      '从我的账户进入“设置与个人资料”，点击“编辑昵称”。昵称需为 1–24 个字符，保存后保留在当前浏览器；不提供真实手机号、邮箱或登录账户服务。'
  },
  {
    id: 'vehicle',
    category: '账户',
    question: '如何管理默认车辆、编辑或删除车辆？',
    answer:
      '我的车辆中可添加、编辑、设为默认或删除。正在用于当前充电会话的车辆暂不能编辑或删除；未保存修改返回前需确认放弃。容量和功率可以留空保存，但补全后才能用于充电。'
  },
  {
    id: 'points',
    category: '账户',
    question: '积分和收藏有什么用？',
    answer:
      '每笔已结算订单完成评价奖励 5 积分，只发放一次；点击账户积分可看明细，暂无兑换。收藏站点可在“我的收藏”快速打开，取消收藏前需要确认。数据只保存在当前浏览器。'
  }
]
const filteredFaqs = computed(() =>
  faqs.filter(
    (faq) =>
      (activeCategory.value === '全部' || faq.category === activeCategory.value) &&
      `${faq.question} ${faq.answer} ${t(faq.question)} ${t(faq.answer)}`
        .toLowerCase()
        .includes(search.value.trim().toLowerCase())
  )
)
watch(filteredFaqs, (list) => {
  if (!list.some((faq) => faq.id === expandedId.value)) expandedId.value = null
})
const clearSearch = async () => {
  search.value = ''
  await nextTick()
  searchRef.value?.focus()
}
const resetSearch = () => {
  activeCategory.value = '全部'
  clearSearch()
}
</script>
