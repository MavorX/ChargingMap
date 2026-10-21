import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PaymentPanel from '../components/payment/PaymentPanel.vue'
import { useStationsStore } from '../store/modules/stations'
import { useChargingStore } from '../store/modules/charging'

const normalized = (text) => text.replace(/\s+/g, '')

const mountPanel = ({ energy, price }) => {
  const stationsStore = useStationsStore()
  const chargingStore = useChargingStore()
  stationsStore.currentStation = {
    stationId: 's1',
    stationName: '测试充电站',
    address: '合肥市测试路1号',
    currentPrice: price
  }
  chargingStore.chargingData.energy = energy
  return mount(PaymentPanel, {
    global: {
      provide: { showToast: vi.fn(), setLoading: vi.fn() }
    }
  })
}

const openCouponList = async (wrapper) => {
  const toggle = wrapper.findAll('button').find((button) => button.text().includes('选择优惠券'))
  expect(toggle).toBeTruthy()
  await toggle.trigger('click')
}

const selectCoupon = async (wrapper, name) => {
  const card = wrapper.findAll('.premium-card').find((element) => element.text().includes(name))
  expect(card).toBeTruthy()
  await card.trigger('click')
}

const paidAmountText = (wrapper) => {
  const row = wrapper
    .findAll('div')
    .map((element) => normalized(element.text()))
    .find((text) => text.startsWith('实付金额¥'))
  expect(row).toBeTruthy()
  return row
}

describe('PaymentPanel coupon arithmetic characterization', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('charges energy * price plus 10% service fee when no coupon is selected', () => {
    const wrapper = mountPanel({ energy: 100, price: 1 })

    expect(paidAmountText(wrapper)).toBe('实付金额¥110.00')
  })

  it('subtracts a fixed amount coupon from the total', async () => {
    const wrapper = mountPanel({ energy: 100, price: 1 })
    await openCouponList(wrapper)
    await selectCoupon(wrapper, '满50减5元')

    expect(paidAmountText(wrapper)).toBe('实付金额¥105.00')
  })

  it('applies a percentage coupon and caps the discount at its value', async () => {
    const wrapper = mountPanel({ energy: 100, price: 1 })
    await openCouponList(wrapper)
    await selectCoupon(wrapper, '新人8折券')

    // total 110 -> 20% off = 22, capped at coupon value 20 -> 90
    expect(paidAmountText(wrapper)).toBe('实付金额¥90.00')
  })

  it('applies an uncapped percentage discount when it is below the coupon cap', async () => {
    const wrapper = mountPanel({ energy: 50, price: 1 })
    await openCouponList(wrapper)
    await selectCoupon(wrapper, '新人8折券')

    // total 55 -> 20% off = 11, below cap 20 -> 44
    expect(paidAmountText(wrapper)).toBe('实付金额¥44.00')
  })

  it('subtracts a free charging coupon by its fixed value', async () => {
    const wrapper = mountPanel({ energy: 100, price: 1 })
    await openCouponList(wrapper)
    await selectCoupon(wrapper, '免费充电券')

    expect(paidAmountText(wrapper)).toBe('实付金额¥95.00')
  })
})
