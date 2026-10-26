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
  { powerKw, batteryCapacityKwh, initialBattery, clockScale },
  elapsedRealSeconds
) => {
  const seconds = Math.max(0, elapsedRealSeconds) * clockScale
  const energy = Math.min(
    ((100 - initialBattery) / 100) * batteryCapacityKwh,
    (powerKw * seconds) / 3600
  )
  return {
    duration: seconds,
    energy,
    battery: Math.min(100, initialBattery + (energy / batteryCapacityKwh) * 100),
    speed: powerKw,
    elapsedRealSeconds: Math.max(0, elapsedRealSeconds)
  }
}
