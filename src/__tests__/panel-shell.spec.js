// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import PanelShell from '../components/common/PanelShell.vue'

const settle = async () => {
  await nextTick()
  await nextTick()
  await nextTick()
}

const pressKey = (key, options = {}) => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...options }))
}

const mountShell = (props = {}, slot) =>
  mount(PanelShell, {
    attachTo: document.body,
    props: { title: '测试面板', ...props },
    slots: {
      default:
        slot ||
        (() => [
          h('button', { id: 'first-button' }, 'first'),
          h('input', { id: 'middle-input' }),
          h('button', { id: 'last-button' }, 'last')
        ])
    }
  })

let trigger

beforeEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
  trigger = document.createElement('button')
  trigger.id = 'panel-trigger'
  document.body.appendChild(trigger)
  trigger.focus()
})

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})

describe('PanelShell', () => {
  it('renders dialog semantics and keeps the panel-overlay root', async () => {
    const wrapper = mountShell()
    await settle()

    const root = wrapper.element
    expect(root.classList.contains('panel-overlay')).toBe(true)
    expect(root.getAttribute('role')).toBe('dialog')
    expect(root.getAttribute('aria-modal')).toBe('true')
    expect(root.getAttribute('aria-label')).toBe('测试面板')
    expect(wrapper.find('.panel-content').exists()).toBe(true)

    wrapper.unmount()
  })

  it('focuses the first focusable element after mounting', async () => {
    const wrapper = mountShell()
    await settle()

    const content = wrapper.find('.panel-content').element
    expect(content.contains(document.activeElement)).toBe(true)
    expect(document.activeElement.id).toBe('first-button')

    wrapper.unmount()
  })

  it('keeps focus inside after ten Tab presses and wraps at the edges', async () => {
    const wrapper = mountShell()
    await settle()

    const content = wrapper.find('.panel-content').element
    const first = wrapper.find('#first-button').element
    const last = wrapper.find('#last-button').element

    for (let index = 0; index < 10; index += 1) {
      pressKey('Tab')
      await nextTick()
      expect(content.contains(document.activeElement)).toBe(true)
    }

    last.focus()
    pressKey('Tab')
    await nextTick()
    expect(document.activeElement).toBe(first)

    pressKey('Tab', { shiftKey: true })
    await nextTick()
    expect(document.activeElement).toBe(last)

    wrapper.unmount()
  })

  it('falls back to the content container when nothing is focusable', async () => {
    const wrapper = mountShell({}, () => h('p', 'plain text'))
    await settle()

    const content = wrapper.find('.panel-content').element
    expect(document.activeElement).toBe(content)

    pressKey('Tab')
    await nextTick()
    expect(document.activeElement).toBe(content)

    wrapper.unmount()
  })

  it('emits close on Escape', async () => {
    const wrapper = mountShell()
    await settle()

    pressKey('Escape')
    await nextTick()

    expect(wrapper.emitted('close')).toHaveLength(1)

    wrapper.unmount()
  })

  it('restores focus to the trigger element on unmount', async () => {
    const wrapper = mountShell()
    await settle()
    expect(document.activeElement).not.toBe(trigger)

    wrapper.unmount()

    expect(document.activeElement).toBe(trigger)
  })

  it('locks body scrolling while mounted and restores the previous value', async () => {
    document.body.style.overflow = 'scroll'
    const wrapper = mountShell()
    await settle()

    expect(document.body.style.overflow).toBe('hidden')

    wrapper.unmount()

    expect(document.body.style.overflow).toBe('scroll')
  })
})
