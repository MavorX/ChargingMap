// Shared by the form and action boundary: a selectable vehicle and a selectable
// gun are not necessarily compatible with one another.
export function reservationSelectionError({ station, connector, vehicle, chargeAmount }) {
  if (!station || station.openStatus !== 1 || !station.reservationAvailable)
    return '该站点暂不支持预约，请返回选择其他站点。'
  if (!connector || connector.status !== 1) return '所选预约充电桩已不可用，请重新选择'
  if (!vehicle) return '请选择站点、充电桩和车辆'
  if (vehicle.connectorType !== connector.connectorType)
    return '车辆接口与充电枪不匹配，请选择兼容接口'
  if (!Number.isFinite(station.currentPrice) || station.currentPrice < 0)
    return '站点电价无效，暂不可预约'
  if (!Number.isFinite(chargeAmount) || chargeAmount < 10 || chargeAmount > 100)
    return '请完善有效的预约信息'
  if (Number.isFinite(vehicle.batteryCapacityKwh) && chargeAmount > vehicle.batteryCapacityKwh)
    return '预计充电量不能超过车辆电池容量，请调整充电量'
  return ''
}
