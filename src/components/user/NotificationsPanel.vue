<template>
  <PanelShell title="通知中心" content-id="notifications-panel" @close="$emit('close')">
    <div
      class="glass-effect z-10 flex flex-shrink-0 items-center justify-between border-b border-surface-200/50 p-4 dark:border-surface-700/50"
    >
      <button
        id="back-from-notifications"
        class="icon-button"
        aria-label="返回"
        @click="$emit('close')"
      >
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">通知中心</h2>
      <button
        class="rounded-xl px-3 py-1.5 text-sm font-semibold text-primary-600 transition-all duration-200 hover:bg-primary-50 active:scale-95 dark:text-primary-400 dark:hover:bg-primary-900/20"
        :disabled="userStore.unreadNotificationsCount === 0"
        @click="markAllAsRead"
      >
        全部已读
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div class="space-y-3">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="group cursor-pointer rounded-2xl bg-gradient-to-br from-white to-surface-50 p-4 shadow-soft transition-all duration-300 hover:shadow-soft-md dark:from-surface-800 dark:to-surface-900"
          :class="!notification.read && 'border-l-4 border-l-primary-500'"
          role="button"
          tabindex="0"
          @click="markAsRead(notification.id)"
          @keydown.enter.self.prevent="markAsRead(notification.id)"
          @keydown.space.self.prevent="markAsRead(notification.id)"
        >
          <div class="mb-2 flex justify-between">
            <div class="flex items-center">
              <div
                v-if="!notification.read"
                class="mr-2.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary-500"
              ></div>
              <h3
                class="text-sm font-bold text-surface-800 dark:text-surface-200"
                :class="{ 'pl-0': notification.read }"
              >
                {{ notification.title }}
              </h3>
            </div>
            <span class="ml-3 flex-shrink-0 text-xs text-surface-400">{{ notification.time }}</span>
          </div>
          <p
            class="text-sm leading-relaxed text-surface-600 dark:text-surface-300"
            :class="{ 'pl-4': !notification.read }"
          >
            {{ notification.content }}
          </p>
        </div>
        <div v-if="notifications.length === 0" class="animate-in py-16 text-center">
          <div
            class="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800"
          >
            <i
              class="fa fa-bell-o text-3xl text-surface-300 dark:text-surface-600"
              aria-hidden="true"
            ></i>
          </div>
          <p class="mb-2 font-bold text-surface-800 dark:text-surface-200">暂无通知</p>
          <p class="text-sm text-surface-500 dark:text-surface-400">您的通知消息将显示在这里</p>
        </div>
      </div>
    </div>
  </PanelShell>
</template>

<script setup>
import PanelShell from '../common/PanelShell.vue'
import { computed } from 'vue'
import { useUserStore } from '../../store/modules/user'

defineEmits(['close'])

const userStore = useUserStore()
const notifications = computed(() => userStore.notifications)

const markAsRead = (notificationId) => {
  userStore.markNotificationAsRead(notificationId)
}

const markAllAsRead = () => {
  userStore.markAllNotificationsAsRead()
}
</script>
