import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { loadStationsList } from '../services/api'
import { useStationsStore } from '../store/modules/stations'

vi.mock('../services/api', () => ({
  loadStationsList: vi.fn(),
  loadStationDetail: vi.fn()
}))

const baseStation = (overrides) => ({
  stationId: 's1',
  stationName: '测试站',
  address: '合肥市',
  distance: 0,
  ...overrides
})

describe('stations store distance characterization', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  it('computes the Hefei known point pair within 1 metre of the haversine reference', async () => {
    loadStationsList.mockResolvedValue([baseStation({ lat: 31.8206, lng: 117.2272 })])
    const store = useStationsStore()
    store.userLocation = { lat: 31.9, lng: 117.3 }

    await store.loadStations()

    expect(Math.abs(store.stations[0].distance - 11190.17012569689)).toBeLessThan(1)
  })

  it('computes 0.01 degree of longitude at the equator as 1111.95 m within 1 metre', async () => {
    loadStationsList.mockResolvedValue([baseStation({ lat: 0, lng: 0.01 })])
    const store = useStationsStore()
    store.userLocation = { lat: 0, lng: 0 }

    await store.loadStations()

    expect(Math.abs(store.stations[0].distance - 1111.9492664455875)).toBeLessThan(1)
  })

  it('locks NaN distance when a station lacks lat/lng while userLocation exists', async () => {
    loadStationsList.mockResolvedValue([baseStation({ stationId: 'missing-coords' })])
    const store = useStationsStore()
    store.userLocation = { lat: 31.82, lng: 117.22 }

    await store.loadStations()

    expect(Number.isNaN(store.stations[0].distance)).toBe(true)
  })

  it('falls back to the provided distance, or 0, when userLocation is absent', async () => {
    loadStationsList.mockResolvedValue([
      baseStation({ stationId: 'with-distance', distance: 1234.5 }),
      baseStation({ stationId: 'without-distance', distance: undefined })
    ])
    const store = useStationsStore()

    await store.loadStations()

    const withDistance = store.stations.find((s) => s.stationId === 'with-distance')
    const withoutDistance = store.stations.find((s) => s.stationId === 'without-distance')
    expect(withDistance.distance).toBe(1234.5)
    expect(withoutDistance.distance).toBe(0)
  })
})
