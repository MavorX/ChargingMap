import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { loadStationsList, loadStationDetail } from '../services/api'
import { useStationsStore } from '../store/modules/stations'

vi.mock('../services/api', () => ({
  loadStationsList: vi.fn(),
  loadStationDetail: vi.fn()
}))

const station = {
  stationId: 'HF000001',
  stationName: '测试站',
  address: '合肥市',
  lat: 31.8206,
  lng: 117.2272,
  distance: 0
}

describe('stations store load errors', () => {
  let toastEvents = []
  const onToast = (event) => toastEvents.push(event.detail)

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    toastEvents = []
    window.addEventListener('appToast', onToast)
  })

  afterEach(() => {
    window.removeEventListener('appToast', onToast)
    vi.restoreAllMocks()
  })

  it('records a retryable error instead of throwing when the list request rejects', async () => {
    loadStationsList.mockRejectedValue(new Error('network down'))
    const store = useStationsStore()

    await expect(store.loadStations()).resolves.toBeUndefined()

    expect(store.error).toBe('站点数据加载失败')
    expect(store.stations).toEqual([])
    expect(store.isLoading).toBe(false)
    expect(toastEvents).toContainEqual({ message: '站点数据加载失败', type: 'error' })
  })

  it('clears the error and fills stations when retrying succeeds', async () => {
    loadStationsList.mockRejectedValueOnce(new Error('network down'))
    const store = useStationsStore()
    await store.loadStations()
    expect(store.error).toBe('站点数据加载失败')

    loadStationsList.mockResolvedValueOnce([station])
    await store.loadStations()

    expect(store.error).toBeNull()
    expect(store.stations).toHaveLength(1)
    expect(store.stations[0].stationId).toBe('HF000001')
  })

  it('records a detail error and clears it when the retry succeeds', async () => {
    loadStationsList.mockResolvedValue([station])
    loadStationDetail.mockRejectedValueOnce(new Error('shard missing'))
    const store = useStationsStore()
    await store.loadStations()

    const detail = await store.loadStationDetails('HF000001')

    expect(detail).toBeNull()
    expect(store.detailsError).toBe('站点详情加载失败')
    expect(toastEvents).toContainEqual({ message: '站点详情加载失败', type: 'error' })

    loadStationDetail.mockResolvedValueOnce({ stationId: 'HF000001', periodPrices: [] })
    const retried = await store.loadStationDetails('HF000001')

    expect(retried.stationId).toBe('HF000001')
    expect(store.detailsError).toBeNull()
    expect(store.stations[0].detailsLoaded).toBe(true)
    expect(store.stations[0].details).toEqual({ stationId: 'HF000001', periodPrices: [] })
  })
})
