import { chargingDurationSeconds, validateChargingSetup, validateEnergyGoal } from './chargingModel'
import { energyAmounts } from './chargingCost'
import { currentPriceFor, parseTimeToMinutes } from './pricing'

export const RECOMMENDATION_PREFERENCES = [
  { id: 'balanced', label: '综合推荐', icon: 'fa-wand-magic-sparkles' },
  { id: 'fastest', label: '更快充好', icon: 'fa-bolt' },
  { id: 'cheapest', label: '更省钱', icon: 'fa-coins' },
  { id: 'nearest', label: '距离优先', icon: 'fa-location-arrow' }
]

export function isStationOpenNow(station, date) {
  if (station.openStatus !== 1) return false
  if (!station.openTime) return true
  const [start, end] = station.openTime.split('-').map(parseTimeToMinutes)
  if (start == null || end == null || start === end) return false
  const minutes = date.getHours() * 60 + date.getMinutes()
  return start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end
}

export function energyGoalError(vehicle, goal, hasLocation) {
  try {
    validateEnergyGoal({ vehicle, ...goal })
    if (goal.preference === 'nearest' && !hasLocation)
      return '按距离推荐需要设备定位，请先定位或选择其他偏好。'
    return ''
  } catch (error) {
    return error.message
  }
}

export function analyzeStation(
  station,
  vehicle,
  goal,
  { now = new Date(), hasLocation = false } = {}
) {
  if (!station.detailsLoaded || !isStationOpenNow(station, now)) return null
  const available = [
    ...(station.details?.fastConnectors || []),
    ...(station.details?.slowConnectors || [])
  ]
    .filter(
      (connector) =>
        connector.status === 1 &&
        connector.connectorType === vehicle.connectorType &&
        Number.isFinite(connector.power) &&
        connector.power > 0
    )
    .sort(
      (a, b) =>
        Math.min(b.power, vehicle.maxPower) - Math.min(a.power, vehicle.maxPower) ||
        String(a.id).localeCompare(String(b.id))
    )
  if (!available.length) return null
  const price = currentPriceFor(station, now)
  if (!Number.isFinite(price) || price < 0) return null
  try {
    const model = validateChargingSetup({
      station: { ...station, currentPrice: price },
      connector: available[0],
      vehicle,
      ...goal
    })
    return {
      station,
      connector: available[0],
      model,
      price,
      compatibleAvailable: available.length,
      durationSeconds: chargingDurationSeconds(model),
      ...energyAmounts(model.targetEnergy, price),
      distance:
        hasLocation && Number.isFinite(station.distance) && station.distance >= 0
          ? station.distance
          : null
    }
  } catch {
    return null
  }
}

// Relative, explainable trade-offs, not a probability or an opaque AI score.
export function rankStations(stations, vehicle, goal, options = {}) {
  if (energyGoalError(vehicle, goal, options.hasLocation)) return []
  const entries = stations
    .map((station) => analyzeStation(station, vehicle, goal, options))
    .filter(Boolean)
  if (!entries.length) return []
  const weights = {
    balanced:
      goal.initialBattery <= 20 && options.hasLocation
        ? [0.2, 0.2, 0.5, 0.1]
        : [0.35, 0.35, 0.2, 0.1],
    fastest: [0.1, 0.75, 0.1, 0.05],
    cheapest: [0.8, 0.1, 0.05, 0.05],
    nearest: [0.1, 0.1, 0.75, 0.05]
  }[goal.preference] || [0.35, 0.35, 0.2, 0.1]
  const keys = ['totalAmount', 'durationSeconds', 'distance']
  const limits = keys.map((key) => {
    const values = entries.map((entry) => entry[key]).filter(Number.isFinite)
    return values.length ? [Math.min(...values), Math.max(...values)] : [0, 0]
  })
  const useDistance =
    !!options.hasLocation && entries.every((entry) => Number.isFinite(entry.distance))
  const effective = [...weights]
  if (!useDistance) effective[2] = 0
  const sum = effective.reduce((total, weight) => total + weight, 0)
  for (const entry of entries) {
    const penalties = keys.map((key, index) => {
      const [min, max] = limits[index]
      return max > min && Number.isFinite(entry[key]) ? (entry[key] - min) / (max - min) : 0
    })
    penalties.push(1 / Math.min(entry.compatibleAvailable, 6))
    entry.score =
      penalties.reduce((score, value, index) => score + value * effective[index], 0) / sum
    entry.isCheapest = entry.totalAmount === limits[0][0]
    entry.isFastest = entry.durationSeconds === limits[1][0]
    entry.isNearest = useDistance && entry.distance === limits[2][0]
  }
  const primaryKey = { cheapest: 'totalAmount', fastest: 'durationSeconds', nearest: 'distance' }[
    goal.preference
  ]
  return entries.sort(
    (a, b) =>
      (primaryKey ? a[primaryKey] - b[primaryKey] : 0) ||
      a.score - b.score ||
      a.totalAmount - b.totalAmount ||
      a.durationSeconds - b.durationSeconds ||
      a.station.stationId.localeCompare(b.station.stationId)
  )
}
