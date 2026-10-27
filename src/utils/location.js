export const LOCATION_TIMEOUT_MS = 20000
// A presentation threshold, not a promise that the reported point is correct.
const SMALL_REPORTED_RADIUS = 200

export const locationError = (code, message) => Object.assign(new Error(message), { code })

export const normalizeLocation = (result) => {
  const source = String(result?.location_type || 'unknown').toLowerCase()
  if (['ip', 'ipcity'].includes(source))
    throw locationError(
      'IP_ONLY',
      '仅获取到 IP 估算位置，未作为当前位置使用；请开启系统位置服务后重试'
    )
  const position = result?.position
  const lng = typeof position?.getLng === 'function' ? position.getLng() : position?.lng
  const lat = typeof position?.getLat === 'function' ? position.getLat() : position?.lat
  if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lng) > 180 || Math.abs(lat) > 90)
    throw locationError('INVALID_LOCATION', '定位服务返回了无效坐标，请重试')
  const accuracy = Number.isFinite(result.accuracy) && result.accuracy > 0 ? result.accuracy : null
  return {
    lng,
    lat,
    accuracy,
    source,
    quality:
      ['h5', 'sdk'].includes(source) && accuracy !== null && accuracy <= SMALL_REPORTED_RADIUS
        ? 'reported'
        : 'approximate'
  }
}

export const locationAccuracyText = (location) => {
  const meters = location?.accuracy
  if (!Number.isFinite(meters) || meters <= 0) return '精度未知'
  return meters >= 1000
    ? `报告误差约 ±${(meters / 1000).toFixed(1)} 公里`
    : `报告误差约 ±${Math.ceil(meters)} 米`
}

export const locationPresentation = ({ userLocation, locationStatus, locationErrorCode }) => {
  if (locationStatus === 'locating')
    return { title: '正在获取位置…', description: '等待设备定位，最多约 20 秒' }
  if (locationStatus === 'error') {
    const denied = locationErrorCode === 'PERMISSION_DENIED'
    return {
      title: denied ? '定位权限未获允许' : '定位暂不可用',
      description: `${userLocation ? '保留上次位置' : '合肥演示视野'} · ${denied ? '请检查浏览器与系统权限' : '点击重试'}`
    }
  }
  if (!userLocation)
    return { title: '合肥市 · 默认视野', description: '尚未定位，点击获取设备位置' }
  return {
    title: userLocation.quality === 'reported' ? '已获取设备位置' : '仅获取到估算位置',
    description: `${userLocation.source === 'sdk' ? '设备定位' : '浏览器定位'} · ${locationAccuracyText(userLocation)}`
  }
}
