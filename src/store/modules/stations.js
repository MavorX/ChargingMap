import { defineStore } from 'pinia'
import { loadStationsList, loadStationDetail } from '../../services/api'

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export const useStationsStore = defineStore('stations', {
  state: () => ({
    stations: [],
    currentStation: null,
    userLocation: null,
    isNavigating: false,
    routeInfo: null,
    filters: {
      quickAvailable: false,
      slowAvailable: false,
      open24h: false,
      reservable: false,
      brand: '',
      connectors: ['CCS', 'GB/T', 'CHAdeMO', 'Type 2'],
      power: 50
    },
    searchQuery: '',
    isLoading: false,
    error: null,
    viewportBounds: null,
    listPage: 1,
    listPageSize: 20,
    _detailsCache: {}
  }),

  actions: {
    async loadStations() {
      this.isLoading = true
      this.error = null

      try {
        const listData = await loadStationsList()

        this.stations = listData.map(station => {
          const distance = this.userLocation
            ? haversineDistance(this.userLocation.lat, this.userLocation.lng, station.lat, station.lng)
            : (station.distance || 0)

          return {
            ...station,
            currentPrice: 0.87,
            distance: distance,
            isFavorite: false,
            detailsLoaded: false
          }
        })

        this.stations.sort((a, b) => a.distance - b.distance)
        this.loadFavoriteStations()
      } catch (err) {
        this.error = err.message
        console.error('加载站点数据失败:', err)
      } finally {
        this.isLoading = false
      }
    },

    async loadStationDetails(stationId) {
      const station = this.stations.find(s => s.stationId === stationId)
      if (!station) return null

      if (station.detailsLoaded && station.details) {
        return station.details
      }

      if (this._detailsCache[stationId]) {
        station.details = this._detailsCache[stationId]
        station.detailsLoaded = true
        station.currentPrice = this.getCurrentPrice(station.details?.periodPrices)
        return station.details
      }

      try {
        const details = await loadStationDetail(stationId)
        if (details) {
          this._detailsCache[stationId] = details
          station.details = details
          station.detailsLoaded = true
          station.currentPrice = this.getCurrentPrice(details.periodPrices)
        }
        return details
      } catch (err) {
        console.error('加载站点详情失败:', err)
        return null
      }
    },

    setViewportBounds(bounds) {
      this.viewportBounds = bounds
      this.listPage = 1
    },

    recalculateDistances() {
      if (!this.userLocation) return
      this.stations.forEach(station => {
        station.distance = haversineDistance(
          this.userLocation.lat, this.userLocation.lng,
          station.lat, station.lng
        )
      })
      this.stations.sort((a, b) => a.distance - b.distance)
    },

    async setCurrentStation(station) {
      this.currentStation = station
      if (station && !station.detailsLoaded) {
        await this.loadStationDetails(station.stationId)
      }
    },

    updateFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.listPage = 1
    },

    setSearchQuery(query) {
      this.searchQuery = query
      this.listPage = 1
    },

    toggleFilter(key) {
      this.filters[key] = !this.filters[key]
      this.listPage = 1
    },

    resetFilters() {
      this.filters = {
        quickAvailable: false,
        slowAvailable: false,
        open24h: false,
        reservable: false,
        brand: '',
        connectors: ['CCS', 'GB/T', 'CHAdeMO', 'Type 2'],
        power: 50
      }
      this.searchQuery = ''
      this.listPage = 1
    },

    getCurrentPrice(periodPrices) {
      if (!periodPrices || !periodPrices.length) {
        return 0.87
      }

      const currentHour = new Date().getHours()

      for (let period of periodPrices) {
        const start = parseInt(period.startTime.split(':')[0])
        const end = parseInt(period.endTime.split(':')[0])

        if (start < end) {
          if (currentHour >= start && currentHour < end) {
            return parseFloat(period.totalFee)
          }
        } else {
          if (currentHour >= start || currentHour < end) {
            return parseFloat(period.totalFee)
          }
        }
      }

      return 0.87
    },

    loadFavoriteStations() {
      try {
        const favoriteStations = JSON.parse(localStorage.getItem('favoriteStations') || '[]')
        this.stations.forEach(station => {
          station.isFavorite = favoriteStations.includes(station.stationId)
        })
      } catch (err) {
        console.error('加载收藏站点失败:', err)
      }
    },

    saveFavoriteStations() {
      try {
        const favoriteStations = this.stations.filter(station => station.isFavorite).map(station => station.stationId)
        localStorage.setItem('favoriteStations', JSON.stringify(favoriteStations))
      } catch (err) {
        console.error('保存收藏站点失败:', err)
      }
    },

    toggleFavorite(stationId) {
      const station = this.stations.find(s => s.stationId === stationId)
      if (station) {
        station.isFavorite = !station.isFavorite
        this.saveFavoriteStations()
      }
    },

    startNavigation(routeInfo) {
      this.isNavigating = true
      this.routeInfo = routeInfo
    },

    stopNavigation() {
      this.isNavigating = false
      this.routeInfo = null
    }
  },

  getters: {
    activeFilterCount: (state) => {
      let count = 0
      if (state.filters.quickAvailable) count++
      if (state.filters.slowAvailable) count++
      if (state.filters.open24h) count++
      if (state.filters.reservable) count++
      if (state.filters.brand) count++
      return count
    },

    filteredStations: (state) => {
      const filters = state.filters
      const query = state.searchQuery.toLowerCase()

      return state.stations.filter(station => {
        if (filters.quickAvailable && station.quickAvailableNum <= 0) return false
        if (filters.slowAvailable && station.slowAvailableNum <= 0) return false
        if (filters.open24h && station.openTime !== '00:00-24:00') return false
        if (filters.reservable && !(station.reservationAvailable && station.openStatus === 1 && (station.quickAvailableNum > 0 || station.slowAvailableNum > 0))) return false

        if (station.maxPower && station.maxPower < filters.power) return false

        if (station.details && station.details.connectorTypes) {
          const hasMatching = filters.connectors.some(c => station.details.connectorTypes.includes(c))
          if (!hasMatching) return false
        }

        if (query) {
          if (!station.stationName.toLowerCase().includes(query) && !station.address.toLowerCase().includes(query)) return false
        }

        return true
      })
    },

    viewportStations() {
      const filtered = this.filteredStations
      const bounds = this.viewportBounds

      if (!bounds) return filtered

      return filtered.filter(station => {
        return station.lng >= bounds.west &&
               station.lng <= bounds.east &&
               station.lat >= bounds.south &&
               station.lat <= bounds.north
      })
    },

    pagedStations(state) {
      const stations = state.viewportBounds ? this.viewportStations : this.filteredStations
      const start = 0
      const end = state.listPage * state.listPageSize
      return stations.slice(start, end)
    },

    hasMoreStations(state) {
      const stations = state.viewportBounds ? this.viewportStations : this.filteredStations
      return state.listPage * state.listPageSize < stations.length
    },

    totalFilteredCount() {
      return this.filteredStations.length
    },

    viewportStationCount() {
      return this.viewportStations.length
    },

    favoriteStationsList: (state) => {
      return state.stations
        .filter(s => s.isFavorite)
        .map(s => ({
          id: s.stationId,
          name: s.stationName,
          address: s.address,
          availableConnectors: s.quickAvailableNum + s.slowAvailableNum,
          totalConnectors: s.quickChargeNum + s.slowChargeNum,
          distance: (s.distance / 1000).toFixed(1),
          power: s.maxPower || 120
        }))
    },

    favoriteStationIds: (state) => {
      return state.stations.filter(s => s.isFavorite).map(s => s.stationId)
    }
  }
})
