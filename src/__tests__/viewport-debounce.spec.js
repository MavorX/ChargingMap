import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import MapView from '../components/map/MapView.vue'
import mapManager from '../services/mapService'
import { useStationsStore } from '../store/modules/stations'

vi.mock('../services/amapLoader', () => ({
  amapLoader: {
    load: vi.fn(() => Promise.resolve()),
    reset: vi.fn()
  }
}))

vi.mock('../services/mapService', () => ({
  default: {
    setMap: vi.fn(),
    setStations: vi.fn(),
    updateMarkers: vi.fn(),
    closeInfoWindow: vi.fn(),
    clearRoute: vi.fn(),
    destroy: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    locateUser: vi.fn(() => Promise.resolve({ lng: 117.28, lat: 31.86 }))
  }
}))

const mapHandlers = new Map()
let initialMapOptions

const fakeMap = {
  on: vi.fn((event, handler) => {
    mapHandlers.set(event, handler)
  }),
  getBounds: vi.fn(() => ({
    getNorthEast: () => ({ lng: 117.5, lat: 32.0 }),
    getSouthWest: () => ({ lng: 117.0, lat: 31.6 })
  })),
  setMapStyle: vi.fn(),
  destroy: vi.fn(),
  addControl: vi.fn(),
  removeControl: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
  setCenter: vi.fn(),
  setZoom: vi.fn(),
  setZoomAndCenter: vi.fn()
}

const mountMapView = async () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useStationsStore()
  vi.spyOn(store, 'loadStations').mockResolvedValue()
  const setViewportBounds = vi.spyOn(store, 'setViewportBounds')
  const setLoading = vi.fn()

  const wrapper = mount(MapView, {
    global: {
      plugins: [pinia],
      provide: { showToast: vi.fn(), setLoading }
    }
  })

  // Let `initMap` resolve the loader promise and register map handlers.
  await vi.advanceTimersByTimeAsync(200)

  // Drop the viewport flush scheduled by the initial `loadStations` call so the
  // assertions below only count explicitly triggered events.
  setViewportBounds.mockClear()
  mapManager.updateMarkers.mockClear()

  return { wrapper, store, setViewportBounds, setLoading }
}

describe('MapView viewport pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mapManager.locateUser.mockReset().mockResolvedValue({ lng: 117.28, lat: 31.86 })
    fakeMap.getBounds.mockReturnValue({
      getNorthEast: () => ({ lng: 117.5, lat: 32.0 }),
      getSouthWest: () => ({ lng: 117.0, lat: 31.6 })
    })
    vi.useFakeTimers()
    mapHandlers.clear()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    globalThis.AMap = {
      Map: class {
        constructor(_container, options) {
          initialMapOptions = options
          return fakeMap
        }
      }
    }
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    delete globalThis.AMap
  })

  it('keeps SDK controls in a local stacking context below business panels', async () => {
    const { wrapper } = await mountMapView()
    expect(wrapper.get('#map-container').classes()).toContain('relative')
    expect(wrapper.get('#map-container').classes()).toContain('isolate')
    wrapper.unmount()
  })

  it('collapses three moveend events within 100ms into one bounds + marker update', async () => {
    const { wrapper, setViewportBounds } = await mountMapView()
    const moveend = mapHandlers.get('moveend')
    expect(typeof moveend).toBe('function')

    moveend()
    await vi.advanceTimersByTimeAsync(100)
    moveend()
    await vi.advanceTimersByTimeAsync(100)
    moveend()
    await vi.advanceTimersByTimeAsync(200)

    expect(setViewportBounds).toHaveBeenCalledTimes(1)
    expect(setViewportBounds).toHaveBeenCalledWith({
      north: 32.0,
      south: 31.6,
      east: 117.5,
      west: 117.0
    })
    expect(mapManager.updateMarkers).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('debounces zoomend through the same handler', async () => {
    const { wrapper, setViewportBounds } = await mountMapView()
    const zoomend = mapHandlers.get('zoomend')

    zoomend()
    await vi.advanceTimersByTimeAsync(50)
    zoomend()
    await vi.advanceTimersByTimeAsync(200)

    expect(setViewportBounds).toHaveBeenCalledTimes(1)
    expect(mapManager.updateMarkers).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('refreshes bounds and markers after map container resizing', async () => {
    const { wrapper, setViewportBounds } = await mountMapView()
    mapHandlers.get('resize')()
    await vi.advanceTimersByTimeAsync(200)
    expect(setViewportBounds).toHaveBeenCalledTimes(1)
    expect(mapManager.updateMarkers).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('refreshes markers once on filter changes without rewriting viewport bounds', async () => {
    const { wrapper, store, setViewportBounds } = await mountMapView()

    store.toggleFilter('quickAvailable')
    await nextTick()
    await vi.advanceTimersByTimeAsync(200)

    expect(mapManager.updateMarkers).toHaveBeenCalledTimes(1)
    expect(setViewportBounds).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('automatically requests device location and accepts a Shanghai fix without any city choice', async () => {
    mapManager.locateUser.mockResolvedValueOnce({ lng: 121.4728, lat: 31.2331, accuracy: 30 })
    const { wrapper, store, setLoading } = await mountMapView()
    expect(initialMapOptions).toMatchObject({ center: [117.283042, 31.86119], zoom: 13 })
    expect(mapManager.locateUser).toHaveBeenCalledTimes(1)
    expect(store.userLocation).toEqual({ lng: 121.4728, lat: 31.2331, accuracy: 30 })
    expect(store.locationStatus).toBe('ready')
    expect(setLoading).not.toHaveBeenCalled()
    expect(wrapper.find('[aria-label="正在加载地图"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('does not block station browsing while initial location is pending', async () => {
    mapManager.locateUser.mockImplementationOnce(() => new Promise(() => {}))
    const { wrapper, store, setLoading } = await mountMapView()
    expect(store.locationStatus).toBe('locating')
    expect(setLoading).not.toHaveBeenCalled()
    expect(wrapper.find('[aria-label="正在加载地图"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('does not move the map or invent a fix when initial geolocation is denied', async () => {
    mapManager.locateUser.mockRejectedValueOnce(
      Object.assign(new Error('定位权限被拒绝'), { code: 'PERMISSION_DENIED' })
    )
    fakeMap.setCenter.mockClear()
    const { wrapper, store } = await mountMapView()
    expect(store.locationStatus).toBe('error')
    expect(store.locationErrorCode).toBe('PERMISSION_DENIED')
    expect(store.userLocation).toBe(null)
    expect(fakeMap.setCenter).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('updates Shanghai markers solely from new map bounds, with no region state', async () => {
    const { wrapper, store } = await mountMapView()
    store.stations = [
      { stationId: 'HF000001', lng: 117.28, lat: 31.86, connectorTypes: ['GB/T'] },
      { stationId: 'SH000001', lng: 121.47, lat: 31.23, connectorTypes: ['GB/T'] }
    ]
    fakeMap.getBounds.mockReturnValue({
      getNorthEast: () => ({ lng: 121.5, lat: 31.26 }),
      getSouthWest: () => ({ lng: 121.44, lat: 31.2 })
    })
    mapHandlers.get('moveend')()
    await vi.advanceTimersByTimeAsync(200)
    expect(store.filteredStations).toHaveLength(2)
    expect(store.viewportStations.map((s) => s.stationId)).toEqual(['SH000001'])
    expect(mapManager.updateMarkers).toHaveBeenLastCalledWith(store.viewportStations)
    expect(store.$state).not.toHaveProperty('activeCityId')
    wrapper.unmount()
  })
})
