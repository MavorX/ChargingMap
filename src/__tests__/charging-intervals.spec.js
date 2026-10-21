import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useChargingStore } from '../store/modules/charging'
import ChargingPanel from '../components/charging/ChargingPanel.vue'

describe('charging store interval characterization', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    const store = useChargingStore()
    store.stopCharging()
    vi.useRealTimers()
    vi.restoreAllMocks()
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

  it('is idempotent: a second startCharging does not duplicate the interval', () => {
    const store = useChargingStore()
    store.startCharging()
    store.startCharging()

    vi.advanceTimersByTime(1000)
    expect(store.chargingData.energy).toBeCloseTo(0.1, 5)

    vi.advanceTimersByTime(1000)
    expect(store.chargingData.energy).toBeCloseTo(0.2, 5)
    expect(store.chargingData.duration).toBe(2)
  })

  it('stops incrementing energy after stopCharging', () => {
    const store = useChargingStore()
    store.startCharging()
    vi.advanceTimersByTime(2000)
    expect(store.chargingData.energy).toBeCloseTo(0.2, 5)

    store.stopCharging()
    vi.advanceTimersByTime(5000)

    expect(store.isCharging).toBe(false)
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
  })

  it('does not accumulate intervals across repeated start/stop cycles', () => {
    const store = useChargingStore()

    for (let round = 0; round < 3; round += 1) {
      store.startCharging()
      vi.advanceTimersByTime(1000)
      expect(store.chargingData.energy).toBeCloseTo(0.1, 5)

      vi.advanceTimersByTime(1000)
      expect(store.chargingData.energy).toBeCloseTo(0.2, 5)

      store.stopCharging()
      vi.advanceTimersByTime(5000)
      expect(store.chargingData.energy).toBeCloseTo(0.2, 5)
    }
  })

  it('survives corrupted settings JSON and restores defaults', () => {
    localStorage.setItem('chargingSettings', '{not-valid-json')
    const store = useChargingStore()

    expect(() => store.loadSettings()).not.toThrow()
    expect(store.settings.targetBattery).toBe(80)
  })

  it('merges partial settings with defaults so targetBattery is never missing', () => {
    localStorage.setItem('chargingSettings', JSON.stringify({ notifyFull: false }))
    const store = useChargingStore()

    store.loadSettings()

    expect(store.settings.targetBattery).toBe(80)
    expect(store.settings.notifyFull).toBe(false)
    expect(store.settings.smartCharge).toBe(false)
  })

  it('keeps charging in the background after the panel unmounts', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useChargingStore()

    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1)
    const cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {})

    const wrapper = mount(ChargingPanel, {
      global: {
        plugins: [pinia],
        provide: { showToast: vi.fn() }
      }
    })

    store.startCharging()
    vi.advanceTimersByTime(1000)
    expect(store.chargingData.energy).toBeCloseTo(0.1, 5)

    wrapper.unmount()
    vi.advanceTimersByTime(2000)

    expect(store.isCharging).toBe(true)
    expect(store.chargingData.energy).toBeCloseTo(0.3, 5)

    rafSpy.mockRestore()
    cancelSpy.mockRestore()
  })
})
