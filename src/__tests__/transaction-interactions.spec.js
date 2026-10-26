// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import WalletPanel from '../components/user/WalletPanel.vue'
import PaymentPanel from '../components/payment/PaymentPanel.vue'
import ReviewPanel from '../components/review/ReviewPanel.vue'
import { processPayment, submitReview } from '../services/api'
import { useUserStore } from '../store/modules/user'
import { useChargingStore } from '../store/modules/charging'
import { useStationsStore } from '../store/modules/stations'
import { completedOrder } from './helpers/charging'

vi.mock('../services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  processPayment: vi.fn(),
  submitReview: vi.fn()
}))
let wrapper
const toast = vi.fn()
const button = (container, text) =>
  container.findAll('button').find((element) => element.text().includes(text))
const mountPanel = (component) =>
  mount(component, { global: { provide: { showToast: toast }, stubs: { teleport: true } } })
beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  useUserStore().userInfo.balance = 100
  useUserStore().userInfo.points = 0
  useUserStore().walletTransactions = []
  useStationsStore().currentStation = { stationId: 's1', stationName: '测试站', currentPrice: 1 }
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  vi.unstubAllGlobals()
})

describe('transaction details', () => {
  it('does not silently recharge a preset when the custom value is zero or invalid', async () => {
    wrapper = mountPanel(WalletPanel)
    await button(wrapper, '充值').trigger('click')
    const input = wrapper.get('[aria-label="自定义充值金额"]')
    await input.setValue(0)
    await button(wrapper, '确认充值').trigger('click')
    expect(useUserStore().userInfo.balance).toBe(100)
    expect(useUserStore().walletTransactions).toHaveLength(0)
    await input.setValue('')
    await button(wrapper, '确认充值').trigger('click')
    expect(useUserStore().walletTransactions).toHaveLength(0)
    await button(wrapper, '¥50').trigger('click')
    await button(wrapper, '确认充值').trigger('click')
    expect(useUserStore().userInfo.balance).toBe(150)
  })

  it('prevents duplicate payment requests and snapshots the selected payment method', async () => {
    completedOrder()
    let resolve
    processPayment.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    useChargingStore().chargingData.energy = 10
    wrapper = mountPanel(PaymentPanel)
    const pay = button(wrapper, '确认支付')
    await pay.trigger('click')
    await pay.trigger('click')
    expect(processPayment).toHaveBeenCalledTimes(1)
    expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined()
    expect(wrapper.get('.panel-overlay').attributes('aria-busy')).toBe('true')
    resolve({ success: true })
    await flushPromises()
    expect(wrapper.emitted('payment-success')).toHaveLength(1)
    expect(useUserStore().userInfo.balance).toBe(100)
  })

  it('adds review points only once and requires an explicit discard of a dirty draft', async () => {
    submitReview.mockResolvedValue({ reviewId: 'review-1' })
    const charging = useChargingStore()
    charging.lastReceipt = { station: { stationId: 's1', stationName: '测试站' } }
    wrapper = mountPanel(ReviewPanel)
    await wrapper.get('#review-content').setValue('充电体验很好')
    await wrapper.get('#back-from-review').trigger('click')
    expect(wrapper.find('.dialog-overlay').exists()).toBe(true)
    expect(wrapper.emitted('close')).toBeUndefined()
    await button(wrapper, '继续编辑').trigger('click')
    await wrapper.get('#submit-review-btn').trigger('click')
    await flushPromises()
    expect(useUserStore().userInfo.points).toBe(5)
    expect(charging.reviewSubmitted).toBe(true)
    expect(submitReview).toHaveBeenCalledTimes(1)
    expect(wrapper.get('#submit-review-btn').attributes('disabled')).toBeDefined()
  })

  it('limits image previews, allows removal and releases every blob URL', async () => {
    let sequence = 0
    const revoke = vi.fn()
    vi.stubGlobal(
      'URL',
      class extends URL {
        static createObjectURL() {
          return `blob:preview-${++sequence}`
        }
        static revokeObjectURL(url) {
          revoke(url)
        }
      }
    )
    wrapper = mountPanel(ReviewPanel)
    const input = wrapper.get('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      configurable: true,
      value: Array.from(
        { length: 4 },
        (_, index) => new File(['image'], `${index}.png`, { type: 'image/png' })
      )
    })
    await input.trigger('change')
    await nextTick()
    expect(wrapper.findAll('img')).toHaveLength(3)
    await wrapper.get('[aria-label="移除图片 1"]').trigger('click')
    expect(revoke).toHaveBeenCalledWith('blob:preview-1')
    wrapper.unmount()
    wrapper = null
    expect(revoke).toHaveBeenCalledTimes(3)
  })
})
