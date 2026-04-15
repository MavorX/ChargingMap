<template>
  <div class="panel-overlay">
    <div class="panel-backdrop" @click="$emit('close')"></div>
    <div id="notifications-panel" class="panel-content">
    <div class="glass-effect border-b border-surface-200/50 dark:border-surface-700/50 p-4 flex justify-between items-center flex-shrink-0 z-10">
      <button id="back-from-notifications" class="icon-button" @click="$emit('close')">
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">通知中心</h2>
      <button class="px-3 py-1.5 rounded-xl text-primary-600 dark:text-primary-400 font-semibold text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200 active:scale-95" @click="markAllAsRead">全部已读</button>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div class="space-y-3">
        <div v-for="notification in notifications" :key="notification.id"
          class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-4 transition-all duration-300 cursor-pointer group hover:shadow-soft-md"
          :class="!notification.read && 'border-l-4 border-l-primary-500'"
          @click="markAsRead(notification.id)">
          <div class="flex justify-between mb-2">
            <div class="flex items-center">
              <div v-if="!notification.read" class="w-2 h-2 rounded-full bg-primary-500 mr-2.5 flex-shrink-0"></div>
              <h3 class="font-bold text-sm text-surface-800 dark:text-surface-200" :class="{ 'pl-0': notification.read }">{{ notification.title }}</h3>
            </div>
            <span class="text-xs text-surface-400 flex-shrink-0 ml-3">{{ notification.time }}</span>
          </div>
          <p class="text-sm text-surface-600 dark:text-surface-300 leading-relaxed" :class="{ 'pl-4': !notification.read }">{{ notification.content }}</p>
        </div>
        <div v-if="notifications.length === 0" class="text-center py-16 animate-in">
          <div class="w-20 h-20 mx-auto mb-5 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
            <i class="fa fa-bell-o text-surface-300 dark:text-surface-600 text-3xl" aria-hidden="true"></i>
          </div>
          <p class="font-bold text-surface-800 dark:text-surface-200 mb-2">暂无通知</p>
          <p class="text-sm text-surface-500 dark:text-surface-400">您的通知消息将显示在这里</p>
        </div>
      </div>
    </div>
      </div>
</div>
</template>

<script setup>
import { computed } from 'vue';
import { useUserStore } from '../../store/modules/user';

const emit = defineEmits(['close']);

const userStore = useUserStore();
const notifications = computed(() => userStore.notifications);

const markAsRead = (notificationId) => {
  userStore.markNotificationAsRead(notificationId);
};

const markAllAsRead = () => {
  userStore.markAllNotificationsAsRead();
};
</script>
