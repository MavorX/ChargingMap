<template>
  <main
    class="h-screen overflow-hidden bg-white pt-16 supports-[height:100dvh]:h-[100dvh] dark:bg-surface-900"
  >
    <h1 class="sr-only">探索附近充电站</h1>
    <div class="flex h-full lg:gap-4 lg:p-4 lg:pl-0">
      <div
        class="relative min-w-0 flex-1 overflow-hidden bg-surface-100 dark:bg-surface-950 lg:rounded-2xl lg:border lg:border-surface-200 dark:lg:border-surface-800"
      >
        <MapView />

        <div
          v-if="!isNavigating && !currentStation && !uiStore.activePanel"
          class="absolute inset-x-4 top-4 z-20 lg:hidden"
        >
          <div class="glass-card flex items-center gap-2 p-2">
            <StationSearch class="flex-1" />
            <button
              class="icon-button h-12 w-12 shrink-0 text-primary-600 dark:text-primary-400"
              aria-label="高级筛选"
              @click="uiStore.open('vehicleFilter')"
            >
              <i class="fa fa-sliders" aria-hidden="true"></i>
            </button>
          </div>
          <span
            class="mt-2 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs text-surface-600 shadow-sm dark:bg-surface-900/95 dark:text-surface-300"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-primary-500"></span
            >{{ viewportStationCount }} 个站点在当前视野内
          </span>
        </div>

        <button
          v-if="!isNavigating"
          class="glass-card absolute left-4 top-4 z-10 hidden items-center gap-3 px-4 py-3 text-left lg:flex"
          aria-label="定位当前位置"
          @click="locateUser"
        >
          <span
            class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
            ><i class="fa fa-location-arrow" aria-hidden="true"></i
          ></span>
          <span
            ><span class="block text-sm font-semibold text-surface-800 dark:text-surface-100">{{
              stationsStore.userLocation ? '已获取你的位置' : '合肥市 · 默认视野'
            }}</span
            ><span class="block text-[11px] text-surface-500 dark:text-surface-400">{{
              stationsStore.userLocation ? '点击重新定位' : '点击定位，发现身边的好站'
            }}</span></span
          >
        </button>

        <div
          v-if="!isNavigating"
          class="glass-card absolute bottom-4 left-4 z-10 hidden flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-[11px] text-surface-600 dark:text-surface-300 sm:flex"
          aria-label="地图状态图例"
        >
          <span class="flex items-center gap-1.5"
            ><span class="h-2 w-2 rounded-full bg-secondary-500"></span>有空闲</span
          >
          <span class="flex items-center gap-1.5"
            ><span class="h-2 w-2 rounded-full bg-warning-500"></span>余位紧张</span
          >
          <span class="flex items-center gap-1.5"
            ><span class="h-2 w-2 rounded-full bg-danger-500"></span>已满</span
          >
          <span class="flex items-center gap-1.5"
            ><span class="h-2 w-2 rounded-full bg-surface-500"></span>维护中</span
          >
        </div>

        <div
          v-if="!isNavigating"
          class="map-tools absolute bottom-28 right-4 z-fab flex flex-col gap-2 pb-[env(safe-area-inset-bottom)] lg:bottom-5"
        >
          <button class="map-tool" title="放大地图" aria-label="放大地图" @click="handleZoomIn">
            <i
              class="fa fa-plus text-primary-500 transition-all duration-200 group-hover:scale-110 group-hover:text-primary-600"
              aria-hidden="true"
            ></i>
          </button>
          <button class="map-tool" title="缩小地图" aria-label="缩小地图" @click="handleZoomOut">
            <i
              class="fa fa-minus text-surface-600 transition-all duration-200 group-hover:scale-110 group-hover:text-primary-500 dark:text-surface-300"
              aria-hidden="true"
            ></i>
          </button>
          <button
            class="map-tool"
            title="我的车辆"
            aria-label="我的车辆"
            @click="uiStore.open('vehicle')"
          >
            <i
              class="fa fa-car text-surface-600 transition-all duration-200 group-hover:scale-110 group-hover:text-secondary-500 dark:text-surface-300"
              aria-hidden="true"
            ></i>
          </button>
          <button
            class="map-tool text-primary-600 dark:text-primary-400"
            title="定位当前位置"
            aria-label="定位当前位置"
            @click="locateUser"
          >
            <i class="fa fa-location-arrow" aria-hidden="true"></i>
          </button>
        </div>

        <button
          v-if="!isNavigating && !desktopSidebarOpen"
          id="toggle-list"
          class="group absolute bottom-[calc(1.5rem_+_env(safe-area-inset-bottom))] left-1/2 z-fab -translate-x-1/2 whitespace-nowrap rounded-full px-6 py-3.5 shadow-lg transition-colors lg:hidden"
          :class="
            uiStore.activePanel === 'stationsList'
              ? 'bg-surface-800 dark:bg-surface-700'
              : 'bg-primary-600 hover:bg-primary-700'
          "
          @click="toggleStationsList"
        >
          <span class="relative z-10 flex items-center space-x-2.5 font-semibold text-white">
            <i
              :class="uiStore.activePanel === 'stationsList' ? 'fa fa-times' : 'fa fa-list'"
              aria-hidden="true"
            ></i>
            <span>{{
              uiStore.activePanel === 'stationsList'
                ? '关闭列表'
                : `查看 ${viewportStationCount} 个站点`
            }}</span>
          </span>
        </button>

        <NavigationBar v-if="isNavigating" @cancel="cancelNavigation" />
      </div>

      <aside
        v-if="desktopSidebarOpen"
        class="order-first hidden w-[380px] flex-shrink-0 flex-col overflow-hidden bg-white dark:bg-surface-900 lg:flex xl:w-[400px]"
        aria-label="站点探索"
      >
        <Transition name="sidebar-switch" mode="out-in">
          <div v-if="!currentStation" key="list" class="flex h-full min-h-0 flex-col">
            <div class="flex flex-shrink-0 items-start justify-between px-5 pb-5 pt-3">
              <div>
                <div>
                  <p
                    class="mb-2 text-[10px] font-semibold tracking-[0.18em] text-primary-600 dark:text-primary-400"
                  >
                    FIND YOUR NEXT CHARGE
                  </p>
                  <h2
                    class="text-2xl font-bold tracking-tight text-surface-900 dark:text-surface-100"
                  >
                    附近充电站
                  </h2>
                  <span class="mt-2 block text-xs text-surface-500 dark:text-surface-400"
                    >选个好站，轻松出发。</span
                  >
                </div>
              </div>
              <button
                class="icon-button"
                title="关闭侧边栏"
                aria-label="关闭侧边栏"
                @click="desktopSidebarOpen = false"
              >
                <i
                  class="fa fa-times text-surface-500 transition-colors duration-200 hover:text-danger-500"
                  aria-hidden="true"
                ></i>
              </button>
            </div>
            <div class="min-h-0 flex-1">
              <DesktopStationList
                @select-station="selectStationFromSidebar"
                @show-filter="uiStore.open('vehicleFilter')"
              />
            </div>
          </div>
          <StationDetail
            v-else
            key="detail"
            :variant="desktopSidebarOpen ? 'inline' : 'sheet'"
            @close="closeStationDetail"
            @start-reservation="uiStore.open('reservation')"
            @start-charging="uiStore.open('chargingSettings')"
            @navigate="navigateToStation"
          />
        </Transition>
      </aside>

      <button
        v-if="!desktopSidebarOpen && !isNavigating"
        class="glass-card group fixed right-6 top-20 z-fab hidden h-10 w-10 items-center justify-center transition-all duration-300 hover:shadow-glow-primary active:scale-95 lg:flex"
        title="打开站点列表"
        aria-label="打开站点列表"
        @click="desktopSidebarOpen = true"
      >
        <i
          class="fa fa-list text-primary-500 transition-all duration-200 group-hover:scale-110"
          aria-hidden="true"
        ></i>
      </button>
    </div>

    <Transition name="slide-up">
      <StationsList
        v-if="uiStore.activePanel === 'stationsList'"
        @close="uiStore.close()"
        @show-filter="uiStore.open('vehicleFilter')"
      />
    </Transition>

    <Transition name="slide-right">
      <StationDetail
        v-if="currentStation && !desktopSidebarOpen"
        :variant="desktopSidebarOpen ? 'inline' : 'sheet'"
        @close="closeStationDetail"
        @start-reservation="uiStore.open('reservation')"
        @start-charging="uiStore.open('chargingSettings')"
        @navigate="navigateToStation"
      />
    </Transition>

    <Transition name="slide-right">
      <VehicleFilter v-if="uiStore.activePanel === 'vehicleFilter'" @close="uiStore.close()" />
    </Transition>

    <Transition name="slide-right">
      <ReservationPanel
        v-if="uiStore.activePanel === 'reservation'"
        @close="uiStore.close()"
        @reservation-success="onReservationSuccess"
      />
    </Transition>

    <Transition name="slide-right">
      <ChargingSettings
        v-if="uiStore.activePanel === 'chargingSettings'"
        @close="uiStore.close()"
        @start-charging="onChargingSettingsConfirmed"
      />
    </Transition>

    <Transition name="slide-right">
      <ChargingPanel v-if="uiStore.activePanel === 'charging'" @close="onChargingComplete" />
    </Transition>

    <Transition name="slide-right">
      <PaymentPanel
        v-if="uiStore.activePanel === 'payment'"
        @close="uiStore.close()"
        @payment-success="onPaymentSuccess"
      />
    </Transition>

    <Transition name="fade-scale">
      <PaymentSuccess
        v-if="uiStore.activePanel === 'paymentSuccess'"
        :amount="lastPaidAmount"
        @close="onPaymentSuccessClose"
      />
    </Transition>

    <Transition name="slide-right">
      <ReviewPanel v-if="uiStore.activePanel === 'review'" @close="uiStore.close()" />
    </Transition>

    <Transition name="slide-right">
      <UserProfile
        v-if="uiStore.activePanel === 'userProfile'"
        @close="uiStore.close()"
        @show-notifications="uiStore.open('notifications')"
        @show-vehicles="uiStore.open('vehicle')"
        @show-charging-history="uiStore.open('chargingHistory')"
        @show-coupons="uiStore.open('coupons')"
        @show-wallet="uiStore.open('wallet')"
        @show-favorites="uiStore.open('favorites')"
        @show-settings="uiStore.open('settings')"
        @show-help="uiStore.open('help')"
      />
    </Transition>

    <Transition name="slide-right">
      <NotificationsPanel v-if="uiStore.activePanel === 'notifications'" @close="uiStore.close()" />
    </Transition>

    <Transition name="slide-right">
      <VehiclePanel v-if="uiStore.activePanel === 'vehicle'" @close="uiStore.close()" />
    </Transition>

    <Transition name="slide-right">
      <ChargingHistoryPanel
        v-if="uiStore.activePanel === 'chargingHistory'"
        @close="uiStore.close()"
      />
    </Transition>

    <Transition name="slide-right">
      <CouponsPanel v-if="uiStore.activePanel === 'coupons'" @close="uiStore.close()" />
    </Transition>

    <Transition name="slide-right">
      <WalletPanel v-if="uiStore.activePanel === 'wallet'" @close="uiStore.close()" />
    </Transition>

    <Transition name="slide-right">
      <FavoritesPanel v-if="uiStore.activePanel === 'favorites'" @close="uiStore.close()" />
    </Transition>

    <Transition name="slide-right">
      <SettingsPanel v-if="uiStore.activePanel === 'settings'" @close="uiStore.close()" />
    </Transition>

    <Transition name="slide-right">
      <HelpCenterPanel v-if="uiStore.activePanel === 'help'" @close="uiStore.close()" />
    </Transition>
  </main>
</template>

<script setup>
import { computed, defineAsyncComponent, inject, onMounted, onUnmounted, ref, watch } from 'vue'
import { useStationsStore } from '../store/modules/stations'
import { useChargingStore } from '../store/modules/charging'
import { useUiStore } from '../store/modules/ui'
import { HEADER_PANEL_EVENTS } from '../constants/headerEvents'
import mapManager from '../services/mapService'
import { formatDuration } from '../utils/format'
import MapView from '../components/map/MapView.vue'
import NavigationBar from '../components/map/NavigationBar.vue'
import StationsList from '../components/station/StationsList.vue'
import StationDetail from '../components/station/StationDetail.vue'
import DesktopStationList from '../components/station/DesktopStationList.vue'
import StationSearch from '../components/station/StationSearch.vue'
import ReservationPanel from '../components/reservation/ReservationPanel.vue'
import ChargingPanel from '../components/charging/ChargingPanel.vue'
import ChargingSettings from '../components/charging/ChargingSettings.vue'
import PaymentPanel from '../components/payment/PaymentPanel.vue'
import PaymentSuccess from '../components/payment/PaymentSuccess.vue'

// Panels that are only needed after a user action are loaded on demand so the
// initial bundle stays focused on the map, station list and station detail.
const ReviewPanel = defineAsyncComponent(() => import('../components/review/ReviewPanel.vue'))
const UserProfile = defineAsyncComponent(() => import('../components/user/UserProfile.vue'))
const NotificationsPanel = defineAsyncComponent(
  () => import('../components/user/NotificationsPanel.vue')
)
const VehiclePanel = defineAsyncComponent(() => import('../components/user/VehiclePanel.vue'))
const ChargingHistoryPanel = defineAsyncComponent(
  () => import('../components/user/ChargingHistoryPanel.vue')
)
const CouponsPanel = defineAsyncComponent(() => import('../components/user/CouponsPanel.vue'))
const WalletPanel = defineAsyncComponent(() => import('../components/user/WalletPanel.vue'))
const FavoritesPanel = defineAsyncComponent(() => import('../components/user/FavoritesPanel.vue'))
const SettingsPanel = defineAsyncComponent(() => import('../components/user/SettingsPanel.vue'))
const HelpCenterPanel = defineAsyncComponent(() => import('../components/user/HelpCenterPanel.vue'))
const VehicleFilter = defineAsyncComponent(() => import('../components/filter/VehicleFilter.vue'))

const stationsStore = useStationsStore()
const chargingStore = useChargingStore()
const uiStore = useUiStore()
const showToast = inject('showToast')

const currentStation = computed(() => stationsStore.currentStation)
const isNavigating = computed(() => stationsStore.isNavigating)
const viewportStationCount = computed(() => stationsStore.viewportStationCount)

const closeStationDetail = () => {
  stationsStore.setCurrentStation(null)
}

// Non-panel state: layout + last receipt amount stay local to the view.
const lastPaidAmount = ref(null)
const desktopSidebarOpen = ref(false)

const selectStationFromSidebar = (station) => {
  stationsStore.setCurrentStation(station)
  if (Number.isFinite(station.lng) && Number.isFinite(station.lat)) {
    mapManager.map?.setCenter([station.lng, station.lat])
  }
}

const locateUser = () => handleHeaderEvent({ detail: { type: 'locateUser' } })

const closeStationsListIfOpen = () => {
  if (uiStore.activePanel === 'stationsList') {
    uiStore.close()
  }
}

const toggleStationsList = () => {
  if (uiStore.activePanel === 'stationsList') {
    uiStore.close()
  } else {
    uiStore.open('stationsList')
  }
}

watch(currentStation, (newStation) => {
  if (newStation) {
    closeStationsListIfOpen()
  }
})

const navigateToStation = () => {
  if (currentStation.value) {
    const station = currentStation.value
    closeStationsListIfOpen()
    stationsStore.setCurrentStation(null)
    mapManager.clearRoute()
    mapManager.navigateToStation(station)
  }
}

const onReservationSuccess = () => {
  uiStore.dismiss()
  showToast('预约成功！请按时到达充电站', 'success')
}

const onChargingSettingsConfirmed = () => {
  uiStore.replace('charging')
  chargingStore.startCharging()
  showToast('充电已开始', 'success')
}

const onChargingComplete = () => {
  uiStore.replace('payment')
}

const onPaymentSuccess = (receipt) => {
  const amount = receipt?.finalAmount
  lastPaidAmount.value = typeof amount === 'number' && Number.isFinite(amount) ? amount : null
  uiStore.open('paymentSuccess', { reset: true })
}

const onPaymentSuccessClose = () => {
  uiStore.replace('review')
}

const handleHeaderEvent = (event) => {
  const { type } = event.detail
  const headerPanel = HEADER_PANEL_EVENTS[type]
  if (headerPanel) {
    uiStore.open(headerPanel)
    return
  }
  switch (type) {
    case 'locateUser':
      mapManager.clearRoute()
      stationsStore.stopNavigation()
      mapManager
        .locateUser()
        .then((loc) => {
          stationsStore.userLocation = loc
          stationsStore.recalculateDistances()
          showToast('已定位到当前位置', 'success')
        })
        .catch((err) => {
          showToast(err.message || '定位失败，请检查位置权限', 'error')
        })
      break
    case 'home':
      stationsStore.setCurrentStation(null)
      closeStationsListIfOpen()
      mapManager.clearRoute()
      stationsStore.stopNavigation()
      break
  }
}

const handleRouteResult = (event) => {
  const { distance, duration, error, station } = event.detail
  if (error) {
    showToast(error, 'error')
  } else if (distance && duration) {
    const durationText = formatDuration(duration * 60, 'hm-verbose')
    stationsStore.startNavigation({ distance, duration, station })
    showToast(`导航路线：${distance}公里，约${durationText}`, 'success')
  }
}

const cancelNavigation = () => {
  mapManager.clearRoute()
  stationsStore.stopNavigation()
  showToast('已取消导航', 'success')
}

const handleMapClick = () => {
  if (currentStation.value) {
    stationsStore.setCurrentStation(null)
  }
}

const handleNavigateToStation = (event) => {
  const station = event.detail
  closeStationsListIfOpen()
  mapManager.clearRoute()
  mapManager.navigateToStation(station)
}

const handleToggleFavoriteFromMap = (event) => {
  const { stationId } = event.detail
  const station = stationsStore.stations.find((s) => s.stationId === stationId)
  if (station) {
    const wasFavorite = station.isFavorite
    stationsStore.toggleFavorite(stationId)
    mapManager.refreshMarker(stationId)
    showToast(wasFavorite ? '已取消收藏' : '已添加收藏', 'success')
  }
}

const handleViewStationDetailFromMap = (event) => {
  const station = event.detail
  stationsStore.setCurrentStation(station)
}

const handleZoomIn = () => {
  mapManager.zoomIn()
}

const handleZoomOut = () => {
  mapManager.zoomOut()
}

// Layout breakpoint only needs to react when it is crossed, not on every pixel
// of a resize (mobile browsers fire continuously while the URL bar collapses).
const DESKTOP_QUERY = '(min-width: 1024px)'
let desktopMediaQuery = null

const applyDesktopLayout = (isDesktop) => {
  if (isDesktop) {
    if (!desktopSidebarOpen.value) {
      desktopSidebarOpen.value = true
    }
  } else {
    desktopSidebarOpen.value = false
    closeStationsListIfOpen()
  }
}

const handleBreakpointChange = (event) => {
  applyDesktopLayout(event.matches)
}

onMounted(() => {
  chargingStore.loadSettings()
  window.addEventListener('headerEvent', handleHeaderEvent)
  window.addEventListener('routeResult', handleRouteResult)
  window.addEventListener('mapClickClose', handleMapClick)
  window.addEventListener('navigateToStation', handleNavigateToStation)
  window.addEventListener('toggleFavoriteFromMap', handleToggleFavoriteFromMap)
  window.addEventListener('viewStationDetailFromMap', handleViewStationDetailFromMap)

  if (typeof window.matchMedia === 'function') {
    desktopMediaQuery = window.matchMedia(DESKTOP_QUERY)
    desktopMediaQuery.addEventListener('change', handleBreakpointChange)
    applyDesktopLayout(desktopMediaQuery.matches)
  } else {
    applyDesktopLayout(window.innerWidth >= 1024)
  }
})

onUnmounted(() => {
  window.removeEventListener('headerEvent', handleHeaderEvent)
  window.removeEventListener('routeResult', handleRouteResult)
  window.removeEventListener('mapClickClose', handleMapClick)
  window.removeEventListener('navigateToStation', handleNavigateToStation)
  window.removeEventListener('toggleFavoriteFromMap', handleToggleFavoriteFromMap)
  window.removeEventListener('viewStationDetailFromMap', handleViewStationDetailFromMap)

  if (desktopMediaQuery) {
    desktopMediaQuery.removeEventListener('change', handleBreakpointChange)
    desktopMediaQuery = null
  }
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.4s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition:
    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
}
.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.fade-scale-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.fade-scale-leave-active {
  transition: all 0.3s ease-in;
}
.fade-scale-enter-from {
  opacity: 0;
  transform: scale(0.9);
}
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.sidebar-switch-enter-active,
.sidebar-switch-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar-switch-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.sidebar-switch-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
