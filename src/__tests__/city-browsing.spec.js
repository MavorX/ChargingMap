import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import CitySelector from '../components/station/CitySelector.vue'
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
})
afterEach(() => {
  useChargingStore().suspendSimulator()
  wrapper?.unmount()
  wrapper = null
  mapManager.setMap(null)
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('Shanghai presentation and cross-city browsing', () => {
  it('defaults to Shanghai, with real coordinates kept separate from display centers', async () => {
    const store = useStationsStore()
    await store.loadStations()
    expect(store.activeCityId).toBe('SH')
    expect(store.pagedStations[0].stationId).toBe('SH000001')
    expect(store.userLocation).toBe(null)
    expect(store.stations.every((s) => s.distance === null)).toBe(true)
    expect(store.locationPresentation.title).toBe('上海市 · 演示视野')
    expect(store.locationPresentation.description).toContain('尚未定位')
  })

  it('switches the data region, clears stale bounds/search/page, and retains explicit filters', async () => {
    const store = useStationsStore()
    await store.loadStations()
    store.setViewportBounds({ west: 121.4, east: 121.6, south: 31.1, north: 31.3 })
    store.setSearchQuery('人民广场')
    store.updateFilters({ quickAvailable: true })
    store.listPage = 5
    store.browseCity('HF')
    expect(store.viewportBounds).toBe(null)
    expect(store.searchQuery).toBe('')
    expect(store.listPage).toBe(1)
    expect(store.filters.quickAvailable).toBe(true)
    expect(store.pagedStations).toHaveLength(20)
    expect(store.filteredStations.every((s) => s.cityId === 'HF' && s.quickAvailableNum > 0)).toBe(
      true
    )
    store.resetFilters()
    expect(store.activeCityId).toBe('HF')
    expect(store.filteredStations).toHaveLength(500)
  })

  it('searches Shanghai district/road/site data without leaking Hefei results', async () => {
    const store = useStationsStore()
    await store.loadStations()
    for (const query of ['人民广场', '浦东新区', '陆家嘴', '张江路']) {
      store.setSearchQuery(query)
      expect(store.filteredStations.length).toBeGreaterThan(0)
      expect(store.filteredStations.every((s) => s.cityId === 'SH')).toBe(true)
    }
    store.setSearchQuery('瑶海区')
    expect(store.filteredStations).toHaveLength(0)
  })

  it('keeps city-level filters active even when the viewport spans both cities', async () => {
    const store = useStationsStore()
    await store.loadStations()
    store.setViewportBounds({ west: 116, east: 123, south: 30, north: 33 })
    expect(store.viewportStations).toHaveLength(500)
    expect(store.viewportStations.every((s) => s.cityId === 'SH')).toBe(true)
    expect(store.hasMoreStations).toBe(true)
  })

  it('keeps cross-city favorites and changes region before opening their exact station', async () => {
    const store = useStationsStore()
    await store.loadStations()
    store.toggleFavorite('SH000001')
    store.toggleFavorite('HF000001')
    const favorite = store.stations.find((s) => s.stationId === 'HF000001')
    await store.setCurrentStation(favorite)
    expect(store.activeCityId).toBe('HF')
    expect(store.currentStation).toBe(favorite)
    expect(store.currentStation.details.stationId).toBe('HF000001')
    expect(store.favoriteStationIds).toEqual(expect.arrayContaining(['SH000001', 'HF000001']))
    store.browseCity('SH')
    expect(store.currentStation).toBe(null)
    expect(store.favoriteStationsList).toHaveLength(2)
    expect(JSON.parse(localStorage.getItem('favoriteStations'))).toHaveLength(2)
  })

  it('does not let an old Shanghai detail failure overwrite the new Hefei selection', async () => {
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
    store.browseCity('HF')
    await store.setCurrentStation(store.stations.find((s) => s.stationId === 'HF000001'))
    rejectOld(new Error('旧上海分片失败'))
    await old
    expect(store.currentStation.stationId).toBe('HF000001')
    expect(store.currentStation.detailsLoaded).toBe(true)
    expect(store.detailsError).toBe(null)
  })

  it('cancels a pending fix/route without losing a previously known device position', async () => {
    const store = useStationsStore()
    store.userLocation = {
      lng: 117.28,
      lat: 31.86,
      accuracy: 35,
      quality: 'reported',
      source: 'h5'
    }
    store.startNavigation({ station: { stationId: 'HF000001' } })
    const clearRoute = vi.spyOn(mapManager, 'clearRoute')
    const cancelLocation = vi.spyOn(mapManager, 'cancelLocation')
    let reject
    vi.spyOn(mapManager, 'locateUser').mockImplementation(
      () =>
        new Promise((_resolve, fail) => {
          reject = fail
        })
    )
    const request = store.requestUserLocation()
    const rejected = expect(request).rejects.toMatchObject({ code: 'LOCATION_CANCELLED' })
    store.browseCity('SH')
    reject(Object.assign(new Error('取消'), { code: 'LOCATION_CANCELLED' }))
    await rejected
    expect(cancelLocation).toHaveBeenCalledOnce()
    expect(clearRoute).toHaveBeenCalledOnce()
    expect(store.isNavigating).toBe(false)
    expect(store.routeInfo).toBe(null)
    expect(store.userLocation.lng).toBe(117.28)
    expect(store.locationStatus).toBe('ready')
    expect(store.locationPresentation.title).toBe('上海市 · 演示视野')
    expect(store.locationPresentation.description).toContain('已保留')
  })

  it('updates the data region on a deliberate location request, not to an invented city center', async () => {
    const store = useStationsStore()
    const fix = { lng: 117.31, lat: 31.86, accuracy: 50, quality: 'reported', source: 'h5' }
    vi.spyOn(mapManager, 'locateUser').mockResolvedValue(fix)
    await store.requestUserLocation()
    expect(store.activeCityId).toBe('HF')
    expect(store.cityViewRevision).toBe(0)
    expect(store.userLocation).toEqual(fix)
    expect(store.locationPresentation.title).toBe('已获取设备位置')
  })

  it('leaves an outside-city fix honest and offers an explicit way back to Shanghai', async () => {
    const store = useStationsStore()
    const fix = { lng: 116.4, lat: 39.9, accuracy: 1500, quality: 'approximate', source: 'h5' }
    vi.spyOn(mapManager, 'locateUser').mockResolvedValue(fix)
    await store.requestUserLocation()
    expect(store.activeCityId).toBe('SH')
    expect(store.userLocation).toEqual(fix)
    expect(store.locationPresentation.title).toContain('估算位置')
    wrapper = mount(CitySelector)
    await wrapper.get('[aria-label="返回上海演示视野"]').trigger('click')
    expect(store.viewingDeviceLocation).toBe(false)
    expect(store.userLocation).toEqual(fix)
  })

  it('keeps selector pressed states in sync and rejects unsupported cities', async () => {
    const store = useStationsStore()
    wrapper = mount(CitySelector)
    expect(wrapper.get('[aria-label="浏览上海模拟站点"]').attributes('aria-pressed')).toBe('true')
    await wrapper.get('[aria-label="浏览合肥模拟站点"]').trigger('click')
    expect(wrapper.get('[aria-label="浏览合肥模拟站点"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[aria-label="返回合肥演示视野"]').exists()).toBe(true)
    expect(store.browseCity('unknown')).toBe(false)
    expect(store.activeCityId).toBe('HF')
  })

  it('focuses a cross-city favorite after the region center is applied', async () => {
    const store = useStationsStore()
    await store.loadStations()
    const fakeMap = { setCenter: vi.fn(), setZoom: vi.fn() }
    mapManager.setMap(fakeMap)
    wrapper = mount(HomeView, {
      global: { stubs: { MapView: true }, provide: { showToast: vi.fn() } }
    })
    wrapper.vm.selectStationFromSidebar(store.stations.find((s) => s.stationId === 'HF000001'))
    await flushPromises()
    expect(store.activeCityId).toBe('HF')
    expect(fakeMap.setCenter).toHaveBeenLastCalledWith([
      store.currentStation.lng,
      store.currentStation.lat
    ])
  })

  it('charges and settles the Shanghai snapshot even after switching to a Hefei station', async () => {
    vi.useFakeTimers()
    const store = useStationsStore()
    await store.loadStations()
    const shanghai = store.stations.find((s) => s.stationId === 'SH000001')
    await store.setCurrentStation(shanghai)
    useUserStore().vehicles = [
      {
        id: 'city-demo-car',
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
      vehicleId: 'city-demo-car',
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
    expect(connector.status).toBe(3)
    expect(shanghai.quickAvailableNum).toBe(available - 1)
    store.browseCity('HF')
    await store.setCurrentStation(store.stations.find((s) => s.stationId === 'HF000001'))
    await vi.advanceTimersByTimeAsync(5000)
    expect(charging.isCharging).toBe(true)
    expect(charging.sessionStation).toEqual(snapshot)
    expect(charging.chargingData.energy).toBeGreaterThan(0)
    const stopping = charging.stopCharging()
    await vi.advanceTimersByTimeAsync(500)
    await stopping
    expect(charging.phase).toBe('awaiting_unplug')
    charging.disconnectPlug()
    expect(connector.status).toBe(1)
    expect(shanghai.quickAvailableNum).toBe(available)
    const receipt = charging.settlePayment({ method: 'wechat' })
    expect(receipt.station.stationId).toBe('SH000001')
    expect(receipt.station.stationName).toBe(snapshot.stationName)
    expect(receipt.finalAmount).toBeGreaterThan(0)
    expect(charging.phase).toBe('paid')
  })
})
