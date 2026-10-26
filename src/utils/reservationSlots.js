export const reservationDateValue = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const SLOTS = [
  ['08:00-10:00', true],
  ['10:00-12:00', true],
  ['12:00-14:00', false],
  ['14:00-16:00', true],
  ['16:00-18:00', true],
  ['18:00-20:00', false]
]

export const reservationSlotsFor = (date, now = new Date()) =>
  SLOTS.map(([value, hasCapacity]) => {
    const start = new Date(`${date}T${value.slice(0, 5)}:00`)
    const expired = !Number.isFinite(start.getTime()) || start <= now
    return {
      value,
      available: hasCapacity && !expired,
      reason: expired ? '已过时段' : hasCapacity ? '可预约' : '已满'
    }
  })
