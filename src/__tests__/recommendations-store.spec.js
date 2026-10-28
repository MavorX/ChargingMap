import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { loadStationDetail } from '../services/api'
import { useRecommendationsStore } from '../store/modules/recommendations'
import { useStationsStore } from '../store/modules/stations'
import { useUserStore } from '../store/modules/user'
import {
  advisorDetails,
  advisorGoal,
  advisorStation,
  advisorVehicle
} from './helpers/recommendations'

vi.mock('../services/api', async (original) => ({
  ...(await original()),
  loadStationDetail: vi.fn()
}))

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  useUserStore().vehicles = [{ ...advisorVehicle }]
  useRecommendationsStore().goal = { ...advisorGoal }
  loadStationDetail.mockReset().mockImplementation(async () => advisorDetails())
})
afterEach(() => vi.restoreAllMocks())

describe('shared analysis, scope and comparison state', () => {
  it('does not eagerly fetch details and keeps nonrecommended stations in the list', async () => {
    const stations = useStationsStore()
    stations.stations = [advisorStation(), advisorStation('HF000002', { openStatus: 0 })]
    const advisor = useRecommendationsStore()
    expect(advisor.ranked).toEqual([])
    expect(loadStationDetail).not.toHaveBeenCalled()
    await advisor.analyze()
    expect(advisor.ranked).toHaveLength(1)
    expect(advisor.orderedStations).toHaveLength(2)
    expect(advisor.checkedCount).toBe(2)
  })

  it('never lets analysis select a station or overwrite detail error feedback', async () => {
    const stations = useStationsStore()
    const selected = advisorStation('HF000003')
    stations.currentStation = selected
    stations.detailsError = '站点详情加载失败'
    stations.stations = [advisorStation('HF000001', { detailsLoaded: false, details: null })]
    await useRecommendationsStore().analyze()
    expect(stations.currentStation).toEqual(selected)
    expect(stations.detailsError).toBe('站点详情加载失败')
    expect(useRecommendationsStore().ranked).toHaveLength(1)
  })

  it('counts a failed shard once, excludes unchecked stations and allows retry', async () => {
    useStationsStore().stations = [
      advisorStation('HF000001', { detailsLoaded: false, details: null }),
      advisorStation('HF000002', { detailsLoaded: false, details: null })
    ]
    loadStationDetail.mockRejectedValueOnce(new Error('offline'))
    const advisor = useRecommendationsStore()
    await advisor.analyze()
    expect(loadStationDetail).toHaveBeenCalledTimes(1)
    expect(advisor.failedCount).toBe(2)
    expect(advisor.status).toBe('error')
    expect(advisor.highlights).toEqual([])
    await advisor.analyze()
    expect(advisor.status).toBe('ready')
    expect(advisor.failedCount).toBe(0)
    expect(advisor.ranked).toHaveLength(2)
  })

  it('reports partial failure without labeling unchecked stations as suitable', async () => {
    useStationsStore().stations = [
      advisorStation(),
      advisorStation('SH000001', { detailsLoaded: false, details: null })
    ]
    loadStationDetail.mockRejectedValue(new Error('offline'))
    const advisor = useRecommendationsStore()
    await advisor.analyze()
    expect(advisor.status).toBe('ready')
    expect(advisor.checkedCount).toBe(1)
    expect(advisor.failedCount).toBe(1)
    expect(advisor.ranked).toHaveLength(1)
  })

  it('does not publish stale results when the map or search changes during a request', async () => {
    let resolve
    loadStationDetail.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    useStationsStore().stations = [
      advisorStation('HF000001', { detailsLoaded: false, details: null })
    ]
    const advisor = useRecommendationsStore()
    const pending = advisor.analyze()
    useStationsStore().setSearchQuery('no-match')
    resolve(advisorDetails())
    await pending
    expect(advisor.isCurrent).toBe(false)
    expect(advisor.ranked).toEqual([])
    expect(advisor.highlights).toEqual([])
    useStationsStore().setSearchQuery('')
    expect(advisor.isCurrent).toBe(true)
  })

  it('limits concurrent shard workers to four', async () => {
    let active = 0
    let peak = 0
    useStationsStore().stations = [
      'HF000001',
      'HF000101',
      'HF000201',
      'SH000001',
      'SH000101',
      'SH000201'
    ].map((id) => advisorStation(id, { detailsLoaded: false, details: null }))
    loadStationDetail.mockImplementation(async () => {
      active++
      peak = Math.max(peak, active)
      await Promise.resolve()
      await Promise.resolve()
      active--
      return advisorDetails()
    })
    await useRecommendationsStore().analyze()
    expect(peak).toBe(4)
    expect(useRecommendationsStore().checkedCount).toBe(6)
  })

  it('re-ranks immediately for goals and occupied guns; comparison never exceeds two', async () => {
    const stations = useStationsStore()
    stations.stations = [
      advisorStation(),
      advisorStation('HF000002', { details: advisorDetails(30, 0.5) }),
      advisorStation('HF000003', { details: advisorDetails(60, 1.2) })
    ]
    const advisor = useRecommendationsStore()
    await advisor.analyze()
    advisor.updateGoal({ preference: 'cheapest' })
    expect(advisor.ranked[0].station.stationId).toBe('HF000002')
    for (const station of stations.stations) advisor.toggleComparison(station.stationId)
    expect(advisor.comparison).toHaveLength(2)
    expect(advisor.highlights.map((entry) => entry.label)).toContain('对比 A')
    const setup = advisor.setupForStation('HF000002')
    expect(setup).toMatchObject({
      vehicleId: 'ev',
      initialBattery: 25,
      targetBattery: 80,
      connectorId: ''
    })
    stations.stations[0].details.fastConnectors[0].status = 3
    expect(advisor.entryById.HF000001).toBeUndefined()
    expect(advisor.comparison).toHaveLength(1)
    expect(advisor.setupForStation('HF000001')).toBe(null)
    expect(loadStationDetail).not.toHaveBeenCalled()
  })

  it('saves only valid goals and refuses to substitute a removed vehicle', async () => {
    const advisor = useRecommendationsStore()
    advisor.updateGoal({ initialBattery: 30 })
    advisor.updateGoal({ targetBattery: 20 })
    advisor.loadGoal()
    expect(advisor.goal).toMatchObject({ initialBattery: 30, targetBattery: 80 })
    useUserStore().vehicles = [{ ...advisorVehicle, id: 'different' }]
    expect(advisor.vehicle).toBeUndefined()
    expect(advisor.validationError).not.toBe('')
    await advisor.analyze()
    expect(loadStationDetail).not.toHaveBeenCalled()
  })

  it('ignores corrupted storage and works with storage blocked', () => {
    const advisor = useRecommendationsStore()
    localStorage.setItem('chargingEnergyGoal', '{broken')
    expect(() => advisor.loadGoal()).not.toThrow()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => advisor.updateGoal({ initialBattery: 45 })).not.toThrow()
    expect(advisor.goal.initialBattery).toBe(45)
  })
})
