import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// id 契约: HF + 6 位数字；分片 = ceil(序号 / 100)
const part01 = {
  HF000001: { stationId: 'HF000001', stationName: '一站' },
  HF000050: { stationId: 'HF000050', stationName: '五十站' }
}
const part02 = {
  HF000101: { stationId: 'HF000101', stationName: '百零一站' }
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

  it('deduplicates concurrent requests for the same shard', async () => {
    const fetchMock = shardFetch()
    vi.stubGlobal('fetch', fetchMock)
    const { loadStationDetail } = await import('../services/api')

    const [a, b] = await Promise.all([
      loadStationDetail('HF000001'),
      loadStationDetail('HF000050')
    ])

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

  it('rejects ids that cannot be mapped to a shard', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { loadStationDetail } = await import('../services/api')

    await expect(loadStationDetail('bad-id')).rejects.toThrow('非法站点 id')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
