<template>
  <AccountPanel
    title="我的账户"
    subtitle="个人资料与充电服务"
    content-id="user-profile-panel"
    back-id="close-profile"
    back-label="关闭个人中心"
    @close="emit('close')"
  >
    <section class="account-card">
      <div class="flex items-center gap-4">
        <span class="account-icon h-14 w-14 text-xl" aria-hidden="true"
          ><i class="fa fa-user-o"></i
        ></span>
        <div class="min-w-0 flex-1">
          <h3 class="break-words text-lg font-bold">{{ t(user.userInfo.name) }}</h3>
          <p class="account-caption mt-1">{{ t(user.userInfo.level) }} · {{ t('本地演示账户') }}</p>
        </div>
        <button
          class="icon-button text-primary-600 dark:text-primary-400"
          :aria-label="t('编辑个人资料')"
          @click="emit('show-settings')"
        >
          <i class="fa fa-pencil" aria-hidden="true"></i>
        </button>
      </div>
      <div
        class="mt-5 grid grid-cols-3 divide-x divide-surface-200 border-t border-surface-100 pt-4 dark:divide-surface-700 dark:border-surface-800"
      >
        <button class="min-w-0 space-y-1 py-2 text-center" @click="emit('show-wallet')">
          <span class="block break-all text-base font-bold tabular-nums">{{
            formatPrice(user.userInfo.balance)
          }}</span
          ><span class="account-caption">{{ t('钱包余额') }}</span>
        </button>
        <button class="min-w-0 space-y-1 py-2 text-center" @click="emit('show-coupons')">
          <span class="block text-base font-bold tabular-nums">{{ couponCount }}</span
          ><span class="account-caption">{{ t('可用优惠券') }}</span>
        </button>
        <button class="min-w-0 space-y-1 py-2 text-center" @click="showPoints = true">
          <span class="block text-base font-bold tabular-nums">{{ user.userInfo.points }}</span
          ><span class="account-caption">{{ t('积分明细') }}</span>
        </button>
      </div>
    </section>
    <button
      v-if="charging.isCharging || charging.paymentPending"
      class="choice-card"
      @click="emit('resume-session')"
    >
      <span class="account-icon"><i class="fa fa-bolt" aria-hidden="true"></i></span
      ><span class="min-w-0 flex-1"
        ><strong class="block text-sm">{{
          t(charging.isCharging ? '充电进行中' : '有待处理的充电订单')
        }}</strong
        ><span class="account-caption">{{
          stationName(charging.sessionStation?.stationName)
        }}</span></span
      ><span class="text-xs font-semibold text-primary-600"
        >{{ t('查看进度') }}<i class="fa fa-angle-right ml-2" aria-hidden="true"></i
      ></span>
    </button>
    <section>
      <h3 class="account-heading">{{ t('我的充电') }}</h3>
      <div class="account-group">
        <button
          v-for="entry in services"
          :key="entry.label"
          class="account-row"
          @click="emit(entry.event)"
        >
          <span class="account-icon"><i :class="entry.icon" aria-hidden="true"></i></span
          ><span class="min-w-0 flex-1"
            ><strong class="block text-sm">{{ t(entry.label) }}</strong
            ><span class="account-caption">{{ t(entry.description) }}</span></span
          ><span
            v-if="entry.count"
            class="text-xs font-semibold text-primary-600 dark:text-primary-400"
            >{{ entry.count }}</span
          ><i class="fa fa-angle-right text-surface-400" aria-hidden="true"></i>
        </button>
      </div>
    </section>
    <section>
      <h3 class="account-heading">{{ t('偏好与帮助') }}</h3>
      <div class="account-group">
        <button class="account-row" @click="emit('show-settings')">
          <span class="account-icon"><i class="fa fa-sliders" aria-hidden="true"></i></span
          ><span class="flex-1 text-sm font-semibold">{{ t('设置与个人资料') }}</span
          ><i class="fa fa-angle-right text-surface-400" aria-hidden="true"></i></button
        ><button class="account-row" @click="emit('show-help')">
          <span class="account-icon"
            ><i class="fa fa-question-circle-o" aria-hidden="true"></i></span
          ><span class="flex-1 text-sm font-semibold">{{ t('帮助中心') }}</span
          ><i class="fa fa-angle-right text-surface-400" aria-hidden="true"></i>
        </button>
      </div>
    </section>
    <p class="account-caption text-center">{{ t('演示账户数据保存在此浏览器，无需登录。') }}</p>
    <template #dialogs
      ><DialogModal v-if="showPoints" title="积分明细" @close="showPoints = false"
        ><p class="account-caption">{{ t('当前积分') }}</p>
        <p class="my-2 text-3xl font-bold tabular-nums">{{ user.userInfo.points }}</p>
        <p class="account-caption mb-4">
          {{ t('每笔充电订单完成评价可获得 5 积分，只奖励一次。积分仅供演示，暂无兑换功能。') }}
        </p>
        <div v-if="!user.pointsRecords.length" class="info-row text-sm text-surface-500">
          {{ t('暂无本地积分变动记录，初始演示积分不计为奖励。') }}
        </div>
        <ul v-else class="max-h-60 space-y-3 overflow-y-auto">
          <li
            v-for="record in user.pointsRecords"
            :key="record.id"
            class="flex items-center justify-between gap-3 border-t border-surface-100 pt-3 dark:border-surface-800"
          >
            <div>
              <p class="text-sm font-semibold">{{ t(record.description) }}</p>
              <p class="account-caption">{{ dataText(record.time) }}</p>
            </div>
            <strong class="text-primary-600">+{{ record.amount }}</strong>
          </li>
        </ul>
        <button class="action-primary mt-5" @click="showPoints = false">
          {{ t('知道了') }}
        </button></DialogModal
      ></template
    >
  </AccountPanel>
</template>
<script setup>
import { computed, ref } from 'vue'
import { t } from '../../i18n'
import { stationName, dataText } from '../../i18n/data'
import AccountPanel from './AccountPanel.vue'
import DialogModal from '../common/DialogModal.vue'
import { useUserStore } from '../../store/modules/user'
import { useStationsStore } from '../../store/modules/stations'
import { useChargingStore } from '../../store/modules/charging'
import { couponState } from '../../utils/coupons'
import { formatPrice } from '../../utils/format'
import { useNow } from '../../composables/useNow'
const emit = defineEmits([
  'close',
  'show-notifications',
  'show-vehicles',
  'show-charging-history',
  'show-coupons',
  'show-wallet',
  'show-favorites',
  'show-settings',
  'show-help',
  'resume-session'
])
const user = useUserStore(),
  stations = useStationsStore(),
  charging = useChargingStore()
const now = useNow()
const showPoints = ref(false)
const couponCount = computed(
  () => user.coupons.filter((coupon) => couponState(coupon, now.value) === 'available').length
)
const services = computed(() => [
  {
    label: '充电记录',
    description: '查看已完成订单与充电费用',
    event: 'show-charging-history',
    icon: 'fa fa-history',
    count: user.chargingHistory.length
      ? t('{count} 笔', { count: user.chargingHistory.length })
      : ''
  },
  {
    label: '我的车辆',
    description: '默认车辆、接口与电池规格',
    event: 'show-vehicles',
    icon: 'fa fa-car',
    count: t('{count} 辆', { count: user.vehicles.length })
  },
  {
    label: '我的收藏',
    description: '快速找到常用充电站',
    event: 'show-favorites',
    icon: 'fa fa-heart-o',
    count: t('{count} 个', { count: stations.favoriteStationsList.length })
  },
  {
    label: '通知中心',
    description: '订单通知与演示消息',
    event: 'show-notifications',
    icon: 'fa fa-bell-o',
    count: user.unreadNotificationsCount
      ? t('{count} 未读', { count: user.unreadNotificationsCount })
      : ''
  }
])
</script>
