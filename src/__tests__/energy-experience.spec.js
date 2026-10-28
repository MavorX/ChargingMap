import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { useRecommendationsStore } from '../store/modules/recommendations'
import { useStationsStore } from '../store/modules/stations'
import { useChargingStore } from '../store/modules/charging'
import { useUserStore } from '../store/modules/user'
import ChargingAdvisor from '../components/station/ChargingAdvisor.vue'
import ChargingSettings from '../components/charging/ChargingSettings.vue'
import ChargingPanel from '../components/charging/ChargingPanel.vue'
import ChargingCurve from '../components/charging/ChargingCurve.vue'
import { setLocale } from '../i18n'
import { chargingDurationSeconds, meterAt, POWER_CURVE_VERSION } from '../utils/chargingModel'
import {
  advisorDetails,
  advisorGoal,
  advisorStation,
  advisorVehicle
} from './helpers/recommendations'

let wrapper
const button = (text) => wrapper.findAll('button').find((item) => item.text().includes(text))
beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  setLocale('zh-CN')
  useUserStore().vehicles = [{ ...advisorVehicle }]
  useRecommendationsStore().goal = { ...advisorGoal }
  useStationsStore().stations = [
    advisorStation(),
    advisorStation('HF000002', { details: advisorDetails(30, 0.5) })
  ]
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  setLocale('zh-CN')
  document.body.replaceChildren()
})

describe('vehicle goal, comparison and charging visualizations', () => {
  it('requires an explicit analysis, then explains the best fit without pretending to know location', async () => {
    wrapper = mount(ChargingAdvisor, { attachTo: document.body })
    expect(wrapper.find('[data-testid=recommended-station]').exists()).toBe(false)
    expect(button('距离优先').attributes('disabled')).toBeDefined()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('[data-testid=recommended-station]').exists()).toBe(true)
    expect(wrapper.text()).toContain('未获得定位：不计距离')
    expect(wrapper.text()).toMatch(/同一补能目标|比最快方案|比最低费用方案|在费用/)
    expect(document.activeElement.getAttribute('role')).toBe('status')
    await button('查看推荐站').trigger('click')
    expect(wrapper.emitted('select')).toHaveLength(1)
    expect(useChargingStore().isCharging).toBe(false)
  })

  it('removes results for invalid SOC and lets the user restore a valid goal', async () => {
    await useRecommendationsStore().analyze()
    wrapper = mount(ChargingAdvisor, { attachTo: document.body })
    await button('调整目标').trigger('click')
    expect(document.activeElement.tagName).toBe('SELECT')
    await wrapper.get('[data-testid=advisor-initial]').setValue('')
    expect(wrapper.find('[data-testid=recommended-station]').exists()).toBe(false)
    expect(button('分析适合').attributes('disabled')).toBeDefined()
    await wrapper.get('[data-testid=advisor-initial]').setValue(45)
    expect(button('分析适合').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('[data-testid=recommended-station]').exists()).toBe(true)
  })

  it('compares the same goal in Chinese and English without translating stored values', async () => {
    const advisor = useRecommendationsStore()
    await advisor.analyze()
    advisor.toggleComparison('HF000001')
    advisor.toggleComparison('HF000002')
    wrapper = mount(ChargingAdvisor)
    expect(wrapper.get('[data-testid=station-comparison]').text()).toContain('预计费用')
    setLocale('en-US')
    await flushPromises()
    expect(wrapper.text()).not.toMatch(/\p{Script=Han}/u)
    expect(wrapper.text()).toContain('Charging time')
    expect(advisor.goal).toEqual(advisorGoal)
  })

  it('carries the recommendation goal into setup but never silently selects a gun', async () => {
    const advisor = useRecommendationsStore()
    await advisor.analyze()
    const stations = useStationsStore()
    stations.currentStation = stations.stations[0]
    useChargingStore().setupDraft = advisor.setupForStation('HF000001')
    wrapper = mount(ChargingSettings, { global: { provide: { showToast: vi.fn() } } })
    expect(wrapper.get('#initial-soc').element.value).toBe('25')
    expect(wrapper.get('#target-soc').element.value).toBe('80')
    expect(wrapper.findAll('.choice-card[aria-pressed=true]')).toHaveLength(0)
    expect(button('下一步').attributes('disabled')).toBeDefined()
    await wrapper.get('[data-suggested=true]').trigger('click')
    expect(button('下一步').attributes('disabled')).toBeUndefined()
    expect(wrapper.findComponent(ChargingCurve).props('model')).toEqual({
      ...advisor.entryById.HF000001.model,
      clockScale: 60
    })
  })

  it('keeps estimates, live power, stage copy and chart progress on one model', async () => {
    const store = useChargingStore()
    const model = {
      powerKw: 90,
      initialBattery: 70,
      targetBattery: 90,
      batteryCapacityKwh: 60,
      targetEnergy: 12,
      clockScale: 60,
      powerCurve: POWER_CURVE_VERSION
    }
    store.sessionModel = model
    store.sessionStation = { currentPrice: 1 }
    store.phase = 'charging'
    store.isCharging = true
    store.chargingData = { ...meterAt(model, 2), cost: 1 }
    wrapper = mount(ChargingPanel, { global: { provide: { showToast: vi.fn() } } })
    expect(wrapper.text()).toContain('逐步降功率阶段')
    expect(wrapper.findComponent(ChargingCurve).props('elapsedSeconds')).toBe(120)
    expect(wrapper.text()).toContain(
      `预计还需 ${Math.ceil((chargingDurationSeconds(model) - 120) / 60)} 分钟`
    )
    store.isCharging = false
    store.phase = 'awaiting_unplug'
    store.chargingData.speed = 0
    await flushPromises()
    expect(wrapper.text()).toContain('充电已结束，可以拔枪了')
    expect(wrapper.findComponent(ChargingCurve).props('stopped')).toBe(true)
    expect(wrapper.get('[role=progressbar]').attributes('aria-valuenow')).toBe(
      Number(store.chargingData.battery.toFixed(1)).toString()
    )
    expect(button('已拔枪').exists()).toBe(true)
  })
})
