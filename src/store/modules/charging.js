import { defineStore } from 'pinia'
import { useStationsStore } from './stations'
import { useUserStore } from './user'
import { formatDuration, formatPrice } from '../../utils/format'

export const SERVICE_FEE_RATE = 0.1

const toAmount = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

// Single source of truth for coupon availability: used, expired and below the
// minimum spend are all unusable. Invalid expiry dates stay permissive so legacy
// coupons without a trustworthy date do not silently disappear.
export const isCouponUsable = (coupon, totalAmount, now = new Date()) => {
  if (!coupon || coupon.used) return false

  if (coupon.expiryDate) {
    const expiry = new Date(`${coupon.expiryDate}T23:59:59`)
    if (!Number.isNaN(expiry.getTime()) && expiry < now) return false
  }

  return toAmount(totalAmount) >= toAmount(coupon.minSpend)
}

const couponDiscountFor = (coupon, totalAmount, now = new Date()) => {
  if (!isCouponUsable(coupon, totalAmount, now)) return 0
  if (coupon.type === 'percent') {
    return Math.min(
      Math.round(totalAmount * (1 - toAmount(coupon.percent) / 100) * 100) / 100,
      toAmount(coupon.value)
    )
  }
  if (coupon.type === 'discount' || coupon.type === 'free') {
    return toAmount(coupon.value)
  }
  return 0
}

export function calculatePaymentAmounts({ energy = 0, price = 0, coupon = null } = {}) {
  const chargeCost = toAmount(energy) * toAmount(price)
  const serviceFee = chargeCost * SERVICE_FEE_RATE
  const totalAmount = chargeCost + serviceFee
  const couponDiscount = couponDiscountFor(coupon, totalAmount)

  return {
    chargeCost,
    serviceFee,
    totalAmount,
    couponDiscount,
    finalAmount: Math.max(0, totalAmount - couponDiscount)
  }
}

const DEFAULT_SETTINGS = {
  targetBattery: 80,
  notifyFull: true,
  notifyCost: false,
  costThreshold: 50,
  smartCharge: false
}

// Timer handles live at module scope: they are not serializable app state and
// keeping them out of Pinia prevents stale handles from being persisted or
// accidentally duplicated by reactive unwrapping.
let chargingInterval = null
let speedUpdateInterval = null
let startedAt = 0

export const useChargingStore = defineStore('charging', {
  state: () => ({
    isCharging: false,
    chargingData: {
      duration: 0,
      energy: 5.2,
      cost: 12.5,
      speed: 0,
      battery: 35
    },
    settings: { ...DEFAULT_SETTINGS }
  }),

  actions: {
    startCharging() {
      // Idempotent: a second start while charging must not reset the session
      // or spawn a second (orphaned) interval.
      if (this.isCharging) return

      this.isCharging = true
      this.chargingData = {
        duration: 0,
        energy: 0,
        cost: 0,
        speed: 0,
        battery: 35
      }
      startedAt = Date.now()

      speedUpdateInterval = setInterval(() => {
        const baseSpeed = 65
        const wave = Math.sin(Date.now() / 8000) * 15
        const noise = (Math.random() - 0.5) * 6
        this.chargingData.speed = Math.max(30, Math.min(120, baseSpeed + wave + noise))
      }, 2000)

      chargingInterval = setInterval(() => {
        // Derive every value from the wall clock instead of incrementing per
        // tick: background throttling cannot make duration/energy drift apart.
        const elapsed = Math.max(0, Math.round((Date.now() - startedAt) / 1000))
        this.chargingData.duration = elapsed
        this.chargingData.energy = elapsed * 0.1
        this.chargingData.cost = elapsed * 0.25
        this.chargingData.battery = 35 + elapsed * 0.5

        if (this.chargingData.battery >= this.settings.targetBattery) {
          this.stopCharging()
        }
      }, 1000)
    },

    stopCharging() {
      this.isCharging = false
      if (chargingInterval) {
        clearInterval(chargingInterval)
        chargingInterval = null
      }
      if (speedUpdateInterval) {
        clearInterval(speedUpdateInterval)
        speedUpdateInterval = null
      }
      startedAt = 0
    },

    updateSettings(settings) {
      this.settings = { ...this.settings, ...settings }
      try {
        localStorage.setItem('chargingSettings', JSON.stringify(this.settings))
      } catch {
        // Storage can be unavailable (private mode/quota); settings still apply
        // for the current session.
      }
    },

    loadSettings() {
      try {
        const raw = localStorage.getItem('chargingSettings')
        if (!raw) return

        const parsed = JSON.parse(raw)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return

        // Merge with defaults so a partial/legacy payload cannot leave
        // `targetBattery` undefined (which would disable auto-stop forever).
        const merged = { ...DEFAULT_SETTINGS, ...parsed }
        if (typeof merged.targetBattery !== 'number' || !Number.isFinite(merged.targetBattery)) {
          merged.targetBattery = DEFAULT_SETTINGS.targetBattery
        }
        this.settings = merged
      } catch {
        // Corrupted JSON: fall back to defaults rather than breaking app boot.
        this.settings = { ...DEFAULT_SETTINGS }
      }
    },

    quotePayment({ couponId = null } = {}) {
      const stationsStore = useStationsStore()
      const userStore = useUserStore()
      // The quote path never throws: a coupon consumed elsewhere previews as
      // no discount instead of breaking the payment panel render.
      const coupon = couponId
        ? (userStore.coupons.find((item) => item.id === couponId && !item.used) ?? null)
        : null

      return calculatePaymentAmounts({
        energy: this.chargingData.energy,
        price: stationsStore.currentStation?.currentPrice ?? 0,
        coupon
      })
    },

    settlePayment({ couponId = null, method = 'wechat' } = {}) {
      const stationsStore = useStationsStore()
      const userStore = useUserStore()
      const station = stationsStore.currentStation

      if (
        !station ||
        typeof station.currentPrice !== 'number' ||
        !Number.isFinite(station.currentPrice)
      ) {
        throw new Error('当前没有可结算的充电站点')
      }

      // Validate before any write: an unavailable coupon must leave balance,
      // wallet, history and notifications untouched.
      const coupon = couponId ? userStore.coupons.find((item) => item.id === couponId) : null
      if (couponId && (!coupon || coupon.used)) {
        throw new Error('优惠券不存在或已使用')
      }

      const { chargeCost, serviceFee, totalAmount, couponDiscount, finalAmount } =
        calculatePaymentAmounts({
          energy: this.chargingData.energy,
          price: station.currentPrice,
          coupon
        })

      if (coupon && !isCouponUsable(coupon, totalAmount)) {
        throw new Error('优惠券已过期或未满足使用条件')
      }
      const paidAt = new Date()

      if (coupon) userStore.useCoupon(coupon.id)
      userStore.addWalletTransaction({
        type: 'payment',
        amount: -finalAmount,
        description: `${station.stationName}充电`,
        method
      })
      userStore.addChargingHistory({
        stationName: station.stationName,
        stationAddress: station.address,
        duration: formatDuration(this.chargingData.duration, 'hm-verbose'),
        energy: `${Number(this.chargingData.energy).toFixed(1)} kWh`,
        cost: finalAmount,
        vehicleModel: userStore.vehicles.length > 0 ? userStore.vehicles[0].model : '未知车型',
        status: 'completed'
      })
      userStore.addNotification({
        title: '充电完成通知',
        content: `您在${station.stationName}的充电已完成，充电${Number(this.chargingData.energy).toFixed(1)}度，费用${formatPrice(finalAmount)}。`
      })

      return { chargeCost, serviceFee, couponDiscount, finalAmount, paidAt }
    }
  }
})
