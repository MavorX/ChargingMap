import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// HF and SH share numeric sequences, but never files or cached Promises.
const part01 = {
  HF000001: { stationId: 'HF000001', stationName: '一站' },
  HF000050: { stationId: 'HF000050', stationName: '五十站' }
}
const part02 = {
  HF000101: { stationId: 'HF000101', stationName: '百零一站' }
}
const shPart01 = {
  SH000001: { stationId: 'SH000001', stationName: '上海首站' },
  SH000050: { stationId: 'SH000050', stationName: '上海五十站' }
}

const jsonResponse = (payload) => ({
  ok: true,
  json: async () => payload
})

const notFoundResponse = () => ({
  ok: false,
  status: 404,
  json: async () => ({})
})

const shardFetch = () =>
  vi.fn((url) => {
    if (url.endsWith('sh-part-01.json')) return Promise.resolve(jsonResponse(shPart01))
    if (url.endsWith('part-01.json')) return Promise.resolve(jsonResponse(part01))
    if (url.endsWith('part-02.json')) return Promise.resolve(jsonResponse(part02))
    return Promise.resolve(notFoundResponse())
  })

describe('api loadStationDetail shard cache', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('loads the station list through BASE_URL for subpath deployments', async () => {
    vi.stubEnv('BASE_URL', '/ChargingMap/')
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([{ stationId: 'HF000001' }]))
    vi.stubGlobal('fetch', fetchMock)
    const { loadStationsList } = await import('../services/api')

    await loadStationsList()

    expect(fetchMock).toHaveBeenCalledWith('/ChargingMap/data/station_list.json')
  })

  it('rejects when the station list response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue(notFoundResponse())
    vi.stubGlobal('fetch', fetchMock)
    const { loadStationsList } = await import('../services/api')

    await expect(loadStationsList()).rejects.toThrow('站点列表加载失败')
  })

  it('loads detail shards through BASE_URL for subpath deployments', async () => {
    vi.stubEnv('BASE_URL', '/ChargingMap/')
    const fetchMock = shardFetch()
    vi.stubGlobal('fetch', fetchMock)
    const { loadStationDetail } = await import('../services/api')

    await loadStationDetail('HF000001')

    expect(fetchMock).toHaveBeenCalledWith('/ChargingMap/data/details/part-01.json')
  })

  it('fetches one shard exactly once for ids of the same part', async () => {
    const fetchMock = shardFetch()
    vi.stubGlobal('fetch', fetchMock)
    const { loadStationDetail } = await import('../services/api')

    const first = await loadStationDetail('HF000001')
    const second = await loadStationDetail('HF000050')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/data/details/part-01.json')
    expect(first.stationName).toBe('一站')
    expect(second.stationName).toBe('五十站')
  })

  it('keeps Shanghai and Hefei details separate under a deployment subpath', async () => {
    vi.stubEnv('BASE_URL', '/ChargingMap/')
    const fetchMock = shardFetch()
    vi.stubGlobal('fetch', fetchMock)
    const { loadStationDetail } = await import('../services/api')
    const [sh, hf, otherSH] = await Promise.all([
      loadStationDetail('SH000001'),
      loadStationDetail('HF000001'),
      loadStationDetail('SH000050')
    ])
    expect(sh.stationName).toBe('上海首站')
    expect(hf.stationName).toBe('一站')
    expect(otherSH.stationName).toBe('上海五十站')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenCalledWith('/ChargingMap/data/details/sh-part-01.json')
    expect(fetchMock).toHaveBeenCalledWith('/ChargingMap/data/details/part-01.json')
  })

  it.each([
    ['HF000001', 'part-01'],
    ['HF000100', 'part-01'],
    ['HF000101', 'part-02'],
    ['SH000001', 'sh-part-01'],
    ['SH000100', 'sh-part-01'],
    ['SH000101', 'sh-part-02'],
    ['SH001000', 'sh-part-10']
  ])('maps %s to its city-specific shard', async (id, part) => {
    const { partIdFor } = await import('../services/api')
    expect(partIdFor(id)).toBe(part)
  })

  it('deduplicates concurrent requests for the same shard', async () => {
    const fetchMock = shardFetch()
    vi.stubGlobal('fetch', fetchMock)
    const { loadStationDetail } = await import('../services/api')

    const [a, b] = await Promise.all([loadStationDetail('HF000001'), loadStationDetail('HF000050')])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(a.stationId).toBe('HF000001')
    expect(b.stationId).toBe('HF000050')
  })

  it('fetches exactly two shards for ids from two different parts', async () => {
    const fetchMock = shardFetch()
    vi.stubGlobal('fetch', fetchMock)
    const { loadStationDetail } = await import('../services/api')

    await loadStationDetail('HF000001')
    await loadStationDetail('HF000101')

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/data/details/part-01.json')
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/data/details/part-02.json')
  })

  it('rejects when a shard is missing (404) instead of returning null', async () => {
    const fetchMock = vi.fn().mockResolvedValue(notFoundResponse())
    vi.stubGlobal('fetch', fetchMock)
    const { loadStationDetail } = await import('../services/api')

    await expect(loadStationDetail('HF000500')).rejects.toThrow('站点详情分片加载失败')
    // 失败分片不入缓存：可重试
    await expect(loadStationDetail('HF000500')).rejects.toThrow()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('rejects for an unknown id inside an existing shard', async () => {
    const fetchMock = shardFetch()
    vi.stubGlobal('fetch', fetchMock)
    const { loadStationDetail } = await import('../services/api')

    await expect(loadStationDetail('HF000099')).rejects.toThrow('站点详情不存在')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it.each([
    'bad-id',
    'XX000001',
    'SH000000',
    'HF000000',
    'HF1',
    'SH000001\n',
    'SH000001junk',
    'SH001001',
    '../part-01'
  ])('rejects invalid id %s before fetching', async (id) => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { loadStationDetail } = await import('../services/api')

    await expect(loadStationDetail(id)).rejects.toThrow('非法站点 id')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
