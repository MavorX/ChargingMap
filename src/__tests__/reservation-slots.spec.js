import { describe, expect, it } from 'vitest'
import { reservationSlotsFor } from '../utils/reservationSlots'

describe('reservation time boundaries', () => {
  it('does not offer a slot that has already started, even if it has capacity', () => {
    const slots = reservationSlotsFor('2026-10-26', new Date('2026-10-26T10:30:00'))
    expect(slots.find((slot) => slot.value === '10:00-12:00')).toMatchObject({
      available: false,
      reason: '已过时段'
    })
    expect(slots.find((slot) => slot.value === '14:00-16:00').available).toBe(true)
  })
  it('keeps full slots unavailable on future days', () => {
    const slots = reservationSlotsFor('2026-10-27', new Date('2026-10-26T23:30:00'))
    expect(slots[0].available).toBe(true)
    expect(slots.find((slot) => slot.value === '12:00-14:00')).toMatchObject({
      available: false,
      reason: '已满'
    })
  })
  it('treats invalid or past dates as unavailable', () => {
    expect(reservationSlotsFor('bad-date').every((slot) => !slot.available)).toBe(true)
    expect(reservationSlotsFor('2020-01-01').every((slot) => !slot.available)).toBe(true)
  })
})
