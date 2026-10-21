// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import StationDetail from '../components/station/StationDetail.vue'

const mountDetail = (props = {}) =>
  mount(StationDetail, {
    props,
    global: {
      plugins: [createPinia()],
      provide: { showToast: vi.fn() }
    }
  })

describe('StationDetail variants', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.body.style.overflow = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
    document.body.style.overflow = ''
  })

  it('renders the sheet variant through the PanelShell dialog by default', () => {
    const wrapper = mountDetail()

    expect(wrapper.classes()).toContain('panel-overlay')
    expect(wrapper.find('.panel-content').exists()).toBe(true)

    wrapper.unmount()
  })

  it('renders the inline variant as a plain full-height column without overlay', () => {
    const wrapper = mountDetail({ variant: 'inline' })

    expect(wrapper.classes()).not.toContain('panel-overlay')
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['flex', 'h-full', 'flex-col']))
    expect(wrapper.find('.panel-backdrop').exists()).toBe(false)

    wrapper.unmount()
  })

  it('warns and falls back to sheet when the variant is unknown', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = mountDetail({ variant: 'bogus' })

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Unknown variant "bogus"'))
    expect(wrapper.classes()).toContain('panel-overlay')

    wrapper.unmount()
    warn.mockRestore()
  })
})
