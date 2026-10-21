import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useChargingStore } from '../store/modules/charging'

describe('charging store interval characterization', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    const store = useChargingStore()
    store.stopCharging()
    vi.useRealTimers()
  })

  it('increments energy every second after startCharging', () => {
    const store = useChargingStore()
    store.startCharging()

    expect(store.isCharging).toBe(true)
    expect(store.chargingData.energy).toBe(0)

    vi.advanceTimersByTime(1000)
    expect(store.chargingData.energy).toBeCloseTo(0.1, 5)

    vi.advanceTimersByTime(2000)
    expect(store.chargingData.energy).toBeCloseTo(0.3, 5)
    expect(store.chargingData.duration).toBe(3)
    expect(store.chargingData.cost).toBeCloseTo(0.75, 5)
    expect(store.chargingData.battery).toBeCloseTo(36.5, 5)
  })

  it('stops incrementing energy after stopCharging', () => {
    const store = useChargingStore()
    store.startCharging()
    vi.advanceTimersByTime(2000)
    expect(store.chargingData.energy).toBeCloseTo(0.2, 5)

    store.stopCharging()
    vi.advanceTimersByTime(5000)

    expect(store.isCharging).toBe(false)
    expect(store.chargingInterval).toBeNull()
    expect(store.chargingData.energy).toBeCloseTo(0.2, 5)
  })

  it('auto-stops when battery reaches the target percentage', () => {
    const store = useChargingStore()
    store.settings.targetBattery = 80
    store.startCharging()

    // battery starts at 35 and grows by 0.5/s: 89s -> 79.5, 90s -> 80
    vi.advanceTimersByTime(89000)
    expect(store.isCharging).toBe(true)

    vi.advanceTimersByTime(1000)
    expect(store.isCharging).toBe(false)
    expect(store.chargingData.battery).toBeCloseTo(80, 5)
    expect(store.chargingData.energy).toBeCloseTo(9, 5)
    expect(store.chargingInterval).toBeNull()
  })
})
