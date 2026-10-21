import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const importLoader = async () => {
  vi.resetModules()
  return import('../services/amapLoader')
}

const captureAppendedScripts = () => {
  const scripts = []
  vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
    scripts.push(node)
    return node
  })
  return scripts
}

describe('amapLoader', () => {
  const fakeAmap = { Map: function Map() {} }

  beforeEach(() => {
    vi.resetModules()
    delete window._AMapSecurityConfig
    delete window.AMap
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.useRealTimers()
    vi.resetModules()
    delete window._AMapSecurityConfig
    delete window.AMap
  })

  it('rejects immediately when the key is missing or an unresolved placeholder', async () => {
    const scripts = captureAppendedScripts()
    const { amapLoader } = await importLoader()

    vi.stubEnv('VITE_AMAP_KEY', '')
    await expect(amapLoader.load()).rejects.toThrow('VITE_AMAP_KEY')

    vi.stubEnv('VITE_AMAP_KEY', '%VITE_AMAP_KEY%')
    await expect(amapLoader.load()).rejects.toThrow('VITE_AMAP_KEY')

    expect(scripts).toHaveLength(0)
  })

  it('rejects when the injected script fires onerror', async () => {
    vi.stubEnv('VITE_AMAP_KEY', 'test_key')
    vi.stubEnv('VITE_AMAP_SECURITY_CODE', 'test_security')
    const scripts = captureAppendedScripts()
    const { amapLoader } = await importLoader()

    const pending = amapLoader.load()
    expect(scripts).toHaveLength(1)
    scripts[0].onerror()

    await expect(pending).rejects.toThrow('高德地图脚本加载失败')
  })

  it('resolves on load and reuses a single script across repeated calls', async () => {
    vi.stubEnv('VITE_AMAP_KEY', 'test_key')
    vi.stubEnv('VITE_AMAP_SECURITY_CODE', 'test_security')
    const scripts = captureAppendedScripts()
    const { amapLoader } = await importLoader()

    const first = amapLoader.load()
    const second = amapLoader.load()

    expect(second).toBe(first)
    expect(scripts).toHaveLength(1)
    expect(window._AMapSecurityConfig).toEqual({ securityJsCode: 'test_security' })
    expect(scripts[0].src).toContain('https://webapi.amap.com/maps?v=2.0&key=test_key')
    expect(scripts[0].src).toContain('plugin=AMap.MarkerCluster,AMap.Geolocation,AMap.Driving')
    expect(scripts[0].src).not.toContain('MarkerClusterer')

    window.AMap = fakeAmap
    scripts[0].onload()

    await expect(first).resolves.toBe(fakeAmap)
    await expect(amapLoader.load()).resolves.toBe(fakeAmap)
    expect(scripts).toHaveLength(1)
  })

  it('allows a retry after a failed load', async () => {
    vi.stubEnv('VITE_AMAP_KEY', 'test_key')
    const scripts = captureAppendedScripts()
    const { amapLoader } = await importLoader()

    const first = amapLoader.load()
    scripts[0].onerror()
    await expect(first).rejects.toThrow('高德地图脚本加载失败')

    const retry = amapLoader.load()
    expect(scripts).toHaveLength(2)
    window.AMap = fakeAmap
    scripts[1].onload()

    await expect(retry).resolves.toBe(fakeAmap)
  })

  it('rejects after the 10 second timeout', async () => {
    vi.useFakeTimers()
    vi.stubEnv('VITE_AMAP_KEY', 'test_key')
    const scripts = captureAppendedScripts()
    const { amapLoader } = await importLoader()

    const pending = amapLoader.load()
    expect(scripts).toHaveLength(1)
    const rejection = expect(pending).rejects.toThrow('高德地图加载超时')

    await vi.advanceTimersByTimeAsync(10000)

    await rejection
  })
})
