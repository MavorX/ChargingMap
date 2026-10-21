import { describe, it, expect } from 'vitest'
import { getCurrentPeriod, currentPriceFor } from '../utils/pricing'

const periodPrices = [
  { startTime: '00:00', endTime: '06:00', totalFee: '0.48' },
  { startTime: '06:00', endTime: '08:00', totalFee: '0.67' },
  { startTime: '08:00', endTime: '11:00', totalFee: '1.05' },
  { startTime: '11:00', endTime: '14:00', totalFee: '1.25' },
  { startTime: '14:00', endTime: '18:00', totalFee: '1.26' },
  { startTime: '18:00', endTime: '21:00', totalFee: '0.81' },
  { startTime: '21:00', endTime: '23:00', totalFee: '1.05' },
  { startTime: '23:00', endTime: '24:00', totalFee: '0.97' }
]

const at = (hour, minute) => new Date(2026, 0, 15, hour, minute)

describe('getCurrentPeriod', () => {
  it('returns 00:00-06:00 at 00:05 with the following slot as next', () => {
    const result = getCurrentPeriod(periodPrices, at(0, 5))

    expect(result.current).toBe(periodPrices[0])
    expect(result.next).toBe(periodPrices[1])
  })

  it('returns 11:00-14:00 at 12:00', () => {
    const result = getCurrentPeriod(periodPrices, at(12, 0))

    expect(result.current).toBe(periodPrices[3])
    expect(result.next).toBe(periodPrices[4])
  })

  it('keeps 23:30 inside 23:00-24:00 and wraps next to the first slot', () => {
    const result = getCurrentPeriod(periodPrices, at(23, 30))

    expect(result.current).toBe(periodPrices[7])
    expect(result.next).toBe(periodPrices[0])
  })

  it('matches a cross-midnight window on both sides of midnight', () => {
    const overnight = [{ startTime: '22:00', endTime: '02:00', totalFee: '0.55' }]

    expect(getCurrentPeriod(overnight, at(0, 5)).current).toBe(overnight[0])
    expect(getCurrentPeriod(overnight, at(23, 30)).current).toBe(overnight[0])
    expect(getCurrentPeriod(overnight, at(12, 0))).toBeNull()
  })

  it('returns null for empty, malformed or uncovered input', () => {
    expect(getCurrentPeriod([], at(12, 0))).toBeNull()
    expect(getCurrentPeriod(null, at(12, 0))).toBeNull()
    expect(getCurrentPeriod([{ startTime: '06:00', endTime: '08:00' }], at(12, 0))).toBeNull()
    expect(getCurrentPeriod([{ startTime: 'bad', endTime: '08:00' }], at(12, 0))).toBeNull()
  })
})

describe('currentPriceFor', () => {
  it('uses the current period totalFee when detail prices exist', () => {
    const station = { totalCostPrice: 1.5, details: { periodPrices } }

    expect(currentPriceFor(station, at(23, 30))).toBe(0.97)
    expect(currentPriceFor(station, at(12, 0))).toBe(1.25)
  })

  it('falls back to totalCostPrice before detail data arrives', () => {
    expect(currentPriceFor({ totalCostPrice: 1.5 }, at(12, 0))).toBe(1.5)
  })

  it('returns null when neither detail prices nor totalCostPrice exist', () => {
    expect(currentPriceFor({}, at(12, 0))).toBeNull()
    expect(currentPriceFor(null, at(12, 0))).toBeNull()
    expect(currentPriceFor({ totalCostPrice: 'n/a' }, at(12, 0))).toBeNull()
  })

  it('returns null for an explicitly empty periodPrices array instead of a fake fallback', () => {
    const station = { totalCostPrice: 1.5, details: { periodPrices: [] } }

    expect(currentPriceFor(station, at(12, 0))).toBeNull()
  })
})
