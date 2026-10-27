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
  if (!vehicle) throw new Error('请选择车辆；不能凭空假定车型和电池容量')
  if (vehicle.connectorType !== connector.connectorType)
    throw new Error('车辆接口与充电枪不匹配，请选择兼容接口')
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
    clockScale
  }
}

export const meterAt = (
  { powerKw, batteryCapacityKwh, initialBattery, targetBattery = 100, clockScale },
  elapsedRealSeconds
) => {
  const seconds = Math.max(0, elapsedRealSeconds) * clockScale
  const targetEnergy = ((targetBattery - initialBattery) / 100) * batteryCapacityKwh
  const targetSeconds = (targetEnergy / powerKw) * 3600
  const reachedTarget = seconds >= targetSeconds
  // A throttled browser timer or a delayed stop acknowledgement must not add
  // energy (and charges) beyond the selected limit. Device acknowledgement and
  // unplugging remain separate state-machine steps, even when output is zero.
  const duration = Math.min(seconds, targetSeconds)
  const energy = reachedTarget ? targetEnergy : (powerKw * duration) / 3600
  return {
    duration,
    energy,
    battery: reachedTarget ? targetBattery : initialBattery + (energy / batteryCapacityKwh) * 100,
    speed: reachedTarget ? 0 : powerKw,
    elapsedRealSeconds: Math.max(0, elapsedRealSeconds)
  }
}
