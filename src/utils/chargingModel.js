export const POWER_CURVE_VERSION = 'soc-taper-v1'

// A deliberately simple demo curve, not a manufacturer's battery/BMS model.
// Linear power between SOC knots lets us integrate and invert it analytically:
// no timer-frequency-dependent accumulation, random power or offline energy.
const POWER_KNOTS = [
  [0, 1],
  [60, 1],
  [80, 0.65],
  [90, 0.4],
  [100, 0.18]
]

export const validateEnergyGoal = ({ vehicle, initialBattery, targetBattery }) => {
  if (!vehicle) throw new Error('请选择车辆；不能凭空假定车型和电池容量')
  if (
    !Number.isFinite(vehicle.batteryCapacityKwh) ||
    vehicle.batteryCapacityKwh < 1 ||
    vehicle.batteryCapacityKwh > 200
  )
    throw new Error('请填写车辆可用电池容量（1–200 kWh）')
  if (!Number.isFinite(initialBattery) || initialBattery < 0 || initialBattery >= 100)
    throw new Error('请填写车内仪表当前电量（0–99%）；网页无法直接读取车辆电量')
  if (!Number.isFinite(targetBattery) || targetBattery <= initialBattery || targetBattery > 100)
    throw new Error('目标电量必须大于当前电量且不超过 100%')
  if (!Number.isFinite(vehicle.maxPower) || vehicle.maxPower <= 0)
    throw new Error('充电枪和车辆的功率上限必须明确')
}

export const validateChargingSetup = ({
  station,
  connector,
  vehicle,
  initialBattery,
  targetBattery,
  clockScale = 1
}) => {
  if (!station || station.dataSource !== 'sandbox')
    throw new Error('真实地点未接入运营商设备控制，不能由本网页启动充电')
  if (station.openStatus !== 1 || !connector || connector.status !== 1)
    throw new Error('所选测试枪不可用')
  validateEnergyGoal({ vehicle, initialBattery, targetBattery })
  if (vehicle.connectorType !== connector.connectorType)
    throw new Error('车辆接口与充电枪不匹配，请选择兼容接口')
  if (
    !Number.isFinite(connector.power) ||
    connector.power <= 0 ||
    !Number.isFinite(vehicle.maxPower) ||
    vehicle.maxPower <= 0
  )
    throw new Error('充电枪和车辆的功率上限必须明确')
  if (!Number.isFinite(station.currentPrice) || station.currentPrice < 0)
    throw new Error('测试费率未知，不能估算或启动计费')
  if (![1, 60].includes(clockScale)) throw new Error('仅支持标注的 1× 或 60× 沙盒时间倍率')
  return {
    powerKw: Math.min(connector.power, vehicle.maxPower),
    targetEnergy: ((targetBattery - initialBattery) / 100) * vehicle.batteryCapacityKwh,
    batteryCapacityKwh: vehicle.batteryCapacityKwh,
    initialBattery,
    targetBattery,
    clockScale,
    powerCurve: POWER_CURVE_VERSION
  }
}

export function powerAtBattery(model, battery) {
  if (!model || !Number.isFinite(model.powerKw)) return 0
  // Persisted v1 sessions without a curve keep their original constant model.
  if (model.powerCurve !== POWER_CURVE_VERSION) return model.powerKw
  const soc = Math.max(0, Math.min(100, battery))
  const index = POWER_KNOTS.findIndex(([end]) => end >= soc)
  if (index <= 0) return model.powerKw
  const [start, a] = POWER_KNOTS[index - 1]
  const [end, b] = POWER_KNOTS[index]
  return model.powerKw * (a + ((soc - start) / (end - start)) * (b - a))
}

function segmentsFor(model, from, to) {
  const knots = model.powerCurve === POWER_CURVE_VERSION ? POWER_KNOTS.map(([soc]) => soc) : []
  const stops = [from, ...knots.filter((soc) => soc > from && soc < to), to]
  return stops.slice(1).map((end, index) => {
    const start = stops[index]
    const power = powerAtBattery(model, start)
    const slope = (powerAtBattery(model, end) - power) / (end - start || 1)
    const factor = (model.batteryCapacityKwh / 100) * 3600
    const seconds =
      Math.abs(slope) < 1e-10
        ? ((end - start) * factor) / power
        : (factor / slope) * Math.log((power + slope * (end - start)) / power)
    return { start, end, power, slope, factor, seconds }
  })
}

export function chargingDurationSeconds(
  model,
  from = model?.initialBattery,
  to = model?.targetBattery ?? 100
) {
  if (
    !model ||
    !Number.isFinite(from) ||
    !Number.isFinite(to) ||
    !Number.isFinite(model.powerKw) ||
    !Number.isFinite(model.batteryCapacityKwh) ||
    from < 0 ||
    to > 100 ||
    model.batteryCapacityKwh > 200 ||
    model.powerKw <= 0 ||
    model.batteryCapacityKwh <= 0
  )
    return 0
  if (to <= from) return 0
  return segmentsFor(model, from, to).reduce((sum, segment) => sum + segment.seconds, 0)
}

export const meterAt = (model, elapsedRealSeconds) => {
  const { powerKw, batteryCapacityKwh, initialBattery, targetBattery = 100, clockScale = 1 } = model
  const elapsed = Number.isFinite(elapsedRealSeconds) ? Math.max(0, elapsedRealSeconds) : 0
  const seconds = elapsed * clockScale
  const targetEnergy = ((targetBattery - initialBattery) / 100) * batteryCapacityKwh
  const targetSeconds = chargingDurationSeconds(model)
  const reachedTarget = seconds >= targetSeconds - 1e-8
  // A throttled browser timer or a delayed stop acknowledgement must not add
  // energy (and charges) beyond the selected limit. Device acknowledgement and
  // unplugging remain separate state-machine steps, even when output is zero.
  const duration = Math.min(seconds, targetSeconds)
  let battery = initialBattery
  if (reachedTarget) battery = targetBattery
  else if (model.powerCurve !== POWER_CURVE_VERSION)
    battery += ((powerKw * duration) / 3600 / batteryCapacityKwh) * 100
  else {
    let remaining = duration
    for (const segment of segmentsFor(model, initialBattery, targetBattery)) {
      if (remaining >= segment.seconds) {
        remaining -= segment.seconds
        battery = segment.end
      } else {
        const delta =
          Math.abs(segment.slope) < 1e-10
            ? (remaining * segment.power) / segment.factor
            : (segment.power * Math.expm1((remaining * segment.slope) / segment.factor)) /
              segment.slope
        battery = segment.start + delta
        break
      }
    }
  }
  const energy = reachedTarget
    ? targetEnergy
    : ((battery - initialBattery) / 100) * batteryCapacityKwh
  return {
    duration,
    energy,
    battery,
    speed: reachedTarget ? 0 : powerAtBattery(model, battery),
    elapsedRealSeconds: elapsed
  }
}

export function chargingCurve(model, count = 48) {
  const duration = chargingDurationSeconds(model)
  if (!(duration > 0)) return []
  return Array.from({ length: count + 1 }, (_, index) => {
    const seconds = (duration * index) / count
    const data = meterAt({ ...model, clockScale: 1 }, seconds)
    // Show the power immediately before target shutoff; actual output is zero
    // at the endpoint and is reported separately by the meter/status.
    return { seconds, battery: data.battery, power: powerAtBattery(model, data.battery) }
  })
}
