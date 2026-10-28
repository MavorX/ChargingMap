import { describe, expect, it } from 'vitest'
import {
  chargingCurve,
  chargingDurationSeconds,
  meterAt,
  powerAtBattery,
  POWER_CURVE_VERSION
} from '../utils/chargingModel'

const model = (patch = {}) => ({
  powerKw: 120,
  batteryCapacityKwh: 80,
  initialBattery: 25,
  targetBattery: 100,
  targetEnergy: 60,
  clockScale: 1,
  powerCurve: POWER_CURVE_VERSION,
  ...patch
})

describe('shared SOC taper model', () => {
  it('keeps steady power below 60% and tapers continuously at higher SOC', () => {
    const value = model()
    expect(powerAtBattery(value, 25)).toBe(120)
    expect(powerAtBattery(value, 60)).toBe(120)
    expect(powerAtBattery(value, 80)).toBeCloseTo(78)
    expect(powerAtBattery(value, 90)).toBeCloseTo(48)
    expect(powerAtBattery(value, 100)).toBeCloseTo(21.6)
    expect(chargingDurationSeconds(value)).toBeGreaterThan(1800)
  })

  it.each([0, 35, 60, 79, 85, 95])(
    'inverts the integrated time for an initial SOC of %s%%',
    (initialBattery) => {
      const value = model({ initialBattery })
      for (const battery of [initialBattery + 0.1, (initialBattery + 100) / 2, 99.99]) {
        const seconds = chargingDurationSeconds(value, initialBattery, battery)
        const data = meterAt(value, seconds)
        expect(data.battery).toBeCloseTo(battery, 8)
        expect(data.energy).toBeCloseTo(((battery - initialBattery) / 100) * 80, 8)
        expect(data.speed).toBeCloseTo(powerAtBattery(value, battery), 8)
      }
    }
  )

  it('integrates the visible forecast to the same energy as the meter', () => {
    const value = model()
    const samples = chargingCurve(value, 2000)
    const energy = samples
      .slice(1)
      .reduce(
        (sum, sample, index) =>
          sum +
          (((sample.power + samples[index].power) / 2) *
            (sample.seconds - samples[index].seconds)) /
            3600,
        0
      )
    expect(energy).toBeCloseTo(60, 4)
    expect(samples.at(-1).seconds).toBe(chargingDurationSeconds(value))
  })

  it('uses the same model at 1× and 60× without depending on tick frequency', () => {
    expect(meterAt(model({ clockScale: 60 }), 20)).toEqual({
      ...meterAt(model(), 1200),
      elapsedRealSeconds: 20
    })
    expect(meterAt(model(), 1200)).toEqual(meterAt(model(), 1200))
  })

  it('caps SOC, output time and energy while a stop acknowledgement is delayed', () => {
    const value = model({ initialBattery: 79, targetBattery: 80 })
    const data = meterAt(value, 36000)
    expect(data).toMatchObject({ battery: 80, speed: 0, elapsedRealSeconds: 36000 })
    expect(data.energy).toBeCloseTo(0.8)
    expect(data.duration).toBeCloseTo(chargingDurationSeconds(value))
    expect(meterAt(value, -5)).toMatchObject({ duration: 0, energy: 0, battery: 79 })
  })

  it('does not retroactively change the model of legacy saved sessions', () => {
    const value = model({ powerCurve: undefined, initialBattery: 80, targetBattery: 100 })
    expect(chargingDurationSeconds(value)).toBeCloseTo(480)
    expect(meterAt(value, 240)).toMatchObject({ battery: 90, energy: 8, speed: 120 })
    expect(chargingCurve(null)).toEqual([])
    expect(chargingDurationSeconds(null)).toBe(0)
  })
})
