import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { DEMO_STATION_ID, demoChargingHistory, demoReservations } from '../mocks/userDemo'

// 相对路径由 node:fs 按仓库根目录解析（vitest 从根目录运行）。
const stationList = JSON.parse(readFileSync('public/data/station_list.json', 'utf8'))
const stationIds = new Set(stationList.map((station) => station.stationId))

// VITE_DEMO 在 store 模块顶层读取，因此必须 resetModules 后动态 import 才能重读环境变量。
// pinia 与 store 一并动态导入，避免 resetModules 后静态 pinia 与 store 内部 pinia 实例不一致。
const loadStores = async () => {
  const { createPinia, setActivePinia } = await import('pinia')
  const [{ useUserStore }, { useReservationStore }] = await Promise.all([
    import('../store/modules/user'),
    import('../store/modules/reservation')
  ])
  setActivePinia(createPinia())
  return { userStore: useUserStore(), reservationStore: useReservationStore() }
}

describe('VITE_DEMO mock data gating', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('starts from empty user data when VITE_DEMO is not enabled', async () => {
    vi.stubEnv('VITE_DEMO', '')

    const { userStore, reservationStore } = await loadStores()

    expect(userStore.userInfo.balance).toBe(0)
    expect(userStore.chargingHistory).toHaveLength(0)
    expect(userStore.coupons).toHaveLength(0)
    expect(userStore.walletTransactions).toHaveLength(0)
    expect(userStore.notifications).toHaveLength(1)
    expect(userStore.notifications[0].id).toBe('welcome')
    expect(reservationStore.reservations).toHaveLength(0)
  })

  it('loads demo user and reservation data when VITE_DEMO is true', async () => {
    vi.stubEnv('VITE_DEMO', 'true')

    const { userStore, reservationStore } = await loadStores()

    expect(userStore.userInfo.balance).toBe(56.8)
    expect(userStore.chargingHistory).toHaveLength(5)
    expect(userStore.coupons).toHaveLength(3)
    expect(userStore.walletTransactions).toHaveLength(6)
    expect(userStore.notifications).toHaveLength(4)
    expect(reservationStore.reservations).toHaveLength(1)
    expect(reservationStore.reservations[0].stationId).toBe(DEMO_STATION_ID)
  })

  it('keeps demo records isolated between pinia instances', async () => {
    vi.stubEnv('VITE_DEMO', 'true')

    const first = await loadStores()
    first.userStore.coupons[0].used = true
    const second = await loadStores()

    expect(second.userStore.coupons[0].used).toBe(false)
  })

  it('only references station ids that exist in the generated dataset', () => {
    const referencedIds = [...demoChargingHistory, ...demoReservations].map(
      (record) => record.stationId
    )

    expect(referencedIds.length).toBeGreaterThan(0)
    expect(stationIds.has(DEMO_STATION_ID)).toBe(true)
    referencedIds.forEach((stationId) => {
      expect(stationIds.has(stationId)).toBe(true)
    })
  })
})
