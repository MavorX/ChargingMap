// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { useUiStore } from '../store/modules/ui'
import HomeView from '../views/HomeView.vue'
import PaymentSuccess from '../components/payment/PaymentSuccess.vue'

const PANEL_MARKERS = {
  stationsList: '#stations-list',
  vehicleFilter: '.panel-overlay[aria-label="筛选条件"]',
  reservation: '.panel-overlay[aria-label="预约充电桩"]',
  chargingSettings: '.panel-overlay[aria-label="充电设置"]',
  charging: '.panel-overlay[aria-label="充电中"]',
  payment: '.panel-overlay[aria-label="确认支付"]',
  paymentSuccess: '.panel-overlay[aria-label="支付成功"]',
  review: '.panel-overlay[aria-label="评价充电站"]',
  userProfile: '.panel-overlay[aria-label="我的账户"]',
  notifications: '.panel-overlay[aria-label="通知中心"]',
  vehicle: '.panel-overlay[aria-label="我的车辆"]',
  chargingHistory: '.panel-overlay[aria-label="充电记录"]',
  coupons: '.panel-overlay[aria-label="优惠券"]',
  wallet: '.panel-overlay[aria-label="我的钱包"]',
  favorites: '.panel-overlay[aria-label="我的收藏"]',
  settings: '.panel-overlay[aria-label="设置"]',
  help: '.panel-overlay[aria-label="帮助中心"]'
}

const PANEL_NAMES = Object.keys(PANEL_MARKERS)

const settle = async () => {
  await flushPromises()
  // Dynamic `import()` resolves through the module runner, which may need a
  // macrotask before the async wrapper re-renders.
  await new Promise((resolve) => setTimeout(resolve, 0))
  await flushPromises()
  await nextTick()
  await nextTick()
}

describe('ui store activePanel orchestration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('opening another panel closes the previous one (mutual exclusion)', () => {
    const ui = useUiStore()

    ui.open('payment')
    expect(ui.activePanel).toBe('payment')

    ui.open('vehicle')
    expect(ui.activePanel).toBe('vehicle')
    expect(ui.panelHistory).toEqual(['payment'])
  })

  it('close() dismisses to null when there is no previous panel', () => {
    const ui = useUiStore()

    ui.open('wallet')
    ui.close()

    expect(ui.activePanel).toBeNull()
    expect(ui.panelHistory).toEqual([])
  })

  it('close() walks back through the panel history stack', () => {
    const ui = useUiStore()

    ui.open('userProfile')
    ui.open('wallet')
    ui.open('coupons')

    ui.close()
    expect(ui.activePanel).toBe('wallet')

    ui.close()
    expect(ui.activePanel).toBe('userProfile')

    ui.close()
    expect(ui.activePanel).toBeNull()
  })

  it('re-opening the active panel does not grow the history', () => {
    const ui = useUiStore()

    ui.open('wallet')
    ui.open('wallet')

    expect(ui.activePanel).toBe('wallet')
    expect(ui.panelHistory).toEqual([])
  })

  it('replace() changes the flow panel without growing the back stack', () => {
    const ui = useUiStore()

    ui.open('chargingSettings')
    ui.replace('charging')
    ui.replace('payment')

    expect(ui.activePanel).toBe('payment')
    expect(ui.panelHistory).toEqual([])

    ui.close()
    expect(ui.activePanel).toBeNull()
  })

  it('open(name, { reset }) drops the previous flow from history', () => {
    const ui = useUiStore()

    ui.open('userProfile')
    ui.open('wallet')
    ui.open('paymentSuccess', { reset: true })
    ui.replace('review')
    ui.close()

    expect(ui.activePanel).toBeNull()
    expect(ui.panelHistory).toEqual([])
  })

  it('dismiss() clears both the active panel and history', () => {
    const ui = useUiStore()

    ui.open('userProfile')
    ui.open('favorites')
    ui.dismiss()

    expect(ui.activePanel).toBeNull()
    expect(ui.panelHistory).toEqual([])
  })

  it('open(undefined) is a no-op and never throws', () => {
    const ui = useUiStore()

    ui.open('payment')
    expect(() => ui.open(undefined)).not.toThrow()
    expect(() => ui.open('')).not.toThrow()
    expect(ui.activePanel).toBe('payment')
    expect(ui.panelHistory).toEqual([])
  })

  it('does not create a history loop when reopening an ancestor panel', () => {
    const ui = useUiStore()
    ui.open('userProfile')
    ui.open('wallet')
    ui.open('coupons')
    ui.open('userProfile')
    expect(ui.panelHistory).toEqual([])
    ui.close()
    expect(ui.activePanel).toBeNull()
  })

  it('drops stale account panels when entering a transactional replacement step', () => {
    const ui = useUiStore()
    ui.open('userProfile')
    ui.open('chargingSettings')
    ui.replace('charging')
    expect(ui.panelHistory).toEqual([])
    ui.close()
    expect(ui.activePanel).toBeNull()
  })
})

describe('HomeView panel smoke', () => {
  let wrapper
  let ui
  let consoleError

  beforeEach(() => {
    setActivePinia(createPinia())
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    wrapper = mount(HomeView, {
      attachTo: document.body,
      global: {
        provide: {
          showToast: vi.fn(),
          setLoading: vi.fn()
        },
        stubs: {
          MapView: true
        }
      }
    })
    ui = useUiStore()
  })

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
    document.body.style.overflow = ''
    consoleError.mockRestore()
  })

  it('mounts every panel through the single activePanel source', async () => {
    for (const name of PANEL_NAMES) {
      ui.dismiss()
      await settle()

      ui.open(name)
      await settle()

      expect(ui.activePanel, `activePanel should be ${name}`).toBe(name)

      await vi.waitFor(
        () => {
          expect(
            document.querySelector(PANEL_MARKERS[name]),
            `panel ${name} should be mounted`
          ).not.toBeNull()
        },
        { timeout: 2000, interval: 20 }
      )
    }

    expect(consoleError).not.toHaveBeenCalled()
  })

  it('opens review only when explicitly chosen on the payment result', async () => {
    ui.open('paymentSuccess', { reset: true })
    await settle()

    await vi.waitFor(
      () => {
        expect(wrapper.findComponent(PaymentSuccess).exists()).toBe(true)
      },
      { timeout: 2000, interval: 20 }
    )

    wrapper.findComponent(PaymentSuccess).vm.$emit('review')
    expect(ui.activePanel).toBe('review')

    await vi.waitFor(
      () => {
        expect(document.querySelector(PANEL_MARKERS.review)).not.toBeNull()
      },
      { timeout: 2000, interval: 20 }
    )

    ui.close()
    expect(ui.activePanel).toBeNull()
  })

  it('keeps mutual exclusion while switching panels in the real view', async () => {
    ui.open('payment')
    await settle()

    ui.open('vehicle')
    await settle()

    expect(ui.activePanel).toBe('vehicle')
    await vi.waitFor(
      () => {
        expect(wrapper.findAll('.panel-overlay')).toHaveLength(1)
      },
      { timeout: 2000, interval: 20 }
    )
  })
})
