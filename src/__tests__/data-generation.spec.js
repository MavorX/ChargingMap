// @vitest-environment node
/* global process */
import { afterEach, describe, expect, it } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { CITIES, cityAtLocation } from '../constants/cities'
import { partIdFor } from '../constants/stationData'
import { shanghaiRoads, shanghaiShowcaseSites } from '../../scripts/shanghai-roads.mjs'

const directories = []
const tempData = () => {
  const root = process.platform === 'win32' ? path.join(tmpdir(), 'opencode') : tmpdir()
  const directory = mkdtempSync(path.join(root, 'chargingmap-data-'))
  directories.push(directory)
  return directory
}
afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})
const generate = (directory, args = []) =>
  execFileSync(process.execPath, ['generate_stations.js', '--out-dir', directory, ...args], {
    encoding: 'utf8',
    timeout: 20000
  })
const listFor = (directory) =>
  JSON.parse(readFileSync(path.join(directory, 'station_list.json'), 'utf8'))
const filesFor = (directory) => [
  'station_list.json',
  ...readdirSync(path.join(directory, 'details'))
    .sort()
    .map((file) => `details/${file}`)
]

// Independent great-circle calculation, not the generator's collision helper.
const distanceMeters = (a, b) => {
  const radians = Math.PI / 180
  const h =
    Math.sin(((b.lat - a.lat) * radians) / 2) ** 2 +
    Math.cos(a.lat * radians) *
      Math.cos(b.lat * radians) *
      Math.sin(((b.lng - a.lng) * radians) / 2) ** 2
  return 12742000 * Math.asin(Math.min(1, Math.sqrt(h)))
}
const nearestDistances = (stations) => {
  const nearest = stations.map(() => Infinity)
  for (let i = 0; i < stations.length; i++) {
    for (let j = i + 1; j < stations.length; j++) {
      const distance = distanceMeters(stations[i], stations[j])
      nearest[i] = Math.min(nearest[i], distance)
      nearest[j] = Math.min(nearest[j], distance)
    }
  }
  return nearest.sort((a, b) => a - b)
}
const locationsFor = (list) =>
  list
    .filter((s) => s.cityId === 'SH')
    .map(({ stationId, road, district, lng, lat }) => ({ stationId, road, district, lng, lat }))

describe('reproducible multi-city simulated data', () => {
  it('reproduces the checked-in Shanghai 1500 + Hefei 500 dataset byte-for-byte', () => {
    const directory = tempData()
    generate(directory)
    expect(listFor(directory)).toHaveLength(2000)
    for (const file of filesFor(directory)) {
      expect(readFileSync(path.join(directory, file), 'utf8')).toBe(
        readFileSync(`public/data/${file}`, 'utf8')
      )
    }
    generate(directory)
    for (const file of filesFor(directory)) {
      expect(readFileSync(path.join(directory, file), 'utf8')).toBe(
        readFileSync(`public/data/${file}`, 'utf8')
      )
    }
  })

  it('covers all 16 Shanghai districts, both city bounds, and stable compatible showcase sites', () => {
    const list = listFor('public/data')
    const shanghai = list.filter((s) => s.cityId === 'SH')
    expect(new Set(shanghai.map((s) => s.district)).size).toBe(16)
    for (const city of CITIES) {
      const stations = list.filter((s) => s.cityId === city.id)
      expect(stations).toHaveLength(city.id === 'SH' ? 1500 : 500)
      expect(
        stations.every((s) => cityAtLocation(s)?.id === city.id && s.cityName === city.name)
      ).toBe(true)
    }
    expect(new Set(shanghai.map((s) => s.road)).size).toBeGreaterThanOrEqual(300)
    for (const district of new Set(shanghai.map((s) => s.district))) {
      // Coverage follows road capacity, not equal quotas for small/large districts.
      expect(shanghai.filter((s) => s.district === district).length).toBeGreaterThanOrEqual(25)
    }
    const details = JSON.parse(readFileSync('public/data/details/sh-part-01.json', 'utf8'))
    for (const [index, station] of shanghai.slice(0, 3).entries()) {
      expect(station).toMatchObject(shanghaiShowcaseSites[index])
      expect(station.openStatus).toBe(1)
      expect(station.openTime).toBe('00:00-24:00')
      expect(station.address).toContain('模拟站点')
      for (const type of ['GB/T', 'CCS Combo', 'Type 2']) {
        const connectors = [
          ...details[station.stationId].fastConnectors,
          ...details[station.stationId].slowConnectors
        ]
        expect(connectors.some((c) => c.connectorType === type && c.status === 1)).toBe(true)
      }
    }
  })

  it('spaces Shanghai sites across neighborhoods instead of packing short CBD roads', () => {
    const stations = listFor('public/data').filter((s) => s.cityId === 'SH')
    const nearest = nearestDistances(stations)
    expect(nearest[0]).toBeGreaterThanOrEqual(360)
    expect(nearest[Math.floor(nearest.length / 2)]).toBeGreaterThan(550)
    for (const station of stations) {
      expect(
        stations.filter((other) => distanceMeters(station, other) < 500).length
      ).toBeLessThanOrEqual(5)
    }
    const center = { lng: 121.473, lat: 31.23 }
    const inner = nearestDistances(stations.filter((s) => distanceMeters(s, center) < 8000))
    const outer = nearestDistances(stations.filter((s) => distanceMeters(s, center) > 30000))
    expect(outer[Math.floor(outer.length / 2)]).toBeGreaterThan(
      inner[Math.floor(inner.length / 2)] * 1.15
    )
  })

  it('keeps simulated parking sites beside their named road rather than scattering over a city bbox', () => {
    for (const station of listFor('public/data').filter((s) => s.cityId === 'SH')) {
      const corridors = shanghaiRoads.filter(
        (road) => road.district === station.district && road.name === station.road
      )
      const distances = corridors.map((road) => {
        const lngScale = 111195 * Math.cos((station.lat * Math.PI) / 180)
        const dx = (road.end[0] - road.start[0]) * lngScale
        const dy = (road.end[1] - road.start[1]) * 111195
        const px = (station.lng - road.start[0]) * lngScale
        const py = (station.lat - road.start[1]) * 111195
        const t = Math.max(0, Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy)))
        return Math.hypot(px - t * dx, py - t * dy)
      })
      expect(Math.min(...distances), station.stationId).toBeLessThanOrEqual(181)
    }
  })

  it('rebuilds both city shard sets on shrink, preserving unrelated files', () => {
    const directory = tempData()
    generate(directory, ['--count', '101', '--seed', '7'])
    expect(readdirSync(path.join(directory, 'details'))).toHaveLength(4)
    writeFileSync(path.join(directory, 'details', 'keep.txt'), 'user notes')
    generate(directory, ['--count', '1', '--seed', '7'])
    expect(filesFor(directory)).toEqual([
      'station_list.json',
      'details/keep.txt',
      'details/part-01.json',
      'details/sh-part-01.json'
    ])
    expect(listFor(directory).map((s) => s.stationId)).toEqual(['HF000001', 'SH000001'])
    expect(readFileSync(path.join(directory, 'details', 'keep.txt'), 'utf8')).toBe('user notes')
    const output = execFileSync(
      process.execPath,
      ['scripts/validate-data.mjs', `--list=${path.join(directory, 'station_list.json')}`],
      { encoding: 'utf8' }
    )
    expect(output).toContain('[OK] 2 stations')
  })

  it('generates and validates the supported per-city maximum without namespace collisions', () => {
    const directory = tempData()
    generate(directory, ['--count=2000', '--seed=0'])
    const list = listFor(directory)
    expect(list).toHaveLength(4000)
    expect(nearestDistances(list.filter((s) => s.cityId === 'SH'))[0]).toBeGreaterThanOrEqual(360)
    expect(new Set(list.map((s) => s.stationId)).size).toBe(4000)
    expect(readdirSync(path.join(directory, 'details'))).toHaveLength(40)
    for (const id of ['HF002000', 'SH002000']) {
      const shard = JSON.parse(
        readFileSync(path.join(directory, 'details', `${partIdFor(id)}.json`), 'utf8')
      )
      expect(shard[id].stationId).toBe(id)
    }
    expect(
      execFileSync(
        process.execPath,
        ['scripts/validate-data.mjs', `--list=${path.join(directory, 'station_list.json')}`],
        { encoding: 'utf8' }
      )
    ).toContain('[OK] 4000 stations')
  })

  it.each([7, 4294967295])('preserves Shanghai spacing at maximum count with seed %s', (seed) => {
    const directory = tempData()
    generate(directory, ['--hefei-count=1', '--shanghai-count=2000', `--seed=${seed}`])
    const stations = listFor(directory).filter((s) => s.cityId === 'SH')
    expect(stations).toHaveLength(2000)
    expect(nearestDistances(stations)[0]).toBeGreaterThanOrEqual(360)
  })

  it('allows independent Shanghai expansion without changing Hefei data', () => {
    const directory = tempData()
    generate(directory, ['--hefei-count=2', '--shanghai-count=101'])
    const oldHF = listFor(directory).filter((s) => s.cityId === 'HF')
    const oldLocations = locationsFor(listFor(directory))
    const oldDetail = readFileSync(path.join(directory, 'details/part-01.json'), 'utf8')
    generate(directory, ['--hefei-count=2', '--shanghai-count=1500'])
    expect(listFor(directory)).toHaveLength(1502)
    expect(listFor(directory).filter((s) => s.cityId === 'HF')).toEqual(oldHF)
    expect(locationsFor(listFor(directory)).slice(0, oldLocations.length)).toEqual(oldLocations)
    expect(readFileSync(path.join(directory, 'details/part-01.json'), 'utf8')).toBe(oldDetail)
    expect(readdirSync(path.join(directory, 'details'))).toContain('sh-part-15.json')
  })

  it.each(['0', '2001', 'NaN', '-1', '1.5'])(
    'rejects invalid per-city count %s before writing',
    (count) => {
      const directory = tempData()
      const result = spawnSync(
        process.execPath,
        ['generate_stations.js', '--out-dir', directory, '--count', count],
        { encoding: 'utf8' }
      )
      expect(result.status).toBe(1)
      expect(readdirSync(directory)).toEqual([])
    }
  )

  it('rejects nearby Shanghai stations even when their ids, roads and city bounds are valid', () => {
    const directory = tempData()
    generate(directory, ['--count=2'])
    const list = listFor(directory)
    const shanghai = list.filter((s) => s.cityId === 'SH')
    shanghai[1].lng = shanghai[0].lng + 0.00001
    shanghai[1].lat = shanghai[0].lat
    writeFileSync(path.join(directory, 'station_list.json'), JSON.stringify(list))
    const result = spawnSync(
      process.execPath,
      ['scripts/validate-data.mjs', `--list=${path.join(directory, 'station_list.json')}`],
      { encoding: 'utf8' }
    )
    expect(result.status).toBe(1)
    expect(result.stdout).toContain('[FAIL] 上海站点间距')
  })

  it('rejects a Shanghai record with Hefei coordinates and an incorrectly placed detail', () => {
    const directory = tempData()
    generate(directory, ['--count=1'])
    const list = listFor(directory)
    const shanghai = list.find((s) => s.cityId === 'SH')
    shanghai.lng = 117.28
    shanghai.lat = 31.86
    writeFileSync(path.join(directory, 'station_list.json'), JSON.stringify(list))
    const shDetail = JSON.parse(
      readFileSync(path.join(directory, 'details', 'sh-part-01.json'), 'utf8')
    )
    const hfPath = path.join(directory, 'details', 'part-01.json')
    const hfDetail = JSON.parse(readFileSync(hfPath, 'utf8'))
    writeFileSync(hfPath, JSON.stringify({ ...hfDetail, ...shDetail }))
    const result = spawnSync(
      process.execPath,
      ['scripts/validate-data.mjs', `--list=${path.join(directory, 'station_list.json')}`],
      { encoding: 'utf8' }
    )
    expect(result.status).toBe(1)
    expect(result.stdout).toContain('坐标超出声明城市')
    expect(result.stdout).toContain('详情分片与 id 不匹配')
  })
})
