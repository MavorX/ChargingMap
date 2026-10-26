<template>
  <header
    class="fixed inset-x-0 top-0 z-header border-b border-surface-200/80 bg-white dark:border-surface-800 dark:bg-surface-900"
  >
    <div class="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
      <button
        class="flex shrink-0 items-center gap-2.5 text-left"
        aria-label="VWer-Charging 首页"
        @click="emitHeaderEvent('home')"
      >
        <img :src="logoUrl" alt="" class="h-9 w-9 rounded-xl object-contain" />
        <span>
          <span
            class="block text-base font-bold tracking-tight text-surface-900 dark:text-white sm:text-lg"
            >VWer<span class="text-primary-600 dark:text-primary-400"> Charging</span></span
          >
          <span class="hidden text-[10px] tracking-[0.18em] text-surface-500 sm:block"
            >让每一次出发，都满电</span
          >
        </span>
      </button>

      <nav class="hidden h-full items-center gap-1 lg:flex" aria-label="主导航">
        <button
          class="header-nav header-nav-active"
          aria-current="page"
          @click="emitHeaderEvent('home')"
        >
          <i class="fa fa-map-o" aria-hidden="true"></i>探索充电站
        </button>
        <button class="header-nav" @click="emitHeaderEvent('showFavorites')">
          <i class="fa fa-heart-o" aria-hidden="true"></i>我的收藏
        </button>
        <button class="header-nav" @click="emitHeaderEvent('showChargingHistory')">
          <i class="fa fa-history" aria-hidden="true"></i>充电记录
        </button>
      </nav>

      <div class="flex items-center gap-1 sm:gap-2">
        <button
          class="icon-button hidden text-surface-500 sm:block"
          aria-label="定位当前位置"
          title="定位当前位置"
          @click="emitHeaderEvent('locateUser')"
        >
          <i class="fa fa-location-arrow" aria-hidden="true"></i>
        </button>
        <button
          class="icon-button text-surface-500"
          aria-label="切换主题"
          title="切换主题"
          :aria-pressed="userStore.isDarkMode"
          @click="userStore.toggleTheme()"
        >
          <i :class="userStore.isDarkMode ? 'fa fa-sun-o' : 'fa fa-moon-o'" aria-hidden="true"></i>
        </button>
        <button
          class="icon-button relative text-surface-500"
          aria-label="通知中心"
          title="通知中心"
          @click="emitHeaderEvent('showNotifications')"
        >
          <i class="fa fa-bell-o" aria-hidden="true"></i>
          <span
            v-if="unreadNotificationsCount > 0"
            class="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-danger-500 dark:border-surface-900"
          ></span>
        </button>
        <span class="mx-1 hidden h-6 w-px bg-surface-200 dark:bg-surface-700 sm:block"></span>
        <button
          class="flex h-10 items-center gap-2 rounded-full bg-surface-100 px-3 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700"
          aria-label="个人中心"
          @click="emitHeaderEvent('showUserProfile')"
        >
          <i class="fa fa-user-o" aria-hidden="true"></i>
          <span class="hidden sm:inline">我的账户</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '../store/modules/user'
import logoUrl from '../assets/logo.webp'

const userStore = useUserStore()
const unreadNotificationsCount = computed(() => userStore.unreadNotificationsCount)

const emitHeaderEvent = (type) => {
  window.dispatchEvent(new CustomEvent('headerEvent', { detail: { type } }))
}
</script>
