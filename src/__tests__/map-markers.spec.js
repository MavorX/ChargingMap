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

const installAMap = ({ withCluster = true } = {}) => {
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
      this.opened = false
    }

    open() {
      this.opened = true
    }

    close() {
      this.opened = false
    }
  }

  class MarkerCluster {
    constructor(map, points, options) {
      this.map = map
      this.points = points
      this.options = options
      this.setPoints = vi.fn((next) => {
        this.points = next
      })
      this.setMap = vi.fn()
      MarkerCluster.instances.push(this)
    }
  }

  MarkerCluster.instances = []

  const AMap = { Pixel, Marker, InfoWindow, MarkerCluster }
  if (!withCluster) {
    delete AMap.MarkerCluster
  }

  globalThis.AMap = AMap
  return AMap
}

const loadManager = async () => {
  vi.resetModules()
  const { default: manager } = await import('../services/mapService')
  return manager
}

describe('MapManager markers', () => {
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

  it('skips setPoints when the station signature is unchanged', async () => {
    const AMap = installAMap()
    const manager = await loadManager()
    manager.setMap(makeMap())

    const stations = [makeStation('HF000001', 117.1, 31.8), makeStation('HF000002', 117.2, 31.9)]
    manager.setStations(stations)

    manager.updateMarkers(stations)
    manager.updateMarkers(stations)

    expect(AMap.MarkerCluster.instances).toHaveLength(1)
    expect(AMap.MarkerCluster.instances[0].setPoints).toHaveBeenCalledTimes(1)
    expect(AMap.MarkerCluster.instances[0].setPoints).toHaveBeenCalledWith([
      expect.objectContaining({ lnglat: [117.1, 31.8] }),
      expect.objectContaining({ lnglat: [117.2, 31.9] })
    ])
  })

  it('clears direct markers and empties the cluster when points are empty', async () => {
    const AMap = installAMap()
    const manager = await loadManager()
    const map = makeMap()
    manager.setMap(map)

    const stations = [makeStation('HF000001', 117.1, 31.8)]
    manager.setStations(stations)
    manager.updateMarkers(stations)

    const staleDirectMarker = { id: 'stale-direct-marker' }
    manager._directMarkers.push(staleDirectMarker)

    manager.updateMarkers([])

    expect(manager._directMarkers).toEqual([])
    expect(map.removed).toContain(staleDirectMarker)
    expect(AMap.MarkerCluster.instances[0].setPoints).toHaveBeenCalledTimes(2)
    expect(AMap.MarkerCluster.instances[0].setPoints).toHaveBeenLastCalledWith([])
  })

  it('adds markers directly without throwing when MarkerCluster is unavailable', async () => {
    installAMap({ withCluster: false })
    const manager = await loadManager()
    const map = makeMap()
    manager.setMap(map)

    const stations = [makeStation('HF000001', 117.1, 31.8), makeStation('HF000002', 117.2, 31.9)]
    manager.setStations(stations)

    expect(() => manager.updateMarkers(stations)).not.toThrow()
    expect(manager.markerClusterer).toBeNull()
    expect(manager._directMarkers).toHaveLength(2)
    expect(map.added).toHaveLength(2)
  })

  it('indexes stations by stationId even when coordinates collide', async () => {
    installAMap()
    const manager = await loadManager()
    const first = makeStation('HF000001', 117.1, 31.8)
    const second = makeStation('HF000002', 117.1, 31.8)

    manager.setStations([first, second])

    expect(manager._stationIndex.size).toBe(2)
    expect(manager._stationIndex.get('HF000001')).toBe(first)
    expect(manager._stationIndex.get('HF000002')).toBe(second)
  })

  it('keeps cluster counts readable and supports keyboard zoom', async () => {
    const AMap = installAMap()
    const manager = await loadManager()
    const map = makeMap()
    manager.setMap(map)
    const stations = [makeStation('HF000001', 117.1, 31.8), makeStation('HF000002', 117.2, 31.9)]
    manager.setStations(stations)
    manager.updateMarkers(stations)
    const marker = new AMap.Marker({ position: [117.1, 31.8] })
    AMap.MarkerCluster.instances[0].options.renderClusterMarker({
      count: 2,
      data: stations.map((station) => ({ station })),
      marker
    })
    expect(marker.content.className).toBe('map-cluster')
    expect(marker.content.getAttribute('role')).toBe('button')
    expect(marker.content.getAttribute('aria-label')).toContain('2 个站点，6 个空闲充电桩')
    expect(marker.content.textContent).toBe('26可用')
    marker.content.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }))
    expect(map.setZoom).toHaveBeenCalledWith(15)
    marker.content.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', cancelable: true }))
    expect(map.setZoom).toHaveBeenCalledTimes(2)
  })

  it('does not accumulate click handlers when the SDK reuses a single marker', async () => {
    const AMap = installAMap()
    const manager = await loadManager()
    manager.setMap(makeMap())
    const stations = [makeStation('HF000001', 117.1, 31.8), makeStation('HF000002', 117.2, 31.9)]
    manager.setStations(stations)
    manager.updateMarkers(stations)
    const marker = new AMap.Marker({ position: [117.1, 31.8] })
    const on = vi.spyOn(marker, 'on')
    const render = AMap.MarkerCluster.instances[0].options.renderMarker
    render({ marker, data: [{ station: stations[0] }] })
    render({ marker, data: [{ station: stations[0] }] })
    render({ marker, data: [{ station: stations[1] }] })
    expect(on).toHaveBeenCalledTimes(1)
    const open = vi.spyOn(manager, '_openStationInfoWindow').mockImplementation(() => {})
    marker.handlers.click()
    expect(open).toHaveBeenCalledOnce()
    expect(open.mock.calls[0][0].stationId).toBe('HF000002')
    expect(manager._markersByStationId.has('HF000001')).toBe(false)
  })

  it('refreshes cluster inputs when an available gun changes without station IDs changing', async () => {
    const AMap = installAMap()
    const manager = await loadManager()
    manager.setMap(makeMap())
    const station = makeStation('HF000001', 117.1, 31.8)
    manager.setStations([station])
    manager.updateMarkers([station])
    station.quickAvailableNum--
    manager.updateMarkers([station])
    expect(AMap.MarkerCluster.instances[0].setPoints).toHaveBeenCalledTimes(2)
  })

  it('does not open a stale station when a station marker is recycled as a cluster', async () => {
    const AMap = installAMap()
    const manager = await loadManager()
    manager.setMap(makeMap())
    const station = makeStation('HF000001', 117.1, 31.8)
    manager.setStations([station])
    manager.updateMarkers([station])
    const marker = new AMap.Marker({ position: [117.1, 31.8] })
    const options = AMap.MarkerCluster.instances[0].options
    options.renderMarker({ marker, data: [{ station }] })
    options.renderClusterMarker({ marker, count: 2, data: [{ station }] })
    const open = vi.spyOn(manager, '_openStationInfoWindow').mockImplementation(() => {})
    marker.handlers.click()
    expect(open).not.toHaveBeenCalled()
    expect(manager._markersByStationId.has(station.stationId)).toBe(false)
  })

  it('refreshMarker updates availability in a visible cluster as well as an open popup', async () => {
    const AMap = installAMap()
    const manager = await loadManager()
    manager.setMap(makeMap())
    const station = makeStation('HF000001', 117.1, 31.8)
    manager.setStations([station])
    manager.updateMarkers([station])
    station.quickAvailableNum--
    manager.refreshMarker(station.stationId)
    expect(AMap.MarkerCluster.instances[0].setPoints).toHaveBeenCalledTimes(2)
    manager.refreshMarker(station.stationId)
    expect(AMap.MarkerCluster.instances[0].setPoints).toHaveBeenCalledTimes(2)
  })

  it('keeps recommended pins outside clusters and restores ordinary markers when cleared', async () => {
    const AMap = installAMap()
    const manager = await loadManager()
    const map = makeMap()
    manager.setMap(map)
    const stations = [makeStation('HF000001', 117.1, 31.8), makeStation('HF000002', 117.2, 31.9)]
    manager.setStations(stations)
    manager.updateMarkers(stations)
    manager.setRecommendations([
      { station: stations[0], label: '本次推荐', durationSeconds: 600, totalAmount: 30 }
    ])
    expect(manager._recommendationMarkers).toHaveLength(1)
    expect(AMap.MarkerCluster.instances[0].points).toHaveLength(1)
    const marker = manager._recommendationMarkers[0]
    expect(marker.content.textContent).toContain('本次推荐')
    expect(marker.content.textContent).toContain('¥30.00')
    expect(map.setCenter).not.toHaveBeenCalled()
    const open = vi.spyOn(manager, '_openStationInfoWindow').mockImplementation(() => {})
    marker.content.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }))
    expect(open).toHaveBeenCalledOnce()
    manager.refreshMarker(stations[0].stationId)
    expect(marker.content.className).toBe('map-recommendation-marker')
    manager.setRecommendations([])
    expect(manager._recommendationMarkers).toHaveLength(0)
    expect(map.removed).toContain(marker)
    expect(AMap.MarkerCluster.instances[0].points).toHaveLength(2)
    manager.destroy()
  })
})
