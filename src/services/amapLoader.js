const SCRIPT_URL_BASE = 'https://webapi.amap.com/maps?v=2.0'
const PLUGINS = 'AMap.MarkerCluster,AMap.Geolocation,AMap.Driving'
const KEY_PLACEHOLDER = '%VITE_AMAP_KEY%'
const LOAD_TIMEOUT_MS = 10000

let pendingLoad = null

const resolveScriptUrl = (key) =>
  `${SCRIPT_URL_BASE}&key=${encodeURIComponent(key)}&plugin=${PLUGINS}`

const loadScript = (key) =>
  new Promise((resolve, reject) => {
    window._AMapSecurityConfig = {
      securityJsCode: import.meta.env.VITE_AMAP_SECURITY_CODE || ''
    }

    const script = document.createElement('script')
    script.src = resolveScriptUrl(key)
    script.async = true

    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      script.remove()
      reject(new Error('高德地图加载超时（10 秒），请检查网络后重试'))
    }, LOAD_TIMEOUT_MS)

    script.onload = () => {
      if (settled) return
      // A loaded script that never publishes the global usually means AMap
      // rejected the key; treat it as a failure so the UI shows a retry panel.
      if (!window.AMap) {
        settled = true
        clearTimeout(timer)
        script.remove()
        reject(new Error('高德地图 SDK 初始化失败，请检查 VITE_AMAP_KEY 是否有效'))
        return
      }
      settled = true
      clearTimeout(timer)
      resolve(window.AMap)
    }

    script.onerror = () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      script.remove()
      reject(new Error('高德地图脚本加载失败，请检查网络或 VITE_AMAP_KEY 配置'))
    }

    document.head.appendChild(script)
  })

const load = () => {
  if (window.AMap) return Promise.resolve(window.AMap)
  if (pendingLoad) return pendingLoad

  const key = String(import.meta.env.VITE_AMAP_KEY || '').trim()
  if (!key || key === KEY_PLACEHOLDER) {
    return Promise.reject(
      new Error('缺少 VITE_AMAP_KEY：请在 .env.local 中配置高德地图 Key 后重新加载')
    )
  }

  pendingLoad = loadScript(key).catch((err) => {
    pendingLoad = null
    throw err
  })

  return pendingLoad
}

const reset = () => {
  pendingLoad = null
}

export const amapLoader = { load, reset }
