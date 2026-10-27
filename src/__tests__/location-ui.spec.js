import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import Header from '../components/Header.vue'
import HomeView from '../views/HomeView.vue'
import NavigationBar from '../components/map/NavigationBar.vue'
import mapManager from '../services/mapService'
import { useStationsStore } from '../store/modules/stations'

let wrapper
const toast = vi.fn()
beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  localStorage.clear()
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  vi.restoreAllMocks()
  document.body.replaceChildren()
})
const mountHome = () => {
  const Root = defineComponent({
    components: { AppHeader: Header, HomeView },
    template: '<div><AppHeader/><HomeView/></div>'
  })
  wrapper = mount(Root, {
    attachTo: document.body,
    global: { stubs: { MapView: true }, provide: { showToast: toast } }
  })
}

describe('location accuracy and permission feedback', () => {
  it('does not let an older rejected request overwrite the latest location status', async () => {
    let rejectOld, resolveNew
    const locate = vi.spyOn(mapManager, 'locateUser')
    locate.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectOld = reject
        })
    )
    locate.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveNew = resolve
        })
    )
    const store = useStationsStore()
    const old = store.requestUserLocation()
    const rejected = expect(old).rejects.toMatchObject({ code: 'LOCATION_CANCELLED' })
    const latest = store.requestUserLocation()
    rejectOld(Object.assign(new Error('取消旧请求'), { code: 'LOCATION_CANCELLED' }))
    await rejected
    expect(store.isLocating).toBe(true)
    resolveNew({ lng: 117.28, lat: 31.86, source: 'h5', quality: 'reported', accuracy: 20 })
    await latest
    expect(store.locationStatus).toBe('ready')
  })
  it('synchronizes all location buttons and does not label a coarse result as exact', async () => {
    let resolve
    const locate = vi.spyOn(mapManager, 'locateUser').mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    mountHome()
    await wrapper.get('header [aria-label="定位当前位置"]').trigger('click')
    expect(locate).toHaveBeenCalledTimes(1)
    for (const button of wrapper.findAll('[aria-label="定位当前位置"]'))
      expect(button.attributes('disabled')).toBeDefined()
    resolve({ lng: 117.28, lat: 31.86, accuracy: 2800, quality: 'approximate', source: 'h5' })
    await flushPromises()
    expect(wrapper.text()).toContain('仅获取到估算位置')
    expect(wrapper.text()).toContain('2.8 公里')
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('估算位置'), 'info')
    for (const button of wrapper.findAll('[aria-label="定位当前位置"]'))
      expect(button.attributes('disabled')).toBeUndefined()
  })

  it('shows permission denial distinctly and retains the last known result as old, not a new fix', async () => {
    const store = useStationsStore()
    store.userLocation = {
      lng: 117.28,
      lat: 31.86,
      accuracy: 30,
      quality: 'reported',
      source: 'h5'
    }
    vi.spyOn(mapManager, 'locateUser').mockRejectedValue(
      Object.assign(new Error('请检查浏览器和系统位置访问'), { code: 'PERMISSION_DENIED' })
    )
    mountHome()
    await wrapper.get('header [aria-label="定位当前位置"]').trigger('click')
    await flushPromises()
    expect(store.locationStatus).toBe('error')
    expect(store.userLocation.accuracy).toBe(30)
    expect(wrapper.text()).toContain('定位权限未获允许')
    expect(wrapper.text()).toContain('保留上次位置')
    expect(toast).not.toHaveBeenCalledWith(expect.any(String), 'success')
  })

  it('marks route origins that come from coarse estimates', async () => {
    useStationsStore().startNavigation({
      distance: '2.0',
      duration: 5,
      station: { stationName: '演示站' },
      origin: { quality: 'approximate', accuracy: 2000 }
    })
    wrapper = mount(NavigationBar)
    await nextTick()
    expect(wrapper.text()).toContain('起点为估算位置')
    expect(wrapper.text()).toContain('2.0 公里')
    expect(wrapper.get('[aria-label="导航路线概览"]').find('.flex-col').exists()).toBe(true)
    expect(wrapper.get('button').classes()).toContain('w-full')
  })
})
