import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { initializeLocale, LANGUAGE_STORAGE_KEY, locale, setLocale, t } from '../i18n'
import { english } from '../i18n/en'
import { dataText, siteGuide, stationAddress, stationName } from '../i18n/data'
import { formatDuration, formatPrice } from '../utils/format'
import { locationAccuracyText, locationPresentation } from '../utils/location'
import { useStationsStore } from '../store/modules/stations'
import { useUserStore } from '../store/modules/user'
import { useChargingStore } from '../store/modules/charging'
import Header from '../components/Header.vue'
import ChargingSettings from '../components/charging/ChargingSettings.vue'
import ChargingPanel from '../components/charging/ChargingPanel.vue'
import ReservationPanel from '../components/reservation/ReservationPanel.vue'
import PaymentPanel from '../components/payment/PaymentPanel.vue'
import PaymentSuccess from '../components/payment/PaymentSuccess.vue'
import ReviewPanel from '../components/review/ReviewPanel.vue'
import UserProfile from '../components/user/UserProfile.vue'
import WalletPanel from '../components/user/WalletPanel.vue'
import VehiclePanel from '../components/user/VehiclePanel.vue'
import ChargingHistoryPanel from '../components/user/ChargingHistoryPanel.vue'
import CouponsPanel from '../components/user/CouponsPanel.vue'
import FavoritesPanel from '../components/user/FavoritesPanel.vue'
import NotificationsPanel from '../components/user/NotificationsPanel.vue'
import SettingsPanel from '../components/user/SettingsPanel.vue'
import HelpCenterPanel from '../components/user/HelpCenterPanel.vue'
import StationDetail from '../components/station/StationDetail.vue'
import VehicleFilter from '../components/filter/VehicleFilter.vue'
import mapManager from '../services/mapService'

const json = (path) => JSON.parse(readFileSync(resolve('src/__tests__', path), 'utf8'))
const stations = json('../../public/data/station_list.json')
const detail = json('../../public/data/details/sh-part-01.json').SH000001
const sampleStation = () => ({
  ...stations.find((station) => station.stationId === 'SH000001'),
  dataSource: 'sandbox',
  currentPrice: 1,
  isFavorite: true,
  detailsLoaded: true,
  details: structuredClone(detail)
})
const han = /\p{Script=Han}/u
let wrapper
const open = (component, props = {}) => {
  wrapper = mount(component, {
    props,
    attachTo: document.body,
    global: { provide: { showToast: vi.fn() }, stubs: { teleport: true } }
  })
  return wrapper
}
const button = (text) => wrapper.findAll('button').find((item) => item.text().includes(text))
beforeEach(() => {
  localStorage.clear()
  initializeLocale()
  setActivePinia(createPinia())
  const station = sampleStation()
  useStationsStore().stations = [station]
  useStationsStore().currentStation = station
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  useChargingStore().suspendSimulator()
  setLocale('zh-CN')
  localStorage.clear()
  vi.restoreAllMocks()
  vi.useRealTimers()
  document.body.replaceChildren()
})

describe('language preference and message formatting', () => {
  it('switches from the header without changing discovery or charging state, and survives reload', async () => {
    const store = useStationsStore()
    store.searchQuery = '南京'
    store.filters.quickAvailable = true
    const station = store.currentStation
    open(Header)
    await wrapper.get('[aria-label="Switch to English"]').trigger('click')
    expect(wrapper.text()).toContain('Explore')
    expect(wrapper.get('[aria-label="My account"]').exists()).toBe(true)
    expect(document.documentElement.lang).toBe('en-US')
    expect(document.title).toBe('VWer Charging · Find a charger')
    expect(store.currentStation).toBe(station)
    expect(store.searchQuery).toBe('南京')
    expect(store.filters.quickAvailable).toBe(true)
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en-US')
    initializeLocale()
    expect(locale.value).toBe('en-US')
    await wrapper.get('[aria-label="切换为中文"]').trigger('click')
    expect(wrapper.text()).toContain('探索充电站')
    expect(document.documentElement.lang).toBe('zh-CN')
  })

  it('rejects invalid preferences and remains usable when storage is blocked', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'not-a-locale')
    initializeLocale()
    expect(locale.value).toBe('zh-CN')
    expect(setLocale('fr')).toBe(false)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    initializeLocale()
    expect(setLocale('en-US')).toBe(true)
    expect(t('返回')).toBe('Back')
  })

  it('formats English plurals, units and errors without changing currency or user text', () => {
    setLocale('en-US')
    expect(t('{count} 个站点', { count: 1 })).toBe('1 station')
    expect(t('{count} 个站点', { count: 0 })).toBe('0 stations')
    expect(t('{count} 个站点', { count: 12 })).toBe('12 stations')
    expect(formatDuration(4800)).toBe('1 hr 20 min')
    expect(formatDuration(3600, 'hm-verbose')).toBe('1 hr 0 min')
    expect(formatDuration(60, 'hms')).toBe('00:01:00')
    expect(formatDuration(60, 'hm', 'zh-CN')).toBe('1分钟')
    expect(formatPrice(12.5)).toBe('¥12.50')
    expect(t('车辆接口与充电枪不匹配，请选择兼容接口')).not.toMatch(han)
    expect(locationAccuracyText({ accuracy: 2800 })).toContain('±2.8 km')
    expect(
      locationPresentation({ locationStatus: 'error', locationErrorCode: 'PERMISSION_DENIED' })
        .title
    ).toBe('Location permission denied')
    expect(dataText('我的自定义车名')).toBe('我的自定义车名')
    expect(t('__proto__')).toBe('__proto__')
  })

  it('keeps station search bilingual in both languages and leaves canonical data unchanged', () => {
    const store = useStationsStore()
    store.searchQuery = "people's square"
    expect(store.filteredStations.map((station) => station.stationId)).toEqual(['SH000001'])
    setLocale('en-US')
    store.searchQuery = 'nanjing'
    expect(store.filteredStations).toHaveLength(1)
    store.searchQuery = '人民广场'
    expect(store.filteredStations).toHaveLength(1)
    expect(store.currentStation.stationName).toBe('上海·人民广场演示充电站')
  })

  it('translates every shipped station, address, parking rule and detail format', () => {
    setLocale('en-US')
    const untranslated = []
    for (const station of stations) {
      for (const text of [
        stationName(station.stationName),
        stationAddress(station.address),
        dataText(station.parkFee)
      ]) {
        if (han.test(text)) untranslated.push(text)
      }
    }
    const directory = resolve('public/data/details')
    for (const file of readdirSync(directory)) {
      if (!file.endsWith('.json')) continue
      const records = JSON.parse(readFileSync(resolve(directory, file), 'utf8'))
      for (const record of Object.values(records)) {
        const text = [
          siteGuide(record.siteGuide),
          ...record.fastConnectors.map((item) => dataText(item.connectorName)),
          ...record.slowConnectors.map((item) => dataText(item.connectorName)),
          ...record.reviews.flatMap((item) => [dataText(item.content), dataText(item.userName)])
        ].join(' ')
        if (han.test(text)) untranslated.push(`${record.stationId}: ${text}`)
      }
    }
    expect(untranslated).toEqual([])
  })

  it('provides a translation for every literal t() message in application source', () => {
    const missing = []
    const visit = (directory) => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (entry.name === '__tests__' || entry.name === 'i18n') continue
        const path = `${directory}/${entry.name}`
        if (entry.isDirectory()) visit(path)
        else if (/\.(vue|js)$/.test(entry.name)) {
          const source = readFileSync(path, 'utf8')
          for (const match of source.matchAll(/\bt\(\s*'([^']+)'/g)) {
            if (han.test(match[1]) && !Object.hasOwn(english, match[1]))
              missing.push(`${entry.name}: ${match[1]}`)
          }
        }
      }
    }
    visit(resolve('src'))
    expect(missing).toEqual([])
  })
})

describe('English panels and live switching', () => {
  it.each(
    [
      [UserProfile, 'My account'],
      [WalletPanel, 'My wallet'],
      [VehiclePanel, 'My vehicles'],
      [ChargingHistoryPanel, 'Charging history'],
      [CouponsPanel, 'Coupons'],
      [FavoritesPanel, 'Favorites'],
      [NotificationsPanel, 'Notifications'],
      [HelpCenterPanel, 'Help center'],
      [StationDetail, 'Choose a charger'],
      [ChargingSettings, 'Set up charging'],
      [ReservationPanel, 'Book a charger'],
      [ChargingPanel, 'Charging details'],
      [PaymentPanel, 'Checkout'],
      [PaymentSuccess, 'Payment successful'],
      [ReviewPanel, 'Leave a review'],
      [VehicleFilter, 'Filter stations']
    ].map(([component, title]) => ({ component, title }))
  )(
    'renders $title in English, including records and accessible controls',
    async ({ component, title }) => {
      setLocale('en-US')
      open(component)
      await flushPromises()
      expect(wrapper.text()).toContain(title)
      expect(wrapper.text()).not.toMatch(han)
      for (const item of wrapper.findAll('[aria-label], [placeholder]')) {
        expect(item.attributes('aria-label') || '').not.toMatch(han)
        expect(item.attributes('placeholder') || '').not.toMatch(han)
      }
    }
  )

  it('offers named language choices in settings and updates the open panel immediately', async () => {
    open(SettingsPanel)
    await button('English').trigger('click')
    expect(wrapper.text()).toContain('Profile & browser preferences')
    expect(button('English').attributes('aria-pressed')).toBe('true')
    await button('简体中文').trigger('click')
    expect(wrapper.text()).toContain('个人资料与本地偏好')
  })

  it('keeps charger selection and a live session intact when the language changes', async () => {
    vi.useFakeTimers()
    open(ChargingSettings)
    const connector = useStationsStore().currentStation.details.fastConnectors.find(
      (item) => item.status === 1
    )
    await button(connector.connectorName).trigger('click')
    await wrapper
      .get('#charging-vehicle')
      .setValue(
        useUserStore().vehicles.find((vehicle) => vehicle.connectorType === connector.connectorType)
          .id
      )
    const draft = { ...useChargingStore().setupDraft }
    setLocale('en-US')
    await nextTick()
    expect(useChargingStore().setupDraft).toEqual(draft)
    await button('Next · Plug in').trigger('click')
    expect(wrapper.text()).toContain('Plug in your vehicle')
    await button('Plugged in · Check connection').trigger('click')
    await vi.advanceTimersByTimeAsync(1600)
    const charging = useChargingStore()
    expect(charging.isCharging).toBe(true)
    const id = charging.sessionId
    setLocale('zh-CN')
    await nextTick()
    expect(charging.sessionId).toBe(id)
    expect(charging.isCharging).toBe(true)
    expect(charging.sessionConnector.id).toBe(connector.id)
  })

  it('translates map popups and invalidates marker language without touching station IDs', () => {
    const station = sampleStation()
    const point = [{ station, lnglat: [station.lng, station.lat] }]
    const originalSignature = mapManager._markerSignatureFor(point)
    setLocale('en-US')
    expect(mapManager._markerSignatureFor(point)).not.toBe(originalSignature)
    const content = mapManager.buildInfoWindowContent(station)
    expect(content.textContent).toContain("People's Square")
    expect(content.textContent).toContain('/kWh')
    expect(content.textContent).not.toMatch(han)
    expect(content.querySelector('.info-detail-btn').dataset.stationId).toBe(station.stationId)
  })

  it('keeps an order paid in English readable in Chinese after switching back', async () => {
    setLocale('en-US')
    const charging = useChargingStore()
    charging.$patch({
      phase: 'finished',
      paymentPending: true,
      sessionId: 'english-order',
      sessionStation: sampleStation(),
      sessionVehicle: useUserStore().vehicles[0],
      chargingData: { ...charging.chargingData, duration: 4800, energy: 20 }
    })
    const receipt = charging.settlePayment({ method: 'wechat' })
    const record = useUserStore().chargingHistory[0]
    expect(record.durationSeconds).toBe(4800)
    expect(record.duration).toBe('1小时20分钟')
    expect(dataText(useUserStore().notifications[0].content)).not.toMatch(han)
    open(ChargingHistoryPanel)
    expect(wrapper.text()).toContain('1 hr 20 min')
    setLocale('zh-CN')
    await nextTick()
    expect(wrapper.text()).toContain('1小时20分钟')
    expect(wrapper.text()).toContain('上海·人民广场演示充电站')
    expect(charging.lastReceipt.finalAmount).toBe(receipt.finalAmount)
  })

  it('refreshes the existing map and open popup instead of recreating the map', () => {
    const previousMap = mapManager.map
    const previousStation = mapManager._activeStationId
    const map = { setLang: vi.fn() }
    const markers = vi.spyOn(mapManager, 'updateMarkers').mockImplementation(() => {})
    const popup = vi.spyOn(mapManager, 'refreshMarker').mockImplementation(() => {})
    try {
      mapManager.map = map
      mapManager._activeStationId = 'SH000001'
      setLocale('en-US')
      mapManager.refreshLanguage(useStationsStore().stations)
      expect(map.setLang).toHaveBeenCalledWith('en')
      expect(markers).toHaveBeenCalledWith(useStationsStore().stations)
      expect(popup).toHaveBeenCalledWith('SH000001')
      expect(mapManager.map).toBe(map)
      setLocale('zh-CN')
      mapManager.refreshLanguage(useStationsStore().stations)
      expect(map.setLang).toHaveBeenLastCalledWith('zh_cn')
    } finally {
      mapManager.map = previousMap
      mapManager._activeStationId = previousStation
    }
  })
})
