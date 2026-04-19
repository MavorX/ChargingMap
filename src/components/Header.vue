<template>
  <header class="fixed top-0 left-0 right-0 z-50 transition-all duration-500">
    <div class="glass-effect shadow-soft">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-3 group cursor-pointer" @click="handleLogoClick">
          <img src="/大众学院logo.png" alt="大众学院" class="w-10 h-10 rounded-lg object-contain" />
          <div class="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 via-primary-600 to-accent-600 flex items-center justify-center shadow-glow-primary transform group-hover:scale-105 transition-all duration-300 overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
            <i class="fa fa-bolt text-white text-lg relative z-10 transform group-hover:rotate-12 transition-transform duration-300"></i>
          </div>
          <div class="flex flex-col">
            <h1 class="text-xl font-bold gradient-text leading-tight tracking-tight">VWer-Charging</h1>
            <span class="text-[10px] font-medium text-surface-400 dark:text-surface-500 -mt-0.5 tracking-wider uppercase hidden sm:block">Smart EV Charging</span>
          </div>
        </div>

          <nav class="hidden md:flex items-center space-x-1">
            <button
              v-for="item in navItems"
              :key="item.id"
              :class="[
                'icon-button relative',
                item.id === 'locateUser' && 'text-primary-500'
              ]"
              @click="emitHeaderEvent(item.id)"
              :title="item.label">
              <i :class="item.icon" aria-hidden="true"></i>
              <span v-if="item.badge" class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse" :class="item.badgeClass"></span>
            </button>

            <div class="w-px h-5 bg-surface-200 dark:bg-surface-700 mx-2"></div>

            <button
              @click="toggleTheme"
              class="icon-button w-10 h-10 rounded-xl flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-300 group"
              title="切换主题">
              <i class="fa fa-moon-o dark:hidden text-surface-600 text-sm group-hover:rotate-12 transition-transform duration-300" aria-hidden="true"></i>
              <i class="fa fa-sun-o hidden dark:block text-warning-400 text-sm group-hover:-rotate-12 transition-transform duration-300" aria-hidden="true"></i>
            </button>
          </nav>

          <div class="md:hidden flex items-center space-x-1.5">
            <button @click="emitHeaderEvent('locateUser')" class="icon-button relative p-2.5" title="定位当前位置">
              <i class="fa fa-location-arrow text-primary-500" aria-hidden="true"></i>
            </button>
            <button @click="emitHeaderEvent('showNotifications')" class="icon-button relative p-2.5" title="通知">
              <i class="fa fa-bell-o text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
              <span v-if="unreadNotificationsCount > 0" class="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full animate-pulse"></span>
            </button>

            <button @click="toggleTheme" class="icon-button p-2.5" title="切换主题">
              <i class="fa fa-moon-o dark:hidden text-surface-600" aria-hidden="true"></i>
              <i class="fa fa-sun-o hidden dark:block text-warning-400" aria-hidden="true"></i>
            </button>

            <button @click="emitHeaderEvent('showUserProfile')" class="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center shadow-md" title="个人中心">
              <i class="fa fa-user text-white text-xs" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useUserStore } from '../store/modules/user';

const userStore = useUserStore();
const unreadNotificationsCount = computed(() => userStore.unreadNotificationsCount);

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
]);

const toggleTheme = () => {
  userStore.toggleTheme();
};

const emitHeaderEvent = (type) => {
  window.dispatchEvent(new CustomEvent('headerEvent', { detail: { type } }));
};

const handleLogoClick = () => {
  window.dispatchEvent(new CustomEvent('headerEvent', { detail: { type: 'home' } }));
};
</script>
