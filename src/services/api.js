// import.meta.env.BASE_URL always ends with a slash, so paths are relative to
// the configured deploy base (e.g. /ChargingMap/).
const dataUrl = (p) => import.meta.env.BASE_URL + p

export const loadStationsList = async () => {
  try {
    const response = await fetch(dataUrl('data/station_list.json'))
    if (!response.ok) throw new Error('站点列表加载失败')
    const data = await response.json()
    return data
  } catch (err) {
    console.error('加载站点列表失败:', err)
    return []
  }
}

// Details are sharded 100 stations per file: HF000001..HF000100 -> part-01.
const DETAILS_PER_PART = 100

export const partIdFor = (stationId) => {
  const numeric = parseInt(String(stationId ?? '').slice(2), 10)
  if (!Number.isFinite(numeric) || numeric < 1) {
    throw new Error(`非法站点 id: ${stationId}`)
  }
  return `part-${String(Math.ceil(numeric / DETAILS_PER_PART)).padStart(2, '0')}`
}

// Single source of detail data: one Promise per shard. Storing the Promise (not
// the parsed value) makes concurrent requests for the same shard share a single
// in-flight fetch.
const _partCache = new Map()

const fetchPart = (partId) => {
  const cached = _partCache.get(partId)
  if (cached) return cached

  const pending = (async () => {
    const response = await fetch(dataUrl(`data/details/${partId}.json`))
    if (!response.ok) throw new Error(`站点详情分片加载失败: ${partId}`)
    return response.json()
  })()

  _partCache.set(partId, pending)
  // Failed shards are not cached, so a later call can retry.
  pending.catch(() => {
    if (_partCache.get(partId) === pending) _partCache.delete(partId)
  })
  return pending
}

export const loadStationDetail = async (stationId) => {
  const partId = partIdFor(stationId)
  const part = await fetchPart(partId)
  const detail = part[stationId]
  if (!detail) throw new Error(`站点详情不存在: ${stationId}`)
  return detail
}

export const processPayment = async (_paymentData) => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return {
      success: true,
      transactionId: `PAY${Date.now()}`,
      paymentTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
    }
  } catch (err) {
    console.error('支付失败:', err)
    throw err
  }
}

export const submitReview = async (_reviewData) => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return {
      success: true,
      reviewId: Date.now().toString()
    }
  } catch (err) {
    console.error('提交评价失败:', err)
    throw err
  }
}
