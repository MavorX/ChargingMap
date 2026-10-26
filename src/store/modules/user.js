import { defineStore } from 'pinia'
import { createRecordId } from '../../utils/id'
import { couponState } from '../../utils/coupons'
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
  content: '欢迎体验找站、导航与充电全流程。站点与充电均为模拟演示，不涉及真实交易。',
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
      maxPower: 250,
      batteryCapacityKwh: 80,
      isTestVehicle: true
    },
    {
      id: '2',
      model: 'ID.3',
      brand: 'Volkswagen',
      connectorType: 'GB/T',
      maxPower: 120,
      batteryCapacityKwh: 58,
      isTestVehicle: true
    }
  ],
  chargingHistory: isDemoMode ? cloneRecords(demoChargingHistory) : [],
  coupons: isDemoMode ? cloneRecords(demoCoupons) : [],
  walletTransactions: isDemoMode ? cloneRecords(demoWalletTransactions) : [],
  pointsRecords: [],
  settings: {
    notificationEnabled: true,
    chargingReminder: true,
    promotionNotification: false,
    autoPay: false,
    language: 'zh-CN'
  },
  notifications: isDemoMode ? cloneRecords(demoNotifications) : [{ ...welcomeNotification }],
  isDarkMode: false
})

export const useUserStore = defineStore('user', {
  state: createInitialState,

  actions: {
    loadPreferences() {
      try {
        const saved = JSON.parse(localStorage.getItem('chargingPreferences') || 'null')
        if (!saved || saved.version !== 1) return
        if (typeof saved.name === 'string' && saved.name.trim() && saved.name.trim().length <= 24)
          this.userInfo.name = saved.name.trim()
        for (const key of ['notificationEnabled', 'chargingReminder'])
          if (typeof saved.settings?.[key] === 'boolean') this.settings[key] = saved.settings[key]
      } catch {
        /* Keep defaults when local preferences are invalid. */
      }
    },
    persistPreferences() {
      try {
        localStorage.setItem(
          'chargingPreferences',
          JSON.stringify({ version: 1, name: this.userInfo.name, settings: this.settings })
        )
      } catch {
        /* Current-page changes remain usable. */
      }
    },
    updateName(value) {
      const name = String(value || '').trim()
      if (!name || name.length > 24) throw new Error('昵称需为 1–24 个字符')
      this.userInfo.name = name
      this.persistPreferences()
    },
    addReviewPoints(sessionId) {
      if (!sessionId || this.pointsRecords.some((record) => record.sessionId === sessionId)) return
      this.userInfo.points += 5
      this.pointsRecords.unshift({
        id: createRecordId(),
        sessionId,
        amount: 5,
        description: '完成充电评价',
        time: new Date().toLocaleString('zh-CN')
      })
      this.persistSandboxLedger()
    },
    loadLocalVehicles() {
      try {
        const vehicles = JSON.parse(localStorage.getItem('chargingLocalVehicles') || 'null')
        if (Array.isArray(vehicles))
          this.vehicles = vehicles.filter(
            (vehicle) =>
              vehicle &&
              typeof vehicle.id === 'string' &&
              typeof vehicle.model === 'string' &&
              typeof vehicle.brand === 'string' &&
              ['GB/T', 'CCS Combo', 'CHAdeMO', 'Type 2'].includes(vehicle.connectorType)
          )
      } catch {
        /* Keep the local vehicle form usable when storage is blocked. */
      }
    },
    persistVehicles() {
      try {
        localStorage.setItem('chargingLocalVehicles', JSON.stringify(this.vehicles))
      } catch {
        /* In-memory edits still work. */
      }
    },
    loadSandboxLedger() {
      try {
        const saved = JSON.parse(localStorage.getItem('chargingSandboxLedger') || 'null')
        const validRecords = (records) =>
          Array.isArray(records) &&
          records.every(
            (record) => record && typeof record === 'object' && typeof record.id === 'string'
          )
        if (
          !saved ||
          saved.version !== 1 ||
          !Number.isFinite(saved.balance) ||
          saved.balance < 0 ||
          !Number.isFinite(saved.points) ||
          saved.points < 0 ||
          !validRecords(saved.history) ||
          !validRecords(saved.transactions)
        )
          return
        this.userInfo.balance = saved.balance
        this.userInfo.points = saved.points
        this.chargingHistory = saved.history.slice(0, 200)
        this.walletTransactions = saved.transactions.slice(0, 200)
        if (validRecords(saved.pointsRecords))
          this.pointsRecords = saved.pointsRecords.slice(0, 200)
        if (validRecords(saved.notifications))
          this.notifications = saved.notifications.slice(0, 200)
        if (Array.isArray(saved.usedCoupons))
          this.coupons.forEach((coupon) => {
            if (saved.usedCoupons.includes(coupon.id)) coupon.used = true
          })
      } catch {
        /* Invalid local test records never prevent a fresh launch. */
      }
    },
    persistSandboxLedger() {
      try {
        localStorage.setItem(
          'chargingSandboxLedger',
          JSON.stringify({
            version: 1,
            balance: this.userInfo.balance,
            points: this.userInfo.points,
            pointsRecords: this.pointsRecords.slice(0, 200),
            history: this.chargingHistory.slice(0, 200),
            transactions: this.walletTransactions.slice(0, 200),
            notifications: this.notifications.slice(0, 200),
            usedCoupons: this.coupons.filter((coupon) => coupon.used).map((coupon) => coupon.id)
          })
        )
      } catch {
        /* Test records remain in memory. */
      }
    },
    toggleTheme() {
      this.isDarkMode = !this.isDarkMode
      try {
        localStorage.setItem('isDarkMode', this.isDarkMode)
      } catch {
        /* In-memory theme still works. */
      }
    },

    loadTheme() {
      try {
        const savedTheme = localStorage.getItem('isDarkMode')
        if (savedTheme !== null) this.isDarkMode = savedTheme === 'true'
      } catch {
        /* Storage may be blocked by browser privacy settings. */
      }
    },

    addVehicle(vehicle) {
      this.vehicles.push({
        id: createRecordId(),
        ...vehicle
      })
      this.persistVehicles()
    },

    removeVehicle(vehicleId) {
      this.vehicles = this.vehicles.filter((v) => v.id !== vehicleId)
      this.persistVehicles()
    },

    updateVehicle(vehicleId, updates) {
      const vehicle = this.vehicles.find((v) => v.id === vehicleId)
      if (vehicle) {
        Object.assign(vehicle, updates)
        this.persistVehicles()
        return true
      }
      return false
    },

    addNotification(notification) {
      if (!this.settings.notificationEnabled) return
      this.notifications.unshift({
        id: createRecordId(),
        time: new Date().toLocaleString('zh-CN'),
        ...notification,
        read: false
      })
      this.persistSandboxLedger()
    },

    markNotificationAsRead(notificationId) {
      const notification = this.notifications.find((n) => n.id === notificationId)
      if (notification) {
        notification.read = true
        this.persistSandboxLedger()
      }
    },

    markAllNotificationsAsRead() {
      this.notifications.forEach((notification) => {
        notification.read = true
      })
      this.persistSandboxLedger()
    },

    useCoupon(couponId) {
      const coupon = this.coupons.find((c) => c.id === couponId)
      if (coupon) {
        coupon.used = true
        this.persistSandboxLedger()
      }
    },

    addWalletTransaction(transaction) {
      if (transaction.operationId) {
        const previous = this.walletTransactions.find(
          (tx) => tx.operationId === transaction.operationId
        )
        if (previous) return previous
      }
      if (
        !['recharge', 'refund', 'withdraw', 'payment'].includes(transaction.type) ||
        !Number.isFinite(transaction.amount)
      )
        throw new Error('交易信息无效')
      const affectsBalance =
        ['recharge', 'refund', 'withdraw'].includes(transaction.type) ||
        (transaction.type === 'payment' && (!transaction.method || transaction.method === 'wallet'))
      const balanceDelta = affectsBalance ? Number(transaction.amount) || 0 : 0
      if (
        ['recharge', 'refund'].includes(transaction.type)
          ? transaction.amount < 0
          : transaction.amount > 0
      )
        throw new Error('交易金额方向无效')
      if (this.userInfo.balance + balanceDelta < 0) throw new Error('钱包余额不足')
      if (balanceDelta !== 0) {
        this.userInfo.balance = Math.round((this.userInfo.balance + balanceDelta) * 100) / 100
      }
      this.walletTransactions.unshift({
        id: createRecordId(),
        description: {
          recharge: '钱包充值',
          withdraw: '钱包提现',
          refund: '订单退款',
          payment: '充电支付'
        }[transaction.type],
        ...transaction,
        balance: this.userInfo.balance,
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
      this.persistSandboxLedger()
      return this.walletTransactions[0]
    },

    updateSettings(updates) {
      Object.assign(this.settings, updates)
      this.persistPreferences()
    },

    addChargingHistory(record) {
      this.chargingHistory.unshift({
        id: createRecordId(),
        date: new Date().toLocaleDateString('zh-CN'),
        ...record,
        status: 'completed'
      })
      this.persistSandboxLedger()
    }
  },

  getters: {
    availableCouponsCount: (state) =>
      state.coupons.filter((coupon) => couponState(coupon) === 'available').length,
    unreadNotificationsCount: (state) => {
      return state.notifications.filter((n) => !n.read).length
    }
  }
})
