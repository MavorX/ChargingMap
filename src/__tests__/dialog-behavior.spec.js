// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import PanelShell from '../components/common/PanelShell.vue'
import DialogModal from '../components/common/DialogModal.vue'
import Toast from '../components/common/Toast.vue'

const settle = async () => {
  await nextTick()
  await nextTick()
  await nextTick()
}
const escape = () =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
let panel, dialog
beforeEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = 'scroll'
})
afterEach(() => {
  dialog?.unmount()
  panel?.unmount()
  dialog = panel = null
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})

describe('stacked dialogs', () => {
  it('allows drawer navigation but locks it again for confirmations and busy actions', async () => {
    const header = document.createElement('header')
    header.setAttribute('data-panel-navigation', '')
    header.innerHTML = '<button id="global-favorites">收藏</button>'
    document.body.append(header)
    panel = mount(PanelShell, {
      attachTo: document.body,
      props: { title: '账户', allowNavigation: true },
      slots: { default: () => h('button', { id: 'inside-account' }, '账户操作') }
    })
    await settle()
    expect(header.hasAttribute('inert')).toBe(false)
    header.querySelector('button').focus()
    expect(document.activeElement.id).toBe('global-favorites')
    dialog = mount(DialogModal, { attachTo: document.body, props: { title: '确认操作' } })
    await settle()
    expect(header.hasAttribute('inert')).toBe(true)
    dialog.unmount()
    dialog = null
    await settle()
    expect(header.hasAttribute('inert')).toBe(false)
    await panel.setProps({ busy: true })
    expect(header.hasAttribute('inert')).toBe(true)
    await panel.setProps({ busy: false })
    expect(header.hasAttribute('inert')).toBe(false)
  })
  it('teleports a nested confirmation outside the drawer and only the top layer closes', async () => {
    panel = mount(PanelShell, {
      attachTo: document.body,
      props: { title: '钱包' },
      slots: { default: () => h('button', { id: 'recharge-trigger' }, '充值') }
    })
    await settle()
    const trigger = document.querySelector('#recharge-trigger')
    trigger.focus()
    dialog = mount(DialogModal, {
      attachTo: document.body,
      props: { title: '充值金额' },
      slots: { default: () => h('input', { 'aria-label': '金额' }) }
    })
    await settle()
    expect(document.querySelector('.dialog-overlay').parentElement).toBe(document.body)
    expect(
      document.querySelector('.panel-content').contains(document.querySelector('.dialog-overlay'))
    ).toBe(false)
    expect(document.querySelector('.panel-overlay').closest('[inert]')).not.toBeNull()
    escape()
    expect(dialog.emitted('close')).toHaveLength(1)
    expect(panel.emitted('close')).toBeUndefined()
    dialog.unmount()
    dialog = null
    await settle()
    expect(document.activeElement).toBe(trigger)
    expect(document.body.style.overflow).toBe('hidden')
    escape()
    expect(panel.emitted('close')).toHaveLength(1)
    panel.unmount()
    panel = null
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('ignores Escape and the backdrop while a submission is in flight', async () => {
    panel = mount(PanelShell, { attachTo: document.body, props: { title: '支付', busy: true } })
    await settle()
    escape()
    await panel.get('.panel-backdrop').trigger('click')
    expect(panel.emitted('close')).toBeUndefined()
    await panel.setProps({ busy: false })
    escape()
    expect(panel.emitted('close')).toHaveLength(1)
  })

  it('excludes hidden and disabled controls from the focus loop', async () => {
    panel = mount(PanelShell, {
      attachTo: document.body,
      slots: {
        default: () => [
          h('button', { disabled: true }, 'disabled'),
          h('button', { hidden: true }, 'hidden'),
          h('input', { type: 'hidden' }),
          h('button', { id: 'visible-action' }, 'visible')
        ]
      }
    })
    await settle()
    expect(document.activeElement.id).toBe('visible-action')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    expect(document.activeElement.id).toBe('visible-action')
  })

  it('keeps system messages outside inert backgrounds while a modal is open', async () => {
    const toast = mount(Toast, {
      // A real Transition adds no wrapper; the default VTU stub would itself
      // become an inert sibling and no longer represent the portal DOM.
      global: { stubs: { transition: false } },
      attachTo: document.body,
      props: { portal: true, show: true, message: '金额无效' }
    })
    dialog = mount(DialogModal, { attachTo: document.body, props: { title: '充值' } })
    await settle()
    const notice = document.querySelector('[data-dialog-exempt]')
    expect(notice.closest('[inert]')).toBeNull()
    const close = notice.querySelector('button')
    close.focus()
    expect(document.activeElement).toBe(close)
    close.click()
    expect(toast.emitted('update:show')).toEqual([[false]])
    toast.unmount()
  })
})
