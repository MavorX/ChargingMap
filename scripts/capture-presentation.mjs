import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium, expect } from '@playwright/test'

// Opt-in live SDK review, intentionally separate from deterministic CI tests.
// Usage: node scripts/capture-presentation.mjs http://127.0.0.1:5177/ <output-dir>
// Start Vite with a valid local AMap key; neither keys nor request URLs are saved.
const [url, directory] = process.argv.slice(2)
if (!url || !directory) throw new Error('Provide the local Vite URL and an output directory.')
const output = path.resolve(directory)
await fs.mkdir(output, { recursive: true })
const browser = await chromium.launch({
  executablePath: process.env.BROWSER_EXECUTABLE || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-first-run']
})
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()
const errors = []
const checks = []
const pending = new Set()
let resourceRequests = 0
const isMapResource = (address) => /getMergedStyleData|web_map\/get_tile/.test(address)
page.on('pageerror', (error) =>
  errors.push(error.message.replace(/\b[a-f0-9]{32}\b/gi, '[redacted]'))
)
page.on('request', (request) => {
  if (isMapResource(request.url())) {
    resourceRequests++
    pending.add(request)
  }
})
page.on('requestfinished', (request) => pending.delete(request))
page.on('requestfailed', (request) => pending.delete(request))
const settle = () =>
  page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    await Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => {}))
    )
  })
const settleMap = async () => {
  const deadline = Date.now() + 25000
  let quietSince
  while (Date.now() < deadline) {
    if (pending.size) quietSince = undefined
    else if (!quietSince) quietSince = Date.now()
    else if (Date.now() - quietSince > 800) return
    await delay(100)
  }
  throw new Error('Live map tiles did not settle.')
}
const store = (name) =>
  `document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('${name}')`
const run = (code) => page.evaluate(code)
const wait = (code) => page.waitForFunction(code, null, { timeout: 45000 })
const click = (text) => page.getByRole('button', { name: text, exact: true }).first().click()
const theme = async (dark) => {
  if ((await run('document.documentElement.classList.contains("dark")')) !== dark)
    await run(`${store('user')}.toggleTheme()`)
  await settle()
}
const capture = async (name) => {
  const toastClose = page.getByRole('button', { name: /^(关闭提示|Dismiss notification)$/ })
  if (await toastClose.isVisible()) await toastClose.click()
  await settle()
  const layout = await page.evaluate(() => {
    const visible = (element) => {
      const rect = element.getBoundingClientRect()
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        window.getComputedStyle(element).visibility !== 'hidden' &&
        !element.closest('[inert]')
      )
    }
    return {
      pageOverflow: document.documentElement.scrollWidth > window.innerWidth,
      controlOverflow: [
        ...document.querySelectorAll(
          'header, header button, .filter-chip, .panel-content, .dialog-content, .account-card, .station-card, .map-info'
        )
      ]
        .filter(visible)
        .filter(
          (element) =>
            element.scrollWidth > element.clientWidth + 1 &&
            window.getComputedStyle(element).overflowX !== 'auto'
        )
        .map((element) => element.tagName),
      locale: document.documentElement.lang,
      dark: document.documentElement.classList.contains('dark')
    }
  })
  assert.equal(layout.pageOverflow, false, `${name}: page overflow`)
  assert.deepEqual(layout.controlOverflow, [], `${name}: control overflow`)
  await page.screenshot({ path: path.join(output, `${name}.png`) })
  checks.push({ name, ...page.viewportSize(), ...layout })
}
const selectStation = async () => {
  await run(
    `${store('ui')}.dismiss(); ${store('stations')}.setCurrentStation(${store('stations')}.stations.find((station) => station.stationId === 'SH000001'))`
  )
  await wait(`${store('stations')}.currentStation?.detailsLoaded`)
  await settle()
}
const openPanel = async (name) => {
  await run(`${store('ui')}.open('${name}', {reset:true})`)
  const titles = {
    userProfile: /^(我的账户|My account)$/,
    wallet: /^(我的钱包|My wallet)$/,
    vehicle: /^(我的车辆|My vehicles)$/,
    chargingHistory: /^(充电记录|Charging history)$/,
    coupons: /^(优惠券|Coupons)$/,
    favorites: /^(我的收藏|Favorites)$/,
    notifications: /^(通知中心|Notifications)$/,
    settings: /^(设置|Settings)$/,
    help: /^(帮助中心|Help center)$/,
    vehicleFilter: /^(筛选条件|Filter stations)$/
  }
  await expect(page.locator('.panel-content h2').filter({ hasText: titles[name] })).toBeVisible()
  await settle()
}

try {
  const firstTile = page.waitForResponse(
    (response) => response.url().includes('/web_map/get_tile') && response.ok(),
    { timeout: 60000 }
  )
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await wait(
    `${store('stations')}?.stations.length === 2000 && document.querySelector('#map-container canvas')`
  )
  await firstTile
  await page.evaluate(async () => {
    const { default: manager } = await import('/src/services/mapService.js')
    window.__reviewManager = manager
    // Explicit review camera, not a claimed device/GPS location.
    manager.map.setZoomAndCenter(14, [121.479, 31.232])
  })
  await settleMap()
  // AMap also loads text glyphs asynchronously; warm those before the hero.
  await theme(true)
  await delay(1200)
  await theme(false)
  await capture('desktop-light')
  await theme(true)
  await capture('desktop-dark')
  await theme(false)

  const measurements = []
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 }
  ]) {
    await page.setViewportSize(viewport)
    await settleMap()
    await page.evaluate(() => {
      const map = window.__reviewManager.map
      const center = map.getCenter()
      const route = new AMap.Polyline({
        path: [
          [center.lng - 0.01, center.lat],
          [center.lng, center.lat + 0.006],
          [center.lng + 0.01, center.lat]
        ],
        strokeColor: '#008C82',
        strokeWeight: 7
      })
      map.add(route)
      const original = map.setMapStyle
      const check = (window.__themeReview = {
        canvas: document.querySelector('#map-container .amap-layers > canvas.amap-layer'),
        marker: document.querySelector('.amap-marker'),
        camera: JSON.stringify([map.getCenter().toArray(), map.getZoom()]),
        route,
        styleCalls: 0,
        restore: () => {
          map.setMapStyle = original
          map.remove(route)
        }
      })
      map.setMapStyle = function (...args) {
        check.styleCalls++
        return original.apply(this, args)
      }
    })
    await settle()
    const before = resourceRequests
    const samples = []
    for (let index = 0; index < 8; index++) {
      const result = await page.evaluate(async () => {
        const start = performance.now()
        document.querySelector('header button[aria-label="切换主题"]').click()
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        const check = window.__themeReview
        const map = window.__reviewManager.map
        const canvas = document.querySelector('#map-container .amap-layers > canvas.amap-layer')
        return {
          elapsed: performance.now() - start,
          sameCanvas: canvas === check.canvas,
          sameMarker: document.querySelector('.amap-marker') === check.marker,
          sameCamera: JSON.stringify([map.getCenter().toArray(), map.getZoom()]) === check.camera,
          routePreserved: map.getAllOverlays('polyline').includes(check.route),
          markerUnfiltered: window.getComputedStyle(check.marker).filter === 'none',
          styleCalls: check.styleCalls,
          themeMatches:
            (window.getComputedStyle(canvas).filter === 'none') ===
            document.documentElement.classList.contains('dark')
        }
      })
      for (const key of [
        'sameCanvas',
        'sameMarker',
        'sameCamera',
        'routePreserved',
        'markerUnfiltered',
        'themeMatches'
      ])
        assert.equal(result[key], true, key)
      assert.equal(result.styleCalls, 0)
      samples.push(Math.round(result.elapsed))
    }
    await page.route('**/web/rendering/vdata/**', (route) => route.abort())
    await page.route('**/web_map/get_tile**', (route) => route.abort())
    await theme(true)
    assert.equal(resourceRequests - before, 0)
    await theme(false)
    assert.equal(resourceRequests - before, 0)
    await page.unroute('**/web/rendering/vdata/**')
    await page.unroute('**/web_map/get_tile**')
    await page.evaluate(() => window.__themeReview.restore())
    measurements.push({
      ...viewport,
      twoFrameObservationMs: samples,
      styleOrTileRequests: resourceRequests - before,
      canvasCameraMarkersAndTestRoutePreserved: true,
      remoteServicesBlockedToggle: true
    })
  }

  await page.setViewportSize({ width: 1440, height: 1000 })
  await selectStation()
  await capture('desktop-detail')
  await page.getByRole('button', { name: '收藏站点', exact: true }).first().click()
  assert.equal(await run(`${store('stations')}.currentStation.isFavorite`), true)
  await run(`${store('stations')}.setCurrentStation(null)`)
  await openPanel('vehicleFilter')
  await capture('desktop-filter')
  await run(`${store('ui')}.dismiss()`)

  await page.setViewportSize({ width: 390, height: 844 })
  await selectStation()
  await capture('mobile-detail')
  await click('选择充电桩')
  await page.locator('#charging-vehicle').waitFor()
  await page.getByRole('button', { name: /超充2/ }).click()
  await capture('mobile-setup')
  await click('下一步 · 连接充电枪')
  await capture('mobile-plug')
  await click('已插好，开始检测')
  await wait(`${store('charging')}.isCharging && document.querySelector('[aria-label="返回地图"]')`)
  await wait(`${store('charging')}.chargingData.energy > 2`)
  const toastClose = page.getByRole('button', { name: '关闭提示', exact: true })
  if (await toastClose.isVisible()) await toastClose.click()
  await capture('mobile-charging')
  await theme(true)
  await capture('mobile-charging-dark')
  await theme(false)
  await click('结束充电')
  await click('确认结束')
  await wait(`${store('charging')}.phase === 'awaiting_unplug'`)
  await capture('mobile-unplug')
  await click('已拔枪，查看账单')
  await expect(page.getByRole('heading', { name: '确认支付', exact: true })).toBeVisible()
  await capture('mobile-checkout')
  await page.getByRole('button', { name: /^确认支付 ¥/ }).click()
  await wait(`${store('charging')}.phase === 'paid'`)
  await expect(page.getByRole('heading', { name: '支付成功', exact: true })).toBeVisible()
  await capture('mobile-paid')
  await run(`${store('ui')}.dismiss()`)
  await openPanel('userProfile')
  await capture('mobile-account')

  for (const dark of [false, true]) {
    await theme(dark)
    for (const name of [
      'userProfile',
      'wallet',
      'vehicle',
      'chargingHistory',
      'coupons',
      'favorites',
      'notifications',
      'settings',
      'help',
      'vehicleFilter'
    ]) {
      await openPanel(name)
      await capture(`account-${name}-${dark ? 'dark' : 'light'}`)
    }
  }
  await theme(false)
  await run(`${store('ui')}.dismiss(); ${store('stations')}.setCurrentStation(null)`)
  await page.locator('.language-switch').click()
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [1024, 768],
    [1440, 1000]
  ]) {
    await page.setViewportSize({ width, height })
    await selectStation()
    await capture(`english-detail-${width}`)
    await openPanel('vehicleFilter')
    await capture(`english-filter-${width}`)
    await run(`${store('ui')}.dismiss(); ${store('stations')}.setCurrentStation(null)`)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await selectStation()
  await capture('mobile-english')
  await theme(true)
  await run(`${store('ui')}.dismiss(); ${store('stations')}.setCurrentStation(null)`)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await wait('document.querySelector("#map-container .amap-layers > canvas.amap-layer")')
  assert.equal(await run('document.documentElement.lang'), 'en-US')
  assert.equal(await run('document.documentElement.classList.contains("dark")'), true)
  assert.equal(
    await run(
      'getComputedStyle(document.querySelector("#map-container .amap-layers > canvas.amap-layer")).filter'
    ),
    'none'
  )
  assert.deepEqual(errors, [])
  const report = {
    measurements,
    checks,
    pageErrors: errors,
    languageAndNightThemeRestored: true,
    boundary:
      'Controlled review camera; test polyline, not a live driving-service or physical GPS validation.'
  }
  await fs.writeFile(path.join(output, 'live-review.json'), JSON.stringify(report, null, 2))
  console.log(
    JSON.stringify(
      { screenshots: checks.length, layoutFailures: 0, pageErrors: errors, measurements, output },
      null,
      2
    )
  )
} catch (error) {
  await page.screenshot({ path: path.join(output, 'failure.png') }).catch(() => {})
  console.error(error.message)
  throw error
} finally {
  await browser.close()
}
