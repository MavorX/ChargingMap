import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import ChargingSettings from '../components/charging/ChargingSettings.vue'
import ChargingPanel from '../components/charging/ChargingPanel.vue'
import { useChargingStore } from '../store/modules/charging'
import { useStationsStore } from '../store/modules/stations'
import { installSandbox, start } from './helpers/charging'

let wrapper
const button = (text) => wrapper.findAll('button').find((element) => element.text().includes(text))
const mountSettings = () =>
  mount(ChargingSettings, {
    attachTo: document.body,
    global: { provide: { showToast: vi.fn() }, stubs: { teleport: true } }
  })
beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  vi.useFakeTimers()
  installSandbox()
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  useChargingStore().suspendSimulator()
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.replaceChildren()
})

describe('human-scale charging demonstration', () => {
  it('replaces a stale stop confirmation with unplugging when charging ends automatically', async () => {
    const store = await start({ initialBattery: 79, targetBattery: 80, clockScale: 60 })
    wrapper = mount(ChargingPanel, {
      attachTo: document.body,
      global: { provide: { showToast: vi.fn() }, stubs: { teleport: true } }
    })
    await button('结束充电').trigger('click')
    expect(wrapper.text()).toContain('结束本次充电？')
    await vi.advanceTimersByTimeAsync(1000)
    expect(store.phase).toBe('stopping')
    expect(button('正在停止').attributes('disabled')).toBeDefined()
    await vi.advanceTimersByTimeAsync(500)
    expect(store.phase).toBe('awaiting_unplug')
    expect(wrapper.find('.dialog-overlay').exists()).toBe(false)
    expect(document.activeElement).toBe(button('已拔枪').element)
    await button('已拔枪').trigger('click')
    expect(store.phase).toBe('finished')
    expect(wrapper.emitted('charging-complete')).toHaveLength(1)
  })
  it('requires an explicit gun selection and a separate plug confirmation', async () => {
    wrapper = mountSettings()
    const store = useChargingStore()
    expect(button('下一步').attributes('disabled')).toBeDefined()
    await button('测试枪').trigger('click')
    await button('下一步').trigger('click')
    expect(wrapper.text()).toContain('请插好充电枪')
    expect(wrapper.text()).toContain('c1')
    expect(store.phase).toBe('awaiting_connection')
    expect(store.isCharging).toBe(false)
    expect(store.chargingData.energy).toBe(0)
    expect(wrapper.find('#gun-code').exists()).toBe(false)
    await button('暂未插好').trigger('click')
    expect(wrapper.find('.dialog-overlay').exists()).toBe(false)
    expect(store.phase).toBe('idle')
    expect(store.plugConnected).toBe(false)
    expect(button('测试枪').attributes('aria-pressed')).toBe('true')
  })

  it('animates inspection and start before metering, and locks repeated confirmation and Escape', async () => {
    wrapper = mountSettings()
    const store = useChargingStore()
    const startSpy = vi.spyOn(store, 'startCharging')
    await button('测试枪').trigger('click')
    await button('下一步').trigger('click')
    await button('已插好').trigger('click')
    await button('检测中').trigger('click')
    expect(store.phase).toBe('checking')
    expect(wrapper.text()).toContain('正在检测充电枪连接')
    expect(wrapper.get('.dialog-overlay').attributes('aria-busy')).toBe('true')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(wrapper.find('.dialog-overlay').exists()).toBe(true)
    await vi.advanceTimersByTimeAsync(899)
    expect(store.isCharging).toBe(false)
    expect(startSpy).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(store.phase).toBe('starting')
    expect(wrapper.text()).toContain('充电枪连接正常')
    expect(store.chargingData.energy).toBe(0)
    await vi.advanceTimersByTimeAsync(700)
    expect(store.isCharging).toBe(true)
    expect(wrapper.emitted('start-charging')).toHaveLength(1)
    expect(startSpy).toHaveBeenCalledTimes(1)
    expect(wrapper.find('.dialog-overlay').exists()).toBe(false)
  })

  it('handles a gun becoming unavailable during confirmation without starting or charging', async () => {
    wrapper = mountSettings()
    const store = useChargingStore()
    await button('测试枪').trigger('click')
    await button('下一步').trigger('click')
    useStationsStore().currentStation.details.fastConnectors[0].status = 3
    await button('已插好').trigger('click')
    await flushPromises()
    expect(store.isCharging).toBe(false)
    expect(store.paymentPending).toBe(false)
    expect(wrapper.get('[role="alert"]').text()).toContain('不可用')
    await button('返回选择充电桩').trigger('click')
    expect(store.phase).toBe('idle')
    expect(button('下一步').attributes('disabled')).toBeDefined()
  })

  it('keeps form selections when visiting vehicle management and returning', async () => {
    wrapper = mountSettings()
    await button('测试枪').trigger('click')
    await wrapper.get('#initial-soc').setValue(28)
    await wrapper.get('#target-soc').setValue(90)
    await button('管理车辆').trigger('click')
    expect(wrapper.emitted('show-vehicles')).toHaveLength(1)
    wrapper.unmount()
    wrapper = mountSettings()
    expect(wrapper.get('#initial-soc').element.value).toBe('28')
    expect(wrapper.get('#target-soc').element.value).toBe('90')
    expect(button('测试枪').attributes('aria-pressed')).toBe('true')
  })

  it('does not start later if the connection panel is removed during detection', async () => {
    wrapper = mountSettings()
    const store = useChargingStore()
    await button('测试枪').trigger('click')
    await button('下一步').trigger('click')
    await button('已插好').trigger('click')
    wrapper.unmount()
    wrapper = null
    await vi.advanceTimersByTimeAsync(2000)
    expect(store.isCharging).toBe(false)
    expect(store.phase).toBe('idle')
    expect(store.chargingData.energy).toBe(0)
  })

  it('asks before ending, waits for stop, and only then allows unplugging and payment', async () => {
    const store = await start()
    wrapper = mount(ChargingPanel, {
      attachTo: document.body,
      global: { provide: { showToast: vi.fn() }, stubs: { teleport: true } }
    })
    await button('结束充电').trigger('click')
    expect(wrapper.text()).toContain('结束本次充电？')
    expect(store.phase).toBe('charging')
    await button('继续充电').trigger('click')
    expect(store.isCharging).toBe(true)
    await button('结束充电').trigger('click')
    await button('确认结束').trigger('click')
    expect(store.phase).toBe('stopping')
    expect(wrapper.emitted('charging-complete')).toBeUndefined()
    await vi.advanceTimersByTimeAsync(500)
    expect(store.phase).toBe('awaiting_unplug')
    expect(wrapper.text()).toContain('可以拔枪了')
    await button('已拔枪').trigger('click')
    expect(store.phase).toBe('finished')
    expect(wrapper.emitted('charging-complete')).toHaveLength(1)
  })
})
