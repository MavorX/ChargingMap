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
    destroy: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    locateUser: vi.fn(() => Promise.resolve({ lng: 117.28, lat: 31.86 }))
  }
}))

const mapHandlers = new Map()

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
  setZoom: vi.fn()
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
    vi.useFakeTimers()
    mapHandlers.clear()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    globalThis.AMap = {
      Map: class {
        constructor() {
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

  it('refreshes markers once on filter changes without rewriting viewport bounds', async () => {
    const { wrapper, store, setViewportBounds } = await mountMapView()

    store.toggleFilter('quickAvailable')
    await nextTick()
    await vi.advanceTimersByTimeAsync(200)

    expect(mapManager.updateMarkers).toHaveBeenCalledTimes(1)
    expect(setViewportBounds).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('does not block the app while initial geolocation is pending', async () => {
    mapManager.locateUser.mockImplementationOnce(() => new Promise(() => {}))
    const { wrapper, setLoading } = await mountMapView()
    expect(setLoading).not.toHaveBeenCalled()
    expect(wrapper.find('[aria-label="正在加载地图"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
