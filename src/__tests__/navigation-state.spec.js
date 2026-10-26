import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import Header from '../components/Header.vue'
import HomeView from '../views/HomeView.vue'
import { useUiStore } from '../store/modules/ui'
let wrapper
const settle = async () => {
  await flushPromises()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await flushPromises()
}
beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.replaceChildren()
})
describe('navigation follows visible content', () => {
  it('has exactly the active destination highlighted and no always-on Explore', async () => {
    wrapper = mount(Header)
    const ui = useUiStore()
    for (const [panel, label] of [
      [null, '探索充电站'],
      ['favorites', '我的收藏'],
      ['chargingHistory', '充电记录']
    ]) {
      if (panel) ui.open(panel)
      else ui.dismiss()
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('.header-nav-active')).toHaveLength(1)
      expect(wrapper.get('.header-nav-active').text()).toBe(label)
      expect(wrapper.get('.header-nav-active').attributes('aria-current')).toBe('page')
    }
    ui.open('userProfile')
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.header-nav-active')).toHaveLength(0)
    expect(wrapper.get('[aria-label="个人中心"]').attributes('aria-pressed')).toBe('true')
    ui.open('wallet')
    ui.close()
    await wrapper.vm.$nextTick()
    expect(ui.activePanel).toBe('userProfile')
    expect(wrapper.get('[aria-label="个人中心"]').attributes('aria-pressed')).toBe('true')
    ui.dismiss()
    await wrapper.vm.$nextTick()
    expect(wrapper.get('.header-nav-active').text()).toBe('探索充电站')
  })
  it('switches top-level destinations without a stale navigation back stack', async () => {
    const Root = defineComponent({
      components: { AppHeader: Header, HomeView },
      template: '<div><AppHeader/><HomeView/></div>'
    })
    wrapper = mount(Root, {
      attachTo: document.body,
      global: { provide: { showToast: vi.fn() }, stubs: { MapView: true } }
    })
    const header = wrapper.findComponent(Header)
    const button = (text) =>
      header.findAll('button').find((element) => element.text().includes(text))
    await button('我的收藏').trigger('click')
    await settle()
    expect(useUiStore().activePanel).toBe('favorites')
    expect(header.element.hasAttribute('inert')).toBe(false)
    await button('充电记录').trigger('click')
    await settle()
    expect(useUiStore().activePanel).toBe('chargingHistory')
    expect(useUiStore().panelHistory).toEqual([])
    expect(header.get('.header-nav-active').text()).toBe('充电记录')
    await vi.waitFor(() =>
      expect(wrapper.find('.panel-overlay [aria-label="返回"]').exists()).toBe(true)
    )
    await wrapper.get('.panel-overlay [aria-label="返回"]').trigger('click')
    await settle()
    expect(useUiStore().activePanel).toBe(null)
    expect(header.get('.header-nav-active').text()).toBe('探索充电站')
  })
})
