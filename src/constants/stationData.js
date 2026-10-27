export const STATIONS_PER_CITY_LIMIT = 2000
export const DETAILS_PER_PART = 100
export const STATION_ID_PATTERN = /^(HF|SH)\d{6}$/

// Preserve existing HF URLs and give SH a separate cache/file namespace.
export const partIdFor = (stationId) => {
  const match =
    typeof stationId === 'string' && stationId.length === 8 && STATION_ID_PATTERN.exec(stationId)
  const numeric = match ? Number(stationId.slice(2)) : 0
  if (numeric < 1 || numeric > STATIONS_PER_CITY_LIMIT) {
    throw new Error(`非法站点 id: ${stationId}`)
  }
  const prefix = match[1] === 'HF' ? '' : 'sh-'
  return `${prefix}part-${String(Math.ceil(numeric / DETAILS_PER_PART)).padStart(2, '0')}`
}
