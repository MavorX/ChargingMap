// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import ChargingSettings from '../components/charging/ChargingSettings.vue'
import ReservationPanel from '../components/reservation/ReservationPanel.vue'
import { useStationsStore } from '../store/modules/stations'
import { useReservationStore } from '../store/modules/reservation'
import { useUserStore } from '../store/modules/user'
import { installSandbox } from './helpers/charging'

let wrapper
const mountPanel = (component) => mount(component, { global: { provide: { showToast: vi.fn() } } })
const button = (text) => wrapper.findAll('button').find((element) => element.text().includes(text))
beforeEach(() => {
  setActivePinia(createPinia())
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-26T10:30:00'))
  useStationsStore().currentStation = {
    stationId: 's1',
    stationName: '测试站',
    currentPrice: 1,
    openStatus: 1,
    reservationAvailable: true,
    detailsLoaded: true,
    details: {
      fastConnectors: [
        { id: 'c1', connectorName: '快充 1', status: 1, power: 60, connectorType: 'GB/T' }
      ],
      slowConnectors: []
    }
  }
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('form state boundaries', () => {
  it('clears a stale connector selection when the last available connector disappears', async () => {
    installSandbox()
    wrapper = mountPanel(ChargingSettings)
    expect(button('下一步').attributes('disabled')).toBeDefined()
    await button('测试枪').trigger('click')
    await wrapper.get('#charging-vehicle').setValue('v1')
    await wrapper.get('#initial-soc').setValue(20)
    expect(button('下一步').attributes('disabled')).toBeUndefined()
    expect(wrapper.text()).toContain('36.0 kWh')
    expect(wrapper.text()).toContain('¥39.60')
    useStationsStore().currentStation.details.fastConnectors[0].status = 2
    await nextTick()
    expect(button('下一步').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('当前没有可用的充电桩')
  })

  it('disables past slots and prevents duplicate reservations while submitting', async () => {
    let resolve
    const create = vi.spyOn(useReservationStore(), 'createReservation').mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    wrapper = mountPanel(ReservationPanel)
    expect(button('08:00-10:00').attributes('disabled')).toBeDefined()
    expect(button('10:00-12:00').attributes('disabled')).toBeDefined()
    await button('明天').trigger('click')
    await button('08:00-10:00').trigger('click')
    await button('确认预约').trigger('click')
    await button('正在预约').trigger('click')
    expect(create).toHaveBeenCalledTimes(1)
    expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined()
    resolve({ id: 'r1' })
    await flushPromises()
    expect(wrapper.emitted('reservation-success')).toHaveLength(1)
  })

  it('provides an add-vehicle path instead of an unexplained disabled submit', async () => {
    useUserStore().vehicles = []
    wrapper = mountPanel(ReservationPanel)
    await button('前往添加车辆').trigger('click')
    expect(wrapper.emitted('show-vehicles')).toHaveLength(1)
    expect(button('确认预约').attributes('disabled')).toBeDefined()
  })

  it('validates an expired time slot again at the reservation action boundary', async () => {
    const store = useReservationStore()
    const count = store.reservations.length
    await expect(
      store.createReservation({
        stationId: 's1',
        connectorId: 'c1',
        vehicleModel: 'ID.3',
        chargeAmount: 50,
        date: '2026-10-26',
        timeSlot: '08:00-10:00'
      })
    ).rejects.toThrow('预约时段已失效')
    expect(store.reservations).toHaveLength(count)
    expect(store.isLoading).toBe(false)
  })

  it('rejects operator reservations for public map locations', async () => {
    useStationsStore().currentStation.dataSource = 'amap'
    await expect(
      useReservationStore().createReservation({ stationId: 'AMAP:poi' })
    ).rejects.toThrow('未接入运营商预约')
  })
})
