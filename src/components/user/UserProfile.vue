<template>
  <div class="panel-overlay">
    <div class="panel-backdrop" @click="$emit('close')"></div>
    <div id="user-profile-panel" class="panel-content">
    <div class="glass-effect border-b border-surface-200/50 dark:border-surface-700/50 p-4 flex justify-between items-center flex-shrink-0 z-10">
      <div class="w-10"></div>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">我的账户</h2>
      <button id="close-profile" class="icon-button" @click="$emit('close')">
        <i class="fa fa-times text-surface-500 hover:text-danger-500 transition-colors duration-200" aria-hidden="true"></i>
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft-md p-6 mb-6 relative overflow-hidden animate-in">
        <div class="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary-500/20 via-accent-500/10 to-transparent rounded-bl-full"></div>
        <div class="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-secondary-500/15 to-transparent rounded-tr-full"></div>

        <div class="flex items-center relative z-10">
          <div class="w-[4.5rem] h-[4.5rem] rounded-2xl bg-gradient-to-br from-primary-400 via-primary-600 to-accent-600 flex items-center justify-center shadow-xl shadow-primary-500/30 mr-5 relative overflow-hidden group flex-shrink-0">
            <div class="absolute inset-0 bg-gradient-to-tr from-white/25 to-transparent"></div>
            <i class="fa fa-user text-white text-2xl relative z-10 group-hover:scale-110 transition-transform duration-300" aria-hidden="true"></i>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-xl font-black text-surface-900 dark:text-surface-100 mb-2.5">{{ userInfo.name }}</h3>
            <div class="flex items-center flex-wrap gap-2">
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-md">{{ userInfo.level }}</span>
              <span class="text-sm font-medium text-surface-500 dark:text-surface-400">{{ userInfo.points }} 积分</span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-3 mb-7 animate-in delay-100">
        <button class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-4 text-center group hover:-translate-y-1 transition-all duration-300 cursor-pointer w-full"
          @click="$emit('show-wallet')">
          <div class="w-11 h-11 mx-auto mb-2.5 rounded-xl bg-gradient-to-br from-warning-400 to-orange-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
            <i class="fa fa-wallet text-white text-base" aria-hidden="true"></i>
          </div>
          <p class="text-lg font-black gradient-text leading-tight">¥{{ userInfo.balance.toFixed(2) }}</p>
          <p class="text-[10px] font-medium text-surface-500 uppercase tracking-wide mt-1">钱包余额</p>
        </button>

        <button class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-4 text-center group hover:-translate-y-1 transition-all duration-300 cursor-pointer w-full"
          @click="$emit('show-coupons')">
          <div class="w-11 h-11 mx-auto mb-2.5 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
            <i class="fa fa-ticket text-white text-base" aria-hidden="true"></i>
          </div>
          <p class="text-lg font-black text-warning-600 leading-tight">{{ availableCouponsCount }}</p>
          <p class="text-[10px] font-medium text-surface-500 uppercase tracking-wide mt-1">优惠券</p>
        </button>

        <button class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-4 text-center group hover:-translate-y-1 transition-all duration-300 cursor-pointer w-full"
          @click="$emit('show-wallet')">
          <div class="w-11 h-11 mx-auto mb-2.5 rounded-xl bg-gradient-to-br from-secondary-400 to-emerald-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
            <i class="fa fa-star text-white text-base" aria-hidden="true"></i>
          </div>
          <p class="text-lg font-black text-secondary-600 leading-tight">{{ userInfo.points }}</p>
          <p class="text-[10px] font-medium text-surface-500 uppercase tracking-wide mt-1">积分</p>
        </button>
      </div>

      <div class="space-y-3 mb-7 animate-in delay-200">
        <button class="group w-full bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-4 hover:shadow-soft-md hover:-translate-x-1 transition-all duration-300 cursor-pointer text-left"
          @click.prevent="$emit('show-charging-history')">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4 flex-1 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-blue-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                <i class="fa fa-history text-white text-sm" aria-hidden="true"></i>
              </div>
              <span class="font-bold text-surface-800 dark:text-surface-200 text-sm">充电记录</span>
            </div>
            <i class="fa fa-chevron-right text-surface-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-200" aria-hidden="true"></i>
          </div>
        </button>

        <button class="group w-full bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-4 hover:shadow-soft-md hover:-translate-x-1 transition-all duration-300 cursor-pointer text-left"
          @click.prevent="$emit('show-coupons')">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4 flex-1 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-warning-400 to-orange-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                <i class="fa fa-ticket text-white text-sm" aria-hidden="true"></i>
              </div>
              <div class="flex items-center space-x-2 min-w-0">
                <span class="font-bold text-surface-800 dark:text-surface-200 text-sm">优惠券</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-danger-500 text-white">{{ availableCouponsCount }}张</span>
              </div>
            </div>
            <i class="fa fa-chevron-right text-surface-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-200" aria-hidden="true"></i>
          </div>
        </button>

        <button class="group w-full bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-4 hover:shadow-soft-md hover:-translate-x-1 transition-all duration-300 cursor-pointer text-left"
          @click.prevent="$emit('show-wallet')">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4 flex-1 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary-400 to-teal-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                <i class="fa fa-credit-card text-white text-sm" aria-hidden="true"></i>
              </div>
              <span class="font-bold text-surface-800 dark:text-surface-200 text-sm">我的钱包</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-bold text-surface-600 dark:text-surface-300">¥{{ userInfo.balance.toFixed(2) }}</span>
              <i class="fa fa-chevron-right text-surface-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-200" aria-hidden="true"></i>
            </div>
          </div>
        </button>

        <button class="group w-full bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-4 hover:shadow-soft-md hover:-translate-x-1 transition-all duration-300 cursor-pointer text-left"
                @click.prevent="$emit('show-vehicles')">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4 flex-1 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                <i class="fa fa-car text-white text-sm" aria-hidden="true"></i>
              </div>
              <span class="font-bold text-surface-800 dark:text-surface-200 text-sm">我的车辆</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-xs font-medium text-surface-500">{{ vehicles.length }}辆</span>
              <i class="fa fa-chevron-right text-surface-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-200" aria-hidden="true"></i>
            </div>
          </div>
        </button>

        <button class="group w-full bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-4 hover:shadow-soft-md hover:-translate-x-1 transition-all duration-300 cursor-pointer text-left"
                @click.prevent="$emit('show-notifications')">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4 flex-1 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-400 to-purple-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                <i class="fa fa-bell text-white text-sm" aria-hidden="true"></i>
              </div>
              <div class="flex items-center space-x-2 min-w-0">
                <span class="font-bold text-surface-800 dark:text-surface-200 text-sm">通知中心</span>
                <span v-if="unreadNotificationsCount > 0"
                      class="w-5 h-5 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {{ unreadNotificationsCount }}
                </span>
              </div>
            </div>
            <i class="fa fa-chevron-right text-surface-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-200" aria-hidden="true"></i>
          </div>
        </button>

        <button class="group w-full bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-4 hover:shadow-soft-md hover:-translate-x-1 transition-all duration-300 cursor-pointer text-left"
          @click.prevent="$emit('show-favorites')">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4 flex-1 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                <i class="fa fa-heart text-white text-sm" aria-hidden="true"></i>
              </div>
              <div class="flex items-center space-x-2 min-w-0">
                <span class="font-bold text-surface-800 dark:text-surface-200 text-sm">我的收藏</span>
                <span v-if="favoriteStations.length > 0" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">{{ favoriteStations.length }}个</span>
              </div>
            </div>
            <i class="fa fa-chevron-right text-surface-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-200" aria-hidden="true"></i>
          </div>
        </button>
      </div>

      <div class="space-y-3 animate-in delay-300">
        <button class="group w-full bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-4 hover:shadow-soft-md hover:-translate-x-1 transition-all duration-300 cursor-pointer text-left"
          @click.prevent="$emit('show-settings')">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4 flex-1 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-400 to-gray-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                <i class="fa fa-cog text-white text-sm" aria-hidden="true"></i>
              </div>
              <span class="font-bold text-surface-800 dark:text-surface-200 text-sm">设置</span>
            </div>
            <i class="fa fa-chevron-right text-surface-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-200" aria-hidden="true"></i>
          </div>
        </button>

        <button class="group w-full bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-4 hover:shadow-soft-md hover:-translate-x-1 transition-all duration-300 cursor-pointer text-left"
          @click.prevent="$emit('show-help')">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4 flex-1 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                <i class="fa fa-question-circle text-white text-sm" aria-hidden="true"></i>
              </div>
              <span class="font-bold text-surface-800 dark:text-surface-200 text-sm">帮助中心</span>
            </div>
            <i class="fa fa-chevron-right text-surface-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-200" aria-hidden="true"></i>
          </div>
        </button>
      </div>
    </div>
      </div>
</div>
</template>

<script setup>
import { computed } from 'vue';
import { useUserStore } from '../../store/modules/user';
import { useStationsStore } from '../../store/modules/stations';

const emit = defineEmits(['close', 'show-notifications', 'show-vehicles', 'show-charging-history', 'show-coupons', 'show-wallet', 'show-favorites', 'show-settings', 'show-help']);

const userStore = useUserStore();
const stationsStore = useStationsStore();
const userInfo = computed(() => userStore.userInfo);
const vehicles = computed(() => userStore.vehicles);
const unreadNotificationsCount = computed(() => userStore.unreadNotificationsCount);
const favoriteStations = computed(() => stationsStore.favoriteStationsList);
const availableCouponsCount = computed(() => userStore.coupons.filter(c => !c.used).length);
</script>
