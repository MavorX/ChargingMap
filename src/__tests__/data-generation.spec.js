// @vitest-environment node
/* global process */
import { afterEach, describe, expect, it } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { CITIES, cityAtLocation } from '../constants/cities'
import { partIdFor } from '../constants/stationData'

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
    expect(new Set(shanghai.map((s) => s.road)).size).toBeGreaterThanOrEqual(70)
    for (const district of new Set(shanghai.map((s) => s.district))) {
      expect(shanghai.filter((s) => s.district === district).length).toBeGreaterThanOrEqual(30)
    }
    const details = JSON.parse(readFileSync('public/data/details/sh-part-01.json', 'utf8'))
    for (const station of shanghai.slice(0, 3)) {
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

  it('allows independent Shanghai expansion without changing Hefei data', () => {
    const directory = tempData()
    generate(directory, ['--hefei-count=2', '--shanghai-count=101'])
    const oldHF = listFor(directory).filter((s) => s.cityId === 'HF')
    const oldDetail = readFileSync(path.join(directory, 'details/part-01.json'), 'utf8')
    generate(directory, ['--hefei-count=2', '--shanghai-count=1500'])
    expect(listFor(directory)).toHaveLength(1502)
    expect(listFor(directory).filter((s) => s.cityId === 'HF')).toEqual(oldHF)
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
