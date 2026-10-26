import { vi } from 'vitest'
import { useChargingStore } from '../../store/modules/charging'
import { useStationsStore } from '../../store/modules/stations'
import { useUserStore } from '../../store/modules/user'

export const installSandbox = () => {
  useStationsStore().currentStation = {
    stationId: 's1',
    stationName: '开始时的站点',
    address: '测试地址',
    dataSource: 'sandbox',
    currentPrice: 1,
    openStatus: 1,
    quickAvailableNum: 1,
    quickChargeNum: 1,
    detailsLoaded: true,
    details: {
      fastConnectors: [
        { id: 'c1', connectorName: '测试枪', connectorType: 'GB/T', power: 60, status: 1 }
      ],
      slowConnectors: []
    }
  }
  useUserStore().vehicles = [
    {
      id: 'v1',
      brand: '沙盒',
      model: '虚拟测试车',
      connectorType: 'GB/T',
      batteryCapacityKwh: 60,
      maxPower: 60,
      isTestVehicle: true
    }
  ]
}

export const prepare = (overrides = {}) => {
  const store = useChargingStore()
  store.prepareSession({
    connectorId: 'c1',
    vehicleId: 'v1',
    initialBattery: 20,
    targetBattery: 80,
    ...overrides
  })
  return store
}

export const ready = async (overrides = {}) => {
  const store = prepare(overrides)
  store.connectPlug()
  store.identifyConnector('c1')
  const pending = store.checkReadiness()
  await vi.advanceTimersByTimeAsync(900)
  await pending
  return store
}

export const start = async (overrides = {}) => {
  const store = await ready(overrides)
  const pending = store.startCharging()
  await vi.advanceTimersByTimeAsync(700)
  await pending
  return store
}

export const stop = async () => {
  const store = useChargingStore()
  const pending = store.stopCharging()
  await vi.advanceTimersByTimeAsync(500)
  await pending
  return store
}

// Settlement unit tests start at an explicit completed device order, not a POI.
export const completedOrder = (station = useStationsStore().currentStation) => {
  const store = useChargingStore()
  store.sessionId = 'completed-test-order'
  store.sessionStation = { ...station, dataSource: 'sandbox' }
  store.phase = 'finished'
  store.paymentPending = true
  return store
}
