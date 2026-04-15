class MapManager {
  constructor() {
    this.map = null
    this.markerClusterer = null
    this.stations = []
    this._geolocation = null
    this._currentInfoWindow = null
    this._userLocation = null
    this._driving = null
  }

  setMap(mapInstance) {
    this.map = mapInstance
    console.log('[MapManager] Map instance set')
  }

  setStations(stationsData) {
    this.stations = stationsData
    console.log('[MapManager] Stations set:', stationsData.length)
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
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
  }

  createStationMarkerContent(station) {
    const color = this.getStationColor(station)
    const availableCount = station.quickAvailableNum + station.slowAvailableNum
    const statusText = station.openStatus === 0 ? '维护' : availableCount === 0 ? '已满' : `${availableCount}空`

    const div = document.createElement('div')
    div.style.cssText = 'cursor:pointer;display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.25));'
    div.innerHTML = `
      <div style="width:36px;height:36px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2);">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
      </div>
      <div style="margin-top:2px;background:white;border-radius:8px;padding:1px 6px;box-shadow:0 1px 4px rgba(0,0,0,0.15);font-size:10px;font-weight:700;color:${color};white-space:nowrap;">
        ${statusText}
      </div>
      <div style="width:2px;height:6px;background:${color};border-radius:0 0 1px 1px;"></div>
    `
    return div
  }

  createInfoWindow(station) {
    const color = this.getStationColor(station)
    const color2 = this.adjustColor(color, -15)
    const availableCount = station.quickAvailableNum + station.slowAvailableNum
    const statusText = station.openStatus === 0 ? '维护中' : availableCount === 0 ? '已满' : '空闲'
    const price = station.currentPrice ? station.currentPrice.toFixed(2) : '0.87'
    const isFav = station.isFavorite

    const content = document.createElement('div')
    content.style.cssText = 'background:white;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,0.18);min-width:260px;max-width:300px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;position:relative;'
    content.innerHTML = `
      <div style="background:linear-gradient(135deg,${color},${color2});padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
        <h3 style="margin:0;color:white;font-size:15px;font-weight:700;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${station.stationName}</h3>
        <span style="background:rgba(255,255,255,0.25);color:white;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;">${statusText}</span>
      </div>
      <div style="padding:14px 16px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
          <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:8px 10px;text-align:center;">
            <div style="color:#166534;font-size:11px;font-weight:600;margin-bottom:2px;">快充</div>
            <div style="color:#15803D;font-size:16px;font-weight:800;">${station.quickAvailableNum}<span style="font-size:12px;font-weight:500;color:#6B7280;">/${station.quickChargeNum}</span></div>
          </div>
          <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:8px 10px;text-align:center;">
            <div style="color:#1E40AF;font-size:11px;font-weight:600;margin-bottom:2px;">慢充</div>
            <div style="color:#2563EB;font-size:16px;font-weight:800;">${station.slowAvailableNum}<span style="font-size:12px;font-weight:500;color:#6B7280;">/${station.slowChargeNum}</span></div>
          </div>
        </div>
        <p style="margin:0 0 10px 0;color:#4B5563;font-size:12px;line-height:1.5;">${station.address}</p>
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid #E5E7EB;">
          <div style="display:flex;gap:8px;">
            <div class="info-fav-btn" data-station-id="${station.stationId}" style="display:flex;align-items:center;gap:4px;background:${isFav ? '#FEE2E2' : '#F3F4F6'};color:${isFav ? '#EF4444' : '#6B7280'};padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:transform 0.15s;">
              <span style="font-size:14px;">${isFav ? '♥' : '♡'}</span>
              <span>${isFav ? '已收藏' : '收藏'}</span>
            </div>
            <div class="info-detail-btn" data-station-id="${station.stationId}" style="display:flex;align-items:center;gap:4px;background:#EFF6FF;color:#2563EB;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:transform 0.15s;">
              <span>详情</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="color:#3B82F6;font-size:12px;font-weight:600;">¥${price}/度</span>
            <div class="info-nav-btn" data-station-id="${station.stationId}" style="background:linear-gradient(135deg,#10B981,#059669);color:white;padding:6px 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:transform 0.15s;">导航</div>
          </div>
        </div>
      </div>
    `

    const self = this

    const favBtn = content.querySelector('.info-fav-btn')
    favBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      window.dispatchEvent(new CustomEvent('toggleFavoriteFromMap', { detail: { stationId: station.stationId, btnElement: favBtn } }))
    })
    favBtn.addEventListener('mouseenter', () => {
      favBtn.style.transform = 'scale(1.05)'
    })
    favBtn.addEventListener('mouseleave', () => {
      favBtn.style.transform = 'scale(1)'
    })

    const detailBtn = content.querySelector('.info-detail-btn')
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

    const navBtn = content.querySelector('.info-nav-btn')
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

    return new AMap.InfoWindow({
      content: content,
      offset: new AMap.Pixel(0, -50),
      isCustom: true
    })
  }

  _openInfoWindow(infoWindow, position) {
    if (this._currentInfoWindow) {
      this._currentInfoWindow.close()
    }
    infoWindow.open(this.map, position)
    this._currentInfoWindow = infoWindow
  }

  closeInfoWindow() {
    if (this._currentInfoWindow) {
      this._currentInfoWindow.close()
      this._currentInfoWindow = null
    }
  }

  _clearDirectMarkers() {
    if (this._directMarkers) {
      this._directMarkers.forEach(m => {
        if (this.map) this.map.remove(m)
      })
      this._directMarkers = []
    }
  }

  updateMarkers(filteredStations) {
    if (!this.map) {
      console.error('[MapManager] Map not initialized!')
      return
    }

    const points = filteredStations
      .filter(station => station.lng && station.lat)
      .map(station => ({
        lnglat: [station.lng, station.lat],
        weight: 1,
        station: station
      }))

    if (points.length === 0) {
      if (this.markerClusterer) {
        this.markerClusterer.setMap(null)
        this.markerClusterer = null
      }
      return
    }

    const self = this

    const renderMarker = (context) => {
      const data = context.data
      const station = data[0].station
      const markerContent = self.createStationMarkerContent(station)
      context.marker.setContent(markerContent)
      context.marker.setOffset(new AMap.Pixel(-18, -50))

      const infoWindow = self.createInfoWindow(station)

      context.marker.on('click', () => {
        self._openInfoWindow(infoWindow, context.marker.getPosition())
      })
    }

    const stationMap = new Map()
    filteredStations.forEach(s => {
      if (s.lng && s.lat) {
        stationMap.set(`${s.lng},${s.lat}`, s)
      }
    })

    const renderClusterMarker = (context) => {
      const count = context.count

      let totalAvailable = 0
      let totalCount = 0
      let hasOpenStation = false

      const dataItems = context.data || context.clusterData || []
      if (Array.isArray(dataItems) && dataItems.length > 0) {
        dataItems.forEach(item => {
          const station = item.station || stationMap.get(`${item.lnglat?.[0]},${item.lnglat?.[1]}`)
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

      let size, fontSize, subFontSize, bgGradient, borderColor, ringSize
      if (count >= 100) {
        size = 96
        fontSize = '24px'
        subFontSize = '12px'
        bgGradient = `radial-gradient(circle at 35% 35%, ${statusColor}, ${self.adjustColor(statusColor, -40)})`
        borderColor = 'rgba(255,255,255,0.9)'
        ringSize = 5
      } else if (count >= 50) {
        size = 78
        fontSize = '20px'
        subFontSize = '11px'
        bgGradient = `radial-gradient(circle at 35% 35%, ${statusColor}, ${self.adjustColor(statusColor, -30)})`
        borderColor = 'rgba(255,255,255,0.85)'
        ringSize = 4
      } else if (count >= 20) {
        size = 62
        fontSize = '17px'
        subFontSize = '10px'
        bgGradient = `radial-gradient(circle at 35% 35%, ${statusColor}, ${self.adjustColor(statusColor, -20)})`
        borderColor = 'rgba(255,255,255,0.8)'
        ringSize = 3
      } else if (count >= 10) {
        size = 50
        fontSize = '15px'
        subFontSize = '9px'
        bgGradient = `radial-gradient(circle at 35% 35%, ${self.adjustColor(statusColor, 20)}, ${statusColor})`
        borderColor = 'rgba(255,255,255,0.75)'
        ringSize = 3
      } else {
        size = 42
        fontSize = '14px'
        subFontSize = '9px'
        bgGradient = `radial-gradient(circle at 35% 35%, ${self.adjustColor(statusColor, 30)}, ${self.adjustColor(statusColor, 10)})`
        borderColor = 'rgba(255,255,255,0.7)'
        ringSize = 2
      }

      const div = document.createElement('div')
      div.style.cssText = `background:${bgGradient};width:${size}px;height:${size}px;border-radius:${size / 2}px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:${fontSize};box-shadow:0 4px 14px rgba(0,0,0,0.3),0 0 0 ${ringSize}px ${borderColor};cursor:pointer;transition:transform 0.2s ease,box-shadow 0.2s ease;position:relative;`

      if (count >= 50) {
        const pulse = document.createElement('div')
        pulse.style.cssText = `position:absolute;top:-4px;left:-4px;right:-4px;bottom:-4px;border-radius:50%;border:2px solid ${statusColor};opacity:0;animation:clusterPulse 2s ease-out infinite;pointer-events:none;`
        div.appendChild(pulse)
      }

      const numDiv = document.createElement('div')
      numDiv.textContent = count
      div.appendChild(numDiv)

      if (totalAvailable > 0) {
        const availDiv = document.createElement('div')
        availDiv.style.cssText = `font-size:${subFontSize};font-weight:600;margin-top:1px;opacity:0.9;`
        availDiv.textContent = `${totalAvailable}可用`
        div.appendChild(availDiv)
      }

      div.addEventListener('mouseenter', () => {
        div.style.transform = 'scale(1.12)'
        div.style.boxShadow = `0 6px 20px rgba(0,0,0,0.35),0 0 0 ${ringSize + 1}px ${borderColor}`
      })
      div.addEventListener('mouseleave', () => {
        div.style.transform = 'scale(1)'
        div.style.boxShadow = `0 4px 14px rgba(0,0,0,0.3),0 0 0 ${ringSize}px ${borderColor}`
      })

      div.addEventListener('click', () => {
        const clusterMarkers = context.clusterMarkers || context.markers || []
        if (clusterMarkers.length > 0) {
          const bounds = new AMap.Bounds()
          clusterMarkers.forEach(m => {
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
        points.forEach(point => {
          const station = point.station
          const marker = new AMap.Marker({
            position: point.lnglat,
            content: self.createStationMarkerContent(station),
            offset: new AMap.Pixel(-18, -50),
            title: station.stationName,
            extData: station
          })
          const infoWindow = self.createInfoWindow(station)
          marker.on('click', () => self._openInfoWindow(infoWindow, marker.getPosition()))
          self.map.add(marker)
          self._directMarkers.push(marker)
        })
        return
      }

      if (this.markerClusterer && typeof this.markerClusterer.setPoints === 'function') {
        this.markerClusterer.setPoints(points)
      } else {
        if (this.markerClusterer) {
          this.markerClusterer.setMap(null)
          this.markerClusterer = null
        }
        this.markerClusterer = new ClusterClass(this.map, points, {
          gridSize: 80,
          maxZoom: 16,
          minClusterSize: 2,
          renderMarker: renderMarker,
          renderClusterMarker: renderClusterMarker
        })
      }
    } catch (err) {
      console.error('[MapManager] MarkerCluster error:', err)
      this._clearDirectMarkers()
      points.forEach(point => {
        const station = point.station
        const marker = new AMap.Marker({
          position: point.lnglat,
          content: self.createStationMarkerContent(station),
          offset: new AMap.Pixel(-18, -50),
          title: station.stationName,
          extData: station
        })
        self.map.add(marker)
        self._directMarkers.push(marker)
      })
    }
  }

  _addUserMarker(lng, lat, accuracy) {
    if (this._userMarker) {
      this.map.remove(this._userMarker)
    }
    this._userMarker = new AMap.Marker({
      position: [lng, lat],
      content: '<div style="width:20px;height:20px;background:rgba(59,130,246,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;"><div style="width:12px;height:12px;background:#3B82F6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,0.5);"></div></div>',
      offset: new AMap.Pixel(-10, -10),
      zIndex: 200
    })
    this.map.add(this._userMarker)

    if (this._accuracyCircle) {
      this.map.remove(this._accuracyCircle)
    }
    if (accuracy && accuracy > 0) {
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
    return new Promise((resolve, reject) => {
      if (!this.map) {
        reject(new Error('地图未初始化'))
        return
      }

      if (this._geolocation) {
        this._doLocate(resolve, reject)
        return
      }

      AMap.plugin(['AMap.Geolocation'], () => {
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
          useNative: true,
          GeoLocationFirst: true,
          noIpLocate: 0,
          needAddress: false
        })
        this.map.addControl(this._geolocation)
        console.log('[MapManager] Geolocation plugin loaded')
        this._doLocate(resolve, reject)
      })
    })
  }

  _doLocate(resolve, reject) {
    if (!this._geolocation) {
      reject(new Error('定位插件加载失败'))
      return
    }

    this._geolocation.getCurrentPosition((status, result) => {
      console.log('[MapManager] Geolocation result:', status, result)
      if (status === 'complete') {
        const userLocation = {
          lng: result.position.lng,
          lat: result.position.lat,
          accuracy: result.accuracy || 0
        }
        this._userLocation = userLocation
        this._addUserMarker(userLocation.lng, userLocation.lat, userLocation.accuracy)

        if (userLocation.accuracy > 0 && userLocation.accuracy <= 200) {
          this.map.setCenter([userLocation.lng, userLocation.lat])
          this.map.setZoom(15)
        } else {
          this.map.setCenter([userLocation.lng, userLocation.lat])
          this.map.setZoom(14)
        }

        resolve(userLocation)
      } else {
        console.warn('[MapManager] AMap geolocation failed:', result)
        let errorMsg = '定位失败'
        if (result && result.message) {
          if (result.message.includes('permission') || result.message.includes('denied') || result.message.includes('权限')) {
            errorMsg = '定位权限被拒绝，请在浏览器设置中允许位置访问'
          } else if (result.message.includes('timeout') || result.message.includes('超时')) {
            errorMsg = '定位请求超时，请重试'
          } else if (result.message.includes('unavailable') || result.message.includes('不可用')) {
            errorMsg = '无法获取位置信息'
          } else {
            errorMsg = '定位失败：' + result.message
          }
        }
        reject(new Error(errorMsg))
      }
    })
  }

  locateStation(station) {
    if (!this.map || !station.lng || !station.lat) return
    this.map.setCenter([station.lng, station.lat])
    this.map.setZoom(15)
  }

  navigateToStation(station) {
    if (!this.map || !station.lng || !station.lat) {
      console.warn('[MapManager] Cannot navigate: map or station position missing')
      return
    }

    this.clearRoute()
    this.closeInfoWindow()

    const self = this
    const endLng = station.lng
    const endLat = station.lat

    const doDriving = (startLng, startLat) => {
      console.log('[MapManager] Planning route from [', startLng, startLat, '] to [', endLng, endLat, ']')

      AMap.plugin(['AMap.Driving'], () => {
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
              console.log('[MapManager] Driving search result:', status, JSON.stringify(result).substring(0, 500))
              if (status === 'complete') {
                if (result.routes && result.routes.length > 0) {
                  const route = result.routes[0]
                  const distance = (route.distance / 1000).toFixed(1)
                  const duration = Math.ceil(route.time / 60)
                  window.dispatchEvent(new CustomEvent('routeResult', {
                    detail: { distance, duration, station }
                  }))
                } else {
                  window.dispatchEvent(new CustomEvent('routeResult', {
                    detail: { error: '未找到可行路线' }
                  }))
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
                window.dispatchEvent(new CustomEvent('routeResult', {
                  detail: { error: errMsg }
                }))
              }
            }
          )
        } catch (e) {
          console.error('[MapManager] Failed to create AMap.Driving:', e)
          window.dispatchEvent(new CustomEvent('routeResult', {
            detail: { error: '导航服务初始化失败：' + e.message }
          }))
        }
      })
    }

    if (this._userLocation) {
      doDriving(this._userLocation.lng, this._userLocation.lat)
    } else {
      this.locateUser().then((loc) => {
        doDriving(loc.lng, loc.lat)
      }).catch(() => {
        const center = this.map.getCenter()
        doDriving(center.lng, center.lat)
      })
    }
  }

  clearRoute() {
    if (this._driving) {
      this._driving.clear()
      this._driving = null
    }
  }

  zoomIn() {
    if (this.map) this.map.zoomIn()
  }

  zoomOut() {
    if (this.map) this.map.zoomOut()
  }

  destroy() {
    this.closeInfoWindow()
    this.clearRoute()
    this._clearDirectMarkers()
    if (this.markerClusterer) {
      this.markerClusterer.setMap(null)
      this.markerClusterer = null
    }
    if (this._userMarker && this.map) {
      this.map.remove(this._userMarker)
      this._userMarker = null
    }
    if (this._accuracyCircle && this.map) {
      this.map.remove(this._accuracyCircle)
      this._accuracyCircle = null
    }
    this.map = null
    this.stations = []
  }
}

const mapManager = new MapManager()
export default mapManager
