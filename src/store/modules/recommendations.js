import { defineStore } from 'pinia'
import { useStationsStore } from './stations'
import { useUserStore } from './user'
import { loadStationDetail, partIdFor } from '../../services/api'
import { currentPriceFor } from '../../utils/pricing'
import {
  energyGoalError,
  rankStations,
  RECOMMENDATION_PREFERENCES
} from '../../utils/stationRecommendations'

const GOAL_STORAGE_KEY = 'chargingEnergyGoal'
const scopeKey = (stations) =>
  stations
    .map((station) => station.stationId)
    .sort()
    .join('|')

export const useRecommendationsStore = defineStore('recommendations', {
  state: () => ({
    goal: { vehicleId: '', initialBattery: 35, targetBattery: 80, preference: 'balanced' },
    status: 'idle',
    requestId: 0,
    analyzedScope: '',
    failedCount: 0,
    checkedCount: 0,
    now: Date.now(),
    comparisonIds: []
  }),
  getters: {
    vehicle(state) {
      const vehicles = useUserStore().vehicles
      return state.goal.vehicleId
        ? vehicles.find((vehicle) => vehicle.id === state.goal.vehicleId)
        : vehicles.find((vehicle) => vehicle.isDefault) || vehicles[0]
    },
    candidates: () => useStationsStore().viewportStations,
    currentScope() {
      return scopeKey(this.candidates)
    },
    validationError() {
      return energyGoalError(this.vehicle, this.goal, !!useStationsStore().userLocation)
    },
    isCurrent() {
      return this.status === 'ready' && this.analyzedScope === this.currentScope
    },
    ranked() {
      if (!this.isCurrent || this.validationError) return []
      return rankStations(this.candidates, this.vehicle, this.goal, {
        now: new Date(this.now),
        hasLocation: !!useStationsStore().userLocation
      })
    },
    entryById() {
      return Object.fromEntries(this.ranked.map((entry) => [entry.station.stationId, entry]))
    },
    highlights() {
      const compared = this.comparison.map((entry) => entry.station.stationId)
      const ids = [
        ...new Set([
          ...compared,
          ...this.ranked.slice(0, 3).map((entry) => entry.station.stationId)
        ])
      ].slice(0, 3)
      return ids.map((id) => ({
        ...this.entryById[id],
        label: compared.includes(id)
          ? compared.indexOf(id) === 0
            ? '对比 A'
            : '对比 B'
          : id === this.ranked[0]?.station.stationId
            ? '本次推荐'
            : '推荐备选'
      }))
    },
    comparison() {
      return this.comparisonIds.map((id) => this.entryById[id]).filter(Boolean)
    },
    orderedStations() {
      if (!this.ranked.length) return this.candidates
      const rankedIds = new Set(this.ranked.map((entry) => entry.station.stationId))
      return [
        ...this.ranked.map((entry) => entry.station),
        ...this.candidates.filter((station) => !rankedIds.has(station.stationId))
      ]
    }
  },
  actions: {
    updateGoal(patch) {
      this.goal = { ...this.goal, ...patch }
      useStationsStore().listPage = 1
      if (!this.validationError) {
        try {
          localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(this.goal))
        } catch {
          /* Current-page inputs remain usable. */
        }
      }
    },
    loadGoal() {
      try {
        const saved = JSON.parse(localStorage.getItem(GOAL_STORAGE_KEY) || 'null')
        if (
          !saved ||
          typeof saved.vehicleId !== 'string' ||
          !RECOMMENDATION_PREFERENCES.some((item) => item.id === saved.preference)
        )
          return
        if (
          !Number.isFinite(saved.initialBattery) ||
          saved.initialBattery < 0 ||
          saved.initialBattery >= 100 ||
          !Number.isFinite(saved.targetBattery) ||
          saved.targetBattery <= saved.initialBattery ||
          saved.targetBattery > 100
        )
          return
        this.goal = {
          vehicleId: saved.vehicleId,
          initialBattery: saved.initialBattery,
          targetBattery: saved.targetBattery,
          preference: saved.preference
        }
      } catch {
        /* Ignore corrupt or blocked local preferences. */
      }
    },
    async analyze() {
      if (this.validationError || useStationsStore().isLoading || useStationsStore().error) return
      const requestId = ++this.requestId
      const candidates = [...this.candidates]
      const scope = scopeKey(candidates)
      this.status = 'loading'
      this.failedCount = 0
      this.checkedCount = 0
      this.comparisonIds = []
      // One work item per shard; at most four requests in flight. A failed
      // shard is counted once, not retried separately for every station in it.
      const groups = new Map()
      for (const station of candidates) {
        if (station.detailsLoaded && station.details) {
          this.checkedCount++
          continue
        }
        try {
          const part = partIdFor(station.stationId)
          if (!groups.has(part)) groups.set(part, [])
          groups.get(part).push(station)
        } catch {
          this.failedCount++
        }
      }
      const queue = [...groups.values()]
      const worker = async () => {
        while (queue.length && requestId === this.requestId) {
          const group = queue.shift()
          try {
            const first = await loadStationDetail(group[0].stationId)
            for (const [index, station] of group.entries()) {
              const details = index === 0 ? first : await loadStationDetail(station.stationId)
              if (requestId !== this.requestId) return
              // Loading details does not select a station or touch its error UI.
              station.details = details
              station.detailsLoaded = true
              station.currentPrice = currentPriceFor(station, new Date(this.now))
              this.checkedCount++
            }
          } catch {
            if (requestId === this.requestId)
              this.failedCount += group.filter((station) => !station.detailsLoaded).length
          }
        }
      }
      await Promise.all(Array.from({ length: Math.min(4, queue.length) }, worker))
      if (requestId !== this.requestId) return
      this.now = Date.now()
      this.analyzedScope = scope
      this.status = this.failedCount && !this.checkedCount ? 'error' : 'ready'
      useStationsStore().listPage = 1
    },
    toggleComparison(stationId) {
      const current = this.comparison.map((entry) => entry.station.stationId)
      if (current.includes(stationId)) this.comparisonIds = current.filter((id) => id !== stationId)
      else if (current.length < 2 && this.entryById[stationId])
        this.comparisonIds = [...current, stationId]
    },
    setupForStation(stationId) {
      if (!this.entryById[stationId] || !this.vehicle) return null
      return {
        stationId,
        connectorId: '',
        suggestedConnectorId: this.entryById[stationId].connector.id,
        vehicleId: this.vehicle.id,
        initialBattery: this.goal.initialBattery,
        targetBattery: this.goal.targetBattery,
        clockScale: 60
      }
    }
  }
})
