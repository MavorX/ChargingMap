import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import ReservationPanel from '../components/reservation/ReservationPanel.vue'
import { useReservationStore } from '../store/modules/reservation'
import { useStationsStore } from '../store/modules/stations'
import { useUserStore } from '../store/modules/user'
import { installSandbox } from './helpers/charging'

const reservation = () => ({
  stationId: 's1',
  connectorId: 'c1',
  vehicleId: 'v1',
  vehicleModel: '虚拟测试车',
  chargeAmount: 50,
  date: '2026-10-27',
  timeSlot: '08:00-10:00'
})
let wrapper
beforeEach(() => {
  setActivePinia(createPinia())
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-26T10:30:00'))
  installSandbox()
  useStationsStore().currentStation.reservationAvailable = true
  useReservationStore().reservations = []
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('reservation selection validation', () => {
  it('rejects an incompatible vehicle before starting a request', async () => {
    useUserStore().vehicles[0].connectorType = 'CCS Combo'
    await expect(useReservationStore().createReservation(reservation())).rejects.toThrow('接口')
    expect(useReservationStore().reservations).toHaveLength(0)
    expect(useReservationStore().isLoading).toBe(false)
  })

  it.each([
    [
      'unavailable connector',
      () => {
        useStationsStore().currentStation.details.fastConnectors[0].status = 3
      }
    ],
    [
      'closed station',
      () => {
        useStationsStore().currentStation.openStatus = 0
      }
    ],
    [
      'unsupported reservation',
      () => {
        useStationsStore().currentStation.reservationAvailable = false
      }
    ],
    [
      'removed vehicle',
      () => {
        useUserStore().vehicles = []
      }
    ]
  ])('rejects a stale %s', async (_name, change) => {
    change()
    await expect(useReservationStore().createReservation(reservation())).rejects.toThrow()
    expect(useReservationStore().reservations).toHaveLength(0)
  })

  it('revalidates the selected connector after the simulated response', async () => {
    const pending = useReservationStore().createReservation(reservation())
    const assertion = expect(pending).rejects.toThrow()
    useStationsStore().currentStation.details.fastConnectors[0].status = 3
    await vi.advanceTimersByTimeAsync(1000)
    await assertion
    expect(useReservationStore().reservations).toHaveLength(0)
    expect(useReservationStore().isLoading).toBe(false)
  })

  it('revalidates an expiring slot before committing the reservation', async () => {
    vi.setSystemTime(new Date('2026-10-27T07:59:59.500'))
    const pending = useReservationStore().createReservation(reservation())
    const assertion = expect(pending).rejects.toThrow('时段')
    await vi.advanceTimersByTimeAsync(1000)
    await assertion
    expect(useReservationStore().reservations).toHaveLength(0)
  })

  it('does not reserve more energy than the selected vehicle can hold', async () => {
    await expect(
      useReservationStore().createReservation({ ...reservation(), chargeAmount: 70 })
    ).rejects.toThrow('电池容量')
    expect(useReservationStore().reservations).toHaveLength(0)
  })

  it('does not apply a late reservation to another selected station', async () => {
    const pending = useReservationStore().createReservation(reservation())
    const assertion = expect(pending).rejects.toThrow('预约站点已变化')
    useStationsStore().currentStation = { stationId: 's2', openStatus: 1 }
    await vi.advanceTimersByTimeAsync(1000)
    await assertion
    expect(useReservationStore().reservations).toHaveLength(0)
  })

  it('creates one valid reservation with canonical station and vehicle information', async () => {
    const pending = useReservationStore().createReservation({
      ...reservation(),
      vehicleModel: 'stale label'
    })
    await vi.advanceTimersByTimeAsync(1000)
    const saved = await pending
    expect(saved).toMatchObject({
      stationName: '开始时的站点',
      vehicleModel: '虚拟测试车',
      vehicleId: 'v1'
    })
    expect(useReservationStore().reservations).toHaveLength(1)
  })

  it('explains an incompatible selection and keeps the submit action disabled', async () => {
    useUserStore().vehicles[0].connectorType = 'CCS Combo'
    wrapper = mount(ReservationPanel, { global: { provide: { showToast: vi.fn() } } })
    const button = (text) => wrapper.findAll('button').find((item) => item.text().includes(text))
    await button('明天').trigger('click')
    await button('08:00-10:00').trigger('click')
    expect(wrapper.text()).toContain('车辆接口与充电枪不匹配')
    expect(button('确认预约').attributes('disabled')).toBeDefined()
  })
})
