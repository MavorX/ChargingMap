/**
 * Display formatting helpers.
 *
 * Every value the UI renders goes through one of these functions so precision,
 * units and empty-state copy stay identical across panels.
 */

import { locale } from '../i18n'

const EMPTY = '—'

function toFiniteNumber(value) {
  if (value == null) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

// zh-CN keeps the decimal separator the app already used; grouping is disabled
// so values above 999 render exactly like the previous `toFixed` output.
const priceFormatter = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: false
})

const distanceFormatter = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  useGrouping: false
})

const powerFormatter = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  useGrouping: false
})

// `toFixed` rounds the binary double exactly like the pre-refactor templates.
// Intl then renders the already-rounded value with the zh-CN locale.
const toFixedNumber = (value, digits) => Number(value.toFixed(digits))

/**
 * @param {number | null | undefined} meters
 * @param {{ withUnit?: boolean }} [options]
 * @returns {string} `x.x km` or `—`
 */
export function formatDistance(meters, { withUnit = true } = {}) {
  const number = toFiniteNumber(meters)
  if (number === null) return EMPTY

  const text = distanceFormatter.format(toFixedNumber(number / 1000, 1))
  return withUnit ? `${text} km` : text
}

/**
 * @param {number | null | undefined} value
 * @param {{ withSymbol?: boolean }} [options]
 * @returns {string} `¥x.xx` (or `x.xx`) or `—`
 */
export function formatPrice(value, { withSymbol = true } = {}) {
  const number = toFiniteNumber(value)
  if (number === null) return EMPTY

  const text = priceFormatter.format(toFixedNumber(number, 2))
  return withSymbol ? `¥${text}` : text
}

/**
 * @param {number} seconds
 * @param {'hm' | 'hm-verbose' | 'hms'} [mode]
 *   - `hm`: `X小时Y分钟` / `Y分钟`; a whole hour is `X小时` (navigation bar)
 *   - `hm-verbose`: `X小时Y分钟` even when minutes are zero (payment panels)
 *   - `hms`: `HH:MM:SS` (live charging clock)
 * @returns {string}
 */
export function formatDuration(seconds, mode = 'hm', language = locale.value) {
  const english = language === 'en-US'
  const total = toFiniteNumber(seconds)
  if (total === null || total < 0) return mode === 'hms' ? '00:00:00' : english ? '0 min' : '0分钟'

  const whole = Math.floor(total)

  if (mode === 'hms') {
    const h = Math.floor(whole / 3600)
      .toString()
      .padStart(2, '0')
    const m = Math.floor((whole % 3600) / 60)
      .toString()
      .padStart(2, '0')
    const s = (whole % 60).toString().padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  const hours = Math.floor(whole / 3600)
  const minutes = Math.floor((whole % 3600) / 60)

  if (english) {
    if (hours > 0)
      return `${hours} hr${mode === 'hm-verbose' || minutes > 0 ? ` ${minutes} min` : ''}`
    return `${minutes} min`
  }

  if (hours > 0) {
    if (mode === 'hm-verbose' || minutes > 0) return `${hours}小时${minutes}分钟`
    return `${hours}小时`
  }

  return `${minutes}分钟`
}

/**
 * @param {number | null | undefined} kw
 * @returns {string} `x.x kW` or `—`
 */
export function formatPower(kw) {
  const number = toFiniteNumber(kw)
  if (number === null) return EMPTY
  return `${powerFormatter.format(toFixedNumber(number, 1))} kW`
}
