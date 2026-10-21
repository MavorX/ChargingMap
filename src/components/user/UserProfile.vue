<template>
  <PanelShell title="我的账户" content-id="user-profile-panel" @close="$emit('close')">
    <div
      class="glass-effect z-10 flex flex-shrink-0 items-center justify-between border-b border-surface-200/50 p-4 dark:border-surface-700/50"
    >
      <div class="w-10"></div>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">我的账户</h2>
      <button id="close-profile" class="icon-button" @click="$emit('close')">
        <i
          class="fa fa-times text-surface-500 transition-colors duration-200 hover:text-danger-500"
          aria-hidden="true"
        ></i>
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div
        class="animate-in relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-white to-surface-50 p-6 shadow-soft-md dark:from-surface-800 dark:to-surface-900"
      >
        <div
          class="absolute right-0 top-0 h-40 w-40 rounded-bl-full bg-gradient-to-br from-primary-500/20 via-accent-500/10 to-transparent"
        ></div>
        <div
          class="absolute bottom-0 left-0 h-32 w-32 rounded-tr-full bg-gradient-to-tr from-secondary-500/15 to-transparent"
        ></div>

        <div class="relative z-10 flex items-center">
          <div
            class="group relative mr-5 flex h-[4.5rem] w-[4.5rem] flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary-400 via-primary-600 to-accent-600 shadow-xl shadow-primary-500/30"
          >
            <div class="absolute inset-0 bg-gradient-to-tr from-white/25 to-transparent"></div>
            <i
              class="fa fa-user relative z-10 text-2xl text-white transition-transform duration-300 group-hover:scale-110"
              aria-hidden="true"
            ></i>
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="mb-2.5 text-xl font-black text-surface-900 dark:text-surface-100">
              {{ userInfo.name }}
            </h3>
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="rounded-full bg-gradient-to-r from-primary-500 to-accent-500 px-3 py-1 text-xs font-bold text-white shadow-md"
                >{{ userInfo.level }}</span
              >
              <span class="text-sm font-medium text-surface-500 dark:text-surface-400"
                >{{ userInfo.points }} 积分</span
              >
            </div>
          </div>
        </div>
      </div>

      <div class="animate-in mb-7 grid grid-cols-3 gap-3 delay-100">
        <button
          class="group w-full cursor-pointer rounded-2xl bg-gradient-to-br from-white to-surface-50 p-4 text-center shadow-soft transition-all duration-300 hover:-translate-y-1 dark:from-surface-800 dark:to-surface-900"
          @click="$emit('show-wallet')"
        >
          <div
            class="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-warning-400 to-orange-500 shadow-md transition-transform duration-300 group-hover:scale-110"
          >
            <i class="fa fa-wallet text-base text-white" aria-hidden="true"></i>
          </div>
          <p class="gradient-text text-lg font-black leading-tight">
            {{ formatPrice(userInfo.balance) }}
          </p>
          <p class="mt-1 text-[10px] font-medium uppercase tracking-wide text-surface-500">
            钱包余额
          </p>
        </button>

        <button
          class="group w-full cursor-pointer rounded-2xl bg-gradient-to-br from-white to-surface-50 p-4 text-center shadow-soft transition-all duration-300 hover:-translate-y-1 dark:from-surface-800 dark:to-surface-900"
          @click="$emit('show-coupons')"
        >
          <div
            class="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 shadow-md transition-transform duration-300 group-hover:scale-110"
          >
            <i class="fa fa-ticket text-base text-white" aria-hidden="true"></i>
          </div>
          <p class="text-lg font-black leading-tight text-warning-600">
            {{ availableCouponsCount }}
          </p>
          <p class="mt-1 text-[10px] font-medium uppercase tracking-wide text-surface-500">
            优惠券
          </p>
        </button>

        <button
          class="group w-full cursor-pointer rounded-2xl bg-gradient-to-br from-white to-surface-50 p-4 text-center shadow-soft transition-all duration-300 hover:-translate-y-1 dark:from-surface-800 dark:to-surface-900"
          @click="$emit('show-wallet')"
        >
          <div
            class="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-secondary-400 to-emerald-500 shadow-md transition-transform duration-300 group-hover:scale-110"
          >
            <i class="fa fa-star text-base text-white" aria-hidden="true"></i>
          </div>
          <p class="text-lg font-black leading-tight text-secondary-600">{{ userInfo.points }}</p>
          <p class="mt-1 text-[10px] font-medium uppercase tracking-wide text-surface-500">积分</p>
        </button>
      </div>

      <div class="animate-in mb-7 space-y-3 delay-200">
        <button
          class="group w-full cursor-pointer rounded-2xl bg-gradient-to-br from-white to-surface-50 p-4 text-left shadow-soft transition-all duration-300 hover:-translate-x-1 hover:shadow-soft-md dark:from-surface-800 dark:to-surface-900"
          @click.prevent="$emit('show-charging-history')"
        >
          <div class="flex items-center justify-between">
            <div class="flex min-w-0 flex-1 items-center space-x-4">
              <div
                class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-blue-500 shadow-md transition-transform duration-300 group-hover:scale-105"
              >
                <i class="fa fa-history text-sm text-white" aria-hidden="true"></i>
              </div>
              <span class="text-sm font-bold text-surface-800 dark:text-surface-200">充电记录</span>
            </div>
            <i
              class="fa fa-chevron-right text-surface-400 transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary-500"
              aria-hidden="true"
            ></i>
          </div>
        </button>

        <button
          class="group w-full cursor-pointer rounded-2xl bg-gradient-to-br from-white to-surface-50 p-4 text-left shadow-soft transition-all duration-300 hover:-translate-x-1 hover:shadow-soft-md dark:from-surface-800 dark:to-surface-900"
          @click.prevent="$emit('show-coupons')"
        >
          <div class="flex items-center justify-between">
            <div class="flex min-w-0 flex-1 items-center space-x-4">
              <div
                class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-warning-400 to-orange-500 shadow-md transition-transform duration-300 group-hover:scale-105"
              >
                <i class="fa fa-ticket text-sm text-white" aria-hidden="true"></i>
              </div>
              <div class="flex min-w-0 items-center space-x-2">
                <span class="text-sm font-bold text-surface-800 dark:text-surface-200">优惠券</span>
                <span
                  class="rounded-full bg-danger-500 px-2 py-0.5 text-[10px] font-bold text-white"
                  >{{ availableCouponsCount }}张</span
                >
              </div>
            </div>
            <i
              class="fa fa-chevron-right text-surface-400 transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary-500"
              aria-hidden="true"
            ></i>
          </div>
        </button>

        <button
          class="group w-full cursor-pointer rounded-2xl bg-gradient-to-br from-white to-surface-50 p-4 text-left shadow-soft transition-all duration-300 hover:-translate-x-1 hover:shadow-soft-md dark:from-surface-800 dark:to-surface-900"
          @click.prevent="$emit('show-wallet')"
        >
          <div class="flex items-center justify-between">
            <div class="flex min-w-0 flex-1 items-center space-x-4">
              <div
                class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-secondary-400 to-teal-500 shadow-md transition-transform duration-300 group-hover:scale-105"
              >
                <i class="fa fa-credit-card text-sm text-white" aria-hidden="true"></i>
              </div>
              <span class="text-sm font-bold text-surface-800 dark:text-surface-200">我的钱包</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-bold text-surface-600 dark:text-surface-300">{{
                formatPrice(userInfo.balance)
              }}</span>
              <i
                class="fa fa-chevron-right text-surface-400 transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary-500"
                aria-hidden="true"
              ></i>
            </div>
          </div>
        </button>

        <button
          class="group w-full cursor-pointer rounded-2xl bg-gradient-to-br from-white to-surface-50 p-4 text-left shadow-soft transition-all duration-300 hover:-translate-x-1 hover:shadow-soft-md dark:from-surface-800 dark:to-surface-900"
          @click.prevent="$emit('show-vehicles')"
        >
          <div class="flex items-center justify-between">
            <div class="flex min-w-0 flex-1 items-center space-x-4">
              <div
                class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-md transition-transform duration-300 group-hover:scale-105"
              >
                <i class="fa fa-car text-sm text-white" aria-hidden="true"></i>
              </div>
              <span class="text-sm font-bold text-surface-800 dark:text-surface-200">我的车辆</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-xs font-medium text-surface-500">{{ vehicles.length }}辆</span>
              <i
                class="fa fa-chevron-right text-surface-400 transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary-500"
                aria-hidden="true"
              ></i>
            </div>
          </div>
        </button>

        <button
          class="group w-full cursor-pointer rounded-2xl bg-gradient-to-br from-white to-surface-50 p-4 text-left shadow-soft transition-all duration-300 hover:-translate-x-1 hover:shadow-soft-md dark:from-surface-800 dark:to-surface-900"
          @click.prevent="$emit('show-notifications')"
        >
          <div class="flex items-center justify-between">
            <div class="flex min-w-0 flex-1 items-center space-x-4">
              <div
                class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400 to-purple-500 shadow-md transition-transform duration-300 group-hover:scale-105"
              >
                <i class="fa fa-bell text-sm text-white" aria-hidden="true"></i>
              </div>
              <div class="flex min-w-0 items-center space-x-2">
                <span class="text-sm font-bold text-surface-800 dark:text-surface-200"
                  >通知中心</span
                >
                <span
                  v-if="unreadNotificationsCount > 0"
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-danger-500 text-[10px] font-bold text-white"
                >
                  {{ unreadNotificationsCount }}
                </span>
              </div>
            </div>
            <i
              class="fa fa-chevron-right text-surface-400 transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary-500"
              aria-hidden="true"
            ></i>
          </div>
        </button>

        <button
          class="group w-full cursor-pointer rounded-2xl bg-gradient-to-br from-white to-surface-50 p-4 text-left shadow-soft transition-all duration-300 hover:-translate-x-1 hover:shadow-soft-md dark:from-surface-800 dark:to-surface-900"
          @click.prevent="$emit('show-favorites')"
        >
          <div class="flex items-center justify-between">
            <div class="flex min-w-0 flex-1 items-center space-x-4">
              <div
                class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 shadow-md transition-transform duration-300 group-hover:scale-105"
              >
                <i class="fa fa-heart text-sm text-white" aria-hidden="true"></i>
              </div>
              <div class="flex min-w-0 items-center space-x-2">
                <span class="text-sm font-bold text-surface-800 dark:text-surface-200"
                  >我的收藏</span
                >
                <span
                  v-if="favoriteStations.length > 0"
                  class="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white"
                  >{{ favoriteStations.length }}个</span
                >
              </div>
            </div>
            <i
              class="fa fa-chevron-right text-surface-400 transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary-500"
              aria-hidden="true"
            ></i>
          </div>
        </button>
      </div>

      <div class="animate-in space-y-3 delay-300">
        <button
          class="group w-full cursor-pointer rounded-2xl bg-gradient-to-br from-white to-surface-50 p-4 text-left shadow-soft transition-all duration-300 hover:-translate-x-1 hover:shadow-soft-md dark:from-surface-800 dark:to-surface-900"
          @click.prevent="$emit('show-settings')"
        >
          <div class="flex items-center justify-between">
            <div class="flex min-w-0 flex-1 items-center space-x-4">
              <div
                class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-400 to-gray-500 shadow-md transition-transform duration-300 group-hover:scale-105"
              >
                <i class="fa fa-cog text-sm text-white" aria-hidden="true"></i>
              </div>
              <span class="text-sm font-bold text-surface-800 dark:text-surface-200">设置</span>
            </div>
            <i
              class="fa fa-chevron-right text-surface-400 transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary-500"
              aria-hidden="true"
            ></i>
          </div>
        </button>

        <button
          class="group w-full cursor-pointer rounded-2xl bg-gradient-to-br from-white to-surface-50 p-4 text-left shadow-soft transition-all duration-300 hover:-translate-x-1 hover:shadow-soft-md dark:from-surface-800 dark:to-surface-900"
          @click.prevent="$emit('show-help')"
        >
          <div class="flex items-center justify-between">
            <div class="flex min-w-0 flex-1 items-center space-x-4">
              <div
                class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 shadow-md transition-transform duration-300 group-hover:scale-105"
              >
                <i class="fa fa-question-circle text-sm text-white" aria-hidden="true"></i>
              </div>
              <span class="text-sm font-bold text-surface-800 dark:text-surface-200">帮助中心</span>
            </div>
            <i
              class="fa fa-chevron-right text-surface-400 transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary-500"
              aria-hidden="true"
            ></i>
          </div>
        </button>
      </div>
    </div>
  </PanelShell>
</template>

<script setup>
import PanelShell from '../common/PanelShell.vue'
import { computed } from 'vue'
import { useUserStore } from '../../store/modules/user'
import { formatPrice } from '../../utils/format'
import { useStationsStore } from '../../store/modules/stations'

const _emit = defineEmits([
  'close',
  'show-notifications',
  'show-vehicles',
  'show-charging-history',
  'show-coupons',
  'show-wallet',
  'show-favorites',
  'show-settings',
  'show-help'
])

const userStore = useUserStore()
const stationsStore = useStationsStore()
const userInfo = computed(() => userStore.userInfo)
const vehicles = computed(() => userStore.vehicles)
const unreadNotificationsCount = computed(() => userStore.unreadNotificationsCount)
const favoriteStations = computed(() => stationsStore.favoriteStationsList)
const availableCouponsCount = computed(() => userStore.coupons.filter((c) => !c.used).length)
</script>
