// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StarRating from '../components/common/StarRating.vue'
import ToggleSwitch from '../components/common/ToggleSwitch.vue'

describe('StarRating', () => {
  it('exposes a radiogroup with one radio per star and links checked state', async () => {
    const wrapper = mount(StarRating, { props: { modelValue: 3, ariaLabel: '评分' } })

    expect(wrapper.attributes('role')).toBe('radiogroup')
    expect(wrapper.attributes('aria-label')).toBe('评分')

    const radios = wrapper.findAll('[role="radio"]')
    expect(radios).toHaveLength(5)
    expect(radios.map((radio) => radio.attributes('aria-checked'))).toEqual([
      'false',
      'false',
      'true',
      'false',
      'false'
    ])
  })

  it('increments with ArrowRight and keeps aria-checked in sync', async () => {
    const wrapper = mount(StarRating, { props: { modelValue: 3 } })
    const radios = wrapper.findAll('[role="radio"]')

    await radios[2].trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([4])

    await wrapper.setProps({ modelValue: 4 })
    expect(wrapper.findAll('[role="radio"]')[3].attributes('aria-checked')).toBe('true')
  })

  it('supports ArrowLeft, Home and End with wrap-around', async () => {
    const wrapper = mount(StarRating, { props: { modelValue: 3 } })
    const third = wrapper.findAll('[role="radio"]')[2]

    await third.trigger('keydown', { key: 'Home' })
    await third.trigger('keydown', { key: 'End' })
    await third.trigger('keydown', { key: 'ArrowLeft' })
    await third.trigger('keydown', { key: 'ArrowRight' })

    expect(wrapper.emitted('update:modelValue').map((event) => event[0])).toEqual([1, 5, 2, 4])
  })
})

describe('ToggleSwitch', () => {
  it('renders switch semantics bound to the label and v-model', async () => {
    const wrapper = mount(ToggleSwitch, {
      props: { modelValue: false, labelId: 'demo-label' }
    })

    const button = wrapper.get('button')
    expect(button.attributes('role')).toBe('switch')
    expect(button.attributes('aria-checked')).toBe('false')
    expect(button.attributes('aria-labelledby')).toBe('demo-label')

    await button.trigger('click')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([true])

    await wrapper.setProps({ modelValue: true })
    expect(button.attributes('aria-checked')).toBe('true')
  })

  it('keeps the compact size variant classes for charging settings', () => {
    const wrapper = mount(ToggleSwitch, { props: { modelValue: true, size: 'sm' } })
    const button = wrapper.get('button')

    expect(button.classes()).toContain('h-6')
    expect(button.classes()).toContain('w-11')
    expect(wrapper.get('span').classes()).toContain('h-5')
    expect(wrapper.get('span').classes()).toContain('left-[22px]')
  })
})
