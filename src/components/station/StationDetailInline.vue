<template>
  <div class="flex flex-col h-full">
    <div class="glass-effect border-b border-surface-200/50 dark:border-surface-700/50 p-4 flex justify-between items-center flex-shrink-0 z-10">
      <button class="icon-button" @click="$emit('close')">
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100 truncate max-w-[60%]">{{ station?.stationName }}</h2>
      <div class="flex space-x-1.5">
        <button class="icon-button group relative" @click="toggleFavorite">
          <i class="fa text-lg transition-all duration-300 group-hover:scale-110" :class="station?.isFavorite ? 'fa-heart text-danger-500' : 'fa-heart-o text-surface-400'" aria-hidden="true"></i>
        </button>
        <button class="icon-button group" @click="shareStation">
          <i class="fa fa-share-alt text-surface-400 group-hover:text-primary-500 group-hover:rotate-12 transition-all duration-300" aria-hidden="true"></i>
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-4" v-if="station">
      <div class="premium-card p-4 mb-4 animate-in">
        <div class="flex items-start mb-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center mr-3 flex-shrink-0 shadow-inner-soft">
            <i class="fa fa-map-marker text-primary-500 text-sm" aria-hidden="true"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[10px] font-medium text-surface-500 dark:text-surface-400 mb-0.5 uppercase tracking-wide">地址信息</p>
            <p class="font-semibold text-surface-800 dark:text-surface-200 text-sm leading-relaxed">{{ station.address }}</p>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 mb-3">
          <div class="bg-white/80 dark:bg-surface-800/50 backdrop-blur-sm rounded-lg p-3 text-center border border-surface-100 dark:border-surface-700/50 shadow-soft">
            <div class="w-7 h-7 mx-auto mb-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <i class="fa fa-road text-primary-500 text-[10px]" aria-hidden="true"></i>
            </div>
            <p class="text-[9px] font-medium text-surface-500 dark:text-surface-400 mb-0.5 uppercase tracking-wide">距离</p>
            <p class="text-lg font-bold gradient-text">{{ (station.distance / 1000).toFixed(1) }}<span class="text-[10px] font-normal ml-0.5 text-surface-500">km</span></p>
          </div>

          <div class="bg-white/80 dark:bg-surface-800/50 backdrop-blur-sm rounded-lg p-3 text-center border border-surface-100 dark:border-surface-700/50 shadow-soft">
            <div class="w-7 h-7 mx-auto mb-1.5 rounded-full flex items-center justify-center" :class="station.quickAvailableNum > 0 ? 'bg-secondary-100 dark:bg-secondary-900/30' : 'bg-danger-100 dark:bg-danger-900/30'">
              <i class="fa fa-bolt text-xs" :class="station.quickAvailableNum > 0 ? 'text-secondary-500' : 'text-danger-500'" aria-hidden="true"></i>
            </div>
            <p class="text-[9px] font-medium text-surface-500 dark:text-surface-400 mb-0.5 uppercase tracking-wide">快充可用</p>
            <p class="text-lg font-bold" :class="station.quickAvailableNum > 0 ? 'text-secondary-600' : 'text-danger-600'">{{ station.quickAvailableNum }}<span class="text-[10px] font-normal text-surface-400">/{{ station.quickChargeNum }}</span></p>
          </div>

          <div class="bg-white/80 dark:bg-surface-800/50 backdrop-blur-sm rounded-lg p-3 text-center border border-surface-100 dark:border-surface-700/50 shadow-soft">
            <div class="w-7 h-7 mx-auto mb-1.5 rounded-full flex items-center justify-center" :class="station.slowAvailableNum > 0 ? 'bg-accent-100 dark:bg-accent-900/30' : 'bg-danger-100 dark:bg-danger-900/30'">
              <i class="fa fa-plug text-xs" :class="station.slowAvailableNum > 0 ? 'text-accent-500' : 'text-danger-500'" aria-hidden="true"></i>
            </div>
            <p class="text-[9px] font-medium text-surface-500 dark:text-surface-400 mb-0.5 uppercase tracking-wide">慢充可用</p>
            <p class="text-lg font-bold" :class="station.slowAvailableNum > 0 ? 'text-accent-600' : 'text-danger-600'">{{ station.slowAvailableNum }}<span class="text-[10px] font-normal text-surface-400">/{{ station.slowChargeNum }}</span></p>
          </div>
        </div>

        <div class="bg-white/80 dark:bg-surface-800/50 backdrop-blur-sm rounded-lg p-3 border border-surface-100 dark:border-surface-700/50 shadow-soft">
          <div class="grid grid-cols-3 gap-3">
            <div class="text-center">
              <p class="text-[9px] font-medium text-surface-500 dark:text-surface-400 mb-1 uppercase tracking-wide">当前电价</p>
              <p class="text-sm font-bold text-primary-600">¥{{ station.currentPrice.toFixed(2) }}<span class="text-[10px] font-normal text-surface-400">/度</span></p>
            </div>
            <div class="border-x border-surface-200 dark:border-surface-700">
              <div class="text-center px-2">
                <p class="text-[9px] font-medium text-surface-500 dark:text-surface-400 mb-1 uppercase tracking-wide">评分</p>
                <div class="flex items-center justify-center space-x-0.5">
                  <i class="fa fa-star text-warning-400 text-xs"></i>
                  <p class="text-sm font-bold text-warning-600">{{ station.stationGradeScore }}</p>
                </div>
              </div>
            </div>
            <div class="text-center">
              <p class="text-[9px] font-medium text-surface-500 dark:text-surface-400 mb-1 uppercase tracking-wide">状态</p>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold" :class="getStationStatusClass(station)">{{ getStationStatusText(station) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-2 mb-4 animate-in delay-100">
        <div class="info-row hover:bg-surface-100/80 dark:hover:bg-surface-800/80 transition-colors duration-200 group">
          <div class="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mr-3 group-hover:scale-105 transition-transform duration-200">
            <i class="fa fa-clock-o text-primary-500 text-xs" aria-hidden="true"></i>
          </div>
          <div class="flex-1">
            <p class="text-[10px] text-surface-500 dark:text-surface-400 mb-0.5">营业时间</p>
            <p class="font-semibold text-surface-800 dark:text-surface-200 text-xs">{{ station.openTime }}</p>
          </div>
          <span v-if="station.reservationAvailable && station.openStatus === 1 && (station.quickAvailableNum > 0 || station.slowAvailableNum > 0)" class="status-badge-warning text-[9px]">支持预约</span>
        </div>

        <div class="info-row hover:bg-surface-100/80 dark:hover:bg-surface-800/80 transition-colors duration-200 group">
          <div class="w-8 h-8 rounded-lg bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center mr-3 group-hover:scale-105 transition-transform duration-200">
            <i class="fa fa-car text-secondary-500 text-xs" aria-hidden="true"></i>
          </div>
          <div class="flex-1">
            <p class="text-[10px] text-surface-500 dark:text-surface-400 mb-0.5">停车费用</p>
            <p class="font-semibold text-surface-800 dark:text-surface-200 text-xs">{{ station.parkFee }}</p>
          </div>
        </div>

        <div class="info-row hover:bg-surface-100/80 dark:hover:bg-surface-800/80 transition-colors duration-200 group">
          <div class="w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center mr-3 group-hover:scale-105 transition-transform duration-200">
            <i class="fa fa-phone text-accent-500 text-xs" aria-hidden="true"></i>
          </div>
          <div class="flex-1">
            <p class="text-[10px] text-surface-500 dark:text-surface-400 mb-0.5">联系电话</p>
            <p class="font-semibold text-surface-800 dark:text-surface-200 text-xs">{{ station.stationTel }}</p>
          </div>
        </div>
      </div>

      <div class="mb-4 animate-in delay-200" v-if="station.details && station.details.fastConnectors">
        <h3 class="section-title text-sm">
          <div class="w-6 h-6 rounded-md bg-gradient-to-br from-warning-400 to-orange-500 flex items-center justify-center mr-2 shadow-sm">
            <i class="fa fa-bolt text-white text-[10px]" aria-hidden="true"></i>
          </div>
          快充桩详情
        </h3>
        <div class="space-y-2">
          <div v-for="(connector, index) in station.details.fastConnectors" :key="connector.id"
               class="premium-card p-3 hover:shadow-soft-md transition-all duration-300 cursor-pointer group animate-in"
               :style="{ animationDelay: `${index * 100}ms` }">
            <div class="flex items-center justify-between">
              <div class="flex items-center flex-1 min-w-0">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center mr-3 shadow-inner-soft transition-transform duration-300 group-hover:scale-110" :class="getConnectorBgClass(connector.status)">
                  <i class="fa fa-bolt text-sm" :class="getConnectorIconClass(connector.status)" aria-hidden="true"></i>
                </div>
                <div class="min-w-0">
                  <h4 class="font-bold text-surface-800 dark:text-surface-200 text-xs mb-0.5 truncate">{{ connector.connectorName }}</h4>
                  <p class="text-[10px] text-surface-500 dark:text-surface-400">{{ connector.power }}kW · {{ connector.connectorType || 'CCS Combo' }}</p>
                </div>
              </div>
              <span class="ml-2 px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap" :class="getConnectorStatusClass(connector.status)">{{ getConnectorStatusText(connector.status) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-4 animate-in delay-250" v-if="station.details && station.details.slowConnectors && station.details.slowConnectors.length > 0">
        <h3 class="section-title text-sm">
          <div class="w-6 h-6 rounded-md bg-gradient-to-br from-primary-400 to-blue-500 flex items-center justify-center mr-2 shadow-sm">
            <i class="fa fa-plug text-white text-[10px]" aria-hidden="true"></i>
          </div>
          慢充桩详情
        </h3>
        <div class="space-y-2">
          <div v-for="(connector, index) in station.details.slowConnectors" :key="connector.id"
               class="premium-card p-3 hover:shadow-soft-md transition-all duration-300 cursor-pointer group animate-in"
               :style="{ animationDelay: `${index * 100}ms` }">
            <div class="flex items-center justify-between">
              <div class="flex items-center flex-1 min-w-0">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center mr-3 shadow-inner-soft transition-transform duration-300 group-hover:scale-110" :class="getConnectorBgClass(connector.status)">
                  <i class="fa fa-plug text-sm" :class="getConnectorIconClass(connector.status)" aria-hidden="true"></i>
                </div>
                <div class="min-w-0">
                  <h4 class="font-bold text-surface-800 dark:text-surface-200 text-xs mb-0.5 truncate">{{ connector.connectorName }}</h4>
                  <p class="text-[10px] text-surface-500 dark:text-surface-400">{{ connector.power }}kW · {{ connector.connectorType || 'Type 2' }}</p>
                </div>
              </div>
              <span class="ml-2 px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap" :class="getConnectorStatusClass(connector.status)">{{ getConnectorStatusText(connector.status) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-4 animate-in delay-300" v-if="station.details && station.details.periodPrices">
        <h3 class="section-title text-sm">
          <div class="w-6 h-6 rounded-md bg-gradient-to-br from-primary-400 to-cyan-500 flex items-center justify-center mr-2 shadow-sm">
            <i class="fa fa-rmb text-white text-[10px]" aria-hidden="true"></i>
          </div>
          分时电价
        </h3>
        <div class="premium-card overflow-hidden">
          <div v-for="(period, index) in station.details.periodPrices" :key="index"
               class="flex justify-between items-center p-3 border-b border-surface-100 dark:border-surface-700/50 last:border-0 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors duration-200 group">
            <div class="flex items-center">
              <div class="w-2 h-2 rounded-full mr-2 transition-transform duration-300 group-hover:scale-125" :class="getPeriodDotClass(index)"></div>
              <span class="font-medium text-surface-700 dark:text-surface-300 text-xs">{{ period.startTime }}~{{ period.endTime }}</span>
            </div>
            <div class="flex items-center space-x-1.5">
              <span class="font-bold text-surface-900 dark:text-surface-100 text-sm">¥{{ period.totalFee }}/度</span>
              <span v-if="period.memberPrice" class="text-[9px] font-bold bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded-full">会员¥{{ period.memberPrice }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-4 animate-in delay-400" v-if="station.details && station.details.reviews && station.details.reviews.length > 0">
        <h3 class="section-title text-sm">
          <div class="w-6 h-6 rounded-md bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center mr-2 shadow-sm">
            <i class="fa fa-comments text-white text-[10px]" aria-hidden="true"></i>
          </div>
          用户评价
          <span class="text-[10px] font-normal text-surface-400 ml-1">({{ station.details.reviewsCount || station.details.reviews.length }}条)</span>
        </h3>
        <div class="space-y-2">
          <div v-for="(review, index) in station.details.reviews" :key="review.id"
               class="premium-card p-3 hover:shadow-soft-md transition-all duration-300 animate-in"
               :style="{ animationDelay: `${index * 150}ms` }">
            <div class="flex justify-between items-start mb-2">
              <div class="flex items-center">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center mr-2 shadow-md">
                  <i class="fa fa-user text-white text-[10px]" aria-hidden="true"></i>
                </div>
                <p class="font-bold text-surface-800 dark:text-surface-200 text-xs">{{ review.userName }}</p>
              </div>
              <div class="rating-stars flex">
                <span v-for="i in 5" :key="i" class="star text-[10px]" :class="i <= review.rating ? 'active' : ''">
                  <i class="fa fa-star" aria-hidden="true"></i>
                </span>
              </div>
            </div>
            <p class="text-xs text-surface-600 dark:text-surface-300 leading-relaxed mb-1">{{ review.content }}</p>
            <p class="text-[10px] text-surface-400">{{ review.date }}</p>
          </div>
        </div>
      </div>

      <div class="pb-2 animate-in delay-500" v-if="station.details">
        <h3 class="section-title text-sm">
          <div class="w-6 h-6 rounded-md bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mr-2 shadow-sm">
            <i class="fa fa-map-marker text-white text-[10px]" aria-hidden="true"></i>
          </div>
          站点指引
        </h3>
        <div class="premium-card p-4">
          <div class="flex items-start">
            <div class="w-5 h-5 rounded-full bg-info-100 dark:bg-info-900/30 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
              <i class="fa fa-info-circle text-info-500 text-[9px]" aria-hidden="true"></i>
            </div>
            <p class="text-xs text-surface-600 dark:text-surface-300 leading-relaxed">{{ station.details.siteGuide || '暂无详细指引信息' }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-shrink-0 glass-effect border-t border-surface-200/50 dark:border-surface-700/50 p-3 space-y-2" v-if="station">
      <div class="grid grid-cols-2 gap-2">
        <button class="group relative overflow-hidden bg-gradient-to-r from-warning-400 to-orange-500 text-white py-2.5 rounded-xl font-bold shadow-lg shadow-warning-500/25 hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 text-sm" @click="$emit('start-reservation')">
          <span class="relative z-10 flex items-center justify-center space-x-1.5">
            <i class="fa fa-calendar-check-o text-xs" aria-hidden="true"></i>
            <span>预约充电</span>
          </span>
        </button>
        <button class="group relative overflow-hidden bg-gradient-to-r from-primary-500 to-blue-600 text-white py-2.5 rounded-xl font-bold shadow-lg shadow-primary-500/25 hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 text-sm" @click="$emit('navigate')">
          <span class="relative z-10 flex items-center justify-center space-x-1.5">
            <i class="fa fa-location-arrow text-xs" aria-hidden="true"></i>
            <span>导航</span>
          </span>
        </button>
      </div>
      <button class="group w-full relative overflow-hidden bg-gradient-to-r from-secondary-500 via-emerald-500 to-teal-500 text-white py-3 rounded-xl font-bold shadow-xl shadow-secondary-500/25 hover:shadow-2xl transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 text-sm" @click="$emit('start-charging')">
        <span class="relative z-10 flex items-center justify-center space-x-2">
          <i class="fa fa-bolt" aria-hidden="true"></i>
          <span>开始充电</span>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'
import { useStationsStore } from '../../store/modules/stations'

const emit = defineEmits(['close', 'start-reservation', 'start-charging', 'navigate'])
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
    navigator.share({
      title: station.value.stationName,
      text: `推荐充电站: ${station.value.stationName} - ${station.value.address}`,
    }).catch(() => {})
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
    case 1: return 'status-badge-success'
    case 3: return 'status-badge-danger'
    default: return 'bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400'
  }
}

const getConnectorStatusText = (status) => {
  switch (status) {
    case 1: return '可用'
    case 3: return '使用中'
    default: return '维护中'
  }
}

const getConnectorBgClass = (status) => {
  switch (status) {
    case 1: return 'bg-secondary-100 dark:bg-secondary-900/30'
    case 3: return 'bg-danger-100 dark:bg-danger-900/30'
    default: return 'bg-surface-200 dark:bg-surface-700'
  }
}

const getConnectorIconClass = (status) => {
  switch (status) {
    case 1: return 'text-secondary-500'
    case 3: return 'text-danger-500'
    default: return 'text-surface-400'
  }
}

const getPeriodDotClass = (index) => {
  const colors = ['bg-primary-400', 'bg-warning-400', 'bg-danger-400', 'bg-orange-400', 'bg-accent-400']
  return colors[index % colors.length]
}
</script>
