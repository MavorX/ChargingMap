import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const detailsPayload = {
  id1: { stationId: 'id1', stationName: '一站' },
  id2: { stationId: 'id2', stationName: '二站' },
  id3: { stationId: 'id3', stationName: '三站' }
}

const jsonResponse = (payload) => ({
  ok: true,
  json: async () => payload
})

describe('api loadStationDetail cache characterization', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches the single details source exactly once for N different ids', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(detailsPayload))
    vi.stubGlobal('fetch', fetchMock)
    const { loadStationDetail } = await import('../services/api')

    const first = await loadStationDetail('id1')
    const second = await loadStationDetail('id2')
    const third = await loadStationDetail('id3')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/data/station_details.json')
    expect(first.stationId).toBe('id1')
    expect(second.stationId).toBe('id2')
    expect(third.stationId).toBe('id3')
  })

  it('reuses the cache populated by loadStationDetails for a later loadStationDetail call', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(detailsPayload))
    vi.stubGlobal('fetch', fetchMock)
    const { loadStationDetails, loadStationDetail } = await import('../services/api')

    const all = await loadStationDetails()
    const one = await loadStationDetail('id2')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(Object.keys(all)).toHaveLength(3)
    expect(one.stationName).toBe('二站')
  })

  it('returns null for an unknown id without refetching the cached source', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(detailsPayload))
    vi.stubGlobal('fetch', fetchMock)
    const { loadStationDetail } = await import('../services/api')

    expect(await loadStationDetail('missing')).toBeNull()
    expect(await loadStationDetail('id1')).not.toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
