import { defineStore } from 'pinia'
import { loadStationsList, loadStationDetail } from '../../services/api'
import { currentPriceFor } from '../../utils/pricing'
import mapManager from '../../services/mapService'
import { locationPresentation } from '../../utils/location'
import { DEFAULT_CITY_ID, cityById, cityIdForStation, cityAtLocation } from '../../constants/cities'

const DEFAULT_CONNECTORS = ['CCS Combo', 'GB/T', 'CHAdeMO', 'Type 2']

const notifyError = (message) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('appToast', { detail: { message, type: 'error' } }))
  }
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function compareDistance(a, b) {
  const aMissing = a.distance == null || Number.isNaN(a.distance)
  const bMissing = b.distance == null || Number.isNaN(b.distance)

  if (aMissing && bMissing) return 0
  if (aMissing) return 1
  if (bMissing) return -1
  return a.distance - b.distance
}

export const useStationsStore = defineStore('stations', {
  state: () => ({
    stations: [],
    loadRequestId: 0,
    currentStation: null,
    activeCityId: DEFAULT_CITY_ID,
    cityViewRevision: 0,
    viewingDeviceLocation: false,
    userLocation: null,
    locationStatus: 'idle',
    locationRequestId: 0,
    locationError: '',
    locationErrorCode: '',
    isNavigating: false,
    routeInfo: null,
    filters: {
      quickAvailable: false,
      slowAvailable: false,
      open24h: false,
      reservable: false,
      brand: '',
      connectors: [...DEFAULT_CONNECTORS],
      power: 50
    },
    searchQuery: '',
    isLoading: false,
    error: null,
    detailsError: null,
    detailsRequestId: 0,
    viewportBounds: null,
    listPage: 1,
    listPageSize: 20
  }),

  actions: {
    browseCity(cityId) {
      if (!cityById(cityId)) return false
      // A deliberate city choice wins over a pending device request/route.
      ++this.locationRequestId
      mapManager.cancelLocation?.()
      mapManager.clearRoute()
      mapManager.closeInfoWindow()
      this.stopNavigation()
      this.activeCityId = cityId
      this.viewingDeviceLocation = false
      this.locationStatus = this.userLocation ? 'ready' : 'idle'
      this.locationError = ''
      this.locationErrorCode = ''
      this.currentStation = null
      ++this.detailsRequestId
      this.detailsError = null
      this.searchQuery = ''
      this.viewportBounds = null
      this.listPage = 1
      ++this.cityViewRevision
      return true
    },

    async requestUserLocation() {
      const requestId = ++this.locationRequestId
      this.locationStatus = 'locating'
      this.locationError = ''
      this.locationErrorCode = ''
      try {
        const location = await mapManager.locateUser()
        if (requestId !== this.locationRequestId) return location
        this.userLocation = location
        this.viewingDeviceLocation = true
        const locatedCity = cityAtLocation(location)
        if (locatedCity && locatedCity.id !== this.activeCityId) {
          // Device location was explicitly requested. Update the data region,
          // but don't recenter to its city: the map already shows the real fix.
          this.activeCityId = locatedCity.id
          this.searchQuery = ''
          this.listPage = 1
          this.viewportBounds = null
        }
        this.locationStatus = 'ready'
        this.recalculateDistances()
        return location
      } catch (error) {
        if (requestId !== this.locationRequestId) throw error
        if (error.code === 'LOCATION_CANCELLED')
          this.locationStatus = this.userLocation ? 'ready' : 'idle'
        else {
          this.locationStatus = 'error'
          this.locationError = error.message || '定位失败，请重试'
          this.locationErrorCode = error.code || 'LOCATION_FAILED'
        }
        throw error
      }
    },
    async loadStations() {
      const requestId = ++this.loadRequestId
      this.isLoading = true
      this.error = null

      try {
        const listData = await loadStationsList()
        if (requestId !== this.loadRequestId) return

        this.stations = listData.map((station) => {
          const distance = this.userLocation
            ? haversineDistance(
                this.userLocation.lat,
                this.userLocation.lng,
                station.lat,
                station.lng
              )
            : null
          const initialPrice = Number.parseFloat(station.totalCostPrice)

          return {
            ...station,
            dataSource: 'sandbox',
            currentPrice: Number.isFinite(initialPrice) ? initialPrice : null,
            distance,
            isFavorite: false,
            detailsLoaded: false
          }
        })

        this.stations.sort(compareDistance)
        this.loadFavoriteStations()
      } catch (err) {
        if (requestId !== this.loadRequestId) return
        this.stations = []
        this.error = '站点数据加载失败'
        console.error('加载站点数据失败:', err)
        notifyError(this.error)
      } finally {
        if (requestId === this.loadRequestId) this.isLoading = false
      }
    },

    async loadStationDetails(stationId) {
      const requestId = ++this.detailsRequestId
      const station = this.stations.find((s) => s.stationId === stationId)
      if (!station) return null

      if (station.detailsLoaded && station.details) {
        this.detailsError = null
        return station.details
      }

      this.detailsError = null

      try {
        const details = await loadStationDetail(stationId)
        station.details = details
        station.detailsLoaded = true
        station.currentPrice = currentPriceFor(station)
        return details
      } catch (err) {
        console.error('加载站点详情失败:', err)
        // The old city's failure must not replace feedback for a newer choice.
        if (requestId === this.detailsRequestId) {
          this.detailsError = '站点详情加载失败'
          notifyError(this.detailsError)
        }
        return null
      }
    },

    setViewportBounds(bounds) {
      this.viewportBounds = bounds
      this.listPage = 1
    },

    recalculateDistances() {
      if (!this.userLocation) return
      this.stations.forEach((station) => {
        station.distance = haversineDistance(
          this.userLocation.lat,
          this.userLocation.lng,
          station.lat,
          station.lng
        )
      })
      this.stations.sort(compareDistance)
    },

    async setCurrentStation(station) {
      ++this.detailsRequestId
      const cityId = cityIdForStation(station)
      if (cityById(cityId) && cityId !== this.activeCityId) this.browseCity(cityId)
      this.currentStation = station
      this.detailsError = null
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
        connectors: [...DEFAULT_CONNECTORS],
        power: 50
      }
      this.searchQuery = ''
      this.listPage = 1
    },

    getCurrentPrice(periodPrices) {
      return currentPriceFor({ details: { periodPrices } })
    },

    loadFavoriteStations() {
      try {
        const storedIds = JSON.parse(localStorage.getItem('favoriteStations') || '[]')
        const favoriteStations = Array.isArray(storedIds)
          ? storedIds.filter((id) => typeof id === 'string')
          : []
        this.stations.forEach((station) => {
          station.isFavorite = favoriteStations.includes(station.stationId)
        })
      } catch (err) {
        console.error('加载收藏站点失败:', err)
      }
    },

    saveFavoriteStations() {
      try {
        const favoriteStations = this.stations
          .filter((station) => station.isFavorite)
          .map((station) => station.stationId)
        localStorage.setItem('favoriteStations', JSON.stringify(favoriteStations))
      } catch (err) {
        console.error('保存收藏站点失败:', err)
      }
    },

    toggleFavorite(stationId) {
      const station = this.stations.find((s) => s.stationId === stationId)
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
    activeCity: (state) => cityById(state.activeCityId),
    isLocating: (state) => state.locationStatus === 'locating',
    locationPresentation: (state) => locationPresentation(state),
    activeFilterCount: (state) => {
      let count = 0
      if (state.filters.quickAvailable) count++
      if (state.filters.slowAvailable) count++
      if (state.filters.open24h) count++
      if (state.filters.reservable) count++
      if (state.filters.brand) count++
      if (state.filters.power !== 50) count++
      if (
        state.filters.connectors.length !== DEFAULT_CONNECTORS.length ||
        DEFAULT_CONNECTORS.some((connector) => !state.filters.connectors.includes(connector))
      )
        count++
      return count
    },

    filteredStations: (state) => {
      const filters = state.filters
      const query = state.searchQuery.toLowerCase()

      return state.stations
        .filter((station) => {
          const cityId = cityIdForStation(station)
          if (cityId && cityId !== state.activeCityId) return false
          if (filters.quickAvailable && station.quickAvailableNum <= 0) return false
          if (filters.slowAvailable && station.slowAvailableNum <= 0) return false
          if (filters.open24h && station.openTime !== '00:00-24:00') return false
          if (
            filters.reservable &&
            !(
              station.reservationAvailable &&
              station.openStatus === 1 &&
              (station.quickAvailableNum > 0 || station.slowAvailableNum > 0)
            )
          )
            return false

          if (station.maxPower && station.maxPower < filters.power) return false

          if (filters.brand && !station.stationName.includes(filters.brand)) return false

          const types = station.connectorTypes || station.details?.connectorTypes || []
          if (!filters.connectors.some((connector) => types.includes(connector))) return false

          if (query) {
            if (
              !station.stationName.toLowerCase().includes(query) &&
              !station.address.toLowerCase().includes(query)
            )
              return false
          }

          return true
        })
        .sort(compareDistance)
    },

    viewportStations() {
      const filtered = this.filteredStations
      const bounds = this.viewportBounds

      if (!bounds) return filtered

      return filtered.filter((station) => {
        return (
          station.lng >= bounds.west &&
          station.lng <= bounds.east &&
          station.lat >= bounds.south &&
          station.lat <= bounds.north
        )
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
        .filter((s) => s.isFavorite)
        .map((s) => ({
          id: s.stationId,
          name: s.stationName,
          address: s.address,
          dataSource: s.dataSource,
          availableConnectors: s.quickAvailableNum + s.slowAvailableNum,
          totalConnectors: s.quickChargeNum + s.slowChargeNum,
          distance:
            s.distance == null || Number.isNaN(s.distance) ? null : (s.distance / 1000).toFixed(1),
          power: s.maxPower || null
        }))
    },

    favoriteStationIds: (state) => {
      return state.stations.filter((s) => s.isFavorite).map((s) => s.stationId)
    }
  }
})
