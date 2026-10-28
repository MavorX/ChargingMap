import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useChargingStore } from '../store/modules/charging'
import { useStationsStore } from '../store/modules/stations'
import { useUserStore } from '../store/modules/user'
import { installSandbox, prepare, ready, start, stop } from './helpers/charging'

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  vi.useFakeTimers()
  installSandbox()
})
afterEach(() => {
  useChargingStore().suspendSimulator()
  vi.useRealTimers()
})

describe('device acknowledgement safety boundaries', () => {
  it('keeps the selected gun occupied until it is unplugged, including while browsing another station', async () => {
    const original = useStationsStore().currentStation
    const store = await start()
    expect(original.details.fastConnectors[0].status).toBe(3)
    expect(original.quickAvailableNum).toBe(0)
    await stop()
    expect(original.quickAvailableNum).toBe(0)
    useStationsStore().currentStation = { stationId: 'other' }
    store.disconnectPlug()
    expect(original.details.fastConnectors[0].status).toBe(1)
    expect(original.quickAvailableNum).toBe(1)
  })
  it('shares the prepared device across per-action devtools proxies', () => {
    const store = useChargingStore()
    store.prepareSession.call(new Proxy(store, {}), {
      connectorId: 'c1',
      vehicleId: 'v1',
      initialBattery: 20,
      targetBattery: 80
    })
    expect(() => store.connectPlug.call(new Proxy(store, {}))).not.toThrow()
    expect(store.plugConnected).toBe(true)
  })
  it('cannot charge or pay from just a selected POI', async () => {
    const store = useChargingStore()
    await expect(store.startCharging()).rejects.toThrow('设备尚未就绪')
    expect(() => store.settlePayment()).toThrow('不能从选中站点')
    useStationsStore().currentStation.dataSource = 'amap'
    expect(() => prepare()).toThrow('未接入运营商')
    expect(store.chargingData.energy).toBe(0)
  })

  it('requires both a physical connection signal and the matching gun code', async () => {
    const store = prepare()
    await expect(store.checkReadiness()).rejects.toThrow('必须先连接')
    store.connectPlug()
    expect(() => store.identifyConnector('other-gun')).toThrow('枪码不匹配')
    await expect(store.startCharging()).rejects.toThrow('设备尚未就绪')
    expect(store.phase).toBe('plugged')
  })

  it('does not meter before a positive start acknowledgement', async () => {
    const store = await ready()
    const pending = store.startCharging()
    expect(store.phase).toBe('starting')
    expect(store.isCharging).toBe(false)
    expect(() => store.disconnectPlug()).toThrow('禁止拔枪')
    expect(() => store.cancelPreparation()).toThrow('命令处理中')
    await vi.advanceTimersByTimeAsync(699)
    expect(store.chargingData.energy).toBe(0)
    await vi.advanceTimersByTimeAsync(1)
    await pending
    expect(store.isCharging).toBe(true)
    expect(store.chargingData.energy).toBe(0)
  })

  it.each([
    ['offline', '离线'],
    ['occupied', '占用']
  ])('rejects %s devices during inspection', async (scenario, text) => {
    const store = prepare({ scenario })
    store.connectPlug()
    store.identifyConnector('c1')
    const assertion = expect(store.checkReadiness()).rejects.toThrow(text)
    await vi.advanceTimersByTimeAsync(900)
    await assertion
    expect(store.phase).toBe('fault')
    expect(store.paymentPending).toBe(false)
    expect(store.chargingData.energy).toBe(0)
  })

  it('does not create an order when the device refuses start', async () => {
    const store = await ready({ scenario: 'start_failure' })
    const assertion = expect(store.startCharging()).rejects.toThrow('拒绝启动')
    await vi.advanceTimersByTimeAsync(700)
    await assertion
    expect(store.isCharging).toBe(false)
    expect(store.paymentPending).toBe(false)
    expect(store.sessionStation).toBe(null)
  })

  it('keeps metering after failed stop, blocks unplug and allows a confirmed retry', async () => {
    const store = await start({ scenario: 'stop_failure' })
    const assertion = expect(store.stopCharging()).rejects.toThrow('应答丢失')
    await vi.advanceTimersByTimeAsync(500)
    await assertion
    await vi.advanceTimersByTimeAsync(2500)
    expect(store.phase).toBe('stop_failed')
    expect(store.chargingData.energy).toBeCloseTo((60 * 3) / 3600)
    expect(() => store.disconnectPlug()).toThrow('禁止拔枪')
    expect(() => store.settlePayment()).toThrow('请先结束')
    store.recoverDeviceResponse()
    await stop()
    expect(store.phase).toBe('awaiting_unplug')
    store.disconnectPlug()
    expect(store.phase).toBe('finished')
  })

  it.each([
    [
      '接口不匹配',
      (user) => {
        user.vehicles[0].connectorType = 'Type 2'
      }
    ],
    [
      '容量未知',
      (user) => {
        user.vehicles[0].batteryCapacityKwh = null
      }
    ],
    [
      '功率未知',
      (user) => {
        user.vehicles[0].maxPower = null
      }
    ]
  ])('rejects %s instead of inventing a default', (_name, change) => {
    change(useUserStore())
    expect(() => prepare()).toThrow()
  })

  it('rejects an obsolete prepared vehicle or newly occupied gun before starting', async () => {
    const store = await ready()
    useUserStore().vehicles[0].batteryCapacityKwh = 80
    await expect(store.startCharging()).rejects.toThrow('规格')
    useUserStore().vehicles[0].batteryCapacityKwh = 60
    useStationsStore().currentStation.details.fastConnectors[0].status = 2
    await expect(store.startCharging()).rejects.toThrow('不可用')
    expect(store.isCharging).toBe(false)
  })

  it('limits modeled power to the lower vehicle rating', async () => {
    useUserStore().vehicles[0].maxPower = 30
    const store = await start()
    await vi.advanceTimersByTimeAsync(3600000)
    expect(store.sessionModel.powerKw).toBe(30)
    expect(store.chargingData.energy).toBeLessThanOrEqual(30)
    expect(store.chargingData.energy).toBeGreaterThan(29)
    expect(store.chargingData.battery).toBeLessThan(70)
    expect(store.chargingData.speed).toBeLessThanOrEqual(30)
  })

  it('does not resurrect a pending start after the simulator is disposed', async () => {
    const store = await ready()
    const assertion = expect(store.startCharging()).rejects.toThrow()
    store.suspendSimulator()
    await vi.advanceTimersByTimeAsync(700)
    await assertion
    expect(store.isCharging).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('isolates timers between stores', async () => {
    const first = await start()
    const firstPinia = createPinia()
    setActivePinia(firstPinia)
    installSandbox()
    const second = await start()
    first.suspendSimulator()
    await vi.advanceTimersByTimeAsync(2000)
    expect(second.isCharging).toBe(true)
    expect(second.chargingData.duration).toBe(2)
  })
})

describe('local recovery without fabricated telemetry', () => {
  it('restores only saved readings and requires archiving an interrupted session', async () => {
    const previous = await start()
    await vi.advanceTimersByTimeAsync(2000)
    previous.suspendSimulator()
    const energy = previous.chargingData.energy
    setActivePinia(createPinia())
    vi.setSystemTime(Date.now() + 3600000)
    const restored = useChargingStore()
    restored.restoreSession()
    expect(restored.phase).toBe('interrupted')
    expect(restored.isCharging).toBe(false)
    expect(restored.chargingData.energy).toBe(energy)
    expect(() => restored.settlePayment()).toThrow('中断')
    restored.acknowledgeInterruption()
    expect(restored.settlePayment().energy).toBe(energy)
  })

  it('does not skip unplugging after refresh of a stopped order', async () => {
    await start()
    await stop()
    setActivePinia(createPinia())
    const restored = useChargingStore()
    restored.restoreSession()
    expect(restored.phase).toBe('awaiting_unplug')
    expect(() => restored.settlePayment()).toThrow('拔枪')
    restored.disconnectPlug()
    expect(restored.phase).toBe('finished')
  })

  it.each([
    null,
    {},
    { version: 1, station: { dataSource: 'amap' } },
    { version: 1, sessionId: 'x', station: { dataSource: 'sandbox' }, data: { energy: -1 } }
  ])('ignores corrupt saved records: %j', (saved) => {
    localStorage.setItem('chargingSandboxSession', JSON.stringify(saved))
    const store = useChargingStore()
    expect(() => store.restoreSession()).not.toThrow()
    expect(store.phase).toBe('idle')
    expect(store.paymentPending).toBe(false)
  })
})
