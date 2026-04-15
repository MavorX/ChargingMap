<template>
  <div class="panel-overlay">
    <div class="panel-backdrop" @click="$emit('close')"></div>
    <div class="panel-content">
    <div class="glass-effect border-b border-surface-200/50 dark:border-surface-700/50 p-4 flex justify-between items-center flex-shrink-0 z-10">
      <button class="icon-button" @click="$emit('close')">
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">设置</h2>
      <div class="w-10"></div>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-5 mb-6">
        <div class="flex items-center">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 via-primary-600 to-accent-600 flex items-center justify-center shadow-xl shadow-primary-500/30 mr-4 flex-shrink-0" style="width:3.5rem;height:3.5rem;">
            <i class="fa fa-user text-white text-xl" aria-hidden="true"></i>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-surface-900 dark:text-surface-100">{{ userInfo.name }}</h3>
            <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{{ userInfo.level }} · {{ userInfo.points }}积分</p>
          </div>
          <button class="px-3 py-1.5 rounded-xl text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all active:scale-95"
            @click="showEditNameModal = true">
            编辑
          </button>
        </div>
      </div>

      <h3 class="font-bold text-surface-800 dark:text-surface-200 mb-3 text-sm">通知设置</h3>
      <div class="space-y-2 mb-6">
        <div class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-xl shadow-soft p-4 flex items-center justify-between">
          <div class="flex items-center">
            <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-400 to-blue-500 flex items-center justify-center mr-3 shadow-sm">
              <i class="fa fa-bell text-white text-xs" aria-hidden="true"></i>
            </div>
            <span class="text-sm font-bold text-surface-800 dark:text-surface-200">消息通知</span>
          </div>
          <button class="relative w-12 h-7 rounded-full transition-all duration-300"
            :class="settings.notificationEnabled ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'"
            @click="toggleSetting('notificationEnabled')">
            <div class="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300"
              :class="settings.notificationEnabled ? 'left-[22px]' : 'left-0.5'"></div>
          </button>
        </div>

        <div class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-xl shadow-soft p-4 flex items-center justify-between">
          <div class="flex items-center">
            <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-warning-400 to-orange-500 flex items-center justify-center mr-3 shadow-sm">
              <i class="fa fa-plug text-white text-xs" aria-hidden="true"></i>
            </div>
            <span class="text-sm font-bold text-surface-800 dark:text-surface-200">充电提醒</span>
          </div>
          <button class="relative w-12 h-7 rounded-full transition-all duration-300"
            :class="settings.chargingReminder ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'"
            @click="toggleSetting('chargingReminder')">
            <div class="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300"
              :class="settings.chargingReminder ? 'left-[22px]' : 'left-0.5'"></div>
          </button>
        </div>

        <div class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-xl shadow-soft p-4 flex items-center justify-between">
          <div class="flex items-center">
            <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-400 to-purple-500 flex items-center justify-center mr-3 shadow-sm">
              <i class="fa fa-tag text-white text-xs" aria-hidden="true"></i>
            </div>
            <span class="text-sm font-bold text-surface-800 dark:text-surface-200">优惠推送</span>
          </div>
          <button class="relative w-12 h-7 rounded-full transition-all duration-300"
            :class="settings.promotionNotification ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'"
            @click="toggleSetting('promotionNotification')">
            <div class="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300"
              :class="settings.promotionNotification ? 'left-[22px]' : 'left-0.5'"></div>
          </button>
        </div>
      </div>

      <h3 class="font-bold text-surface-800 dark:text-surface-200 mb-3 text-sm">支付设置</h3>
      <div class="space-y-2 mb-6">
        <div class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-xl shadow-soft p-4 flex items-center justify-between">
          <div class="flex items-center">
            <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-secondary-400 to-emerald-500 flex items-center justify-center mr-3 shadow-sm">
              <i class="fa fa-credit-card text-white text-xs" aria-hidden="true"></i>
            </div>
            <span class="text-sm font-bold text-surface-800 dark:text-surface-200">自动支付</span>
          </div>
          <button class="relative w-12 h-7 rounded-full transition-all duration-300"
            :class="settings.autoPay ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'"
            @click="toggleSetting('autoPay')">
            <div class="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300"
              :class="settings.autoPay ? 'left-[22px]' : 'left-0.5'"></div>
          </button>
        </div>
      </div>

      <h3 class="font-bold text-surface-800 dark:text-surface-200 mb-3 text-sm">外观</h3>
      <div class="space-y-2 mb-6">
        <div class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-xl shadow-soft p-4 flex items-center justify-between">
          <div class="flex items-center">
            <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-400 to-gray-500 flex items-center justify-center mr-3 shadow-sm">
              <i class="fa fa-moon text-white text-xs" aria-hidden="true"></i>
            </div>
            <span class="text-sm font-bold text-surface-800 dark:text-surface-200">深色模式</span>
          </div>
          <button class="relative w-12 h-7 rounded-full transition-all duration-300"
            :class="isDarkMode ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'"
            @click="userStore.toggleTheme()">
            <div class="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300"
              :class="isDarkMode ? 'left-[22px]' : 'left-0.5'"></div>
          </button>
        </div>
      </div>

      <h3 class="font-bold text-surface-800 dark:text-surface-200 mb-3 text-sm">其他</h3>
      <div class="space-y-2">
        <button class="w-full bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-xl shadow-soft p-4 flex items-center justify-between group hover:shadow-soft-md transition-all"
          @click="showToast('缓存已清除', 'success')">
          <div class="flex items-center">
            <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mr-3 shadow-sm">
              <i class="fa fa-trash text-white text-xs" aria-hidden="true"></i>
            </div>
            <span class="text-sm font-bold text-surface-800 dark:text-surface-200">清除缓存</span>
          </div>
          <i class="fa fa-chevron-right text-surface-400 group-hover:text-primary-500 transition-colors" aria-hidden="true"></i>
        </button>

        <button class="w-full bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-xl shadow-soft p-4 flex items-center justify-between group hover:shadow-soft-md transition-all"
          @click="showAboutModal = true">
          <div class="flex items-center">
            <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mr-3 shadow-sm">
              <i class="fa fa-info-circle text-white text-xs" aria-hidden="true"></i>
            </div>
            <span class="text-sm font-bold text-surface-800 dark:text-surface-200">关于我们</span>
          </div>
          <i class="fa fa-chevron-right text-surface-400 group-hover:text-primary-500 transition-colors" aria-hidden="true"></i>
        </button>

        <button class="w-full bg-gradient-to-br from-danger-50 to-rose-50 dark:from-surface-800 dark:to-surface-900 rounded-xl shadow-soft p-4 flex items-center justify-between group hover:shadow-soft-md transition-all"
          @click="handleLogout">
          <div class="flex items-center">
            <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-danger-400 to-rose-500 flex items-center justify-center mr-3 shadow-sm">
              <i class="fa fa-sign-out text-white text-xs" aria-hidden="true"></i>
            </div>
            <span class="text-sm font-bold text-danger-600 dark:text-danger-400">退出登录</span>
          </div>
        </button>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="showEditNameModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-6" @click.self="showEditNameModal = false">
        <div class="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
          <h3 class="font-bold text-lg text-surface-900 dark:text-surface-100 mb-4">修改昵称</h3>
          <input type="text" v-model="editName" placeholder="请输入新昵称" class="input-premium mb-4">
          <div class="flex space-x-3">
            <button class="flex-1 py-3 rounded-xl font-bold border-2 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-all duration-200" @click="showEditNameModal = false">
              取消
            </button>
            <button class="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:shadow-lg transition-all duration-200 active:scale-95" @click="saveName">
              保存
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="showAboutModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-6" @click.self="showAboutModal = false">
        <div class="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center shadow-lg">
            <i class="fa fa-bolt text-white text-2xl" aria-hidden="true"></i>
          </div>
          <h3 class="font-bold text-lg text-surface-900 dark:text-surface-100">智能充电站</h3>
          <p class="text-sm text-surface-500 dark:text-surface-400 mt-2">版本 1.0.0</p>
          <p class="text-xs text-surface-400 mt-3 leading-relaxed">为电动汽车用户提供便捷的充电服务，查找附近充电站，一键导航，智能充电，让出行更轻松。</p>
          <button class="mt-5 px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:shadow-lg transition-all duration-200 active:scale-95" @click="showAboutModal = false">
            知道了</button>
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
const settings = computed(() => userStore.settings)
const isDarkMode = computed(() => userStore.isDarkMode)

const showEditNameModal = ref(false)
const showAboutModal = ref(false)
const editName = ref(userInfo.value.name)

const toggleSetting = (key) => {
  const updates = { [key]: !settings.value[key] }
  userStore.updateSettings(updates)
  const labels = {
    notificationEnabled: '消息通知',
    chargingReminder: '充电提醒',
    promotionNotification: '优惠推送',
    autoPay: '自动支付'
  }
  showToast(`${labels[key]}已${updates[key] ? '开启' : '关闭'}`, 'success')
}

const saveName = () => {
  if (!editName.value.trim()) {
    showToast('昵称不能为空', 'warning')
    return
  }
  userStore.userInfo.name = editName.value.trim()
  showToast('昵称修改成功', 'success')
  showEditNameModal.value = false
}

const handleLogout = () => {
  showToast('已退出登录', 'info')
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
