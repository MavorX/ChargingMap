import { defineStore } from 'pinia'
import {
  demoUserInfo,
  demoChargingHistory,
  demoCoupons,
  demoWalletTransactions,
  demoNotifications
} from '../../mocks/userDemo'

const isDemoMode = import.meta.env.VITE_DEMO === 'true'

const cloneRecords = (records) => records.map((record) => ({ ...record }))

const welcomeNotification = {
  id: 'welcome',
  title: '欢迎使用 VWer-Charging',
  content: '开始充电后，充电记录、优惠券、钱包交易与通知将显示在这里。',
  time: '刚刚',
  read: true
}

const createInitialState = () => ({
  userInfo: isDemoMode
    ? { ...demoUserInfo }
    : { name: '电动汽车用户', level: '普通会员', points: 0, balance: 0 },
  vehicles: [
    {
      id: '1',
      model: 'ID.UNYX 08',
      brand: 'Volkswagen',
      connectorType: 'CCS Combo',
      maxPower: 250
    },
    {
      id: '2',
      model: 'ID.3',
      brand: 'Volkswagen',
      connectorType: 'GB/T',
      maxPower: 120
    }
  ],
  chargingHistory: isDemoMode ? cloneRecords(demoChargingHistory) : [],
  coupons: isDemoMode ? cloneRecords(demoCoupons) : [],
  walletTransactions: isDemoMode ? cloneRecords(demoWalletTransactions) : [],
  settings: {
    notificationEnabled: true,
    chargingReminder: true,
    promotionNotification: false,
    autoPay: true,
    language: 'zh-CN'
  },
  notifications: isDemoMode ? cloneRecords(demoNotifications) : [{ ...welcomeNotification }],
  isDarkMode: false
})

export const useUserStore = defineStore('user', {
  state: createInitialState,

  actions: {
    toggleTheme() {
      this.isDarkMode = !this.isDarkMode
      localStorage.setItem('isDarkMode', this.isDarkMode)
    },

    loadTheme() {
      const savedTheme = localStorage.getItem('isDarkMode')
      if (savedTheme !== null) {
        this.isDarkMode = savedTheme === 'true'
      }
    },

    addVehicle(vehicle) {
      this.vehicles.push({
        id: Date.now().toString(),
        ...vehicle
      })
    },

    removeVehicle(vehicleId) {
      this.vehicles = this.vehicles.filter((v) => v.id !== vehicleId)
    },

    updateVehicle(vehicleId, updates) {
      const vehicle = this.vehicles.find((v) => v.id === vehicleId)
      if (vehicle) {
        Object.assign(vehicle, updates)
      }
    },

    addNotification(notification) {
      this.notifications.unshift({
        id: Date.now().toString(),
        ...notification,
        read: false
      })
    },

    markNotificationAsRead(notificationId) {
      const notification = this.notifications.find((n) => n.id === notificationId)
      if (notification) {
        notification.read = true
      }
    },

    markAllNotificationsAsRead() {
      this.notifications.forEach((notification) => {
        notification.read = true
      })
    },

    useCoupon(couponId) {
      const coupon = this.coupons.find((c) => c.id === couponId)
      if (coupon) {
        coupon.used = true
      }
    },

    addWalletTransaction(transaction, updateBalance = true) {
      this.walletTransactions.unshift({
        id: Date.now().toString(),
        ...transaction,
        date: new Date()
          .toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
          .replace(/\//g, '-')
      })
      if (
        updateBalance &&
        ['recharge', 'payment', 'refund', 'withdraw'].includes(transaction.type)
      ) {
        this.userInfo.balance += transaction.amount
      }
    },

    updateSettings(updates) {
      Object.assign(this.settings, updates)
    },

    addChargingHistory(record) {
      this.chargingHistory.unshift({
        id: Date.now().toString(),
        ...record,
        status: 'completed'
      })
    }
  },

  getters: {
    unreadNotificationsCount: (state) => {
      return state.notifications.filter((n) => !n.read).length
    }
  }
})
