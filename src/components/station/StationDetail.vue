<template>
  <div class="panel-overlay">
    <div class="panel-backdrop" @click="$emit('close')"></div>
    <div class="panel-content">
      <div
        class="glass-effect z-10 flex flex-shrink-0 items-center justify-between border-b border-surface-200/50 p-4 dark:border-surface-700/50"
      >
        <button class="icon-button" @click="$emit('close')">
          <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
        </button>
        <h2 class="max-w-[60%] truncate text-lg font-bold text-surface-900 dark:text-surface-100">
          {{ station?.stationName }}
        </h2>
        <div class="flex space-x-1.5">
          <button class="icon-button group relative" @click="toggleFavorite">
            <i
              class="fa text-lg transition-all duration-300 group-hover:scale-110"
              :class="
                station?.isFavorite ? 'fa-heart text-danger-500' : 'fa-heart-o text-surface-400'
              "
              aria-hidden="true"
            ></i>
          </button>
          <button class="icon-button group" @click="shareStation">
            <i
              class="fa fa-share-alt text-surface-400 transition-all duration-300 group-hover:rotate-12 group-hover:text-primary-500"
              aria-hidden="true"
            ></i>
          </button>
        </div>
      </div>

      <div v-if="station" class="flex-1 overflow-y-auto p-5">
        <div class="premium-card animate-in mb-6 p-5">
          <div class="mb-4 flex items-start">
            <div
              class="mr-3 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 shadow-inner-soft dark:from-primary-900/30 dark:to-primary-800/30"
            >
              <i class="fa fa-map-marker text-base text-primary-500" aria-hidden="true"></i>
            </div>
            <div class="min-w-0 flex-1">
              <p
                class="mb-1 text-xs font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400"
              >
                地址信息
              </p>
              <p class="font-semibold leading-relaxed text-surface-800 dark:text-surface-200">
                {{ station.address }}
              </p>
            </div>
          </div>

          <div class="mb-4 grid grid-cols-3 gap-3">
            <div
              class="rounded-xl border border-surface-100 bg-white/80 p-4 text-center shadow-soft backdrop-blur-sm dark:border-surface-700/50 dark:bg-surface-800/50"
            >
              <div
                class="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30"
              >
                <i class="fa fa-road text-xs text-primary-500" aria-hidden="true"></i>
              </div>
              <p
                class="mb-1 text-[10px] font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400"
              >
                距离
              </p>
              <p class="gradient-text text-xl font-bold">
                {{ (station.distance / 1000).toFixed(1)
                }}<span class="ml-0.5 text-xs font-normal text-surface-500">km</span>
              </p>
            </div>

            <div
              class="rounded-xl border border-surface-100 bg-white/80 p-4 text-center shadow-soft backdrop-blur-sm dark:border-surface-700/50 dark:bg-surface-800/50"
            >
              <div
                class="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full"
                :class="
                  station.quickAvailableNum > 0
                    ? 'bg-secondary-100 dark:bg-secondary-900/30'
                    : 'bg-danger-100 dark:bg-danger-900/30'
                "
              >
                <i
                  class="fa fa-bolt text-sm"
                  :class="station.quickAvailableNum > 0 ? 'text-secondary-500' : 'text-danger-500'"
                  aria-hidden="true"
                ></i>
              </div>
              <p
                class="mb-1 text-[10px] font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400"
              >
                快充可用
              </p>
              <p
                class="text-xl font-bold"
                :class="station.quickAvailableNum > 0 ? 'text-secondary-600' : 'text-danger-600'"
              >
                {{ station.quickAvailableNum
                }}<span class="text-xs font-normal text-surface-400"
                  >/{{ station.quickChargeNum }}</span
                >
              </p>
            </div>

            <div
              class="rounded-xl border border-surface-100 bg-white/80 p-4 text-center shadow-soft backdrop-blur-sm dark:border-surface-700/50 dark:bg-surface-800/50"
            >
              <div
                class="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full"
                :class="
                  station.slowAvailableNum > 0
                    ? 'bg-accent-100 dark:bg-accent-900/30'
                    : 'bg-danger-100 dark:bg-danger-900/30'
                "
              >
                <i
                  class="fa fa-plug text-sm"
                  :class="station.slowAvailableNum > 0 ? 'text-accent-500' : 'text-danger-500'"
                  aria-hidden="true"
                ></i>
              </div>
              <p
                class="mb-1 text-[10px] font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400"
              >
                慢充可用
              </p>
              <p
                class="text-xl font-bold"
                :class="station.slowAvailableNum > 0 ? 'text-accent-600' : 'text-danger-600'"
              >
                {{ station.slowAvailableNum
                }}<span class="text-xs font-normal text-surface-400"
                  >/{{ station.slowChargeNum }}</span
                >
              </p>
            </div>
          </div>

          <div
            class="rounded-xl border border-surface-100 bg-white/80 p-4 shadow-soft backdrop-blur-sm dark:border-surface-700/50 dark:bg-surface-800/50"
          >
            <div class="grid grid-cols-3 gap-4">
              <div class="text-center">
                <p
                  class="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400"
                >
                  当前电价
                </p>
                <p class="text-lg font-bold text-primary-600">
                  ¥{{ station.currentPrice.toFixed(2)
                  }}<span class="text-xs font-normal text-surface-400">/度</span>
                </p>
              </div>
              <div class="border-x border-surface-200 dark:border-surface-700">
                <div class="px-4 text-center">
                  <p
                    class="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400"
                  >
                    评分
                  </p>
                  <div class="flex items-center justify-center space-x-1">
                    <i class="fa fa-star text-sm text-warning-400"></i>
                    <p class="text-lg font-bold text-warning-600">
                      {{ station.stationGradeScore }}
                    </p>
                  </div>
                </div>
              </div>
              <div class="text-center">
                <p
                  class="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400"
                >
                  状态
                </p>
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold"
                  :class="getStationStatusClass(station)"
                  >{{ getStationStatusText(station) }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <div class="animate-in mb-6 space-y-3 delay-100">
          <div
            class="info-row group transition-colors duration-200 hover:bg-surface-100/80 dark:hover:bg-surface-800/80"
          >
            <div
              class="mr-3.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 transition-transform duration-200 group-hover:scale-105 dark:bg-primary-900/30"
            >
              <i class="fa fa-clock-o text-sm text-primary-500" aria-hidden="true"></i>
            </div>
            <div class="flex-1">
              <p class="mb-0.5 text-xs text-surface-500 dark:text-surface-400">营业时间</p>
              <p class="text-sm font-semibold text-surface-800 dark:text-surface-200">
                {{ station.openTime }}
              </p>
            </div>
            <span
              v-if="
                station.reservationAvailable &&
                station.openStatus === 1 &&
                (station.quickAvailableNum > 0 || station.slowAvailableNum > 0)
              "
              class="status-badge-warning text-[10px]"
              >支持预约</span
            >
          </div>

          <div
            class="info-row group transition-colors duration-200 hover:bg-surface-100/80 dark:hover:bg-surface-800/80"
          >
            <div
              class="mr-3.5 flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-100 transition-transform duration-200 group-hover:scale-105 dark:bg-secondary-900/30"
            >
              <i class="fa fa-car text-sm text-secondary-500" aria-hidden="true"></i>
            </div>
            <div class="flex-1">
              <p class="mb-0.5 text-xs text-surface-500 dark:text-surface-400">停车费用</p>
              <p class="text-sm font-semibold text-surface-800 dark:text-surface-200">
                {{ station.parkFee }}
              </p>
            </div>
          </div>

          <div
            class="info-row group transition-colors duration-200 hover:bg-surface-100/80 dark:hover:bg-surface-800/80"
          >
            <div
              class="mr-3.5 flex h-9 w-9 items-center justify-center rounded-xl bg-accent-100 transition-transform duration-200 group-hover:scale-105 dark:bg-accent-900/30"
            >
              <i class="fa fa-phone text-sm text-accent-500" aria-hidden="true"></i>
            </div>
            <div class="flex-1">
              <p class="mb-0.5 text-xs text-surface-500 dark:text-surface-400">联系电话</p>
              <p class="text-sm font-semibold text-surface-800 dark:text-surface-200">
                {{ station.stationTel }}
              </p>
            </div>
          </div>
        </div>

        <div
          v-if="station.details && station.details.fastConnectors"
          class="animate-in mb-6 delay-200"
        >
          <h3 class="section-title">
            <div
              class="mr-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-warning-400 to-orange-500 shadow-md"
            >
              <i class="fa fa-bolt text-xs text-white" aria-hidden="true"></i>
            </div>
            快充桩详情
          </h3>
          <div class="space-y-2.5">
            <div
              v-for="(connector, index) in station.details.fastConnectors"
              :key="connector.id"
              class="premium-card animate-in group cursor-pointer p-4 transition-all duration-300 hover:shadow-soft-md"
              :style="{ animationDelay: `${index * 100}ms` }"
            >
              <div class="flex items-center justify-between">
                <div class="flex min-w-0 flex-1 items-center">
                  <div
                    class="mr-3.5 flex h-12 w-12 items-center justify-center rounded-xl shadow-inner-soft transition-transform duration-300 group-hover:scale-110"
                    :class="getConnectorBgClass(connector.status)"
                  >
                    <i
                      class="fa fa-bolt text-lg"
                      :class="getConnectorIconClass(connector.status)"
                      aria-hidden="true"
                    ></i>
                  </div>
                  <div class="min-w-0">
                    <h4
                      class="mb-0.5 truncate text-sm font-bold text-surface-800 dark:text-surface-200"
                    >
                      {{ connector.connectorName }}
                    </h4>
                    <p class="text-xs text-surface-500 dark:text-surface-400">
                      {{ connector.power }}kW · {{ connector.connectorType || 'CCS Combo' }}
                    </p>
                  </div>
                </div>
                <span
                  class="ml-3 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold"
                  :class="getConnectorStatusClass(connector.status)"
                  >{{ getConnectorStatusText(connector.status) }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="
            station.details &&
            station.details.slowConnectors &&
            station.details.slowConnectors.length > 0
          "
          class="animate-in delay-250 mb-6"
        >
          <h3 class="section-title">
            <div
              class="mr-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-blue-500 shadow-md"
            >
              <i class="fa fa-plug text-xs text-white" aria-hidden="true"></i>
            </div>
            慢充桩详情
          </h3>
          <div class="space-y-2.5">
            <div
              v-for="(connector, index) in station.details.slowConnectors"
              :key="connector.id"
              class="premium-card animate-in group cursor-pointer p-4 transition-all duration-300 hover:shadow-soft-md"
              :style="{ animationDelay: `${index * 100}ms` }"
            >
              <div class="flex items-center justify-between">
                <div class="flex min-w-0 flex-1 items-center">
                  <div
                    class="mr-3.5 flex h-12 w-12 items-center justify-center rounded-xl shadow-inner-soft transition-transform duration-300 group-hover:scale-110"
                    :class="getConnectorBgClass(connector.status)"
                  >
                    <i
                      class="fa fa-plug text-lg"
                      :class="getConnectorIconClass(connector.status)"
                      aria-hidden="true"
                    ></i>
                  </div>
                  <div class="min-w-0">
                    <h4
                      class="mb-0.5 truncate text-sm font-bold text-surface-800 dark:text-surface-200"
                    >
                      {{ connector.connectorName }}
                    </h4>
                    <p class="text-xs text-surface-500 dark:text-surface-400">
                      {{ connector.power }}kW · {{ connector.connectorType || 'Type 2' }}
                    </p>
                  </div>
                </div>
                <span
                  class="ml-3 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold"
                  :class="getConnectorStatusClass(connector.status)"
                  >{{ getConnectorStatusText(connector.status) }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="station.details && station.details.periodPrices"
          class="animate-in mb-6 delay-300"
        >
          <h3 class="section-title">
            <div
              class="mr-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-cyan-500 shadow-md"
            >
              <i class="fa fa-rmb text-xs text-white" aria-hidden="true"></i>
            </div>
            分时电价
          </h3>
          <div class="premium-card overflow-hidden">
            <div
              v-for="(period, index) in station.details.periodPrices"
              :key="index"
              class="group flex items-center justify-between border-b border-surface-100 p-4 transition-colors duration-200 last:border-0 hover:bg-surface-50 dark:border-surface-700/50 dark:hover:bg-surface-800/50"
            >
              <div class="flex items-center">
                <div
                  class="mr-3 h-2.5 w-2.5 rounded-full transition-transform duration-300 group-hover:scale-125"
                  :class="getPeriodDotClass(index)"
                ></div>
                <span class="text-sm font-medium text-surface-700 dark:text-surface-300"
                  >{{ period.startTime }}~{{ period.endTime }}</span
                >
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-base font-bold text-surface-900 dark:text-surface-100"
                  >¥{{ period.totalFee }}/度</span
                >
                <span
                  v-if="period.memberPrice"
                  class="rounded-full bg-primary-100 px-2 py-1 text-[10px] font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                  >会员¥{{ period.memberPrice }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="station.details && station.details.reviews && station.details.reviews.length > 0"
          class="animate-in delay-400 mb-6"
        >
          <h3 class="section-title">
            <div
              class="mr-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 shadow-md"
            >
              <i class="fa fa-comments text-xs text-white" aria-hidden="true"></i>
            </div>
            用户评价
            <span class="ml-2 text-xs font-normal text-surface-400"
              >({{ station.details.reviewsCount || station.details.reviews.length }}条)</span
            >
          </h3>
          <div class="space-y-3">
            <div
              v-for="(review, index) in station.details.reviews"
              :key="review.id"
              class="premium-card animate-in p-4 transition-all duration-300 hover:shadow-soft-md"
              :style="{ animationDelay: `${index * 150}ms` }"
            >
              <div class="mb-3 flex items-start justify-between">
                <div class="flex items-center">
                  <div
                    class="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-accent-500 shadow-md"
                  >
                    <i class="fa fa-user text-xs text-white" aria-hidden="true"></i>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-surface-800 dark:text-surface-200">
                      {{ review.userName }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center space-x-1">
                  <div class="rating-stars flex">
                    <span
                      v-for="i in 5"
                      :key="i"
                      class="star text-sm"
                      :class="i <= review.rating ? 'active' : ''"
                    >
                      <i class="fa fa-star" aria-hidden="true"></i>
                    </span>
                  </div>
                </div>
              </div>
              <p class="mb-2 text-sm leading-relaxed text-surface-600 dark:text-surface-300">
                {{ review.content }}
              </p>
              <p class="text-xs text-surface-400">{{ review.date }}</p>
            </div>
          </div>
        </div>

        <div v-if="station.details" class="animate-in pb-4 delay-500">
          <h3 class="section-title">
            <div
              class="mr-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 shadow-md"
            >
              <i class="fa fa-map-marker text-xs text-white" aria-hidden="true"></i>
            </div>
            站点指引
          </h3>
          <div class="premium-card p-5">
            <div class="flex items-start">
              <div
                class="mr-3 mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-info-100 dark:bg-info-900/30"
              >
                <i class="fa fa-info-circle text-xs text-info-500" aria-hidden="true"></i>
              </div>
              <p class="text-sm leading-relaxed text-surface-600 dark:text-surface-300">
                {{ station.details.siteGuide || '暂无详细指引信息' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="station"
        class="glass-effect flex-shrink-0 space-y-2.5 border-t border-surface-200/50 p-4 dark:border-surface-700/50 lg:space-y-3 lg:p-5"
      >
        <div class="grid grid-cols-2 gap-3">
          <button
            class="group relative transform overflow-hidden rounded-xl bg-gradient-to-r from-warning-400 to-orange-500 py-3 font-bold text-white shadow-lg shadow-warning-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-warning-500/30 active:translate-y-0 lg:py-3.5"
            @click="$emit('start-reservation')"
          >
            <div
              class="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]"
            ></div>
            <span class="relative z-10 flex items-center justify-center space-x-2">
              <i class="fa fa-calendar-check-o" aria-hidden="true"></i>
              <span>预约充电</span>
            </span>
          </button>
          <button
            class="group relative transform overflow-hidden rounded-xl bg-gradient-to-r from-primary-500 to-blue-600 py-3 font-bold text-white shadow-lg shadow-primary-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary-500/30 active:translate-y-0 lg:py-3.5"
            @click="$emit('navigate')"
          >
            <div
              class="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]"
            ></div>
            <span class="relative z-10 flex items-center justify-center space-x-2">
              <i class="fa fa-location-arrow" aria-hidden="true"></i>
              <span>导航</span>
            </span>
          </button>
        </div>
        <button
          class="group relative w-full transform overflow-hidden rounded-xl bg-gradient-to-r from-secondary-500 via-emerald-500 to-teal-500 py-3.5 font-bold text-white shadow-xl shadow-secondary-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-secondary-500/35 active:translate-y-0 lg:py-4"
          @click="$emit('start-charging')"
        >
          <div
            class="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]"
          ></div>
          <span class="relative z-10 flex items-center justify-center space-x-2.5 text-base">
            <i class="fa fa-bolt text-lg" aria-hidden="true"></i>
            <span>开始充电</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'
import { useStationsStore } from '../../store/modules/stations'

const _emit = defineEmits(['close', 'start-reservation', 'start-charging', 'navigate'])
const stationsStore = useStationsStore()
const showToast = inject('showToast')
const station = computed(() => stationsStore.currentStation)

const toggleFavorite = () => {
  if (station.value) {
    const wasFavorite = station.value.isFavorite
    stationsStore.toggleFavorite(station.value.stationId)
    showToast(wasFavorite ? '已取消收藏' : '已添加收藏', 'success')
  }
}

const shareStation = () => {
  if (station.value && navigator.share) {
    navigator
      .share({
        title: station.value.stationName,
        text: `推荐充电站: ${station.value.stationName} - ${station.value.address}`
      })
      .catch(() => {})
  } else {
    showToast('分享链接已复制到剪贴板', 'success')
  }
}

const getStationStatusClass = (station) => {
  if (station.openStatus === 0) {
    return 'bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400'
  }
  if (station.quickAvailableNum > 0 || station.slowAvailableNum > 0) {
    return 'status-badge-success'
  }
  return 'status-badge-danger'
}

const getStationStatusText = (station) => {
  if (station.openStatus === 0) {
    return '维护中'
  }
  if (station.quickAvailableNum > 0 || station.slowAvailableNum > 0) {
    return '有可用'
  }
  return '已满'
}

const getConnectorStatusClass = (status) => {
  switch (status) {
    case 1:
      return 'status-badge-success'
    case 3:
      return 'status-badge-danger'
    default:
      return 'bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400'
  }
}

const getConnectorStatusText = (status) => {
  switch (status) {
    case 1:
      return '可用'
    case 3:
      return '使用中'
    default:
      return '维护中'
  }
}

const getConnectorBgClass = (status) => {
  switch (status) {
    case 1:
      return 'bg-secondary-100 dark:bg-secondary-900/30'
    case 3:
      return 'bg-danger-100 dark:bg-danger-900/30'
    default:
      return 'bg-surface-200 dark:bg-surface-700'
  }
}

const getConnectorIconClass = (status) => {
  switch (status) {
    case 1:
      return 'text-secondary-500'
    case 3:
      return 'text-danger-500'
    default:
      return 'text-surface-400'
  }
}

const getPeriodDotClass = (index) => {
  const colors = [
    'bg-primary-400',
    'bg-warning-400',
    'bg-danger-400',
    'bg-orange-400',
    'bg-accent-400'
  ]
  return colors[index % colors.length]
}
</script>
