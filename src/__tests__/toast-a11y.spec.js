// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Toast from '../components/common/Toast.vue'
import Loading from '../components/common/Loading.vue'
import App from '../App.vue'

const settle = async () => {
  await nextTick()
  await nextTick()
  await nextTick()
}

const mountToast = (props = {}) =>
  mount(Toast, {
    global: { stubs: { teleport: true } },
    props: { show: true, message: '提示内容', type: 'success', ...props }
  })

const mountApp = () =>
  mount(App, {
    global: {
      plugins: [createPinia()],
      stubs: {
        teleport: true,
        Header: true,
        RouterView: true,
        'router-view': true
      }
    }
  })

const dispatchToast = (message, type = 'success') => {
  window.dispatchEvent(new CustomEvent('appToast', { detail: { message, type } }))
}

describe('Toast 读屏语义', () => {
  it('error 使用 role=alert，且不额外设置 aria-live', () => {
    const wrapper = mountToast({ type: 'error', message: '保存失败' })
    const toast = wrapper.get('[role="alert"]')

    expect(toast.text()).toContain('保存失败')
    expect(toast.attributes('aria-live')).toBeUndefined()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('success 使用 role=status + aria-live=polite + aria-atomic=true', () => {
    const wrapper = mountToast({ type: 'success' })
    const toast = wrapper.get('[role="status"]')

    expect(toast.attributes('aria-live')).toBe('polite')
    expect(toast.attributes('aria-atomic')).toBe('true')

    wrapper.unmount()
  })

  it('关闭按钮有可朗读名称', () => {
    const wrapper = mountToast()
    expect(wrapper.get('button').attributes('aria-label')).toBe('关闭提示')
    wrapper.unmount()
  })
})

describe('Loading 读屏语义', () => {
  it('根节点为 role=status 且 aria-busy=true', () => {
    const wrapper = mount(Loading)
    const root = wrapper.get('#loading')

    expect(root.attributes('role')).toBe('status')
    expect(root.attributes('aria-busy')).toBe('true')

    wrapper.unmount()
  })
})

describe('Toast 自动消失与暂停', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('Toast 组件自身 hover 暂停、leave 后完成剩余计时', async () => {
    const wrapper = mountToast()
    await wrapper.get('[role="status"]').trigger('mouseenter')
    expect(wrapper.emitted('pause')).toHaveLength(1)

    await vi.advanceTimersByTimeAsync(5000)
    expect(wrapper.emitted('update:show')).toBeUndefined()

    await wrapper.get('[role="status"]').trigger('mouseleave')
    expect(wrapper.emitted('resume')).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(3000)
    expect(wrapper.emitted('update:show')).toEqual([[false]])

    wrapper.unmount()
  })

  it('hover 暂停计时，leave 后按剩余时长继续并消失', async () => {
    const wrapper = mountApp()
    dispatchToast('已保存', 'success')
    await settle()

    const toast = wrapper.get('[role="status"]')
    await toast.trigger('mouseenter')

    await vi.advanceTimersByTimeAsync(3500)
    await settle()
    expect(wrapper.find('[role="status"]').exists()).toBe(true)

    await wrapper.get('[role="status"]').trigger('mouseleave')
    await vi.advanceTimersByTimeAsync(2900)
    await settle()
    expect(wrapper.find('[role="status"]').exists()).toBe(true)

    await vi.advanceTimersByTimeAsync(200)
    await settle()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('焦点进入暂停，焦点离开恢复', async () => {
    const wrapper = mountApp()
    dispatchToast('已保存', 'success')
    await settle()

    const toast = wrapper.get('[role="status"]')
    await toast.trigger('focusin')

    await vi.advanceTimersByTimeAsync(3500)
    await settle()
    expect(wrapper.find('[role="status"]').exists()).toBe(true)

    await wrapper.get('[role="status"]').trigger('focusout')
    await vi.advanceTimersByTimeAsync(3000)
    await settle()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('连续两条 toast 时旧计时器不会关闭新 toast（C13）', async () => {
    const wrapper = mountApp()

    dispatchToast('第一条', 'success')
    await settle()
    expect(wrapper.find('[role="status"]').exists()).toBe(true)

    await vi.advanceTimersByTimeAsync(2000)
    dispatchToast('第二条', 'error')
    await settle()
    expect(wrapper.get('[role="alert"]').text()).toContain('第二条')

    // 旧定时器原本会在 t=3000ms 触发；此时已到 t=3500ms，新 toast 仍应可见
    await vi.advanceTimersByTimeAsync(1500)
    await settle()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)

    // 新 toast 从 t=2000ms 起计时 3000ms，t=5000ms 消失
    await vi.advanceTimersByTimeAsync(1500)
    await settle()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('restarts the timer even when the next toast has identical text', async () => {
    const wrapper = mountApp()
    dispatchToast('同一条提示')
    await settle()
    await vi.advanceTimersByTimeAsync(2000)
    dispatchToast('同一条提示')
    await settle()
    await vi.advanceTimersByTimeAsync(2000)
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    await vi.advanceTimersByTimeAsync(1100)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
