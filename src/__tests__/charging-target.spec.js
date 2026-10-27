import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useChargingStore } from '../store/modules/charging'
import { meterAt } from '../utils/chargingModel'
import { installSandbox, start } from './helpers/charging'

const model = {
  powerKw: 240,
  batteryCapacityKwh: 80,
  initialBattery: 35,
  targetBattery: 80,
  targetEnergy: 36,
  clockScale: 60
}

describe('target-limited charging meter', () => {
  it('meters power × time before the target is reached', () => {
    expect(meterAt(model, 2)).toMatchObject({ duration: 120, energy: 8, battery: 45, speed: 240 })
  })

  it.each([9, 9.5, 30, 3600])(
    'caps energy and active time at the target after %s seconds',
    (elapsed) => {
      const reading = meterAt(model, elapsed)
      expect(reading.energy).toBeCloseTo(36)
      expect(reading.battery).toBeCloseTo(80)
      expect(reading.duration).toBeCloseTo(540)
      expect(reading.speed).toBe(0)
    }
  )

  it('does not meter negative time', () => {
    expect(meterAt(model, -10)).toMatchObject({ duration: 0, energy: 0, battery: 35 })
  })
})

describe('automatic stop after a delayed browser clock', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.useFakeTimers()
    installSandbox()
  })
  afterEach(() => {
    useChargingStore().suspendSimulator()
    vi.useRealTimers()
  })

  it('does not bill energy beyond the selected target while waiting for stop acknowledgement', async () => {
    const store = await start({ initialBattery: 79, targetBattery: 80, clockScale: 60 })
    await vi.advanceTimersByTimeAsync(1500)
    expect(store.phase).toBe('awaiting_unplug')
    expect(store.chargingData.battery).toBeCloseTo(80)
    expect(store.chargingData.energy).toBeCloseTo(0.6)
    expect(store.chargingData.cost).toBe(0.66)
    expect(store.plugConnected).toBe(true)
    expect(() => store.settlePayment()).toThrow('拔枪')
    store.disconnectPlug()
    expect(store.settlePayment().energy).toBeCloseTo(0.6)
  })
})
