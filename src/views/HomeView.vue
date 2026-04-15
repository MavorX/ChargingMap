<template>
  <main class="h-screen pt-16 overflow-hidden">
    <div class="flex h-full">
      <div class="flex-1 relative min-w-0">
        <MapView />

        <div v-if="!isNavigating" class="fixed bottom-24 z-40 flex flex-col space-y-3 transition-all duration-300" :class="desktopSidebarOpen ? 'right-[424px] xl:right-[444px]' : 'right-6'">
          <button
            class="group w-12 h-12 glass-card flex items-center justify-center hover:shadow-glow-primary transition-all duration-300 active:scale-95"
            @click="handleZoomIn"
            title="放大地图">
            <i class="fa fa-plus text-primary-500 group-hover:text-primary-600 group-hover:scale-110 transition-all duration-200" aria-hidden="true"></i>
          </button>
          <button
            class="group w-12 h-12 glass-card flex items-center justify-center hover:shadow-glow-primary transition-all duration-300 active:scale-95"
            @click="handleZoomOut"
            title="缩小地图">
            <i class="fa fa-minus text-surface-600 dark:text-surface-300 group-hover:text-primary-500 group-hover:scale-110 transition-all duration-200" aria-hidden="true"></i>
          </button>
          <button
            class="group w-12 h-12 glass-card flex items-center justify-center hover:shadow-glow-secondary transition-all duration-300 active:scale-95"
            @click="showVehiclePanel = true"
            title="我的车辆">
            <i class="fa fa-car text-surface-600 dark:text-surface-300 group-hover:text-secondary-500 group-hover:scale-110 transition-all duration-200" aria-hidden="true"></i>
          </button>
        </div>

        <button
          v-if="!isNavigating && !desktopSidebarOpen"
          id="toggle-list"
          class="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 px-7 py-3.5 rounded-2xl shadow-xl shadow-primary-500/25 hover:shadow-2xl hover:shadow-primary-500/30 transform hover:-translate-y-1 transition-all duration-300 active:scale-[0.98] overflow-hidden group lg:hidden"
          :class="showStationsList ? 'bg-gradient-to-r from-surface-700 to-surface-800 dark:from-surface-800 dark:to-surface-900' : 'bg-gradient-to-r from-primary-500 to-accent-500'"
          @click="showStationsList = !showStationsList">
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <span class="relative z-10 flex items-center space-x-2.5 text-white font-semibold">
            <i :class="showStationsList ? 'fa fa-times' : 'fa fa-list'" aria-hidden="true"></i>
            <span>{{ showStationsList ? '关闭列表' : '查看站点列表' }}</span>
          </span>
        </button>

        <NavigationBar v-if="isNavigating" @cancel="cancelNavigation" />
      </div>

      <aside v-if="desktopSidebarOpen" class="hidden lg:flex w-[400px] xl:w-[420px] flex-shrink-0 border-l border-surface-200 dark:border-surface-700/50 bg-white dark:bg-surface-900 flex-col overflow-hidden">
        <Transition name="sidebar-switch" mode="out-in">
          <div v-if="!currentStation" key="list" class="flex flex-col h-full">
            <div class="glass-effect border-b border-surface-200/50 dark:border-surface-700/50 p-4 flex justify-between items-center flex-shrink-0">
              <div class="flex items-center space-x-3">
                <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center shadow-md">
                  <i class="fa fa-map-marker text-white text-sm" aria-hidden="true"></i>
                </div>
                <div>
                  <h2 class="text-base font-bold text-surface-900 dark:text-surface-100">附近充电站</h2>
                  <span class="text-xs text-surface-400 dark:text-surface-500">{{ viewportStationCount }}个在视野内</span>
                </div>
              </div>
              <button class="icon-button" @click="desktopSidebarOpen = false" title="关闭侧边栏">
                <i class="fa fa-times text-surface-500 hover:text-danger-500 transition-colors duration-200" aria-hidden="true"></i>
              </button>
            </div>
            <div class="flex-1 overflow-y-auto">
              <DesktopStationList @select-station="selectStationFromSidebar" />
            </div>
          </div>
          <StationDetailInline v-else key="detail" @close="closeStationDetail" @start-reservation="openReservation" @start-charging="openCharging" @navigate="navigateToStation" />
        </Transition>
      </aside>

      <button
        v-if="!desktopSidebarOpen && !isNavigating"
        class="hidden lg:flex fixed right-6 top-20 z-40 w-10 h-10 glass-card items-center justify-center hover:shadow-glow-primary transition-all duration-300 active:scale-95 group"
        @click="desktopSidebarOpen = true"
        title="打开站点列表">
        <i class="fa fa-list text-primary-500 group-hover:scale-110 transition-all duration-200" aria-hidden="true"></i>
      </button>
    </div>

    <Transition name="slide-up">
      <StationsList v-if="showStationsList" @close="showStationsList = false" @show-filter="showVehicleFilter = true" />
    </Transition>

    <Transition name="slide-right">
      <StationDetail v-if="currentStation && !desktopSidebarOpen" @close="closeStationDetail" @start-reservation="openReservation" @start-charging="openCharging" @navigate="navigateToStation" />
    </Transition>

    <Transition name="slide-right">
      <VehicleFilter v-if="showVehicleFilter" @close="showVehicleFilter = false" />
    </Transition>

    <Transition name="slide-right">
      <ReservationPanel v-if="showReservation" @close="showReservation = false" @reservation-success="onReservationSuccess" />
    </Transition>

    <Transition name="slide-right">
      <ChargingSettings v-if="showChargingSettings" @close="showChargingSettings = false" @start-charging="onChargingSettingsConfirmed" />
    </Transition>

    <Transition name="slide-right">
      <ChargingPanel v-if="showCharging" @close="onChargingComplete" />
    </Transition>

    <Transition name="slide-right">
      <PaymentPanel v-if="showPayment" @close="showPayment = false" @payment-success="onPaymentSuccess" />
    </Transition>

    <Transition name="fade-scale">
      <PaymentSuccess v-if="showPaymentSuccess" :amount="lastPaidAmount" @close="onPaymentSuccessClose" />
    </Transition>

    <Transition name="slide-right">
      <ReviewPanel v-if="showReview" @close="showReview = false" />
    </Transition>

    <Transition name="slide-right">
      <UserProfile v-if="showUserProfile" @close="showUserProfile = false" @show-notifications="openNotifications" @show-vehicles="openVehiclePanel" @show-charging-history="openChargingHistory" @show-coupons="openCoupons" @show-wallet="openWallet" @show-favorites="openFavorites" @show-settings="openSettings" @show-help="openHelp" />
    </Transition>

    <Transition name="slide-right">
      <NotificationsPanel v-if="showNotifications" @close="showNotifications = false" />
    </Transition>

    <Transition name="slide-right">
      <VehiclePanel v-if="showVehiclePanel" @close="showVehiclePanel = false" />
    </Transition>

    <Transition name="slide-right">
      <ChargingHistoryPanel v-if="showChargingHistory" @close="showChargingHistory = false" />
    </Transition>

    <Transition name="slide-right">
      <CouponsPanel v-if="showCoupons" @close="showCoupons = false" />
    </Transition>

    <Transition name="slide-right">
      <WalletPanel v-if="showWallet" @close="showWallet = false" />
    </Transition>

    <Transition name="slide-right">
      <FavoritesPanel v-if="showFavorites" @close="showFavorites = false" />
    </Transition>

    <Transition name="slide-right">
      <SettingsPanel v-if="showSettings" @close="showSettings = false" />
    </Transition>

    <Transition name="slide-right">
      <HelpCenterPanel v-if="showHelp" @close="showHelp = false" />
    </Transition>
  </main>
</template>

<script setup>
import { ref, computed, watch, inject, onMounted, onUnmounted } from 'vue';
import { useStationsStore } from '../store/modules/stations';
import { useChargingStore } from '../store/modules/charging';
import { useReservationStore } from '../store/modules/reservation';
import { useUserStore } from '../store/modules/user';
import mapManager from '../services/mapService';
import MapView from '../components/map/MapView.vue';
import NavigationBar from '../components/map/NavigationBar.vue';
import StationsList from '../components/station/StationsList.vue';
import StationDetail from '../components/station/StationDetail.vue';
import StationDetailInline from '../components/station/StationDetailInline.vue';
import DesktopStationList from '../components/station/DesktopStationList.vue';
import ReservationPanel from '../components/reservation/ReservationPanel.vue';
import ChargingPanel from '../components/charging/ChargingPanel.vue';
import ChargingSettings from '../components/charging/ChargingSettings.vue';
import PaymentPanel from '../components/payment/PaymentPanel.vue';
import PaymentSuccess from '../components/payment/PaymentSuccess.vue';
import ReviewPanel from '../components/review/ReviewPanel.vue';
import UserProfile from '../components/user/UserProfile.vue';
import NotificationsPanel from '../components/user/NotificationsPanel.vue';
import VehiclePanel from '../components/user/VehiclePanel.vue';
import ChargingHistoryPanel from '../components/user/ChargingHistoryPanel.vue';
import CouponsPanel from '../components/user/CouponsPanel.vue';
import WalletPanel from '../components/user/WalletPanel.vue';
import FavoritesPanel from '../components/user/FavoritesPanel.vue';
import SettingsPanel from '../components/user/SettingsPanel.vue';
import HelpCenterPanel from '../components/user/HelpCenterPanel.vue';
import VehicleFilter from '../components/filter/VehicleFilter.vue';

const stationsStore = useStationsStore();
const chargingStore = useChargingStore();
const reservationStore = useReservationStore();
const userStore = useUserStore();
const showToast = inject('showToast');

const currentStation = computed(() => stationsStore.currentStation);
const isNavigating = computed(() => stationsStore.isNavigating);
const viewportStationCount = computed(() => stationsStore.viewportStationCount);

const closeStationDetail = () => {
  stationsStore.setCurrentStation(null);
};

const showStationsList = ref(false);
const showReservation = ref(false);
const showCharging = ref(false);
const showChargingSettings = ref(false);
const showPayment = ref(false);
const showPaymentSuccess = ref(false);
const showReview = ref(false);
const showUserProfile = ref(false);
const showNotifications = ref(false);
const showVehiclePanel = ref(false);
const showChargingHistory = ref(false);
const showCoupons = ref(false);
const showWallet = ref(false);
const showFavorites = ref(false);
const showSettings = ref(false);
const showHelp = ref(false);
const showVehicleFilter = ref(false);
const lastPaidAmount = ref(0);
const desktopSidebarOpen = ref(false);

const selectStationFromSidebar = (station) => {
  stationsStore.setCurrentStation(station);
};

watch(currentStation, (newStation) => {
  if (newStation) {
    showStationsList.value = false;
  }
});

const openReservation = () => {
  showReservation.value = true;
};

const openCharging = () => {
  showChargingSettings.value = true;
};

const navigateToStation = () => {
  if (currentStation.value) {
    const station = currentStation.value
    showStationsList.value = false
    stationsStore.setCurrentStation(null)
    mapManager.clearRoute()
    mapManager.navigateToStation(station)
  }
};

const onReservationSuccess = () => {
  showReservation.value = false;
  showToast('预约成功！请按时到达充电站', 'success');
};

const onChargingSettingsConfirmed = () => {
  showChargingSettings.value = false;
  chargingStore.startCharging();
  showCharging.value = true;
  showToast('充电已开始', 'success');
};

const onChargingComplete = () => {
  showCharging.value = false;
  showPayment.value = true;
};

const onPaymentSuccess = (paidAmount) => {
  showPayment.value = false;
  showPaymentSuccess.value = true;

  const station = currentStation.value;
  const chargingData = chargingStore.chargingData;
  if (station) {
    const chargeCost = chargingData.energy * station.currentPrice;
    const serviceFee = chargeCost * 0.1;
    const totalCost = chargeCost + serviceFee;
    const actualPaid = paidAmount || totalCost;
    lastPaidAmount.value = actualPaid;

    userStore.addChargingHistory({
      stationName: station.stationName,
      stationAddress: station.address,
      duration: chargingData.duration >= 3600
        ? `${Math.floor(chargingData.duration / 3600)}小时${Math.floor((chargingData.duration % 3600) / 60)}分钟`
        : `${Math.floor(chargingData.duration / 60)}分钟`,
      energy: `${chargingData.energy.toFixed(1)} kWh`,
      cost: actualPaid,
      vehicleModel: userStore.vehicles.length > 0 ? userStore.vehicles[0].model : '未知车型',
      status: 'completed'
    });

    userStore.addWalletTransaction({
      type: 'payment',
      amount: -actualPaid,
      description: `${station.stationName}充电`
    }, false);

    userStore.addNotification({
      title: '充电完成通知',
      content: `您在${station.stationName}的充电已完成，充电${chargingData.energy.toFixed(1)}度，费用¥${actualPaid.toFixed(2)}。`
    });
  }
};

const onPaymentSuccessClose = () => {
  showPaymentSuccess.value = false;
  showReview.value = true;
};

const openNotifications = () => {
  showUserProfile.value = false;
  showNotifications.value = true;
};

const openVehiclePanel = () => {
  showUserProfile.value = false;
  showVehiclePanel.value = true;
};

const openChargingHistory = () => {
  showUserProfile.value = false;
  showChargingHistory.value = true;
};

const openCoupons = () => {
  showUserProfile.value = false;
  showCoupons.value = true;
};

const openWallet = () => {
  showUserProfile.value = false;
  showWallet.value = true;
};

const openFavorites = () => {
  showUserProfile.value = false;
  showFavorites.value = true;
};

const openSettings = () => {
  showUserProfile.value = false;
  showSettings.value = true;
};

const openHelp = () => {
  showUserProfile.value = false;
  showHelp.value = true;
};

const handleHeaderEvent = (event) => {
  const { type } = event.detail;
  switch (type) {
    case 'showNotifications':
      showNotifications.value = true;
      break;
    case 'showUserProfile':
      showUserProfile.value = true;
      break;
    case 'locateUser':
      mapManager.clearRoute()
      stationsStore.stopNavigation()
      mapManager.locateUser().then((loc) => {
        stationsStore.userLocation = loc;
        stationsStore.recalculateDistances();
        showToast('已定位到当前位置', 'success');
      }).catch((err) => {
        showToast(err.message || '定位失败，请检查位置权限', 'error');
      });
      break;
    case 'home':
      stationsStore.setCurrentStation(null);
      showStationsList.value = false;
      mapManager.clearRoute();
      stationsStore.stopNavigation();
      break;
  }
};

const handleRouteResult = (event) => {
  const { distance, duration, error, station } = event.detail;
  if (error) {
    showToast(error, 'error');
  } else if (distance && duration) {
    const durationText = duration >= 60 ? `${Math.floor(duration / 60)}小时${duration % 60}分钟` : `${duration}分钟`;
    stationsStore.startNavigation({ distance, duration, station });
    showToast(`导航路线：${distance}公里，约${durationText}`, 'success');
  }
};

const cancelNavigation = () => {
  mapManager.clearRoute();
  stationsStore.stopNavigation();
  showToast('已取消导航', 'success');
};

const handleMapClick = () => {
  if (currentStation.value) {
    stationsStore.setCurrentStation(null);
  }
};

const handleNavigateToStation = (event) => {
  const station = event.detail;
  showStationsList.value = false;
  mapManager.clearRoute();
  mapManager.navigateToStation(station);
};

const handleToggleFavoriteFromMap = (event) => {
  const { stationId, btnElement } = event.detail;
  const station = stationsStore.stations.find(s => s.stationId === stationId);
  if (station) {
    const wasFavorite = station.isFavorite;
    stationsStore.toggleFavorite(stationId);
    if (btnElement) {
      const nowFavorite = !wasFavorite;
      btnElement.style.background = nowFavorite ? '#FEE2E2' : '#F3F4F6';
      btnElement.style.color = nowFavorite ? '#EF4444' : '#6B7280';
      btnElement.innerHTML = `<span style="font-size:14px;">${nowFavorite ? '♥' : '♡'}</span><span>${nowFavorite ? '已收藏' : '收藏'}</span>`;
    }
    showToast(wasFavorite ? '已取消收藏' : '已添加收藏', 'success');
  }
};

const handleViewStationDetailFromMap = (event) => {
  const station = event.detail;
  stationsStore.setCurrentStation(station);
};

const handleZoomIn = () => {
  mapManager.zoomIn();
};

const handleZoomOut = () => {
  mapManager.zoomOut();
};

const handleResize = () => {
  if (window.innerWidth >= 1024) {
    if (!desktopSidebarOpen.value) {
      desktopSidebarOpen.value = true;
    }
  } else {
    desktopSidebarOpen.value = false;
    showStationsList.value = false;
  }
};

onMounted(() => {
  window.addEventListener('headerEvent', handleHeaderEvent);
  window.addEventListener('routeResult', handleRouteResult);
  window.addEventListener('mapClickClose', handleMapClick);
  window.addEventListener('navigateToStation', handleNavigateToStation);
  window.addEventListener('toggleFavoriteFromMap', handleToggleFavoriteFromMap);
  window.addEventListener('viewStationDetailFromMap', handleViewStationDetailFromMap);
  window.addEventListener('resize', handleResize);

  if (window.innerWidth >= 1024) {
    desktopSidebarOpen.value = true;
  }
});

onUnmounted(() => {
  window.removeEventListener('headerEvent', handleHeaderEvent);
  window.removeEventListener('routeResult', handleRouteResult);
  window.removeEventListener('mapClickClose', handleMapClick);
  window.removeEventListener('navigateToStation', handleNavigateToStation);
  window.removeEventListener('toggleFavoriteFromMap', handleToggleFavoriteFromMap);
  window.removeEventListener('viewStationDetailFromMap', handleViewStationDetailFromMap);
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
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
