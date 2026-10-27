// Display regions and generated station coordinates use AMap's GCJ-02 system.
// A city center is a browsing destination, never a device location.
export const DEFAULT_CITY_ID = 'SH'
export const CITIES = [
  {
    id: 'SH',
    name: '上海市',
    shortName: '上海',
    center: [121.4737, 31.2304],
    zoom: 12,
    bounds: { west: 121.0, east: 122.0, south: 30.7, north: 31.85 }
  },
  {
    id: 'HF',
    name: '合肥市',
    shortName: '合肥',
    center: [117.283042, 31.86119],
    zoom: 13,
    bounds: { west: 117.0, east: 117.6, south: 31.2, north: 32.2 }
  }
]

export const cityById = (id) => CITIES.find((city) => city.id === id)
export const cityIdForStation = (station) =>
  station?.cityId || /^(SH|HF)\d{6}$/.exec(station?.stationId)?.[1] || null

export const cityAtLocation = ({ lng, lat }) =>
  CITIES.find(
    ({ bounds }) =>
      lng >= bounds.west && lng <= bounds.east && lat >= bounds.south && lat <= bounds.north
  )
