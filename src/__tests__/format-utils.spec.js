import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { formatDistance, formatPrice, formatDuration, formatPower } from '../utils/format'
import { connectorStatus, periodDotClass, stationStatus } from '../utils/stationStatus'
import { useAvailableConnectors } from '../composables/useAvailableConnectors'

describe('formatDistance', () => {
  it('renders metres as one-decimal kilometres', () => {
    expect(formatDistance(1234)).toBe('1.2 km')
    expect(formatDistance(0)).toBe('0.0 km')
    expect(formatDistance(999)).toBe('1.0 km')
  })

  it('supports unit-less output for detail markup that owns the unit span', () => {
    expect(formatDistance(1234, { withUnit: false })).toBe('1.2')
  })

  it('returns an em dash for null, undefined, NaN and non-finite input', () => {
    expect(formatDistance(null)).toBe('—')
    expect(formatDistance(undefined)).toBe('—')
    expect(formatDistance(Number.NaN)).toBe('—')
    expect(formatDistance(Number.POSITIVE_INFINITY)).toBe('—')
  })
})

describe('formatPrice', () => {
  it('keeps two decimals and the RMB symbol', () => {
    expect(formatPrice(1.23)).toBe('¥1.23')
    expect(formatPrice(12)).toBe('¥12.00')
    expect(formatPrice(12.345)).toBe('¥12.35')
  })

  it('can omit the symbol when the template already renders ¥', () => {
    expect(formatPrice(1.23, { withSymbol: false })).toBe('1.23')
  })

  it('returns an em dash for missing or invalid values', () => {
    expect(formatPrice(null)).toBe('—')
    expect(formatPrice(undefined)).toBe('—')
    expect(formatPrice(Number.NaN)).toBe('—')
  })
})

describe('formatDuration', () => {
  it('matches the legacy payment wording (verbose hours)', () => {
    expect(formatDuration(3660, 'hm-verbose')).toBe('1小时1分钟')
    expect(formatDuration(3600, 'hm-verbose')).toBe('1小时0分钟')
    expect(formatDuration(59, 'hm-verbose')).toBe('0分钟')
  })

  it('matches the navigation wording (whole hours collapse)', () => {
    expect(formatDuration(3660, 'hm')).toBe('1小时1分钟')
    expect(formatDuration(3600, 'hm')).toBe('1小时')
    expect(formatDuration(5400, 'hm')).toBe('1小时30分钟')
    expect(formatDuration(2700, 'hm')).toBe('45分钟')
    expect(formatDuration(0, 'hm')).toBe('0分钟')
  })

  it('renders a fixed-width clock for the live charging panel', () => {
    expect(formatDuration(3661, 'hms')).toBe('01:01:01')
    expect(formatDuration(0, 'hms')).toBe('00:00:00')
    expect(formatDuration(59, 'hms')).toBe('00:00:59')
  })

  it('is defensive about missing seconds', () => {
    expect(formatDuration(null, 'hm')).toBe('0分钟')
    expect(formatDuration(undefined, 'hms')).toBe('00:00:00')
    expect(formatDuration(Number.NaN, 'hm-verbose')).toBe('0分钟')
  })
})

describe('formatPower', () => {
  it('keeps one decimal and the kW unit', () => {
    expect(formatPower(60)).toBe('60.0 kW')
    expect(formatPower(7.25)).toBe('7.3 kW')
  })

  it('returns an em dash for missing input', () => {
    expect(formatPower(null)).toBe('—')
    expect(formatPower(undefined)).toBe('—')
  })
})

describe('stationStatus', () => {
  it('maps maintenance, available and full states to the legacy copy', () => {
    expect(stationStatus({ openStatus: 0 })).toEqual({
      text: '维护中',
      tone: 'bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400'
    })
    expect(stationStatus({ openStatus: 1, quickAvailableNum: 1, slowAvailableNum: 0 })).toEqual({
      text: '有可用',
      tone: 'status-badge-success'
    })
    expect(stationStatus({ openStatus: 1, quickAvailableNum: 0, slowAvailableNum: 0 })).toEqual({
      text: '已满',
      tone: 'status-badge-danger'
    })
  })

  it('handles a missing station', () => {
    expect(stationStatus(null).text).toBe('—')
  })
})

describe('connectorStatus', () => {
  it('maps connector codes to copy and classes', () => {
    expect(connectorStatus(1)).toEqual({
      text: '可用',
      badgeClass: 'status-badge-success',
      bgClass: 'bg-secondary-100 dark:bg-secondary-900/30',
      iconClass: 'text-secondary-500'
    })
    expect(connectorStatus(3).text).toBe('使用中')
    expect(connectorStatus(3).badgeClass).toBe('status-badge-danger')
    expect(connectorStatus(255).text).toBe('维护中')
    expect(connectorStatus(255).bgClass).toBe('bg-surface-200 dark:bg-surface-700')
  })
})

describe('periodDotClass', () => {
  it('cycles through the five period colours', () => {
    expect(periodDotClass(0)).toBe('bg-primary-400')
    expect(periodDotClass(4)).toBe('bg-accent-400')
    expect(periodDotClass(5)).toBe('bg-primary-400')
  })
})

describe('useAvailableConnectors', () => {
  it('returns available fast connectors before available slow ones', () => {
    const station = ref({
      details: {
        fastConnectors: [
          { id: 'f1', status: 1 },
          { id: 'f2', status: 3 }
        ],
        slowConnectors: [
          { id: 's1', status: 1 },
          { id: 's2', status: 0 }
        ]
      }
    })

    expect(useAvailableConnectors(station).value.map((connector) => connector.id)).toEqual([
      'f1',
      's1'
    ])
  })

  it('is empty when the station has no details yet', () => {
    expect(useAvailableConnectors(ref(null)).value).toEqual([])
  })
})
