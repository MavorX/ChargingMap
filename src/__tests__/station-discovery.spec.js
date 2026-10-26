// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import StationSearch from '../components/station/StationSearch.vue'
import StationListControls from '../components/station/StationListControls.vue'
import StationListState from '../components/station/StationListState.vue'
import DesktopStationList from '../components/station/DesktopStationList.vue'
import Header from '../components/Header.vue'
import { HEADER_PANEL_EVENTS } from '../constants/headerEvents'
import { useStationsStore } from '../store/modules/stations'

describe('station discovery interactions', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => document.body.replaceChildren())

  it('shares search across surfaces and clears it without losing focus', async () => {
    const wrapper = mount(StationSearch, { attachTo: document.body })
    const other = mount(StationSearch)
    const store = useStationsStore()
    store.listPage = 3
    await wrapper.get('input').setValue('合肥')
    expect(other.get('input').element.value).toBe('合肥')
    expect(store.listPage).toBe(1)
    await wrapper.get('[aria-label="清除搜索"]').trigger('click')
    expect(store.searchQuery).toBe('')
    expect(other.get('input').element.value).toBe('')
    expect(document.activeElement).toBe(wrapper.get('input').element)
    wrapper.unmount()
    other.unmount()
  })

  it('announces toggled filter states', async () => {
    const wrapper = mount(StationListControls)
    const quickFilter = wrapper.findAll('button').find((button) => button.text() === '快充可用')
    expect(quickFilter.attributes('aria-pressed')).toBe('false')
    await quickFilter.trigger('click')
    expect(quickFilter.attributes('aria-pressed')).toBe('true')
    expect(useStationsStore().filters.quickAvailable).toBe(true)
    wrapper.unmount()
  })

  it('distinguishes loading, load errors and empty results', async () => {
    const store = useStationsStore()
    const wrapper = mount(StationListState)
    store.isLoading = true
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[aria-label="正在加载充电站"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('没有匹配')
    store.isLoading = false
    store.error = '站点数据加载失败'
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('站点暂时无法加载')
    store.error = null
    store.setSearchQuery('不存在的站点')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('这里还没有匹配的充电站')
    await wrapper.get('button').trigger('click')
    expect(store.searchQuery).toBe('')
    wrapper.unmount()
  })

  it('allows resetting empty results caused only by advanced filters', async () => {
    const store = useStationsStore()
    store.updateFilters({ power: 150, connectors: ['GB/T'] })
    expect(store.activeFilterCount).toBe(2)
    const wrapper = mount(StationListState)
    await wrapper.get('button').trigger('click')
    expect(store.filters.power).toBe(50)
    expect(store.filters.connectors).toHaveLength(4)
    expect(store.activeFilterCount).toBe(0)
    wrapper.unmount()
  })

  it('exposes advanced filters and reports total matches rather than the loaded page', async () => {
    const store = useStationsStore()
    store.stations = Array.from({ length: 25 }, (_, index) => ({
      stationId: `station-${index}`,
      stationName: `站点 ${index}`,
      address: '合肥',
      connectorTypes: ['GB/T'],
      quickAvailableNum: 1,
      quickChargeNum: 2,
      slowAvailableNum: 0,
      slowChargeNum: 0,
      currentPrice: 1,
      openStatus: 1
    }))
    const wrapper = mount(DesktopStationList)
    expect(wrapper.get('[aria-live="polite"]').text()).toContain('25 个站点')
    expect(wrapper.findAll('.station-card')).toHaveLength(20)
    const filter = wrapper.findAll('button').find((button) => button.text() === '高级筛选')
    await filter.trigger('click')
    expect(wrapper.emitted('show-filter')).toHaveLength(1)
    wrapper.unmount()
  })

  it('routes the new labeled navigation to existing panels', async () => {
    const handler = vi.fn()
    window.addEventListener('headerEvent', handler)
    const wrapper = mount(Header)
    for (const [label, eventName] of [
      ['我的收藏', 'showFavorites'],
      ['充电记录', 'showChargingHistory']
    ]) {
      await wrapper
        .findAll('button')
        .find((button) => button.text() === label)
        .trigger('click')
      expect(handler.mock.calls.at(-1)[0].detail.type).toBe(eventName)
      expect(HEADER_PANEL_EVENTS[eventName]).toBeTruthy()
    }
    window.removeEventListener('headerEvent', handler)
    wrapper.unmount()
  })
})
