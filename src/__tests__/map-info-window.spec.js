import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const makeMap = () => ({
  added: [],
  removed: [],
  add(marker) {
    this.added.push(marker)
  },
  remove(marker) {
    this.removed.push(marker)
  },
  setBounds: vi.fn(),
  setCenter: vi.fn(),
  setZoom: vi.fn(),
  getZoom: () => 12
})

const makeStation = (stationId, lng, lat, overrides = {}) => ({
  stationId,
  stationName: `Station ${stationId}`,
  lng,
  lat,
  openStatus: 1,
  quickAvailableNum: 2,
  slowAvailableNum: 1,
  quickChargeNum: 4,
  slowChargeNum: 2,
  currentPrice: 1.2,
  address: 'Test address',
  isFavorite: false,
  ...overrides
})

const installAMap = () => {
  class Pixel {
    constructor(x, y) {
      this.x = x
      this.y = y
    }
  }

  class Marker {
    constructor(options) {
      this.options = options
      this.position = options.position
      this.content = options.content
      this.handlers = {}
    }

    on(name, handler) {
      this.handlers[name] = handler
    }

    getPosition() {
      return this.position
    }

    setContent(content) {
      this.content = content
    }

    setOffset(offset) {
      this.offset = offset
    }
  }

  class InfoWindow {
    constructor(options) {
      this.options = options
      this.content = options.content
      this.opened = false
      InfoWindow.instances.push(this)
    }

    setContent(content) {
      this.content = content
    }

    getContent() {
      return this.content
    }

    open() {
      this.opened = true
    }

    close() {
      this.opened = false
    }
  }

  InfoWindow.instances = []

  const AMap = { Pixel, Marker, InfoWindow }
  globalThis.AMap = AMap
  return AMap
}

const loadManager = async () => {
  vi.resetModules()
  const { default: manager } = await import('../services/mapService')
  return manager
}

const setup = async (stations) => {
  const AMap = installAMap()
  const manager = await loadManager()
  const map = makeMap()
  manager.setMap(map)
  manager.setStations(stations)
  manager.updateMarkers(stations)
  return { AMap, manager, map }
}

describe('MapManager shared info window', () => {
  beforeEach(() => {
    delete globalThis.AMap
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
    delete globalThis.AMap
  })

  it('builds no info window while rendering markers', async () => {
    const stations = [
      makeStation('HF000001', 117.1, 31.8),
      makeStation('HF000002', 117.2, 31.9)
    ]
    const { AMap, manager } = await setup(stations)

    expect(manager._directMarkers).toHaveLength(2)
    expect(AMap.InfoWindow.instances).toHaveLength(0)
    expect(manager._infoWindow).toBeNull()
  })

  it('reuses one shared InfoWindow instance for every marker click', async () => {
    const stations = [
      makeStation('HF000001', 117.1, 31.8),
      makeStation('HF000002', 117.2, 31.9)
    ]
    const { AMap, manager } = await setup(stations)
    const [firstMarker, secondMarker] = manager._directMarkers

    firstMarker.handlers.click()
    secondMarker.handlers.click()
    firstMarker.handlers.click()

    expect(AMap.InfoWindow.instances).toHaveLength(1)
    expect(manager._infoWindow).toBe(AMap.InfoWindow.instances[0])
    expect(manager._currentInfoWindow).toBe(AMap.InfoWindow.instances[0])
    expect(manager._infoWindow.opened).toBe(true)
    expect(manager._infoWindow.getContent().textContent).toContain('Station HF000001')
  })

  it('refreshMarker rebuilds the open content with the new favorite state', async () => {
    const station = makeStation('HF000001', 117.1, 31.8)
    const { AMap, manager } = await setup([station])

    manager._directMarkers[0].handlers.click()
    expect(manager._infoWindow.getContent().textContent).toContain('收藏')
    expect(manager._infoWindow.getContent().textContent).not.toContain('已收藏')

    station.isFavorite = true
    manager.refreshMarker('HF000001')

    expect(AMap.InfoWindow.instances).toHaveLength(1)
    expect(manager._infoWindow.getContent().textContent).toContain('已收藏')
  })

  it('refreshMarker silently ignores an unknown stationId', async () => {
    const station = makeStation('HF000001', 117.1, 31.8)
    const { manager } = await setup([station])

    manager._directMarkers[0].handlers.click()
    const before = manager._infoWindow.getContent()

    expect(() => manager.refreshMarker('MISSING')).not.toThrow()
    expect(manager._infoWindow.getContent()).toBe(before)
  })

  it('dispatches only stationId from the favorite chip and leaves DOM untouched', async () => {
    const station = makeStation('HF000001', 117.1, 31.8)
    const { manager } = await setup([station])

    manager._directMarkers[0].handlers.click()
    const favBtn = manager._infoWindow.getContent().querySelector('.info-fav-btn')
    const handler = vi.fn()
    window.addEventListener('toggleFavoriteFromMap', handler)

    favBtn.click()

    window.removeEventListener('toggleFavoriteFromMap', handler)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler.mock.calls[0][0].detail).toEqual({ stationId: 'HF000001' })
    expect(favBtn.textContent).toContain('收藏')
    expect(favBtn.style.background).not.toBe('rgb(254, 226, 226)')
  })

  it('renders station strings as text, never as markup', async () => {
    const station = makeStation('HF000001', 117.1, 31.8, {
      stationName: '<img src=x onerror="window.__xss=1">',
      address: '<script>window.__xss=2</script>'
    })
    const { manager } = await setup([station])

    manager._directMarkers[0].handlers.click()
    const content = manager._infoWindow.getContent()

    expect(content.querySelector('img')).toBeNull()
    expect(content.querySelector('script')).toBeNull()
    expect(content.textContent).toContain('<img src=x onerror="window.__xss=1">')
    expect(window.__xss).toBeUndefined()
  })
})
