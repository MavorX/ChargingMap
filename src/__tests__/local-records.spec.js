import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '../store/modules/user'

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})

describe('browser-local vehicle and sandbox records', () => {
  it('persists a vehicle without inventing its unknown specifications', () => {
    const user = useUserStore()
    user.vehicles = []
    user.addVehicle({
      model: '我的车辆',
      brand: '用户填写',
      connectorType: 'GB/T',
      maxPower: null,
      batteryCapacityKwh: null
    })
    setActivePinia(createPinia())
    const restored = useUserStore()
    restored.loadLocalVehicles()
    expect(restored.vehicles).toHaveLength(1)
    expect(restored.vehicles[0].maxPower).toBe(null)
    expect(restored.vehicles[0].batteryCapacityKwh).toBe(null)
  })

  it('restores test wallet entries and notification read status', () => {
    const user = useUserStore()
    user.userInfo.balance = 0
    user.addWalletTransaction({ type: 'recharge', amount: 10 })
    user.addNotification({ title: '测试通知', content: '不代表设备遥测' })
    user.markAllNotificationsAsRead()
    setActivePinia(createPinia())
    const restored = useUserStore()
    restored.loadSandboxLedger()
    expect(restored.userInfo.balance).toBe(10)
    expect(restored.walletTransactions[0].amount).toBe(10)
    expect(restored.unreadNotificationsCount).toBe(0)
  })

  it('ignores malformed record arrays instead of breaking account panels', () => {
    localStorage.setItem(
      'chargingSandboxLedger',
      JSON.stringify({ version: 1, balance: 999, points: 0, history: [null], transactions: [] })
    )
    const user = useUserStore()
    const original = user.userInfo.balance
    expect(() => user.loadSandboxLedger()).not.toThrow()
    expect(user.userInfo.balance).toBe(original)
  })
})
