import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import HomeView from '../views/HomeView.vue'
import { useStationsStore } from '../store/modules/stations'
import { useUiStore } from '../store/modules/ui'

let wrapper
let listener
const station = {
  stationId: 's1',
  stationName: '演示站',
  address: '演示地址',
  connectorTypes: ['GB/T'],
  currentPrice: 1,
  openStatus: 1,
  quickAvailableNum: 1,
  quickChargeNum: 2,
  slowAvailableNum: 0,
  slowChargeNum: 0,
  detailsLoaded: true,
  details: { fastConnectors: [], slowConnectors: [] }
}
beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: true,
      addEventListener: (_type, callback) => {
        listener = callback
      },
      removeEventListener: vi.fn()
    }))
  )
  useStationsStore().stations = [{ ...station }]
  wrapper = mount(HomeView, {
    attachTo: document.body,
    global: { provide: { showToast: vi.fn() }, stubs: { MapView: true } }
  })
})
afterEach(() => {
  wrapper.unmount()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

describe('left explorer spatial continuity', () => {
  it('keeps the expand control inside the original left rail and restores focus', async () => {
    await wrapper.get('[aria-label="收起站点列表"]').trigger('click')
    const expand = wrapper.get('[aria-label="展开站点列表"]')
    expect(expand.element.closest('#station-explorer')).not.toBe(null)
    expect(expand.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(expand.element)
    expect(wrapper.find('[aria-label="打开站点列表"]').exists()).toBe(false)
    await expand.trigger('click')
    expect(wrapper.get('[aria-label="收起站点列表"]').attributes('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(wrapper.get('[aria-label="收起站点列表"]').element)
  })

  it('preserves the exact result scroller, search and filters on collapse', async () => {
    const store = useStationsStore()
    store.searchQuery = '演示'
    store.filters.quickAvailable = true
    const content = wrapper.get('#station-explorer-content').element
    const scroller = content.querySelector('.overflow-y-auto')
    scroller.scrollTop = 120
    await wrapper.get('[aria-label="收起站点列表"]').trigger('click')
    expect(content.style.display).toBe('none')
    await wrapper.get('[aria-label="展开站点列表"]').trigger('click')
    expect(wrapper.get('#station-explorer-content').element).toBe(content)
    expect(scroller.scrollTop).toBe(120)
    expect(store.searchQuery).toBe('演示')
    expect(store.filters.quickAvailable).toBe(true)
  })

  it('opens map-selected station details on the left, not in a right drawer', async () => {
    await wrapper.get('[aria-label="收起站点列表"]').trigger('click')
    window.dispatchEvent(new CustomEvent('viewStationDetailFromMap', { detail: { ...station } }))
    await flushPromises()
    expect(wrapper.get('#station-explorer-content').element.style.display).not.toBe('none')
    expect(wrapper.get('#station-explorer').text()).toContain('演示站')
    expect(wrapper.findAll('.panel-overlay')).toHaveLength(0)
  })

  it('preserves collapsed preference across breakpoints and makes Explore reopen the list', async () => {
    await wrapper.get('[aria-label="收起站点列表"]').trigger('click')
    listener({ matches: false })
    await nextTick()
    expect(wrapper.find('#station-explorer').exists()).toBe(false)
    useUiStore().open('stationsList')
    await nextTick()
    listener({ matches: true })
    await flushPromises()
    expect(useUiStore().activePanel).toBe(null)
    expect(wrapper.find('[aria-label="展开站点列表"]').exists()).toBe(true)
    window.dispatchEvent(new CustomEvent('headerEvent', { detail: { type: 'home' } }))
    await nextTick()
    expect(wrapper.find('[aria-label="收起站点列表"]').exists()).toBe(true)
  })
})
