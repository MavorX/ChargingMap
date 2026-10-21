/**
 * Local-time pricing helpers.
 *
 * The station detail payload still carries generation-time `currentFlag` /
 * `nextFlag` fields. They are intentionally ignored here: the flags were frozen
 * when the dataset was generated, so they cannot answer "what is the price now"
 * for a user opening the app at any other time of day.
 */

function parseTimeToMinutes(value) {
  if (typeof value !== 'string') return null

  const parts = value.split(':')
  if (parts.length !== 2) return null

  const hour = Number(parts[0])
  const minute = Number(parts[1])

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null
  if (hour < 0 || hour > 24 || minute < 0 || minute > 59) return null

  return hour * 60 + minute
}

function matchesPeriod(minutes, start, end) {
  // "HH:MM" to "HH:MM" with equal endpoints has no interval to match.
  if (start === end) return false

  // Regular interval, including 23:00-24:00 where end === 1440.
  if (start < end) return minutes >= start && minutes < end

  // Cross-midnight interval, e.g. 22:00-02:00.
  return minutes >= start || minutes < end
}

/**
 * Return the period covering `date` and the chronologically following period.
 * Periods outside the current day (e.g. 22:00-02:00) are matched against the
 * local clock in minutes; `next` wraps around to the first period after the
 * final slot so callers always get a usable upcoming price.
 *
 * @param {Array<{startTime: string, endTime: string}>} periodPrices
 * @param {Date} [date]
 * @returns {{ current: object, next: object } | null}
 */
export function getCurrentPeriod(periodPrices, date = new Date()) {
  if (!Array.isArray(periodPrices) || periodPrices.length === 0) return null
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null

  const minutes = date.getHours() * 60 + date.getMinutes()

  const normalized = periodPrices
    .map((period) => ({
      period,
      start: parseTimeToMinutes(period?.startTime),
      end: parseTimeToMinutes(period?.endTime)
    }))
    .filter((entry) => entry.start !== null && entry.end !== null)

  if (normalized.length === 0) return null

  const index = normalized.findIndex((entry) => matchesPeriod(minutes, entry.start, entry.end))
  if (index === -1) return null

  const current = normalized[index].period
  const next = normalized[(index + 1) % normalized.length].period

  return { current, next }
}

/**
 * Current price per kWh for a station.
 *
 * - Detail shard with a non-empty `periodPrices` → the current period's
 *   `totalFee` (null when no period covers "now", or when the fee is invalid).
 * - No detail shard yet → `station.totalCostPrice`.
 * - Neither available → null.
 *
 * An explicitly empty `periodPrices` array is treated as "unknown", not as a
 * reason to fall back to the list-level average price.
 *
 * @param {object | null | undefined} station
 * @param {Date} [date]
 * @returns {number | null}
 */
export function currentPriceFor(station, date = new Date()) {
  if (!station) return null

  const periodPrices = station.details?.periodPrices

  if (Array.isArray(periodPrices)) {
    if (periodPrices.length === 0) return null

    const result = getCurrentPeriod(periodPrices, date)
    if (!result) return null

    const fee = Number.parseFloat(result.current.totalFee)
    return Number.isFinite(fee) ? fee : null
  }

  const fallback = Number.parseFloat(station.totalCostPrice)
  return Number.isFinite(fallback) ? fallback : null
}

export { parseTimeToMinutes }
