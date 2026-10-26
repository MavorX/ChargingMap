<template>
  <PanelShell title="帮助中心" @close="$emit('close')">
    <div
      class="glass-effect z-10 flex flex-shrink-0 items-center justify-between border-b border-surface-200/50 p-4 dark:border-surface-700/50"
    >
      <button class="icon-button" aria-label="返回" @click="$emit('close')">
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">帮助中心</h2>
      <div class="w-10"></div>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div class="mb-5">
        <div class="relative">
          <i
            class="fa fa-search absolute left-4 top-1/2 -translate-y-1/2 text-surface-400"
            aria-hidden="true"
          ></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索常见问题"
            class="w-full rounded-xl bg-surface-100 py-3 pl-11 pr-4 text-sm text-surface-800 placeholder-surface-400 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:bg-surface-800 dark:text-surface-200"
          />
        </div>
      </div>

      <div class="mb-6 grid grid-cols-4 gap-3">
        <button
          v-for="category in categories"
          :key="category.label"
          class="flex flex-col items-center rounded-xl bg-gradient-to-br from-white to-surface-50 p-3 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-md active:scale-95 dark:from-surface-800 dark:to-surface-900"
          @click="filterCategory(category.label)"
        >
          <div
            class="mb-2 flex h-10 w-10 items-center justify-center rounded-xl shadow-sm"
            :class="category.bgClass"
          >
            <i :class="category.icon + ' text-sm text-white'" aria-hidden="true"></i>
          </div>
          <span class="text-[10px] font-bold text-surface-700 dark:text-surface-300">{{
            category.label
          }}</span>
        </button>
      </div>

      <div class="space-y-2.5">
        <div
          v-for="faq in filteredFaqs"
          :key="faq.id"
          class="overflow-hidden rounded-xl bg-gradient-to-br from-white to-surface-50 shadow-soft dark:from-surface-800 dark:to-surface-900"
        >
          <button
            class="flex w-full items-center justify-between p-4 text-left"
            @click="toggleFaq(faq.id)"
          >
            <span class="pr-3 text-sm font-bold text-surface-800 dark:text-surface-200">{{
              faq.question
            }}</span>
            <i
              class="fa flex-shrink-0 text-surface-400 transition-transform duration-300"
              :class="expandedFaq === faq.id ? 'fa-chevron-up' : 'fa-chevron-down'"
              aria-hidden="true"
            ></i>
          </button>
          <div v-if="expandedFaq === faq.id" class="animate-in px-4 pb-4">
            <p class="text-sm leading-relaxed text-surface-600 dark:text-surface-300">
              {{ faq.answer }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="filteredFaqs.length === 0" class="animate-in py-12 text-center">
        <div
          class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800"
        >
          <i
            class="fa fa-search text-xl text-surface-300 dark:text-surface-600"
            aria-hidden="true"
          ></i>
        </div>
        <p class="mb-1 font-bold text-surface-800 dark:text-surface-200">未找到相关问题</p>
        <p class="text-sm text-surface-500 dark:text-surface-400">
          试试其他关键词；设备与订单问题请联系运营商
        </p>
      </div>

      <div
        class="mt-6 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 p-5 text-center shadow-soft dark:from-surface-800 dark:to-surface-900"
      >
        <div
          class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 shadow-md"
        >
          <i class="fa fa-headset text-lg text-white" aria-hidden="true"></i>
        </div>
        <h3 class="mb-1 font-bold text-surface-800 dark:text-surface-200">还有问题？</h3>
        <p class="text-xs leading-6 text-surface-500 dark:text-surface-400">
          这是充电服务演示项目，接枪检测、充电、预约和支付均为模拟。体验流程无需真实充电设备。
        </p>
      </div>
    </div>
  </PanelShell>
</template>

<script setup>
import PanelShell from '../common/PanelShell.vue'
import { ref, computed } from 'vue'

defineEmits(['close'])

const searchQuery = ref('')
const expandedFaq = ref(null)
const activeCategory = ref(null)

const categories = [
  { label: '充电', icon: 'fa fa-bolt', bgClass: 'bg-gradient-to-br from-primary-400 to-blue-500' },
  {
    label: '支付',
    icon: 'fa fa-credit-card',
    bgClass: 'bg-gradient-to-br from-secondary-400 to-emerald-500'
  },
  { label: '账户', icon: 'fa fa-user', bgClass: 'bg-gradient-to-br from-accent-400 to-purple-500' },
  {
    label: '其他',
    icon: 'fa fa-ellipsis-h',
    bgClass: 'bg-gradient-to-br from-slate-400 to-gray-500'
  }
]

const faqs = [
  {
    id: '1',
    question: '如何开始充电？',
    answer:
      '选择站点后点击“选择充电桩”，明确选择可用桩位、车辆和目标电量。下一步会提示“请插好充电枪”，点击“已插好，开始检测”后，页面演示连接检测、车辆通信和启动过程，完成后进入充电进度。未选桩或未确认接枪不会开始充电。',
    category: '充电'
  },
  {
    id: '2',
    question: '充电需要多长时间？',
    answer:
      '演示时长根据车辆容量、起始电量、目标电量及枪车较小功率估算。默认 60× 加速，屏幕上经过 1 秒对应演示充电 1 分钟；可以在充电设置中改为正常速度。示例参数可以调整，预计时间不是现实车辆的充满承诺。',
    category: '充电'
  },
  {
    id: '3',
    question: '充电费用如何计算？',
    answer:
      '演示费用按充电量 × 所选站点电价，再加 10% 服务费计算，账单展示优惠抵扣与实付。浏览其他站点不会改变正在充电订单的费率。所有支付只演示流程，不会实际扣款。',
    category: '支付'
  },
  {
    id: '4',
    question: '如何充值钱包？',
    answer:
      '钱包是本浏览器内的测试账本，充值只增加虚拟测试余额，不会向微信、支付宝或银行卡收款，不能提现真实资金。清理浏览器数据会丢失测试记录，请勿将其视为真实钱包。',
    category: '支付'
  },
  {
    id: '5',
    question: '如何使用优惠券？',
    answer:
      '订单结束后可在账单中选择未使用、未过期且达到最低消费的演示优惠券，抵扣不会超过应付金额。同一订单重复点击支付也只结算一次，演示券不用于现实消费。',
    category: '支付'
  },
  {
    id: '6',
    question: '如何修改个人信息？',
    answer:
      '本项目未接入真实账户认证或个人资料服务，不提供手机号、邮箱等线上修改能力。车辆、个人到站备注等只保存在当前浏览器，不会跨设备同步。',
    category: '账户'
  },
  {
    id: '7',
    question: '如何添加/删除车辆？',
    answer:
      '进入"我的车辆"页面，点击"添加车辆"按钮填写车辆信息即可添加。如需删除，点击车辆卡片上的删除按钮并确认即可。',
    category: '账户'
  },
  {
    id: '8',
    question: '充电中途可以停止吗？',
    answer:
      '点击“结束充电”并确认后，页面先演示停止输出，再提醒拔枪归位；点击“已拔枪，查看账单”进入结算。返回地图只收起进度页，不会结束充电，可以通过“正在充电 · 查看进度”返回。达到目标电量也会自动进入停止和拔枪步骤。',
    category: '充电'
  },
  {
    id: '9',
    question: '如何收藏充电站？',
    answer:
      '在站点详情页面，点击右上角的收藏按钮即可将站点添加到收藏列表。您可以在"我的收藏"中查看和管理已收藏的站点。',
    category: '其他'
  },
  {
    id: '10',
    question: '充电桩故障怎么办？',
    answer:
      '如枪头破损、进水、发热异常或冒烟，请停止操作、远离危险并联系运营商；紧急情况按现场急停与救援指引处理。不要强行拔枪，也不要因网页显示停止就认为硬件安全。本项目不能派单维修，设备与费用争议请联系充电桩标注的官方客服。',
    category: '其他'
  }
]

const filteredFaqs = computed(() => {
  let result = faqs
  if (activeCategory.value) {
    result = result.filter((f) => f.category === activeCategory.value)
  }
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()
    result = result.filter(
      (f) => f.question.toLowerCase().includes(query) || f.answer.toLowerCase().includes(query)
    )
  }
  return result
})

const toggleFaq = (id) => {
  expandedFaq.value = expandedFaq.value === id ? null : id
}

const filterCategory = (label) => {
  if (activeCategory.value === label) {
    activeCategory.value = null
  } else {
    activeCategory.value = label
  }
}
</script>
