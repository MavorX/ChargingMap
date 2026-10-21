<template>
  <header class="fixed left-0 right-0 top-0 z-50 transition-all duration-500">
    <div class="glass-effect shadow-soft">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <div class="group flex cursor-pointer items-center space-x-3" @click="handleLogoClick">
            <img
              src="/大众学院logo.png"
              alt="大众学院"
              class="h-10 w-10 rounded-lg object-contain"
            />
            <div
              class="relative flex h-10 w-10 transform items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary-400 via-primary-600 to-accent-600 shadow-glow-primary transition-all duration-300 group-hover:scale-105"
            >
              <div class="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
              <i
                class="fa fa-bolt relative z-10 transform text-lg text-white transition-transform duration-300 group-hover:rotate-12"
              ></i>
            </div>
            <div class="flex flex-col">
              <h1 class="gradient-text text-xl font-bold leading-tight tracking-tight">
                VWer-Charging
              </h1>
              <span
                class="-mt-0.5 hidden text-[10px] font-medium uppercase tracking-wider text-surface-400 dark:text-surface-500 sm:block"
                >Smart EV Charging</span
              >
            </div>
          </div>

          <nav class="hidden items-center space-x-1 md:flex">
            <button
              v-for="item in navItems"
              :key="item.id"
              :class="['icon-button relative', item.id === 'locateUser' && 'text-primary-500']"
              :title="item.label"
              :aria-label="item.label"
              @click="emitHeaderEvent(item.id)"
            >
              <i :class="item.icon" aria-hidden="true"></i>
              <span
                v-if="item.badge"
                class="absolute right-1.5 top-1.5 h-2 w-2 animate-pulse rounded-full"
                :class="item.badgeClass"
              ></span>
            </button>

            <div class="mx-2 h-5 w-px bg-surface-200 dark:bg-surface-700"></div>

            <button
              class="icon-button group flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 hover:bg-surface-100 dark:hover:bg-surface-800"
              title="切换主题"
              aria-label="切换主题"
              @click="toggleTheme"
            >
              <i
                class="fa fa-moon-o text-sm text-surface-600 transition-transform duration-300 group-hover:rotate-12 dark:hidden"
                aria-hidden="true"
              ></i>
              <i
                class="fa fa-sun-o hidden text-sm text-warning-400 transition-transform duration-300 group-hover:-rotate-12 dark:block"
                aria-hidden="true"
              ></i>
            </button>
          </nav>

          <div class="flex items-center space-x-1.5 md:hidden">
            <button
              class="icon-button relative p-2.5"
              title="定位当前位置"
              aria-label="定位当前位置"
              @click="emitHeaderEvent('locateUser')"
            >
              <i class="fa fa-location-arrow text-primary-500" aria-hidden="true"></i>
            </button>
            <button
              class="icon-button relative p-2.5"
              title="通知"
              aria-label="通知"
              @click="emitHeaderEvent('showNotifications')"
            >
              <i class="fa fa-bell-o text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
              <span
                v-if="unreadNotificationsCount > 0"
                class="absolute right-1 top-1 h-2 w-2 animate-pulse rounded-full bg-danger-500"
              ></span>
            </button>

            <button
              class="icon-button p-2.5"
              title="切换主题"
              aria-label="切换主题"
              @click="toggleTheme"
            >
              <i class="fa fa-moon-o text-surface-600 dark:hidden" aria-hidden="true"></i>
              <i class="fa fa-sun-o hidden text-warning-400 dark:block" aria-hidden="true"></i>
            </button>

            <button
              class="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-accent-500 shadow-md"
              title="个人中心"
              aria-label="个人中心"
              @click="emitHeaderEvent('showUserProfile')"
            >
              <i class="fa fa-user text-xs text-white" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '../store/modules/user'

const userStore = useUserStore()
const unreadNotificationsCount = computed(() => userStore.unreadNotificationsCount)

const navItems = computed(() => [
  {
    id: 'showNotifications',
    label: '通知中心',
    icon: 'fa fa-bell-o text-surface-600 dark:text-surface-300',
    badge: unreadNotificationsCount.value > 0,
    badgeClass: 'bg-danger-500'
  },
  {
    id: 'showUserProfile',
    label: '个人中心',
    icon: 'fa fa-user-o text-surface-600 dark:text-surface-300'
  },
  {
    id: 'locateUser',
    label: '定位当前位置',
    icon: 'fa fa-location-arrow text-primary-500'
  }
])

const toggleTheme = () => {
  userStore.toggleTheme()
}

const emitHeaderEvent = (type) => {
  window.dispatchEvent(new CustomEvent('headerEvent', { detail: { type } }))
}

const handleLogoClick = () => {
  window.dispatchEvent(new CustomEvent('headerEvent', { detail: { type: 'home' } }))
}
</script>
