import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { SERVICE_FEE_RATE, useChargingStore } from '../store/modules/charging'
import { useStationsStore } from '../store/modules/stations'
import { useUserStore } from '../store/modules/user'

const STATION = {
  stationId: 's1',
  stationName: '测试充电站',
  address: '合肥市包河区测试路1号',
  currentPrice: 1
}

const COUPONS = {
  discount: {
    id: 'cp-discount',
    title: '满50减5元',
    type: 'discount',
    value: 5,
    used: false
  },
  percent: {
    id: 'cp-percent',
    title: '八折券',
    type: 'percent',
    value: 20,
    percent: 80,
    used: false
  },
  free: {
    id: 'cp-free',
    title: '免费充电券',
    type: 'free',
    value: 15,
    used: false
  }
}

const couponList = () => Object.values(COUPONS).map((coupon) => ({ ...coupon }))

const setup = () => {
  setActivePinia(createPinia())

  const chargingStore = useChargingStore()
  const stationsStore = useStationsStore()
  const userStore = useUserStore()

  stationsStore.currentStation = { ...STATION }
  chargingStore.chargingData = {
    duration: 600,
    energy: 100,
    cost: 0,
    speed: 60,
    battery: 80
  }
  userStore.userInfo.balance = 1000
  userStore.coupons = couponList()
  userStore.chargingHistory = []
  userStore.walletTransactions = []
  userStore.notifications = []

  return { chargingStore, userStore }
}

const snapshot = (userStore) => ({
  balance: userStore.userInfo.balance,
  historyIds: userStore.chargingHistory.map((record) => record.id),
  walletIds: userStore.walletTransactions.map((record) => record.id),
  notificationIds: userStore.notifications.map((record) => record.id),
  couponUsage: userStore.coupons.map((coupon) => [coupon.id, coupon.used])
})

describe('chargingStore.settlePayment', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('returns a receipt with a 10% service fee when no coupon is selected', () => {
    const { chargingStore } = setup()

    const receipt = chargingStore.settlePayment()

    expect(receipt.chargeCost).toBe(100)
    expect(receipt.serviceFee).toBeCloseTo(receipt.chargeCost * SERVICE_FEE_RATE, 2)
    expect(receipt.couponDiscount).toBe(0)
    expect(receipt.finalAmount).toBe(110)
    expect(receipt.paidAt).toBeInstanceOf(Date)
  })

  it.each([
    ['discount', 'cp-discount', 105],
    ['percent', 'cp-percent', 90],
    ['free', 'cp-free', 95]
  ])(
    'keeps receipt, balance, history and wallet in sync for a %s coupon',
    (_label, couponId, expectedAmount) => {
      const { chargingStore, userStore } = setup()
      const balanceBefore = userStore.userInfo.balance

      const receipt = chargingStore.settlePayment({ couponId, method: 'wallet' })

      expect(receipt.finalAmount).toBe(expectedAmount)
      expect(userStore.userInfo.balance).toBeCloseTo(balanceBefore - expectedAmount, 2)
      expect(userStore.chargingHistory[0].cost).toBe(receipt.finalAmount)
      expect(userStore.walletTransactions[0].amount).toBe(-receipt.finalAmount)
      expect(userStore.walletTransactions[0].balance).toBeCloseTo(userStore.userInfo.balance, 2)
      expect(userStore.notifications).toHaveLength(1)
      expect(userStore.coupons.find((coupon) => coupon.id === couponId).used).toBe(true)
    }
  )

  it.each([
    ['missing', 'cp-missing'],
    ['already used', 'cp-used']
  ])('rejects a %s coupon with zero side effects', (_label, couponId) => {
    const { chargingStore, userStore } = setup()
    userStore.coupons.push({
      id: 'cp-used',
      title: '已使用券',
      type: 'discount',
      value: 5,
      used: true
    })
    const before = snapshot(userStore)

    expect(() => chargingStore.settlePayment({ couponId })).toThrow(/优惠券/)
    expect(snapshot(userStore)).toEqual(before)
  })
})
