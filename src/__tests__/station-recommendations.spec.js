import { describe, expect, it } from 'vitest'
import {
  analyzeStation,
  energyGoalError,
  isStationOpenNow,
  rankStations
} from '../utils/stationRecommendations'
import { chargingDurationSeconds } from '../utils/chargingModel'
import { calculatePaymentAmounts } from '../store/modules/charging'
import {
  advisorDetails,
  advisorGoal,
  advisorStation,
  advisorVehicle
} from './helpers/recommendations'

const options = { now: new Date('2026-10-28T12:00:00'), hasLocation: true }

describe('explainable vehicle-aware station selection', () => {
  it('limits power by the actual compatible gun, not the station maximum', () => {
    const station = advisorStation('HF000001', {
      maxPower: 360,
      details: {
        ...advisorDetails(7),
        slowConnectors: [{ id: 'other', power: 360, connectorType: 'CCS Combo', status: 1 }]
      }
    })
    const entry = analyzeStation(station, advisorVehicle, advisorGoal, options)
    expect(entry.model.powerKw).toBe(7)
    expect(entry.compatibleAvailable).toBe(1)
    expect(entry.durationSeconds).toBe(chargingDurationSeconds(entry.model))
    expect(entry.totalAmount).toBe(calculatePaymentAmounts({ energy: 33, price: 1 }).totalAmount)
  })

  it.each([
    ['maintenance', { openStatus: 0 }],
    ['closed hours', { openTime: '07:00-10:00' }],
    ['missing details', { detailsLoaded: false }],
    ['unknown price', { details: { ...advisorDetails(), periodPrices: [] } }],
    [
      'occupied gun',
      {
        details: {
          ...advisorDetails(),
          fastConnectors: [{ ...advisorDetails().fastConnectors[0], status: 3 }]
        }
      }
    ],
    [
      'incompatible gun',
      {
        details: {
          ...advisorDetails(),
          fastConnectors: [{ ...advisorDetails().fastConnectors[0], connectorType: 'CCS Combo' }]
        }
      }
    ],
    ['invalid gun power', { details: advisorDetails(0) }]
  ])('excludes %s instead of inventing a usable connector', (_name, patch) => {
    expect(
      analyzeStation(advisorStation('HF000001', patch), advisorVehicle, advisorGoal, options)
    ).toBe(null)
  })

  it('honors cheapest, fastest and nearest preferences with stable tie-breaks', () => {
    const stations = [
      advisorStation('HF000001', { details: advisorDetails(30, 0.7), distance: 2000 }),
      advisorStation('HF000002', { details: advisorDetails(180, 1.5), distance: 1000 }),
      advisorStation('HF000003', { details: advisorDetails(60, 1.2), distance: 200 })
    ]
    for (const [preference, id] of [
      ['cheapest', 'HF000001'],
      ['fastest', 'HF000002'],
      ['nearest', 'HF000003']
    ]) {
      expect(
        rankStations(stations, advisorVehicle, { ...advisorGoal, preference }, options)[0].station
          .stationId
      ).toBe(id)
    }
    expect(
      rankStations(stations.toReversed(), advisorVehicle, advisorGoal, options).map(
        (entry) => entry.station.stationId
      )
    ).toEqual(
      rankStations(stations, advisorVehicle, advisorGoal, options).map(
        (entry) => entry.station.stationId
      )
    )
  })

  it('does not reward nominal power beyond the vehicle capability', () => {
    const entries = rankStations(
      [
        advisorStation('HF000001', { details: advisorDetails(120) }),
        advisorStation('HF000002', { details: advisorDetails(360) })
      ],
      advisorVehicle,
      { ...advisorGoal, preference: 'fastest' },
      options
    )
    expect(entries[0].durationSeconds).toBe(entries[1].durationSeconds)
    expect(entries[0].model.powerKw).toBe(90)
  })

  it('ignores all distances without a device location, even if the data contains a number', () => {
    const stations = [advisorStation(), advisorStation('HF000002', { distance: 1 })]
    const entries = rankStations(stations, advisorVehicle, advisorGoal, {
      ...options,
      hasLocation: false
    })
    expect(entries.every((entry) => entry.distance === null && !entry.isNearest)).toBe(true)
    expect(
      rankStations(
        stations,
        advisorVehicle,
        { ...advisorGoal, preference: 'nearest' },
        { ...options, hasLocation: false }
      )
    ).toEqual([])
  })

  it('uses local opening hours, including cross-midnight and end-exclusive boundaries', () => {
    const station = advisorStation('HF000001', { openTime: '22:00-02:00' })
    expect(isStationOpenNow(station, new Date('2026-10-28T23:00:00'))).toBe(true)
    expect(isStationOpenNow(station, new Date('2026-10-28T01:59:00'))).toBe(true)
    expect(isStationOpenNow(station, new Date('2026-10-28T02:00:00'))).toBe(false)
  })

  it('recalculates for SOC, vehicle capability and the current tariff', () => {
    const station = advisorStation('HF000001', {
      details: {
        ...advisorDetails(),
        periodPrices: [
          { startTime: '00:00', endTime: '12:00', totalFee: 1 },
          { startTime: '12:00', endTime: '24:00', totalFee: 2 }
        ]
      }
    })
    const before = analyzeStation(station, advisorVehicle, advisorGoal, {
      ...options,
      now: new Date('2026-10-28T11:59:00')
    })
    const after = analyzeStation(station, advisorVehicle, advisorGoal, options)
    expect(after.totalAmount).toBeCloseTo(before.totalAmount * 2)
    const high = analyzeStation(
      station,
      advisorVehicle,
      { ...advisorGoal, initialBattery: 80, targetBattery: 100 },
      options
    )
    expect(high.durationSeconds).toBeGreaterThan((12 / 90) * 3600)
    expect(after.station.currentPrice).toBe(1)
  })

  it.each([
    { initialBattery: '' },
    { initialBattery: -1 },
    { targetBattery: 10 },
    { targetBattery: 101 }
  ])('rejects invalid goal %j', (patch) => {
    expect(energyGoalError(advisorVehicle, { ...advisorGoal, ...patch }, true)).not.toBe('')
    expect(
      rankStations([advisorStation()], advisorVehicle, { ...advisorGoal, ...patch }, options)
    ).toEqual([])
  })

  it('does not invent a missing vehicle or capacity', () => {
    expect(rankStations([advisorStation()], null, advisorGoal, options)).toEqual([])
    expect(
      rankStations(
        [advisorStation()],
        { ...advisorVehicle, batteryCapacityKwh: null },
        advisorGoal,
        options
      )
    ).toEqual([])
  })

  it('prioritizes proximity in balanced ranking when SOC is low, without claiming reachability', () => {
    const stations = [
      advisorStation('HF000001', { details: advisorDetails(60, 1.2), distance: 100 }),
      advisorStation('HF000002', { details: advisorDetails(120, 0.5), distance: 10000 })
    ]
    expect(rankStations(stations, advisorVehicle, advisorGoal, options)[0].station.stationId).toBe(
      'HF000002'
    )
    expect(
      rankStations(stations, advisorVehicle, { ...advisorGoal, initialBattery: 10 }, options)[0]
        .station.stationId
    ).toBe('HF000001')
    expect(
      rankStations(
        stations,
        advisorVehicle,
        { ...advisorGoal, initialBattery: 10 },
        { ...options, hasLocation: false }
      )[0].station.stationId
    ).toBe('HF000002')
  })
})
