export const loadStationsList = async () => {
  try {
    const response = await fetch('/data/station_list.json')
    if (!response.ok) throw new Error('站点列表加载失败')
    const data = await response.json()
    return data
  } catch (err) {
    console.error('加载站点列表失败:', err)
    return []
  }
}

let _detailsCache = null

export const loadStationDetail = async (stationId) => {
  try {
    if (!_detailsCache) {
      const response = await fetch('/data/station_details.json')
      if (!response.ok) throw new Error('站点详情加载失败')
      _detailsCache = await response.json()
    }
    return _detailsCache[stationId] || null
  } catch (err) {
    console.error('加载站点详情失败:', err)
    return null
  }
}

export const loadStationDetails = async () => {
  try {
    const response = await fetch('/data/station_details.json')
    if (!response.ok) throw new Error('站点详情加载失败')
    _detailsCache = await response.json()
    return _detailsCache
  } catch (err) {
    console.error('加载站点详情失败:', err)
    return {}
  }
}

export const processPayment = async (paymentData) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
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

export const submitReview = async (reviewData) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return {
      success: true,
      reviewId: Date.now().toString()
    }
  } catch (err) {
    console.error('提交评价失败:', err)
    throw err
  }
}
