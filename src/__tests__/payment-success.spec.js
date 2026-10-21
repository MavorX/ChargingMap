import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PaymentSuccess from '../components/payment/PaymentSuccess.vue'
import { useChargingStore } from '../store/modules/charging'

const normalized = (text) => text.replace(/\s+/g, '')

const mountSuccess = (props = {}) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const chargingStore = useChargingStore()
  chargingStore.quotePayment = () => ({
    chargeCost: 100,
    serviceFee: 10,
    totalAmount: 110,
    couponDiscount: 0,
    finalAmount: 110
  })

  return mount(PaymentSuccess, {
    props,
    global: { plugins: [pinia] }
  })
}

const paidAmountText = (wrapper) =>
  wrapper
    .findAll('div')
    .map((element) => normalized(element.text()))
    .find((text) => text.startsWith('支付金额'))

describe('PaymentSuccess amount rendering', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.body.style.overflow = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
    document.body.style.overflow = ''
  })

  it('renders ¥0.00 for a fully discounted payment instead of the pre-coupon quote', () => {
    const wrapper = mountSuccess({ amount: 0 })

    expect(paidAmountText(wrapper)).toBe('支付金额¥0.00')
    expect(wrapper.text()).not.toContain('¥110.00')

    wrapper.unmount()
  })

  it('falls back to the current quote when no receipt amount is passed', () => {
    const wrapper = mountSuccess()

    expect(paidAmountText(wrapper)).toBe('支付金额¥110.00')

    wrapper.unmount()
  })

  it('still renders a positive receipt amount', () => {
    const wrapper = mountSuccess({ amount: 12.5 })

    expect(paidAmountText(wrapper)).toBe('支付金额¥12.50')

    wrapper.unmount()
  })
})
