<template>
  <PanelShell title="设置" @close="$emit('close')">
    <div
      class="glass-effect z-10 flex flex-shrink-0 items-center justify-between border-b border-surface-200/50 p-4 dark:border-surface-700/50"
    >
      <button class="icon-button" aria-label="返回" @click="$emit('close')">
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">设置</h2>
      <div class="w-10"></div>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div
        class="mb-6 rounded-2xl bg-gradient-to-br from-white to-surface-50 p-5 shadow-soft dark:from-surface-800 dark:to-surface-900"
      >
        <div class="flex items-center">
          <div
            class="mr-4 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 via-primary-600 to-accent-600 shadow-xl shadow-primary-500/30"
            style="width: 3.5rem; height: 3.5rem"
          >
            <i class="fa fa-user text-xl text-white" aria-hidden="true"></i>
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="font-bold text-surface-900 dark:text-surface-100">{{ userInfo.name }}</h3>
            <p class="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
              {{ userInfo.level }} · {{ userInfo.points }}积分
            </p>
          </div>
          <button
            class="rounded-xl bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-600 transition-all hover:bg-primary-100 active:scale-95 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/30"
            @click="showEditNameModal = true"
          >
            编辑
          </button>
        </div>
      </div>

      <h3 class="mb-3 text-sm font-bold text-surface-800 dark:text-surface-200">通知设置</h3>
      <div class="mb-6 space-y-2">
        <div
          class="flex items-center justify-between rounded-xl bg-gradient-to-br from-white to-surface-50 p-4 shadow-soft dark:from-surface-800 dark:to-surface-900"
        >
          <div class="flex items-center">
            <div
              class="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-blue-500 shadow-sm"
            >
              <i class="fa fa-bell text-xs text-white" aria-hidden="true"></i>
            </div>
            <span
              id="settings-notification-label"
              class="text-sm font-bold text-surface-800 dark:text-surface-200"
              >消息通知</span
            >
          </div>
          <ToggleSwitch
            label-id="settings-notification-label"
            :model-value="settings.notificationEnabled"
            @update:model-value="toggleSetting('notificationEnabled')"
          />
        </div>

        <div
          class="flex items-center justify-between rounded-xl bg-gradient-to-br from-white to-surface-50 p-4 shadow-soft dark:from-surface-800 dark:to-surface-900"
        >
          <div class="flex items-center">
            <div
              class="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-warning-400 to-orange-500 shadow-sm"
            >
              <i class="fa fa-plug text-xs text-white" aria-hidden="true"></i>
            </div>
            <span
              id="settings-charging-reminder-label"
              class="text-sm font-bold text-surface-800 dark:text-surface-200"
              >充电提醒</span
            >
          </div>
          <ToggleSwitch
            label-id="settings-charging-reminder-label"
            :model-value="settings.chargingReminder"
            @update:model-value="toggleSetting('chargingReminder')"
          />
        </div>

        <div
          class="flex items-center justify-between rounded-xl bg-gradient-to-br from-white to-surface-50 p-4 shadow-soft dark:from-surface-800 dark:to-surface-900"
        >
          <div class="flex items-center">
            <div
              class="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent-400 to-purple-500 shadow-sm"
            >
              <i class="fa fa-tag text-xs text-white" aria-hidden="true"></i>
            </div>
            <span
              id="settings-promotion-label"
              class="text-sm font-bold text-surface-800 dark:text-surface-200"
              >优惠推送</span
            >
          </div>
          <ToggleSwitch
            label-id="settings-promotion-label"
            :model-value="settings.promotionNotification"
            @update:model-value="toggleSetting('promotionNotification')"
          />
        </div>
      </div>

      <h3 class="mb-3 text-sm font-bold text-surface-800 dark:text-surface-200">支付设置</h3>
      <div class="mb-6 space-y-2">
        <div
          class="flex items-center justify-between rounded-xl bg-gradient-to-br from-white to-surface-50 p-4 shadow-soft dark:from-surface-800 dark:to-surface-900"
        >
          <div class="flex items-center">
            <div
              class="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-secondary-400 to-emerald-500 shadow-sm"
            >
              <i class="fa fa-credit-card text-xs text-white" aria-hidden="true"></i>
            </div>
            <span
              id="settings-auto-pay-label"
              class="text-sm font-bold text-surface-800 dark:text-surface-200"
              >自动支付</span
            >
          </div>
          <ToggleSwitch
            label-id="settings-auto-pay-label"
            :model-value="settings.autoPay"
            @update:model-value="toggleSetting('autoPay')"
          />
        </div>
      </div>

      <h3 class="mb-3 text-sm font-bold text-surface-800 dark:text-surface-200">外观</h3>
      <div class="mb-6 space-y-2">
        <div
          class="flex items-center justify-between rounded-xl bg-gradient-to-br from-white to-surface-50 p-4 shadow-soft dark:from-surface-800 dark:to-surface-900"
        >
          <div class="flex items-center">
            <div
              class="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-400 to-gray-500 shadow-sm"
            >
              <i class="fa fa-moon text-xs text-white" aria-hidden="true"></i>
            </div>
            <span
              id="settings-dark-mode-label"
              class="text-sm font-bold text-surface-800 dark:text-surface-200"
              >深色模式</span
            >
          </div>
          <ToggleSwitch
            label-id="settings-dark-mode-label"
            :model-value="isDarkMode"
            @update:model-value="userStore.toggleTheme()"
          />
        </div>
      </div>

      <h3 class="mb-3 text-sm font-bold text-surface-800 dark:text-surface-200">其他</h3>
      <div class="space-y-2">
        <button
          class="group flex w-full items-center justify-between rounded-xl bg-gradient-to-br from-white to-surface-50 p-4 shadow-soft transition-all hover:shadow-soft-md dark:from-surface-800 dark:to-surface-900"
          @click="showToast('缓存已清除', 'success')"
        >
          <div class="flex items-center">
            <div
              class="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 shadow-sm"
            >
              <i class="fa fa-trash text-xs text-white" aria-hidden="true"></i>
            </div>
            <span class="text-sm font-bold text-surface-800 dark:text-surface-200">清除缓存</span>
          </div>
          <i
            class="fa fa-chevron-right text-surface-400 transition-colors group-hover:text-primary-500"
            aria-hidden="true"
          ></i>
        </button>

        <button
          class="group flex w-full items-center justify-between rounded-xl bg-gradient-to-br from-white to-surface-50 p-4 shadow-soft transition-all hover:shadow-soft-md dark:from-surface-800 dark:to-surface-900"
          @click="showAboutModal = true"
        >
          <div class="flex items-center">
            <div
              class="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 shadow-sm"
            >
              <i class="fa fa-info-circle text-xs text-white" aria-hidden="true"></i>
            </div>
            <span class="text-sm font-bold text-surface-800 dark:text-surface-200">关于我们</span>
          </div>
          <i
            class="fa fa-chevron-right text-surface-400 transition-colors group-hover:text-primary-500"
            aria-hidden="true"
          ></i>
        </button>

        <button
          class="group flex w-full items-center justify-between rounded-xl bg-gradient-to-br from-danger-50 to-rose-50 p-4 shadow-soft transition-all hover:shadow-soft-md dark:from-surface-800 dark:to-surface-900"
          @click="handleLogout"
        >
          <div class="flex items-center">
            <div
              class="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-danger-400 to-rose-500 shadow-sm"
            >
              <i class="fa fa-sign-out text-xs text-white" aria-hidden="true"></i>
            </div>
            <span class="text-sm font-bold text-danger-600 dark:text-danger-400">退出登录</span>
          </div>
        </button>
      </div>
    </div>

    <Transition name="fade">
      <div
        v-if="showEditNameModal"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm"
        @click.self="showEditNameModal = false"
      >
        <div
          class="w-full max-w-sm animate-scale-in rounded-2xl bg-white p-6 shadow-2xl dark:bg-surface-800"
        >
          <h3 class="mb-4 text-lg font-bold text-surface-900 dark:text-surface-100">修改昵称</h3>
          <input
            v-model="editName"
            type="text"
            placeholder="请输入新昵称"
            class="input-premium mb-4"
          />
          <div class="flex space-x-3">
            <button
              class="flex-1 rounded-xl border-2 border-surface-200 py-3 font-bold text-surface-600 transition-all duration-200 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
              @click="showEditNameModal = false"
            >
              取消
            </button>
            <button
              class="flex-1 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 py-3 font-bold text-white transition-all duration-200 hover:shadow-lg active:scale-95"
              @click="saveName"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div
        v-if="showAboutModal"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm"
        @click.self="showAboutModal = false"
      >
        <div
          class="w-full max-w-sm animate-scale-in rounded-2xl bg-white p-6 text-center shadow-2xl dark:bg-surface-800"
        >
          <div
            class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 shadow-lg"
          >
            <i class="fa fa-bolt text-2xl text-white" aria-hidden="true"></i>
          </div>
          <h3 class="text-lg font-bold text-surface-900 dark:text-surface-100">智能充电站</h3>
          <p class="mt-2 text-sm text-surface-500 dark:text-surface-400">版本 1.0.0</p>
          <p class="mt-3 text-xs leading-relaxed text-surface-400">
            为电动汽车用户提供便捷的充电服务，查找附近充电站，一键导航，智能充电，让出行更轻松。
          </p>
          <button
            class="mt-5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 px-6 py-2.5 font-bold text-white transition-all duration-200 hover:shadow-lg active:scale-95"
            @click="showAboutModal = false"
          >
            知道了
          </button>
        </div>
      </div>
    </Transition>
  </PanelShell>
</template>

<script setup>
import PanelShell from '../common/PanelShell.vue'
import ToggleSwitch from '../common/ToggleSwitch.vue'
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
