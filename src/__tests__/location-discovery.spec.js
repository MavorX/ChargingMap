import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import HomeView from '../views/HomeView.vue'
import { loadStationsList, loadStationDetail } from '../services/api'
import mapManager from '../services/mapService'
import { partIdFor } from '../constants/stationData'
import { useStationsStore } from '../store/modules/stations'
import { useChargingStore } from '../store/modules/charging'
import { useUserStore } from '../store/modules/user'

vi.mock('../services/api', () => ({ loadStationsList: vi.fn(), loadStationDetail: vi.fn() }))
const dataset = JSON.parse(readFileSync('public/data/station_list.json', 'utf8'))
const detailFor = (id) =>
  JSON.parse(readFileSync(`public/data/details/${partIdFor(id)}.json`, 'utf8'))[id]
let wrapper
beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  loadStationsList.mockResolvedValue(structuredClone(dataset))
  loadStationDetail.mockImplementation(async (id) => detailFor(id))
  vi.spyOn(console, 'log').mockImplementation(() => {})
})
afterEach(() => {
  useChargingStore().suspendSimulator()
  wrapper?.unmount()
  wrapper = null
  mapManager.setMap(null)
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('location/viewport discovery, without city modes', () => {
  it('loads Shanghai 1500 + Hefei 500 into the same searchable dataset', async () => {
    const store = useStationsStore()
    await store.loadStations()
    expect(store.filteredStations).toHaveLength(2000)
    expect(store.stations.filter((s) => s.cityId === 'SH')).toHaveLength(1500)
    expect(store.stations.filter((s) => s.cityId === 'HF')).toHaveLength(500)
    expect(store.userLocation).toBe(null)
    expect(store.stations.every((s) => s.distance === null)).toBe(true)
    expect(store.$state).not.toHaveProperty('activeCityId')
    expect(store).not.toHaveProperty('browseCity')
  })

  it('uses the actual Shanghai fix for distances and nearby ordering', async () => {
    const store = useStationsStore()
    const fix = { lng: 121.4728, lat: 31.2331, accuracy: 35, quality: 'reported', source: 'h5' }
    vi.spyOn(mapManager, 'locateUser').mockResolvedValue(fix)
    await store.loadStations()
    await store.requestUserLocation()
    expect(store.userLocation).toEqual(fix)
    expect(store.filteredStations[0].stationId).toBe('SH000001')
    expect(store.filteredStations[0].distance).toBe(0)
    expect(store.filteredStations.slice(0, 20).every((s) => s.cityId === 'SH')).toBe(true)
    expect(store.stations.find((s) => s.stationId === 'HF000001').distance).toBeGreaterThan(300000)
    expect(store.locationPresentation.title).toBe('已获取设备位置')
  })

  it('also sorts correctly when the fix arrives before station data', async () => {
    const store = useStationsStore()
    vi.spyOn(mapManager, 'locateUser').mockResolvedValue({ lng: 121.4728, lat: 31.2331 })
    await store.requestUserLocation()
    await store.loadStations()
    expect(store.pagedStations[0].stationId).toBe('SH000001')
    expect(store.pagedStations[0].distance).toBe(0)
  })

  it.each([
    ['上海中心', { west: 121.45, east: 121.5, south: 31.21, north: 31.25 }, 'SH'],
    ['张江', { west: 121.58, east: 121.64, south: 31.18, north: 31.23 }, 'SH'],
    ['临港', { west: 121.87, east: 121.95, south: 30.87, north: 30.95 }, 'SH'],
    // Include western town catchments; a single quiet road need not contain a site.
    ['青浦西部', { west: 120.89, east: 121.08, south: 31.01, north: 31.14 }, 'SH'],
    ['合肥', { west: 117.0, east: 117.6, south: 31.2, north: 32.2 }, 'HF']
  ])('finds %s stations solely from viewport bounds', async (_label, bounds, prefix) => {
    const store = useStationsStore()
    await store.loadStations()
    store.setViewportBounds(bounds)
    expect(store.viewportStationCount).toBeGreaterThan(0)
    expect(store.viewportStations.every((s) => s.stationId.startsWith(prefix))).toBe(true)
    expect(store.pagedStations.length).toBeGreaterThan(0)
  })

  it('allows an empty viewport without filling every area or leaking nearby results into it', async () => {
    const store = useStationsStore()
    await store.loadStations()
    // A lake-side gap between western Qingpu's town catchments, not a city filter.
    store.setViewportBounds({ west: 120.97, east: 121.0, south: 31.15, north: 31.18 })
    expect(store.viewportStationCount).toBe(0)
    expect(store.viewportStations).toEqual([])
    expect(store.pagedStations).toEqual([])
    expect(store.filteredStations).toHaveLength(2000)
  })

  it('does not hide either region when zoomed out across both', async () => {
    const store = useStationsStore()
    await store.loadStations()
    store.setViewportBounds({ west: 116, east: 123, south: 30, north: 33 })
    expect(store.viewportStations).toHaveLength(2000)
    expect(new Set(store.viewportStations.map((s) => s.cityId))).toEqual(new Set(['HF', 'SH']))
    expect(store.hasMoreStations).toBe(true)
  })

  it('searches either region without a selected-city prerequisite', async () => {
    const store = useStationsStore()
    await store.loadStations()
    for (const [query, region] of [
      ['人民广场', 'SH'],
      ['浦东新区', 'SH'],
      ['瑶海区', 'HF']
    ]) {
      store.setSearchQuery(query)
      expect(store.filteredStations.length).toBeGreaterThan(0)
      expect(store.filteredStations.every((s) => s.cityId === region)).toBe(true)
    }
  })

  it('keeps all favorites and the real device position when opening another region', async () => {
    const store = useStationsStore()
    await store.loadStations()
    store.userLocation = { lng: 121.47, lat: 31.23, accuracy: 30 }
    store.toggleFavorite('SH000001')
    store.toggleFavorite('HF000001')
    store.setSearchQuery('人民广场')
    const favorite = store.stations.find((s) => s.stationId === 'HF000001')
    await store.setCurrentStation(favorite)
    expect(store.currentStation).toBe(favorite)
    expect(store.currentStation.details.stationId).toBe('HF000001')
    expect(store.searchQuery).toBe('人民广场')
    expect(store.userLocation).toEqual({ lng: 121.47, lat: 31.23, accuracy: 30 })
    expect(store.favoriteStationsList).toHaveLength(2)
  })

  it('does not let an old detail failure overwrite a newer selection', async () => {
    const store = useStationsStore()
    await store.loadStations()
    let rejectOld
    loadStationDetail.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectOld = reject
        })
    )
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const old = store.setCurrentStation(store.stations.find((s) => s.stationId === 'SH000001'))
    await store.setCurrentStation(store.stations.find((s) => s.stationId === 'HF000001'))
    rejectOld(new Error('旧分片失败'))
    await old
    expect(store.currentStation.stationId).toBe('HF000001')
    expect(store.currentStation.detailsLoaded).toBe(true)
    expect(store.detailsError).toBe(null)
  })

  it('loads the final Shanghai station from shard 15', async () => {
    const store = useStationsStore()
    await store.loadStations()
    await store.setCurrentStation(store.stations.find((s) => s.stationId === 'SH001500'))
    expect(store.currentStation.detailsLoaded).toBe(true)
    expect(store.currentStation.details.stationId).toBe('SH001500')
  })

  it('renders ordinary nearby discovery, not city switch or return-city controls', async () => {
    const store = useStationsStore()
    await store.loadStations()
    wrapper = mount(HomeView, {
      global: { stubs: { MapView: true }, provide: { showToast: vi.fn() } }
    })
    await flushPromises()
    expect(wrapper.find('[aria-label="演示城市"]').exists()).toBe(false)
    expect(wrapper.find('[aria-label="浏览上海模拟站点"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('回到上海')
    expect(wrapper.text()).toContain('探索附近充电站')
  })

  it('settles the original Shanghai order after browsing a Hefei station', async () => {
    vi.useFakeTimers()
    const store = useStationsStore()
    await store.loadStations()
    const shanghai = store.stations.find((s) => s.stationId === 'SH000001')
    await store.setCurrentStation(shanghai)
    useUserStore().vehicles = [
      {
        id: 'demo-car',
        brand: '演示',
        model: '国标电动车',
        connectorType: 'GB/T',
        batteryCapacityKwh: 60,
        maxPower: 120,
        isTestVehicle: true
      }
    ]
    const charging = useChargingStore()
    const connector = shanghai.details.fastConnectors[0]
    const available = shanghai.quickAvailableNum
    charging.prepareSession({
      connectorId: connector.id,
      vehicleId: 'demo-car',
      initialBattery: 20,
      targetBattery: 80,
      clockScale: 60
    })
    charging.connectPlug()
    charging.identifyConnector(connector.id)
    const checking = charging.checkReadiness()
    await vi.advanceTimersByTimeAsync(900)
    await checking
    const starting = charging.startCharging()
    await vi.advanceTimersByTimeAsync(700)
    await starting
    const snapshot = { ...charging.sessionStation }
    await store.setCurrentStation(store.stations.find((s) => s.stationId === 'HF000001'))
    await vi.advanceTimersByTimeAsync(5000)
    expect(charging.isCharging).toBe(true)
    expect(charging.sessionStation).toEqual(snapshot)
    const stopping = charging.stopCharging()
    await vi.advanceTimersByTimeAsync(500)
    await stopping
    expect(charging.phase).toBe('awaiting_unplug')
    charging.disconnectPlug()
    expect(connector.status).toBe(1)
    expect(shanghai.quickAvailableNum).toBe(available)
    const receipt = charging.settlePayment({ method: 'wechat' })
    expect(receipt.station.stationId).toBe('SH000001')
    expect(receipt.finalAmount).toBeGreaterThan(0)
  })
})
