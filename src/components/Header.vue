<template>
  <header
    data-panel-navigation
    class="brand-header fixed inset-x-0 top-0 z-header border-b border-surface-800 bg-brand-ink text-white dark:bg-surface-950"
  >
    <div class="flex h-16 items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
      <button
        class="flex shrink-0 items-center gap-2.5 text-left"
        :aria-label="t('VWer-Charging 首页')"
        @click="emitHeaderEvent('home')"
      >
        <img :src="logoUrl" alt="" class="h-9 w-9 rounded-xl bg-white object-contain p-0.5" />
        <span>
          <span class="block text-base font-bold tracking-tight text-white sm:text-lg"
            >VWer<span
              class="block text-[10px] leading-3 text-primary-200 min-[400px]:inline min-[400px]:text-[length:inherit] min-[400px]:leading-[inherit]"
            >
              Charging</span
            ></span
          >
          <span class="hidden text-[10px] tracking-wide text-surface-300 sm:block">{{
            t('让每一次出发，都满电')
          }}</span>
        </span>
      </button>

      <nav class="hidden h-full items-center gap-1 lg:flex" :aria-label="t('主导航')">
        <button
          class="header-nav"
          :class="{ 'header-nav-active': ui.navigationSection === 'explore' }"
          :aria-current="ui.navigationSection === 'explore' ? 'page' : undefined"
          @click="emitHeaderEvent('home')"
        >
          <i class="fa fa-map-o" aria-hidden="true"></i>{{ t('探索充电站') }}
        </button>
        <button
          class="header-nav"
          :class="{ 'header-nav-active': ui.navigationSection === 'favorites' }"
          :aria-current="ui.navigationSection === 'favorites' ? 'page' : undefined"
          @click="emitHeaderEvent('showFavorites')"
        >
          <i class="fa fa-heart-o" aria-hidden="true"></i>{{ t('我的收藏') }}
        </button>
        <button
          class="header-nav"
          :class="{ 'header-nav-active': ui.navigationSection === 'history' }"
          :aria-current="ui.navigationSection === 'history' ? 'page' : undefined"
          @click="emitHeaderEvent('showChargingHistory')"
        >
          <i class="fa fa-history" aria-hidden="true"></i>{{ t('充电记录') }}
        </button>
      </nav>

      <div class="flex shrink-0 items-center gap-0.5 sm:gap-2">
        <LanguageSwitch />
        <button
          class="icon-button header-tool hidden sm:block"
          :aria-label="t('定位当前位置')"
          :title="t('定位当前位置')"
          :disabled="stationsStore.isLocating"
          :aria-busy="stationsStore.isLocating"
          @click="emitHeaderEvent('locateUser')"
        >
          <i
            :class="
              stationsStore.isLocating ? 'fa fa-circle-o-notch fa-spin' : 'fa fa-location-arrow'
            "
            aria-hidden="true"
          ></i>
        </button>
        <button
          class="icon-button header-tool"
          :aria-label="t('切换主题')"
          :title="t('切换主题')"
          :aria-pressed="userStore.isDarkMode"
          @click="userStore.toggleTheme()"
        >
          <i :class="userStore.isDarkMode ? 'fa fa-sun-o' : 'fa fa-moon-o'" aria-hidden="true"></i>
        </button>
        <button
          class="icon-button relative"
          :aria-label="t('通知中心')"
          :aria-pressed="ui.navigationSection === 'notifications'"
          :class="
            ui.navigationSection === 'notifications'
              ? 'bg-white/10 text-accent-500 hover:bg-white/20 dark:hover:bg-white/20'
              : 'header-tool'
          "
          :title="t('通知中心')"
          @click="emitHeaderEvent('showNotifications')"
        >
          <i class="fa fa-bell-o" aria-hidden="true"></i>
          <span
            v-if="unreadNotificationsCount > 0"
            class="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-brand-ink bg-danger-400"
          ></span>
        </button>
        <span class="mx-1 hidden h-6 w-px bg-white/20 sm:block"></span>
        <button
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm transition-colors"
          :aria-label="t('个人中心')"
          :aria-pressed="ui.navigationSection === 'account'"
          :class="
            ui.navigationSection === 'account'
              ? 'bg-accent-500 text-brand-ink ring-2 ring-accent-500/30'
              : 'bg-white/10 text-primary-100 hover:bg-white/20'
          "
          @click="emitHeaderEvent('showUserProfile')"
        >
          <i class="fa fa-user-o" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '../store/modules/user'
import { useUiStore } from '../store/modules/ui'
import { useStationsStore } from '../store/modules/stations'
import logoUrl from '../assets/logo.webp'
import { t } from '../i18n'
import LanguageSwitch from './common/LanguageSwitch.vue'

const userStore = useUserStore()
const ui = useUiStore()
const stationsStore = useStationsStore()
const unreadNotificationsCount = computed(() => userStore.unreadNotificationsCount)

const emitHeaderEvent = (type) => {
  window.dispatchEvent(new CustomEvent('headerEvent', { detail: { type } }))
}
</script>
