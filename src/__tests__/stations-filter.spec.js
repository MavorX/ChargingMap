import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { createPinia, setActivePinia } from 'pinia'
import { useStationsStore } from '../store/modules/stations'

const dataset = JSON.parse(readFileSync('public/data/station_list.json', 'utf8'))

const makeStation = (overrides) => ({
  stationId: 's1',
  stationName: '标准充电站',
  address: '合肥市蜀山区',
  quickAvailableNum: 1,
  slowAvailableNum: 1,
  openTime: '00:00-24:00',
  reservationAvailable: true,
  openStatus: 1,
  maxPower: 120,
  connectorTypes: ['CCS Combo', 'GB/T'],
  ...overrides
})

const fixtures = () => [
  makeStation({
    stationId: 'a',
    stationName: 'Alpha 快充站',
    address: '合肥市政务区',
    quickAvailableNum: 2,
    slowAvailableNum: 0,
    maxPower: 120
  }),
  makeStation({
    stationId: 'b',
    stationName: 'Beta 慢充站',
    address: '合肥市包河区',
    quickAvailableNum: 0,
    slowAvailableNum: 3,
    openTime: '06:00-22:00',
    reservationAvailable: false,
    maxPower: 60,
    connectorTypes: ['GB/T']
  }),
  makeStation({
    stationId: 'c',
    stationName: 'Gamma 维护站',
    address: '合肥市庐阳区',
    quickAvailableNum: 0,
    slowAvailableNum: 0,
    openStatus: 2,
    maxPower: 200,
    connectorTypes: ['CHAdeMO']
  }),
  makeStation({
    stationId: 'd',
    stationName: 'Delta 混合站',
    address: '合肥市瑶海区',
    maxPower: 150,
    connectorTypes: ['CCS Combo']
  })
]

describe('stations store filteredStations characterization', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('returns every station when default filters are active', () => {
    const store = useStationsStore()
    store.stations = fixtures()

    expect(store.filteredStations).toHaveLength(4)
  })

  it('combines quickAvailable and open24h filters', () => {
    const store = useStationsStore()
    store.stations = fixtures()
    store.filters.quickAvailable = true
    store.filters.open24h = true

    expect(store.filteredStations.map((s) => s.stationId)).toEqual(['a', 'd'])
  })

  it('combines reservable, power and connector filters', () => {
    const store = useStationsStore()
    store.stations = fixtures()
    store.filters.reservable = true
    store.filters.power = 100
    store.filters.connectors = ['CCS Combo']

    expect(store.filteredStations.map((s) => s.stationId)).toEqual(['a', 'd'])
  })

  it('matches connectorTypes on the list record and never bypasses stations without details', () => {
    const store = useStationsStore()
    store.stations = fixtures()
    store.filters.connectors = ['GB/T']

    expect(store.filteredStations.map((s) => s.stationId)).toEqual(['a', 'b'])
  })

  it('excludes stations that carry no connector metadata', () => {
    const store = useStationsStore()
    store.stations = [makeStation({ stationId: 'no-meta', connectorTypes: undefined })]

    expect(store.filteredStations).toHaveLength(0)
  })

  it('filters by brand via stationName and ignores an empty brand', () => {
    const store = useStationsStore()
    store.stations = fixtures()

    store.filters.brand = 'Alpha'
    expect(store.filteredStations.map((s) => s.stationId)).toEqual(['a'])

    store.filters.brand = ''
    expect(store.filteredStations).toHaveLength(4)
  })

  it('applies search across the full unpaged list, not just the first page', () => {
    const store = useStationsStore()
    store.stations = Array.from({ length: 25 }, (_, index) => {
      const number = String(index + 1).padStart(2, '0')
      return makeStation({
        stationId: `bulk-${number}`,
        stationName: `批量测试站${number}`,
        address: `合肥市测试路${number}号`
      })
    })
    store.listPage = 1
    store.listPageSize = 20

    expect(store.pagedStations).toHaveLength(20)
    store.setSearchQuery('站25')
    expect(store.filteredStations).toHaveLength(1)
    expect(store.filteredStations[0].stationId).toBe('bulk-25')
    expect(store.totalFilteredCount).toBe(1)
  })

  it('searches case-insensitively on both station name and address', () => {
    const store = useStationsStore()
    store.stations = fixtures()
    store.setSearchQuery('ALPHA')
    expect(store.filteredStations.map((s) => s.stationId)).toEqual(['a'])

    store.setSearchQuery('瑶海')
    expect(store.filteredStations.map((s) => s.stationId)).toEqual(['d'])
  })
})

describe('stations store on the generated dataset', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it.each(['SH', 'HF'])(
    'keeps all 500 %s stations, and no other city, under default filters',
    (cityId) => {
      const store = useStationsStore()
      store.stations = dataset
      store.browseCity(cityId)

      expect(dataset).toHaveLength(1000)
      expect(store.filteredStations).toHaveLength(500)
      expect(store.filteredStations.every((s) => s.cityId === cityId)).toBe(true)
    }
  )

  it.each([
    ['HF', 40],
    ['SH', 50]
  ])('filters %s by brand using the station name', (cityId, count) => {
    const store = useStationsStore()
    store.stations = dataset
    store.browseCity(cityId)
    store.filters.brand = '国家电网'

    const result = store.filteredStations

    expect(result).toHaveLength(count)
    expect(result.every((s) => s.cityId === cityId)).toBe(true)
    expect(result.every((station) => station.stationName.includes('国家电网'))).toBe(true)
    expect(store.activeFilterCount).toBe(1)
  })

  it('filters by connector before any detail shard is loaded', () => {
    const store = useStationsStore()
    store.stations = dataset
    store.filters.connectors = ['CHAdeMO']

    expect(store.stations.every((station) => station.details === undefined)).toBe(true)

    const result = store.filteredStations

    expect(result.length).toBeGreaterThan(0)
    expect(result.every((station) => station.connectorTypes.includes('CHAdeMO'))).toBe(true)
  })
})
