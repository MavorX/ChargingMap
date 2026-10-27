import fs from 'node:fs'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import postcss from 'postcss'
import { parse, compileStyle } from '@vue/compiler-sfc'
import App from '../App.vue'
import { useUserStore } from '../store/modules/user'

const { descriptor } = parse(fs.readFileSync('src/components/map/MapView.vue', 'utf8'))
const compiled = compileStyle({
  source: descriptor.styles[0].content,
  id: 'data-v-map-theme',
  scoped: true
})
const css = postcss.parse(compiled.code)
const rules = []
css.walkRules((rule) => rules.push(rule))
const declarations = (selector) =>
  Object.fromEntries(
    rules
      .find((rule) => rule.selector === selector)
      .nodes.filter((node) => node.type === 'decl')
      .map((node) => [node.prop, node.value])
  )

let wrapper
beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  document.body.classList.remove('dark')
  setActivePinia(createPinia())
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  vi.restoreAllMocks()
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  document.body.classList.remove('dark')
})
const mountApp = () => {
  wrapper = mount(App, {
    global: { stubs: { Header: true, RouterView: true, Loading: true, Toast: true } }
  })
}

describe('instant map theme', () => {
  it('limits local color adjustment to the basemap canvas, not interactive overlays', () => {
    expect(compiled.errors).toEqual([])
    const filteredRules = rules.filter((rule) =>
      rule.nodes.some(
        (node) =>
          node.type === 'decl' &&
          node.prop === 'filter' &&
          (node.value.includes('--map-basemap-filter') || node.value.includes('invert('))
      )
    )
    expect(filteredRules.map((rule) => rule.selector)).toEqual([
      '#map-container[data-v-map-theme] .amap-layers > canvas.amap-layer'
    ])
    const canvas = declarations(filteredRules[0].selector)
    expect(canvas.filter).toBe('var(--map-basemap-filter)')
    expect(canvas.transition).toBe('none')
    const day = declarations('#map-container[data-v-map-theme]')['--map-basemap-filter']
    expect(day).toContain('invert(')
    expect(day).not.toContain('url(')
    const night = declarations('.dark #map-container[data-v-map-theme]')['--map-basemap-filter']
    expect(night).toBe('none')
  })

  it('restores a saved night theme and switches both roots within the next Vue update', async () => {
    localStorage.setItem('isDarkMode', 'true')
    mountApp()
    await nextTick()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.body.classList.contains('dark')).toBe(true)
    useUserStore().toggleTheme()
    await nextTick()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.body.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('isDarkMode')).toBe('false')
  })

  it('still switches immediately when theme persistence is blocked', async () => {
    mountApp()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked')
    })
    useUserStore().toggleTheme()
    await nextTick()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.body.classList.contains('dark')).toBe(true)
  })
})
