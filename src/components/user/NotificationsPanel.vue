<template>
  <AccountPanel
    title="通知中心"
    :subtitle="`${user.unreadNotificationsCount} 条未读消息`"
    content-id="notifications-panel"
    back-id="back-from-notifications"
    @close="emit('close')"
  >
    <template #header-action
      ><button
        class="min-h-10 rounded-lg px-2 text-xs font-semibold text-primary-600 disabled:text-surface-400 dark:text-primary-400"
        :disabled="!user.unreadNotificationsCount"
        @click="user.markAllNotificationsAsRead()"
      >
        全部已读
      </button></template
    >
    <div class="segmented-control" role="group" aria-label="通知筛选">
      <button class="segmented-item" :aria-pressed="filter === 'all'" @click="filter = 'all'">
        全部通知</button
      ><button
        class="segmented-item"
        :aria-pressed="filter === 'unread'"
        @click="filter = 'unread'"
      >
        未读消息
      </button>
    </div>
    <article
      v-for="notification in notifications"
      :key="notification.id"
      class="account-card"
      :class="{ 'border-primary-300 dark:border-primary-700': !notification.read }"
    >
      <div class="flex items-start gap-3">
        <span class="account-icon"
          ><i
            :class="notification.read ? 'fa fa-envelope-open-o' : 'fa fa-envelope-o'"
            aria-hidden="true"
          ></i
        ></span>
        <div class="min-w-0 flex-1">
          <h3 class="text-sm font-semibold">{{ notification.title }}</h3>
          <p class="account-caption mt-1">{{ notification.time }}</p>
        </div>
        <span
          v-if="!notification.read"
          class="h-2 w-2 shrink-0 rounded-full bg-primary-500"
          aria-label="未读"
        ></span>
      </div>
      <p class="mt-3 break-words text-sm leading-7 text-surface-600 dark:text-surface-300">
        {{ notification.content }}
      </p>
      <button
        v-if="!notification.read"
        class="mt-2 min-h-10 text-xs font-semibold text-primary-600 dark:text-primary-400"
        :aria-label="`标为已读 ${notification.title}`"
        @click="user.markNotificationAsRead(notification.id)"
      >
        标为已读
      </button>
      <p v-else class="account-caption mt-2">已读</p>
    </article>
    <div v-if="!notifications.length" class="account-empty">
      <span class="account-icon"><i class="fa fa-bell-o" aria-hidden="true"></i></span>
      <h3 class="text-sm font-semibold">{{ filter === 'unread' ? '没有未读消息' : '暂无通知' }}</h3>
      <p class="account-caption">
        {{
          !user.settings.notificationEnabled
            ? '消息通知已关闭，可在设置中开启。'
            : '新订单通知会显示在这里。'
        }}
      </p>
      <button v-if="filter === 'unread'" class="action-secondary" @click="filter = 'all'">
        查看全部通知
      </button>
    </div>
  </AccountPanel>
</template>
<script setup>
import { computed, ref } from 'vue'
import AccountPanel from './AccountPanel.vue'
import { useUserStore } from '../../store/modules/user'
const emit = defineEmits(['close'])
const user = useUserStore(),
  filter = ref('all')
const notifications = computed(() =>
  user.notifications.filter((notification) => filter.value === 'all' || !notification.read)
)
</script>
