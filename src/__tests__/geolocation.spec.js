import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import mapManager from '../services/mapService'
import { LOCATION_TIMEOUT_MS, locationAccuracyText, normalizeLocation } from '../utils/location'

const callbacks = []
let map
const location = (updates = {}) => ({
  position: { lng: 117.28, lat: 31.86 },
  accuracy: 35,
  location_type: 'h5',
  isConverted: true,
  ...updates
})
const settle = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

beforeEach(() => {
  vi.useFakeTimers()
  callbacks.length = 0
  vi.stubGlobal('isSecureContext', true)
  vi.stubGlobal('navigator', {
    geolocation: { getCurrentPosition: vi.fn() },
    permissions: { query: vi.fn().mockResolvedValue({ state: 'granted' }) }
  })
  vi.stubGlobal('AMap', {
    plugin: vi.fn((_plugins, callback) => callback()),
    Geolocation: class {
      constructor(options) {
        this.options = options
      }
      getCurrentPosition(callback) {
        callbacks.push(callback)
      }
    },
    Marker: class {
      constructor(options) {
        this.options = options
      }
    },
    Circle: class {
      constructor(options) {
        this.options = options
      }
    },
    Pixel: class {},
    convertFrom: vi.fn()
  })
  map = {
    addControl: vi.fn(),
    removeControl: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    setCenter: vi.fn(),
    setZoom: vi.fn(),
    getCenter: vi.fn(() => ({ lng: 117.28, lat: 31.86 }))
  }
  vi.spyOn(console, 'log').mockImplementation(() => {})
  mapManager.setMap(map)
})
afterEach(() => {
  mapManager.destroy()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('honest device geolocation', () => {
  it('reports denied embedded-browser permission without an IP fallback', async () => {
    navigator.permissions.query.mockResolvedValue({ state: 'denied' })
    await expect(mapManager.locateUser()).rejects.toMatchObject({ code: 'PERMISSION_DENIED' })
    expect(AMap.plugin).not.toHaveBeenCalled()
    expect(map.setCenter).not.toHaveBeenCalled()
    expect(mapManager._userLocation).toBe(null)
  })

  it('identifies an insecure HTTP origin before requesting location', async () => {
    vi.stubGlobal('isSecureContext', false)
    await expect(mapManager.locateUser()).rejects.toMatchObject({ code: 'INSECURE_CONTEXT' })
    expect(AMap.plugin).not.toHaveBeenCalled()
  })

  it('identifies missing browser geolocation support', async () => {
    navigator.geolocation = undefined
    await expect(mapManager.locateUser()).rejects.toMatchObject({ code: 'LOCATION_UNSUPPORTED' })
  })

  it('deduplicates requests and disables IP/city fallback with a full SDK time budget', async () => {
    const first = mapManager.locateUser(),
      second = mapManager.locateUser()
    expect(second).toBe(first)
    await settle()
    expect(callbacks).toHaveLength(1)
    expect(mapManager._geolocation.options).toMatchObject({
      convert: true,
      noIpLocate: 3,
      noGeoLocation: 0,
      getCityWhenFail: false,
      enableHighAccuracy: true,
      maximumAge: 0,
      GeoLocationFirst: true
    })
    expect(mapManager._geolocation.options.timeout).toBeLessThan(LOCATION_TIMEOUT_MS)
    callbacks[0]('complete', location())
    await first
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps source, reported accuracy and the already-converted map coordinates', async () => {
    const pending = mapManager.locateUser()
    await settle()
    callbacks[0]('complete', location())
    const result = await pending
    expect(result).toMatchObject({
      lng: 117.28,
      lat: 31.86,
      accuracy: 35,
      source: 'h5',
      quality: 'reported',
      coordinateSystem: 'GCJ-02'
    })
    expect(map.setCenter).toHaveBeenCalledWith([117.28, 31.86])
    expect(map.setZoom).toHaveBeenCalledWith(15)
    expect(AMap.convertFrom).not.toHaveBeenCalled()
  })

  it('labels a multi-kilometer device estimate and uses a wider map scale', async () => {
    const pending = mapManager.locateUser()
    await settle()
    callbacks[0]('complete', location({ accuracy: 3500 }))
    const result = await pending
    expect(result.quality).toBe('approximate')
    expect(locationAccuracyText(result)).toContain('3.5 公里')
    expect(map.setZoom).toHaveBeenCalledWith(11)
    expect(mapManager._accuracyCircle.options.radius).toBe(3500)
  })

  it('does not pretend zero or missing accuracy is an exact GPS result', () => {
    for (const accuracy of [0, undefined, NaN, -1]) {
      const result = normalizeLocation(location({ accuracy }))
      expect(result.quality).toBe('approximate')
      expect(result.accuracy).toBe(null)
      expect(locationAccuracyText(result)).toBe('精度未知')
    }
  })

  it.each(['ip', 'ipcity'])(
    'rejects a %s result instead of displaying a false user marker',
    async (source) => {
      const pending = mapManager.locateUser()
      await settle()
      const rejected = expect(pending).rejects.toMatchObject({ code: 'IP_ONLY' })
      callbacks[0]('complete', location({ location_type: source }))
      await rejected
      expect(map.setCenter).not.toHaveBeenCalled()
      expect(map.add).not.toHaveBeenCalled()
    }
  )

  it.each([null, { lng: NaN, lat: 31 }, { lng: 181, lat: 31 }, { lng: 117, lat: 91 }])(
    'rejects invalid coordinates %j',
    async (position) => {
      const pending = mapManager.locateUser()
      await settle()
      const rejected = expect(pending).rejects.toMatchObject({ code: 'INVALID_LOCATION' })
      callbacks[0]('complete', location({ position }))
      await rejected
      expect(map.setCenter).not.toHaveBeenCalled()
    }
  )

  it.each([false, 0])(
    'converts explicitly raw browser coordinates once (flag %j)',
    async (isConverted) => {
      AMap.convertFrom.mockImplementation((_point, _type, callback) =>
        callback('complete', { locations: [{ lng: 117.286, lat: 31.857 }] })
      )
      const pending = mapManager.locateUser()
      await settle()
      callbacks[0]('complete', location({ isConverted }))
      const result = await pending
      expect(AMap.convertFrom).toHaveBeenCalledTimes(1)
      expect(AMap.convertFrom).toHaveBeenCalledWith([117.28, 31.86], 'gps', expect.any(Function))
      expect(result).toMatchObject({ lng: 117.286, lat: 31.857, coordinateSystem: 'GCJ-02' })
    }
  )

  it('leaves the viewport unchanged when coordinate conversion fails', async () => {
    AMap.convertFrom.mockImplementation((_point, _type, callback) => callback('error', {}))
    const pending = mapManager.locateUser()
    await settle()
    const rejected = expect(pending).rejects.toMatchObject({ code: 'COORDINATE_CONVERSION_FAILED' })
    callbacks[0]('complete', location({ isConverted: false }))
    await rejected
    expect(map.setCenter).not.toHaveBeenCalled()
  })

  it('ignores a timed-out callback even after a retry has succeeded', async () => {
    const first = mapManager.locateUser()
    await settle()
    const rejected = expect(first).rejects.toMatchObject({ code: 'LOCATION_TIMEOUT' })
    await vi.advanceTimersByTimeAsync(LOCATION_TIMEOUT_MS)
    await rejected
    const second = mapManager.locateUser()
    await settle()
    callbacks[1]('complete', location({ position: { lng: 117.3, lat: 31.9 } }))
    await second
    callbacks[0]('complete', location())
    expect(map.setCenter).toHaveBeenCalledTimes(1)
    expect(mapManager._userLocation).toMatchObject({ lng: 117.3, lat: 31.9 })
  })

  it('does not install a plugin that loads after its deadline', async () => {
    let ready
    AMap.plugin.mockImplementation((_plugins, callback) => {
      ready = callback
    })
    const pending = mapManager.locateUser()
    await settle()
    const rejected = expect(pending).rejects.toMatchObject({ code: 'LOCATION_TIMEOUT' })
    await vi.advanceTimersByTimeAsync(LOCATION_TIMEOUT_MS)
    await rejected
    ready()
    expect(map.addControl).not.toHaveBeenCalled()
  })

  it.each(['destroy', 'replace'])('cancels callbacks when the map is %s', async (action) => {
    const pending = mapManager.locateUser()
    await settle()
    const rejected = expect(pending).rejects.toMatchObject({ code: 'LOCATION_CANCELLED' })
    if (action === 'destroy') mapManager.destroy()
    else mapManager.setMap({ ...map, setCenter: vi.fn() })
    await rejected
    callbacks[0]('complete', location())
    expect(map.setCenter).not.toHaveBeenCalled()
    expect(mapManager._userLocation).toBe(null)
  })

  it('does not start a route from the default map center when location fails', async () => {
    vi.spyOn(mapManager, 'locateUser').mockRejectedValue(new Error('定位权限被拒绝'))
    const dispatch = vi.spyOn(window, 'dispatchEvent')
    mapManager.navigateToStation({ stationId: 'demo', lng: 117.3, lat: 31.9 })
    await settle()
    expect(map.getCenter).not.toHaveBeenCalled()
    expect(AMap.plugin).not.toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ error: expect.stringContaining('未使用地图中心') })
      })
    )
  })
})
