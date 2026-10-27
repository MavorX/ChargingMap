// Dataset metadata for generation/validation only, never a browsing mode/filter.
// Generated station coordinates use AMap's GCJ-02 system.
export const CITIES = [
  {
    id: 'SH',
    name: '上海市',
    bounds: { west: 120.85, east: 122.0, south: 30.7, north: 31.85 }
  },
  {
    id: 'HF',
    name: '合肥市',
    bounds: { west: 117.0, east: 117.6, south: 31.2, north: 32.2 }
  }
]

export const cityById = (id) => CITIES.find((city) => city.id === id)
export const cityAtLocation = ({ lng, lat }) =>
  CITIES.find(
    ({ bounds }) =>
      lng >= bounds.west && lng <= bounds.east && lat >= bounds.south && lat <= bounds.north
  )
