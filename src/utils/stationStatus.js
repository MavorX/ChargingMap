/**
 * Status copy + badge classes for stations, connectors and price periods.
 *
 * The strings and Tailwind classes below are the single source of truth for
 * what the list and detail views render.
 */

const MUTED_BADGE = 'bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400'
const MUTED_BG = 'bg-surface-200 dark:bg-surface-700'
const MUTED_ICON = 'text-surface-400'

/**
 * @param {object | null | undefined} station
 * @returns {{ text: string, tone: string }}
 */
export function stationStatus(station) {
  if (!station) return { text: '—', tone: MUTED_BADGE }

  if (station.openStatus === 0) {
    return { text: '维护中', tone: MUTED_BADGE }
  }

  if (station.quickAvailableNum > 0 || station.slowAvailableNum > 0) {
    return { text: '有可用', tone: 'status-badge-success' }
  }

  return { text: '已满', tone: 'status-badge-danger' }
}

/**
 * Backwards-compatible aliases for the class/text helpers the templates used.
 * Kept as thin wrappers so there is still exactly one status implementation.
 */
export const getStationStatusClass = (station) => stationStatus(station).tone
export const getStationStatusText = (station) => stationStatus(station).text

/**
 * @param {number} status 1 = available, 3 = in use, anything else = maintenance
 * @returns {{ text: string, badgeClass: string, bgClass: string, iconClass: string }}
 */
export function connectorStatus(status) {
  switch (status) {
    case 1:
      return {
        text: '可用',
        badgeClass: 'status-badge-success',
        bgClass: 'bg-secondary-100 dark:bg-secondary-900/30',
        iconClass: 'text-secondary-500'
      }
    case 3:
      return {
        text: '使用中',
        badgeClass: 'status-badge-danger',
        bgClass: 'bg-danger-100 dark:bg-danger-900/30',
        iconClass: 'text-danger-500'
      }
    default:
      return {
        text: '维护中',
        badgeClass: MUTED_BADGE,
        bgClass: MUTED_BG,
        iconClass: MUTED_ICON
      }
  }
}

const PERIOD_DOT_COLORS = [
  'bg-primary-400',
  'bg-warning-400',
  'bg-danger-400',
  'bg-orange-400',
  'bg-accent-400'
]

/**
 * @param {number} index
 * @returns {string}
 */
export function periodDotClass(index) {
  return PERIOD_DOT_COLORS[index % PERIOD_DOT_COLORS.length]
}
