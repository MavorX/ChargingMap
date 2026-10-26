import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const installAMap = () => {
  class Pixel {
    constructor(x, y) {
      this.x = x
      this.y = y
    }
  }

  class Geolocation {
    constructor(options) {
      this.options = options
      // Never invokes the callback: simulates a stalled GPS request so the
      // timeout path (not the plugin callback) must settle the promise.
      this.getCurrentPosition = vi.fn()
    }
  }

  const AMap = {
    Pixel,
    Geolocation,
    plugin: vi.fn((plugins, callback) => callback())
  }

  globalThis.AMap = AMap
  return AMap
}

const makeMap = () => ({
  addControl: vi.fn(),
  removeControl: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
  setCenter: vi.fn(),
  setZoom: vi.fn(),
  zoomIn: vi.fn(),
  zoomOut: vi.fn(),
  getCenter: () => ({ lng: 117.28, lat: 31.86 }),
  getZoom: () => 13
})

const makeStation = (stationId) => ({
  stationId,
  stationName: `Station ${stationId}`,
  lng: 117.1,
  lat: 31.8,
  openStatus: 1,
  quickAvailableNum: 1,
  slowAvailableNum: 1,
  quickChargeNum: 2,
  slowChargeNum: 2,
  currentPrice: 1.2,
  address: 'Test address'
})

const loadManager = async () => {
  vi.resetModules()
  const { default: manager } = await import('../services/mapService')
  return manager
}

describe('MapManager lifecycle', () => {
  beforeEach(() => {
    delete globalThis.AMap
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    vi.resetModules()
    delete globalThis.AMap
  })

  it('rejects locateUser after 8s when geolocation never responds', async () => {
    vi.useFakeTimers()
    installAMap()
    const manager = await loadManager()
    const map = makeMap()
    manager.setMap(map)

    let finalized = false
    const pending = manager.locateUser()
    pending
      .finally(() => {
        finalized = true
      })
      .catch(() => {})
    const rejection = expect(pending).rejects.toThrow('定位超时')

    await vi.advanceTimersByTimeAsync(9000)
    await rejection

    expect(finalized).toBe(true)
    expect(map.setCenter).not.toHaveBeenCalled()
    expect(manager._userLocation).toBeNull()
  })

  it('rejects locateUser immediately when the map is not initialized', async () => {
    installAMap()
    const manager = await loadManager()

    await expect(manager.locateUser()).rejects.toThrow('地图未初始化')
  })

  it('clears all map resources and index state on destroy', async () => {
    const AMap = installAMap()
    const manager = await loadManager()
    const map = makeMap()
    manager.setMap(map)
    manager.setStations([makeStation('HF000001')])

    manager._geolocation = new AMap.Geolocation({})
    manager._driving = { clear: vi.fn() }
    manager._currentInfoWindow = { close: vi.fn() }
    manager._directMarkers.push({ id: 'direct-marker' })

    manager.destroy()

    expect(map.removeControl).toHaveBeenCalledTimes(1)
    expect(map.remove).toHaveBeenCalled()
    expect(manager.map).toBeNull()
    expect(manager._geolocation).toBeNull()
    expect(manager._userLocation).toBeNull()
    expect(manager._driving).toBeNull()
    expect(manager._currentInfoWindow).toBeNull()
    expect(manager._infoWindow).toBeNull()
    expect(manager._directMarkers).toEqual([])
    expect(manager._stationIndex.size).toBe(0)
    expect(manager.stations).toEqual([])
  })

  it('supports a setMap → destroy → setMap cycle without throwing', async () => {
    installAMap()
    const manager = await loadManager()
    const first = makeMap()
    manager.setMap(first)
    manager._geolocation = new globalThis.AMap.Geolocation({})

    manager.destroy()

    const second = makeMap()
    expect(() => manager.setMap(second)).not.toThrow()
    expect(() => manager.destroy()).not.toThrow()

    expect(first.removeControl).toHaveBeenCalledTimes(1)
    expect(second.removeControl).not.toHaveBeenCalled()
    expect(second.addControl).not.toHaveBeenCalled()
  })

  it('public methods are safe no-ops after destroy', async () => {
    installAMap()
    const manager = await loadManager()
    const map = makeMap()
    manager.setMap(map)
    manager.destroy()

    expect(() => {
      manager.closeInfoWindow()
      manager.clearRoute()
      manager.locateStation(makeStation('HF000001'))
      manager.navigateToStation(makeStation('HF000001'))
      manager.zoomIn()
      manager.zoomOut()
      manager.updateMarkers([makeStation('HF000001')])
      manager._openInfoWindow({ open: vi.fn() }, [117.1, 31.8])
    }).not.toThrow()

    expect(map.zoomIn).not.toHaveBeenCalled()
    expect(map.zoomOut).not.toHaveBeenCalled()
    expect(map.setCenter).not.toHaveBeenCalled()
  })

  it('ignores a late route result after a newer destination has been selected', async () => {
    const AMap = installAMap()
    const searches = []
    AMap.LngLat = class {
      constructor(lng, lat) {
        this.lng = lng
        this.lat = lat
      }
    }
    AMap.Driving = class {
      constructor() {
        this.clear = vi.fn()
        searches.push(this)
      }
      search(_start, _end, callback) {
        this.result = callback
      }
    }
    const manager = await loadManager()
    manager.setMap(makeMap())
    manager._userLocation = { lng: 117.28, lat: 31.86 }
    const dispatch = vi.spyOn(window, 'dispatchEvent')
    manager.navigateToStation(makeStation('old'))
    manager.navigateToStation(makeStation('new'))
    const result = { routes: [{ distance: 1000, time: 120 }] }
    searches[1].result('complete', result)
    searches[0].result('complete', result)
    const routes = dispatch.mock.calls
      .map(([event]) => event)
      .filter((event) => event.type === 'routeResult')
    expect(routes).toHaveLength(1)
    expect(routes[0].detail.station.stationId).toBe('new')
    expect(searches[0].clear).toHaveBeenCalled()
    manager.destroy()
  })

  it('does not start navigation when its plugin finishes loading after cancellation', async () => {
    const AMap = installAMap()
    let pluginReady
    AMap.plugin.mockImplementation((_plugins, callback) => {
      pluginReady = callback
    })
    AMap.Driving = vi.fn()
    const manager = await loadManager()
    manager.setMap(makeMap())
    manager._userLocation = { lng: 117.28, lat: 31.86 }
    manager.navigateToStation(makeStation('old'))
    manager.clearRoute()
    pluginReady()
    expect(AMap.Driving).not.toHaveBeenCalled()
    manager.destroy()
  })

  it.each(['resolve', 'reject'])(
    'ignores %s from navigation geolocation after map teardown',
    async (outcome) => {
      const AMap = installAMap()
      const manager = await loadManager()
      manager.setMap(makeMap())
      let resolve, reject
      vi.spyOn(manager, 'locateUser').mockImplementation(
        () =>
          new Promise((done, fail) => {
            resolve = done
            reject = fail
          })
      )
      manager.navigateToStation(makeStation('old'))
      manager.destroy()
      if (outcome === 'resolve') resolve({ lng: 117.28, lat: 31.86 })
      else reject(new Error('late location failure'))
      await Promise.resolve()
      await Promise.resolve()
      expect(AMap.plugin).not.toHaveBeenCalled()
    }
  )
})
