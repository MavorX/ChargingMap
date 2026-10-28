import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { useStationsStore } from '../store/modules/stations'
import { useChargingStore } from '../store/modules/charging'
import { useUserStore } from '../store/modules/user'
import { useUiStore } from '../store/modules/ui'
import HomeView from '../views/HomeView.vue'
import ChargingPanel from '../components/charging/ChargingPanel.vue'
import PaymentSuccess from '../components/payment/PaymentSuccess.vue'
import { installSandbox, start, stop } from './helpers/charging'
import { chargingDurationSeconds } from '../utils/chargingModel'

let wrapper
beforeEach(() => {
  setActivePinia(createPinia())
  vi.useFakeTimers()
  localStorage.clear()
  installSandbox()
  useUserStore().userInfo.balance = 100
  useUserStore().walletTransactions = []
  useUserStore().chargingHistory = []
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  useChargingStore().suspendSimulator()
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('charging order lifecycle', () => {
  it('freezes the device, vehicle and tariff after browsing another station', async () => {
    const store = await start()
    await vi.advanceTimersByTimeAsync(2000)
    useStationsStore().currentStation = { stationId: 's2', stationName: '其他站', currentPrice: 99 }
    await stop()
    store.disconnectPlug()
    expect(store.quotePayment().finalAmount).toBe(0.04)
    const receipt = store.settlePayment({ method: 'wallet' })
    expect(receipt.station.stationId).toBe('s1')
    expect(useUserStore().chargingHistory[0].stationName).toBe('开始时的站点')
    expect(store.sessionConnector.id).toBe('c1')
    expect(store.paymentPending).toBe(false)
  })

  it('requires stopping and unplugging before payment, and blocks unpaid session replacement', async () => {
    const store = await start()
    expect(() => store.settlePayment()).toThrow('请先结束充电')
    await stop()
    expect(() => store.settlePayment()).toThrow('请先完成拔枪')
    await expect(store.startCharging()).rejects.toThrow('请先结算')
  })

  it('settles once and never debits the test wallet for an external test payment', async () => {
    const store = await start()
    await vi.advanceTimersByTimeAsync(3000)
    await stop()
    store.disconnectPlug()
    const receipt = store.settlePayment({ method: 'wechat' })
    expect(store.settlePayment()).toBe(receipt)
    expect(useUserStore().userInfo.balance).toBe(100)
    expect(useUserStore().walletTransactions).toHaveLength(1)
    expect(useUserStore().chargingHistory).toHaveLength(1)
  })

  it('rejects insufficient wallet balance without mutating records', async () => {
    const store = await start()
    await vi.advanceTimersByTimeAsync(3000)
    await stop()
    store.disconnectPlug()
    useUserStore().userInfo.balance = 0
    expect(() => store.settlePayment({ method: 'wallet' })).toThrow('钱包余额不足')
    expect(useUserStore().walletTransactions).toHaveLength(0)
    expect(store.paymentPending).toBe(true)
  })

  it('limits modeled output but still waits for stop acknowledgement after a late timer', async () => {
    const store = await start()
    vi.setSystemTime(Date.now() + 3600000)
    await vi.advanceTimersByTimeAsync(1000)
    expect(store.phase).toBe('stopping')
    expect(store.isCharging).toBe(true)
    expect(store.chargingData.elapsedRealSeconds).toBe(3601)
    expect(store.chargingData.duration).toBeCloseTo(chargingDurationSeconds(store.sessionModel))
    expect(store.chargingData.energy).toBe(36)
    expect(store.chargingData.battery).toBe(80)
    expect(() => store.disconnectPlug()).toThrow('禁止拔枪')
    await vi.advanceTimersByTimeAsync(500)
    expect(store.isCharging).toBe(false)
    expect(store.phase).toBe('awaiting_unplug')
  })

  it('closing the panel keeps the session alive and requires unplug after resume', async () => {
    wrapper = mount(HomeView, {
      attachTo: document.body,
      global: { provide: { showToast: vi.fn(), setLoading: vi.fn() }, stubs: { MapView: true } }
    })
    const store = await start()
    const ui = useUiStore()
    ui.open('charging')
    await flushPromises()
    wrapper.findComponent(ChargingPanel).vm.$emit('close')
    await flushPromises()
    expect(ui.activePanel).toBe(null)
    expect(store.isCharging).toBe(true)
    await wrapper.get('.session-resume').trigger('click')
    expect(ui.activePanel).toBe('charging')
    await stop()
    await flushPromises()
    expect(ui.activePanel).toBe('charging')
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('已拔枪'))
      .trigger('click')
    expect(ui.activePanel).toBe('payment')
  })

  it('payment return goes to the map rather than forcing a review', async () => {
    wrapper = mount(HomeView, {
      attachTo: document.body,
      global: { provide: { showToast: vi.fn() }, stubs: { MapView: true } }
    })
    const ui = useUiStore()
    ui.open('paymentSuccess')
    await flushPromises()
    wrapper.findComponent(PaymentSuccess).vm.$emit('close')
    expect(ui.activePanel).toBe(null)
    expect(useStationsStore().currentStation).toBe(null)
  })
})
