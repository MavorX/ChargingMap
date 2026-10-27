import { formatPrice } from '../utils/format'
import { LOCATION_TIMEOUT_MS, locationError, normalizeLocation } from '../utils/location'

// Small DOM builder: station fields only ever travel through textContent, never
// through a markup string, so names/addresses cannot inject markup.
const el = (tag, cssText, text) => {
  const node = document.createElement(tag)
  if (cssText) node.style.cssText = cssText
  if (text != null) node.textContent = String(text)
  return node
}

class MapManager {
  constructor() {
    this.map = null
    this.markerClusterer = null
    this.stations = []
    this._geolocation = null
    this._locationRequest = null
    this._currentInfoWindow = null
    this._infoWindow = null
    this._activeStationId = null
    this._userLocation = null
    this._driving = null
    this._routeRevision = 0
    this._directMarkers = []
    this._stationIndex = new Map()
    this._markersByStationId = new Map()
    this._markerSignature = ''
  }

  setMap(mapInstance) {
    if (this.map !== mapInstance) this._cancelLocation()
    this.map = mapInstance
    this._markerSignature = ''
    if (import.meta.env.DEV) console.log('[MapManager] Map instance set')
  }

  setStations(stationsData) {
    this.stations = stationsData
    this._stationIndex = new Map()
    stationsData.forEach((station) => {
      if (station && station.stationId != null) {
        this._stationIndex.set(station.stationId, station)
      }
    })
    if (import.meta.env.DEV) console.log('[MapManager] Stations set:', stationsData.length)
  }

  getStationColor(station) {
    if (station.openStatus === 0) {
      return '#6B7280'
    }
    const availableCount = station.quickAvailableNum + station.slowAvailableNum
    if (availableCount === 0) {
      return '#EF4444'
    }
    const totalCount = station.quickChargeNum + station.slowChargeNum
    const usageRate = totalCount > 0 ? (totalCount - availableCount) / totalCount : 0
    if (usageRate >= 0.8) {
      return '#F59E0B'
    }
    return '#10B981'
  }

  adjustColor(color, amount) {
    const hex = color.replace('#', '')
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount))
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount))
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount))
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
  }

  createStationMarkerContent(station) {
    const color = this.getStationColor(station)
    const availableCount = station.quickAvailableNum + station.slowAvailableNum
    const statusText =
      station.openStatus === 0 ? '维护' : availableCount === 0 ? '已满' : `${availableCount}空`

    const div = document.createElement('div')
    div.style.cssText = 'cursor:pointer;display:flex;flex-direction:column;align-items:center;'

    const circle = document.createElement('div')
    circle.style.cssText = `width:36px;height:36px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;border:3px solid var(--map-marker-bg,white);box-shadow:0 2px 6px rgba(15,23,42,0.15);`

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', '16')
    svg.setAttribute('height', '16')
    svg.setAttribute('viewBox', '0 0 24 24')
    svg.setAttribute('fill', 'white')
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', 'M13 2L3 14h9l-1 8 10-12h-9l1-8z')
    svg.appendChild(path)
    circle.appendChild(svg)

    const label = document.createElement('div')
    label.style.cssText =
      'margin-top:2px;background:var(--map-marker-bg,white);border-radius:6px;padding:2px 6px;box-shadow:0 1px 4px rgba(15,23,42,0.12);font-size:10px;font-weight:600;color:var(--map-marker-text,#0f172a);white-space:nowrap;'
    label.textContent = statusText

    const stem = document.createElement('div')
    stem.style.cssText = `width:2px;height:6px;background:${color};border-radius:0 0 1px 1px;`

    div.appendChild(circle)
    div.appendChild(label)
    div.appendChild(stem)
    return div
  }

  buildInfoWindowContent(station) {
    const color = this.getStationColor(station)
    const color2 = this.adjustColor(color, -15)
    const availableCount = station.quickAvailableNum + station.slowAvailableNum
    const statusText = station.openStatus === 0 ? '维护中' : availableCount === 0 ? '已满' : '空闲'
    const price = formatPrice(station.currentPrice, { withSymbol: false })
    const isFav = station.isFavorite
    const self = this

    const content = el(
      'div',
      'background:white;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,0.18);min-width:260px;max-width:300px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;position:relative;'
    )

    const header = el(
      'div',
      `background:linear-gradient(135deg,${color},${color2});padding:12px 16px;display:flex;justify-content:space-between;align-items:center;`
    )
    const title = el(
      'h3',
      'margin:0;color:white;font-size:15px;font-weight:700;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;',
      station.stationName
    )
    const statusBadge = el(
      'span',
      'background:rgba(255,255,255,0.25);color:white;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;',
      statusText
    )
    header.append(title, statusBadge)

    const body = el('div', 'padding:14px 16px;')
    const grid = el(
      'div',
      'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;'
    )

    const quickBox = el(
      'div',
      'background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:8px 10px;text-align:center;'
    )
    quickBox.append(
      el('div', 'color:#166534;font-size:11px;font-weight:600;margin-bottom:2px;', '快充')
    )
    const quickValue = el(
      'div',
      'color:#15803D;font-size:16px;font-weight:800;',
      station.quickAvailableNum
    )
    quickValue.append(
      el('span', 'font-size:12px;font-weight:500;color:#6B7280;', `/${station.quickChargeNum}`)
    )
    quickBox.append(quickValue)

    const slowBox = el(
      'div',
      'background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:8px 10px;text-align:center;'
    )
    slowBox.append(
      el('div', 'color:#1E40AF;font-size:11px;font-weight:600;margin-bottom:2px;', '慢充')
    )
    const slowValue = el(
      'div',
      'color:#2563EB;font-size:16px;font-weight:800;',
      station.slowAvailableNum
    )
    slowValue.append(
      el('span', 'font-size:12px;font-weight:500;color:#6B7280;', `/${station.slowChargeNum}`)
    )
    slowBox.append(slowValue)

    grid.append(quickBox, slowBox)
    body.append(
      grid,
      el('p', 'margin:0 0 10px 0;color:#4B5563;font-size:12px;line-height:1.5;', station.address)
    )

    const footer = el(
      'div',
      'display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid #E5E7EB;'
    )
    const footerLeft = el('div', 'display:flex;gap:8px;')

    const favBtn = el(
      'div',
      `display:flex;align-items:center;gap:4px;background:${isFav ? '#FEE2E2' : '#F3F4F6'};color:${isFav ? '#EF4444' : '#6B7280'};padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:transform 0.15s;`
    )
    favBtn.className = 'info-fav-btn'
    favBtn.setAttribute('data-station-id', station.stationId)
    favBtn.append(
      el('span', 'font-size:14px;', isFav ? '♥' : '♡'),
      el('span', '', isFav ? '已收藏' : '收藏')
    )
    favBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      window.dispatchEvent(
        new CustomEvent('toggleFavoriteFromMap', {
          detail: { stationId: station.stationId }
        })
      )
    })
    favBtn.addEventListener('mouseenter', () => {
      favBtn.style.transform = 'scale(1.05)'
    })
    favBtn.addEventListener('mouseleave', () => {
      favBtn.style.transform = 'scale(1)'
    })

    const detailBtn = el(
      'div',
      'display:flex;align-items:center;gap:4px;background:#EFF6FF;color:#2563EB;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:transform 0.15s;'
    )
    detailBtn.className = 'info-detail-btn'
    detailBtn.setAttribute('data-station-id', station.stationId)
    detailBtn.append(el('span', '', '详情'))
    detailBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      self.closeInfoWindow()
      window.dispatchEvent(new CustomEvent('viewStationDetailFromMap', { detail: station }))
    })
    detailBtn.addEventListener('mouseenter', () => {
      detailBtn.style.transform = 'scale(1.05)'
    })
    detailBtn.addEventListener('mouseleave', () => {
      detailBtn.style.transform = 'scale(1)'
    })

    footerLeft.append(favBtn, detailBtn)

    const footerRight = el('div', 'display:flex;align-items:center;gap:8px;')
    const navBtn = el(
      'div',
      'background:linear-gradient(135deg,#10B981,#059669);color:white;padding:6px 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:transform 0.15s;',
      '导航'
    )
    navBtn.className = 'info-nav-btn'
    navBtn.setAttribute('data-station-id', station.stationId)
    navBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      self.closeInfoWindow()
      window.dispatchEvent(new CustomEvent('navigateToStation', { detail: station }))
    })
    navBtn.addEventListener('mouseenter', () => {
      navBtn.style.transform = 'scale(1.05)'
    })
    navBtn.addEventListener('mouseleave', () => {
      navBtn.style.transform = 'scale(1)'
    })
    footerRight.append(
      el('span', 'color:#3B82F6;font-size:12px;font-weight:600;', `¥${price}/度`),
      navBtn
    )

    footer.append(footerLeft, footerRight)
    body.append(footer)
    content.append(header, body)

    return content
  }

  _ensureInfoWindow() {
    if (!this._infoWindow) {
      this._infoWindow = new AMap.InfoWindow({
        offset: new AMap.Pixel(0, -50),
        isCustom: true
      })
    }
    return this._infoWindow
  }

  _openStationInfoWindow(station, position) {
    if (!this.map || !station) return
    const current = this._stationIndex.get(station.stationId) || station
    const infoWindow = this._ensureInfoWindow()
    infoWindow.setContent(this.buildInfoWindowContent(current))
    this._activeStationId = current.stationId
    this._openInfoWindow(infoWindow, position)
  }

  refreshMarker(stationId) {
    const station = this._stationIndex.get(stationId)
    if (!station) return
    const marker = this._markersByStationId.get(stationId)
    if (marker && typeof marker.setContent === 'function') {
      marker.setContent(this.createStationMarkerContent(station))
    }
    if (this._infoWindow && this._activeStationId === stationId) {
      this._infoWindow.setContent(this.buildInfoWindowContent(station))
    }
  }

  _openInfoWindow(infoWindow, position) {
    if (!this.map) return
    if (this._currentInfoWindow && this._currentInfoWindow !== infoWindow) {
      this._currentInfoWindow.close()
    }
    infoWindow.open(this.map, position)
    this._currentInfoWindow = infoWindow
  }

  closeInfoWindow() {
    if (!this.map) return
    if (this._currentInfoWindow) {
      this._currentInfoWindow.close()
      this._currentInfoWindow = null
    }
    this._activeStationId = null
  }

  _clearDirectMarkers() {
    this._directMarkers.forEach((m) => {
      if (this.map) this.map.remove(m)
    })
    this._directMarkers = []
  }

  _markerSignatureFor(points) {
    if (points.length === 0) return '0'
    const ids = points
      .map((point) => point.station?.stationId ?? `${point.lnglat[0]},${point.lnglat[1]}`)
      .sort()
    return `${points.length}:${ids.join('|')}`
  }

  updateMarkers(filteredStations) {
    if (!this.map) {
      console.error('[MapManager] Map not initialized!')
      return
    }

    const points = filteredStations
      .filter((station) => station.lng && station.lat)
      .map((station) => ({
        lnglat: [station.lng, station.lat],
        weight: 1,
        station: station
      }))

    const signature = this._markerSignatureFor(points)
    if (signature === this._markerSignature) {
      return
    }
    this._markerSignature = signature

    if (points.length === 0) {
      this._clearDirectMarkers()
      this._markersByStationId = new Map()
      if (this.markerClusterer) {
        if (typeof this.markerClusterer.setPoints === 'function') {
          this.markerClusterer.setPoints([])
        } else {
          this.markerClusterer.setMap(null)
          this.markerClusterer = null
        }
      }
      return
    }

    const self = this
    this._markersByStationId = new Map()

    const renderMarker = (context) => {
      const data = context.data
      const station = data[0].station
      const markerContent = self.createStationMarkerContent(station)
      context.marker.setContent(markerContent)
      context.marker.setOffset(new AMap.Pixel(-18, -50))
      self._markersByStationId.set(station.stationId, context.marker)

      context.marker.on('click', () => {
        self._openStationInfoWindow(station, context.marker.getPosition())
      })
    }

    const renderClusterMarker = (context) => {
      const count = context.count

      let totalAvailable = 0
      let totalCount = 0
      let hasOpenStation = false

      const dataItems = context.data || context.clusterData || []
      if (Array.isArray(dataItems) && dataItems.length > 0) {
        dataItems.forEach((item) => {
          const station =
            item.station || (item.stationId != null ? self._stationIndex.get(item.stationId) : null)
          if (station) {
            totalAvailable += (station.quickAvailableNum || 0) + (station.slowAvailableNum || 0)
            totalCount += (station.quickChargeNum || 0) + (station.slowChargeNum || 0)
            if (station.openStatus !== 0) {
              hasOpenStation = true
            }
          }
        })
      }

      if (!hasOpenStation && totalCount === 0) {
        hasOpenStation = true
      }

      let statusColor = '#6B7280'
      if (hasOpenStation) {
        if (totalAvailable === 0) {
          statusColor = '#EF4444'
        } else if (totalCount > 0 && (totalCount - totalAvailable) / totalCount >= 0.8) {
          statusColor = '#F59E0B'
        } else {
          statusColor = '#10B981'
        }
      }

      const size = count >= 100 ? 64 : count >= 50 ? 58 : count >= 20 ? 52 : 44
      const fontSize = count >= 50 ? '18px' : '15px'

      const div = document.createElement('div')
      div.className = 'map-cluster'
      div.style.cssText = `background:var(--map-marker-bg,white);width:${size}px;height:${size}px;border:2px solid ${statusColor};border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--map-marker-text,#0f172a);font-weight:700;font-size:${fontSize};cursor:pointer;`
      div.setAttribute('role', 'button')
      div.tabIndex = 0
      div.setAttribute(
        'aria-label',
        `${count} 个站点，${totalAvailable} 个空闲充电桩，放大地图查看`
      )
      div.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          div.click()
        }
      })

      const numDiv = document.createElement('div')
      numDiv.textContent = count
      div.appendChild(numDiv)

      if (totalAvailable > 0) {
        const availDiv = document.createElement('div')
        availDiv.style.cssText =
          'font-size:9px;font-weight:500;margin-top:1px;color:var(--map-marker-muted,#475569);'
        availDiv.textContent = `${totalAvailable}可用`
        div.appendChild(availDiv)
      }

      div.addEventListener('click', () => {
        const clusterMarkers = context.clusterMarkers || context.markers || []
        if (clusterMarkers.length > 0) {
          const bounds = new AMap.Bounds()
          clusterMarkers.forEach((m) => {
            const pos = m.getPosition ? m.getPosition() : m
            bounds.extend(pos)
          })
          self.map.setBounds(bounds, false, [60, 60, 60, 60])
        } else {
          const center = context.marker.getPosition()
          const currentZoom = self.map.getZoom()
          self.map.setCenter(center)
          self.map.setZoom(currentZoom + 3)
        }
      })

      context.marker.setOffset(new AMap.Pixel(-size / 2, -size / 2))
      context.marker.setContent(div)
    }

    try {
      const ClusterClass = AMap.MarkerCluster || AMap.MarkerClusterer
      if (!ClusterClass) {
        console.warn('[MapManager] MarkerCluster not available, adding markers directly')
        this._clearDirectMarkers()
        points.forEach((point) => {
          const station = point.station
          const marker = new AMap.Marker({
            position: point.lnglat,
            content: self.createStationMarkerContent(station),
            offset: new AMap.Pixel(-18, -50),
            title: station.stationName,
            extData: station
          })
          marker.on('click', () => self._openStationInfoWindow(station, marker.getPosition()))
          self._markersByStationId.set(station.stationId, marker)
          self.map.add(marker)
          self._directMarkers.push(marker)
        })
        return
      }

      this._clearDirectMarkers()

      if (this.markerClusterer && typeof this.markerClusterer.setPoints === 'function') {
        this.markerClusterer.setPoints(points)
      } else {
        if (this.markerClusterer) {
          this.markerClusterer.setMap(null)
          this.markerClusterer = null
        }
        const clusterOptions = {
          gridSize: 80,
          maxZoom: 16,
          minClusterSize: 2,
          renderMarker: renderMarker,
          renderClusterMarker: renderClusterMarker
        }
        this.markerClusterer = new ClusterClass(this.map, [], clusterOptions)
        if (typeof this.markerClusterer.setPoints === 'function') {
          this.markerClusterer.setPoints(points)
        } else {
          this.markerClusterer.setMap(null)
          this.markerClusterer = new ClusterClass(this.map, points, clusterOptions)
        }
      }
    } catch (err) {
      console.error('[MapManager] MarkerCluster error:', err)
      this._clearDirectMarkers()
      points.forEach((point) => {
        const station = point.station
        const marker = new AMap.Marker({
          position: point.lnglat,
          content: self.createStationMarkerContent(station),
          offset: new AMap.Pixel(-18, -50),
          title: station.stationName,
          extData: station
        })
        marker.on('click', () => self._openStationInfoWindow(station, marker.getPosition()))
        self._markersByStationId.set(station.stationId, marker)
        self.map.add(marker)
        self._directMarkers.push(marker)
      })
    }
  }

  _addUserMarker(lng, lat, accuracy) {
    if (!this.map) return
    if (this._userMarker) {
      this.map.remove(this._userMarker)
    }
    this._userMarker = new AMap.Marker({
      position: [lng, lat],
      content:
        '<div style="width:20px;height:20px;background:rgba(59,130,246,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;"><div style="width:12px;height:12px;background:#3B82F6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,0.5);"></div></div>',
      offset: new AMap.Pixel(-10, -10),
      zIndex: 200
    })
    this.map.add(this._userMarker)

    if (this._accuracyCircle) {
      this.map.remove(this._accuracyCircle)
      this._accuracyCircle = null
    }
    if (Number.isFinite(accuracy) && accuracy > 0) {
      this._accuracyCircle = new AMap.Circle({
        center: [lng, lat],
        radius: accuracy,
        strokeColor: '#3B82F6',
        strokeOpacity: 0.3,
        strokeWeight: 1,
        fillColor: '#3B82F6',
        fillOpacity: 0.08,
        zIndex: 199
      })
      this.map.add(this._accuracyCircle)
    }
  }

  locateUser() {
    if (!this.map) return Promise.reject(locationError('MAP_UNAVAILABLE', '地图未初始化'))
    if (this._locationRequest?.map === this.map) return this._locationRequest.promise

    const request = { map: this.map, active: true, timer: null }
    request.promise = new Promise((resolve, reject) => {
      request.finish = (error, location) => {
        if (!request.active) return
        request.active = false
        clearTimeout(request.timer)
        if (this._locationRequest === request) this._locationRequest = null
        if (error) reject(error)
        else resolve(location)
      }
    })
    this._locationRequest = request
    request.timer = setTimeout(() => {
      request.finish(locationError('LOCATION_TIMEOUT', '定位超时，请检查系统位置服务或网络后重试'))
    }, LOCATION_TIMEOUT_MS)
    this._startLocation(request).catch((error) => request.finish(error))
    return request.promise
  }

  _cancelLocation() {
    this._locationRequest?.finish(locationError('LOCATION_CANCELLED', '定位请求已取消'))
  }

  _isCurrentLocation(request) {
    return request.active && this._locationRequest === request && this.map === request.map
  }

  async _startLocation(request) {
    if (globalThis.isSecureContext === false)
      throw locationError(
        'INSECURE_CONTEXT',
        '定位需要 HTTPS 或 localhost，请不要使用普通 HTTP 局域网地址'
      )
    if (!globalThis.navigator?.geolocation)
      throw locationError(
        'LOCATION_UNSUPPORTED',
        '当前浏览器没有提供设备定位，请在支持定位的普通浏览器中打开'
      )
    let permission
    try {
      permission = await navigator.permissions?.query({ name: 'geolocation' })
    } catch {
      /* Some browsers do not expose geolocation in the Permissions API. */
    }
    if (!this._isCurrentLocation(request)) return
    if (permission?.state === 'denied')
      throw locationError(
        'PERMISSION_DENIED',
        '定位权限被拒绝，请允许浏览器与系统位置访问；内嵌预览无法授权时请在普通浏览器打开'
      )
    if (this._geolocation) {
      this._doLocate(request)
      return
    }
    if (typeof AMap === 'undefined' || typeof AMap.plugin !== 'function')
      throw locationError('LOCATION_PLUGIN_FAILED', '定位插件加载失败，请重试')
    AMap.plugin(['AMap.Geolocation'], () => {
      if (!this._isCurrentLocation(request)) return
      try {
        this._geolocation = new AMap.Geolocation({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
          convert: true,
          showButton: false,
          showMarker: false,
          showCircle: false,
          panToLocation: false,
          zoomToAccuracy: false,
          GeoLocationFirst: true,
          noIpLocate: 3,
          noGeoLocation: 0,
          getCityWhenFail: false,
          needAddress: false
        })
        request.map.addControl(this._geolocation)
        this._doLocate(request)
      } catch (error) {
        request.finish(error)
      }
    })
  }

  _doLocate(request) {
    this._geolocation.getCurrentPosition((status, result) => {
      if (!this._isCurrentLocation(request)) return
      if (status !== 'complete') {
        const message = String(result?.message || result?.info || '')
        const denied = result?.code === 1 || /permission|denied|权限/i.test(message)
        request.finish(
          locationError(
            denied ? 'PERMISSION_DENIED' : 'LOCATION_FAILED',
            denied
              ? '定位权限被拒绝，请检查浏览器和系统位置访问；内嵌预览无法授权时请在普通浏览器打开'
              : '未能获取设备位置，请检查系统位置服务或网络后重试；不会改用 IP 城市冒充当前位置'
          )
        )
        return
      }
      try {
        const location = normalizeLocation(result)
        const applyLocation = (normalized) => {
          if (!this._isCurrentLocation(request)) return
          const accepted = { ...normalized, coordinateSystem: 'GCJ-02', receivedAt: Date.now() }
          this._addUserMarker(accepted.lng, accepted.lat, accepted.accuracy)
          request.map.setCenter([accepted.lng, accepted.lat])
          request.map.setZoom(
            accepted.quality === 'reported' ? 15 : accepted.accuracy > 1000 ? 11 : 13
          )
          this._userLocation = accepted
          request.finish(null, accepted)
        }
        // The live SDK can report isConverted=false alongside "Convert Success."
        // for HTML5 fixes that are already GCJ-02. Do not offset those twice.
        const sdkConverted = /convert\s*success|转换成功/i.test(String(result.message || ''))
        if ((result.isConverted === false || result.isConverted === 0) && !sdkConverted) {
          if (typeof AMap.convertFrom !== 'function')
            throw locationError('COORDINATE_CONVERSION_FAILED', '设备坐标未转换为地图坐标，请重试')
          AMap.convertFrom([location.lng, location.lat], 'gps', (conversionStatus, converted) => {
            if (!this._isCurrentLocation(request)) return
            try {
              if (conversionStatus !== 'complete' || !converted?.locations?.length)
                throw locationError(
                  'COORDINATE_CONVERSION_FAILED',
                  '设备坐标转换失败，未移动地图，请重试'
                )
              applyLocation(normalizeLocation({ ...result, position: converted.locations[0] }))
            } catch (error) {
              request.finish(error)
            }
          })
        } else applyLocation(location)
      } catch (error) {
        request.finish(error)
      }
    })
  }

  locateStation(station) {
    if (!this.map || !station.lng || !station.lat) return
    this.map.setCenter([station.lng, station.lat])
    this.map.setZoom(15)
  }

  navigateToStation(station) {
    if (!this.map || !station || !station.lng || !station.lat) {
      console.warn('[MapManager] Cannot navigate: map or station position missing')
      return
    }

    this.clearRoute()
    this.closeInfoWindow()

    const self = this
    const map = this.map
    const revision = this._routeRevision
    const isCurrent = () => this.map === map && this._routeRevision === revision
    const endLng = station.lng
    const endLat = station.lat

    const doDriving = (startLng, startLat) => {
      if (!isCurrent()) return
      const origin = this._userLocation ? { ...this._userLocation } : null
      if (import.meta.env.DEV) {
        console.log(
          '[MapManager] Planning route from [',
          startLng,
          startLat,
          '] to [',
          endLng,
          endLat,
          ']'
        )
      }

      AMap.plugin(['AMap.Driving'], () => {
        if (!isCurrent()) return
        try {
          const driving = new AMap.Driving({
            map: self.map,
            autoFitView: true
          })
          self._driving = driving

          driving.search(
            new AMap.LngLat(startLng, startLat),
            new AMap.LngLat(endLng, endLat),
            function (status, result) {
              if (!isCurrent()) {
                driving.clear()
                return
              }
              if (import.meta.env.DEV) {
                console.log(
                  '[MapManager] Driving search result:',
                  status,
                  JSON.stringify(result).substring(0, 500)
                )
              }
              if (status === 'complete') {
                if (result.routes && result.routes.length > 0) {
                  const route = result.routes[0]
                  const distance = (route.distance / 1000).toFixed(1)
                  const duration = Math.ceil(route.time / 60)
                  window.dispatchEvent(
                    new CustomEvent('routeResult', {
                      detail: { distance, duration, station, origin }
                    })
                  )
                } else {
                  window.dispatchEvent(
                    new CustomEvent('routeResult', {
                      detail: { error: '未找到可行路线' }
                    })
                  )
                }
              } else {
                console.error('[MapManager] Route planning error:', status, result)
                let errMsg = '路线规划失败'
                if (result === 'INVALID_USER_SCODE') {
                  errMsg = '安全密钥无效，路线规划服务不可用'
                } else if (typeof result === 'string') {
                  errMsg = '路线规划失败：' + result
                } else if (result && result.info) {
                  errMsg = '路线规划失败：' + result.info
                }
                window.dispatchEvent(
                  new CustomEvent('routeResult', {
                    detail: { error: errMsg }
                  })
                )
              }
            }
          )
        } catch (e) {
          console.error('[MapManager] Failed to create AMap.Driving:', e)
          window.dispatchEvent(
            new CustomEvent('routeResult', {
              detail: { error: '导航服务初始化失败：' + e.message }
            })
          )
        }
      })
    }

    if (this._userLocation) {
      doDriving(this._userLocation.lng, this._userLocation.lat)
    } else {
      this.locateUser()
        .then((loc) => {
          doDriving(loc.lng, loc.lat)
        })
        .catch((error) => {
          if (!isCurrent()) return
          window.dispatchEvent(
            new CustomEvent('routeResult', {
              detail: { error: `${error.message || '定位失败'}；未使用地图中心作为导航起点` }
            })
          )
        })
    }
  }

  clearRoute() {
    // Invalidate work that is still locating, loading the plugin or searching.
    this._routeRevision++
    if (this._driving) {
      this._driving.clear()
      this._driving = null
    }
  }

  zoomIn() {
    if (!this.map) return
    this.map.zoomIn()
  }

  zoomOut() {
    if (!this.map) return
    this.map.zoomOut()
  }

  destroy() {
    this._cancelLocation()
    this.closeInfoWindow()
    this.clearRoute()
    this._clearDirectMarkers()
    if (this.markerClusterer) {
      this.markerClusterer.setMap(null)
      this.markerClusterer = null
    }
    if (this._geolocation) {
      if (this.map && typeof this.map.removeControl === 'function') {
        this.map.removeControl(this._geolocation)
      }
      this._geolocation = null
    }
    if (this._userMarker && this.map) {
      this.map.remove(this._userMarker)
    }
    this._userMarker = null
    if (this._accuracyCircle && this.map) {
      this.map.remove(this._accuracyCircle)
    }
    this._accuracyCircle = null
    this._userLocation = null
    this._infoWindow = null
    this._currentInfoWindow = null
    this._activeStationId = null
    this._driving = null
    this._stationIndex = new Map()
    this._markersByStationId = new Map()
    this._markerSignature = ''
    this.map = null
    this.stations = []
  }
}

const mapManager = new MapManager()
export default mapManager
