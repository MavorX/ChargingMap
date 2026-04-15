<template>
  <div class="panel-overlay">
    <div class="panel-backdrop" @click="$emit('close')"></div>
    <div class="panel-content">
    <div class="glass-effect border-b border-surface-200/50 dark:border-surface-700/50 p-4 flex justify-between items-center flex-shrink-0 z-10">
      <button class="icon-button" @click="$emit('close')">
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">帮助中心</h2>
      <div class="w-10"></div>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div class="mb-5">
        <div class="relative">
          <i class="fa fa-search absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" aria-hidden="true"></i>
          <input type="text" v-model="searchQuery" placeholder="搜索常见问题"
            class="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-100 dark:bg-surface-800 text-sm text-surface-800 dark:text-surface-200 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all">
        </div>
      </div>

      <div class="grid grid-cols-4 gap-3 mb-6">
        <button v-for="category in categories" :key="category.label"
          class="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 shadow-soft hover:shadow-soft-md hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
          @click="filterCategory(category.label)">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm mb-2"
            :class="category.bgClass">
            <i :class="category.icon + ' text-white text-sm'" aria-hidden="true"></i>
          </div>
          <span class="text-[10px] font-bold text-surface-700 dark:text-surface-300">{{ category.label }}</span>
        </button>
      </div>

      <div class="space-y-2.5">
        <div v-for="faq in filteredFaqs" :key="faq.id"
          class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-xl shadow-soft overflow-hidden">
          <button class="w-full p-4 flex items-center justify-between text-left" @click="toggleFaq(faq.id)">
            <span class="font-bold text-sm text-surface-800 dark:text-surface-200 pr-3">{{ faq.question }}</span>
            <i class="fa text-surface-400 transition-transform duration-300 flex-shrink-0"
              :class="expandedFaq === faq.id ? 'fa-chevron-up' : 'fa-chevron-down'" aria-hidden="true"></i>
          </button>
          <div v-if="expandedFaq === faq.id" class="px-4 pb-4 animate-in">
            <p class="text-sm text-surface-600 dark:text-surface-300 leading-relaxed">{{ faq.answer }}</p>
          </div>
        </div>
      </div>

      <div v-if="filteredFaqs.length === 0" class="text-center py-12 animate-in">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
          <i class="fa fa-search text-surface-300 dark:text-surface-600 text-xl" aria-hidden="true"></i>
        </div>
        <p class="font-bold text-surface-800 dark:text-surface-200 mb-1">未找到相关问题</p>
        <p class="text-sm text-surface-500 dark:text-surface-400">试试其他关键词或联系客服</p>
      </div>

      <div class="mt-6 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-5 text-center">
        <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center shadow-md">
          <i class="fa fa-headset text-white text-lg" aria-hidden="true"></i>
        </div>
        <h3 class="font-bold text-surface-800 dark:text-surface-200 mb-1">还有问题？</h3>
        <p class="text-xs text-surface-500 dark:text-surface-400 mb-3">联系在线客服获取帮助</p>
        <button class="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-md hover:shadow-lg active:scale-95 transition-all duration-200"
          @click="showToast('客服功能开发中，请稍后再试', 'info')">
          联系客服
        </button>
      </div>
    </div>
      </div>
</div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'

defineEmits(['close'])

const showToast = inject('showToast')

const searchQuery = ref('')
const expandedFaq = ref(null)
const activeCategory = ref(null)

const categories = [
  { label: '充电', icon: 'fa fa-bolt', bgClass: 'bg-gradient-to-br from-primary-400 to-blue-500' },
  { label: '支付', icon: 'fa fa-credit-card', bgClass: 'bg-gradient-to-br from-secondary-400 to-emerald-500' },
  { label: '账户', icon: 'fa fa-user', bgClass: 'bg-gradient-to-br from-accent-400 to-purple-500' },
  { label: '其他', icon: 'fa fa-ellipsis-h', bgClass: 'bg-gradient-to-br from-slate-400 to-gray-500' }
]

const faqs = [
  { id: '1', question: '如何开始充电？', answer: '在地图上找到附近的充电站，点击进入站点详情，选择可用的充电桩，设置充电参数后点击"开始充电"即可。充电完成后系统会自动扣费。', category: '充电' },
  { id: '2', question: '充电需要多长时间？', answer: '充电时间取决于车辆电池容量和充电桩功率。快充桩一般30-60分钟可充至80%，慢充桩则需要4-8小时充满。建议充至80%即可，后续充电速度会明显降低。', category: '充电' },
  { id: '3', question: '充电费用如何计算？', answer: '充电费用 = 充电量(kWh) × 电价(元/kWh) + 服务费。不同站点和时段的电价可能不同，具体价格在站点详情页可以查看。会员用户可享受优惠电价。', category: '支付' },
  { id: '4', question: '如何充值钱包？', answer: '进入"我的钱包"页面，点击"充值"按钮，选择充值金额或输入自定义金额，确认后即可完成充值。支持微信、支付宝等多种支付方式。', category: '支付' },
  { id: '5', question: '如何使用优惠券？', answer: '在充电结算时，系统会自动匹配可用的优惠券。您也可以在"优惠券"页面查看和管理您的优惠券，点击"去使用"前往充电站使用。', category: '支付' },
  { id: '6', question: '如何修改个人信息？', answer: '进入"设置"页面，点击头像旁边的"编辑"按钮即可修改昵称。其他个人信息如手机号、邮箱等也可以在设置页面中修改。', category: '账户' },
  { id: '7', question: '如何添加/删除车辆？', answer: '进入"我的车辆"页面，点击"添加车辆"按钮填写车辆信息即可添加。如需删除，点击车辆卡片上的删除按钮并确认即可。', category: '账户' },
  { id: '8', question: '充电中途可以停止吗？', answer: '可以。在充电过程中，您可以随时点击"停止充电"按钮结束充电。系统会根据实际充电量进行计费，不会收取额外费用。', category: '充电' },
  { id: '9', question: '如何收藏充电站？', answer: '在站点详情页面，点击右上角的收藏按钮即可将站点添加到收藏列表。您可以在"我的收藏"中查看和管理已收藏的站点。', category: '其他' },
  { id: '10', question: '充电桩故障怎么办？', answer: '如果遇到充电桩故障，请先停止充电操作，然后通过"帮助中心"联系在线客服，或拨打充电桩上的服务电话报修。我们会尽快安排维修。', category: '其他' }
]

const filteredFaqs = computed(() => {
  let result = faqs
  if (activeCategory.value) {
    result = result.filter(f => f.category === activeCategory.value)
  }
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()
    result = result.filter(f =>
      f.question.toLowerCase().includes(query) || f.answer.toLowerCase().includes(query)
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
