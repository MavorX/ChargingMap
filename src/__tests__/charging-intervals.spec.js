import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useChargingStore } from '../store/modules/charging'
import ChargingPanel from '../components/charging/ChargingPanel.vue'
import { installSandbox, start, stop } from './helpers/charging'
import { chargingDurationSeconds } from '../utils/chargingModel'

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  vi.useFakeTimers()
  installSandbox()
})
afterEach(() => {
  useChargingStore().suspendSimulator()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('physical sandbox metering', () => {
  it('meters kW × hours, with no invented initial SOC or random power', async () => {
    const store = await start()
    expect(store.chargingData.energy).toBe(0)
    await vi.advanceTimersByTimeAsync(3000)
    expect(store.chargingData.energy).toBeCloseTo((60 * 3) / 3600)
    expect(store.chargingData.duration).toBe(3)
    expect(store.chargingData.speed).toBe(60)
    expect(store.chargingData.cost).toBe(0.06)
    expect(store.chargingData.battery).toBeCloseTo(20 + (0.05 / 60) * 100)
  })

  it('does not duplicate intervals when start is repeated', async () => {
    const store = await start()
    await store.startCharging()
    await vi.advanceTimersByTimeAsync(2000)
    expect(store.chargingData.energy).toBeCloseTo((60 * 2) / 3600)
    expect(store.chargingData.duration).toBe(2)
  })

  it('keeps metering until stop acknowledgement, then freezes the meter', async () => {
    const store = await start()
    await vi.advanceTimersByTimeAsync(2000)
    const pending = store.stopCharging()
    expect(store.isCharging).toBe(true)
    expect(() => store.disconnectPlug()).toThrow('禁止拔枪')
    await vi.advanceTimersByTimeAsync(500)
    await pending
    expect(store.chargingData.energy).toBeCloseTo((60 * 2.5) / 3600)
    const energy = store.chargingData.energy
    await vi.advanceTimersByTimeAsync(5000)
    expect(store.isCharging).toBe(false)
    expect(store.chargingData.energy).toBe(energy)
    expect(store.phase).toBe('awaiting_unplug')
  })

  it('requests automatic stop at the target and still waits for acknowledgement', async () => {
    const store = await start({ initialBattery: 79, targetBattery: 80, clockScale: 60 })
    await vi.advanceTimersByTimeAsync(1000)
    expect(store.phase).toBe('stopping')
    expect(store.isCharging).toBe(true)
    await vi.advanceTimersByTimeAsync(500)
    expect(store.isCharging).toBe(false)
    expect(store.phase).toBe('awaiting_unplug')
    expect(store.chargingData.energy).toBeCloseTo(0.6)
    expect(store.chargingData.battery).toBeCloseTo(80)
    expect(store.chargingData.duration).toBeCloseTo(chargingDurationSeconds(store.sessionModel))
  })

  it('does not accumulate intervals across paid sessions', async () => {
    for (let round = 0; round < 3; round++) {
      const store = await start()
      await vi.advanceTimersByTimeAsync(2000)
      expect(store.chargingData.energy).toBeCloseTo((60 * 2) / 3600)
      await stop()
      store.disconnectPlug()
      store.settlePayment()
      const energy = store.chargingData.energy
      await vi.advanceTimersByTimeAsync(5000)
      expect(store.chargingData.energy).toBe(energy)
    }
  })

  it('survives corrupted settings JSON and restores defaults', () => {
    localStorage.setItem('chargingSettings', '{not-valid-json')
    expect(() => useChargingStore().loadSettings()).not.toThrow()
    expect(useChargingStore().settings.targetBattery).toBe(80)
  })

  it('merges partial settings with defaults without promising scheduling', () => {
    localStorage.setItem('chargingSettings', JSON.stringify({ notifyFull: false }))
    const store = useChargingStore()
    store.loadSettings()
    expect(store.settings.targetBattery).toBe(80)
    expect(store.settings.notifyFull).toBe(false)
    expect(store.settings.smartCharge).toBe(false)
  })

  it('keeps the sandbox running when its panel closes', async () => {
    const store = await start()
    const wrapper = mount(ChargingPanel, { global: { provide: { showToast: vi.fn() } } })
    await vi.advanceTimersByTimeAsync(1000)
    wrapper.unmount()
    await vi.advanceTimersByTimeAsync(2000)
    expect(store.isCharging).toBe(true)
    expect(store.chargingData.energy).toBeCloseTo((60 * 3) / 3600)
  })
})
