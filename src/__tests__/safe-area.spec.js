import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8')

const PANELS = [
  'src/components/station/StationDetail.vue',
  'src/components/charging/ChargingPanel.vue',
  'src/components/charging/ChargingSettings.vue',
  'src/components/payment/PaymentPanel.vue',
  'src/components/reservation/ReservationPanel.vue',
  'src/components/review/ReviewPanel.vue',
  'src/components/user/VehiclePanel.vue',
  'src/components/filter/VehicleFilter.vue'
]

describe('bottom safe area contract', () => {
  it('reserves the iOS home-indicator inset on the shared panel container', () => {
    const css = read('src/assets/main.css')
    const blocks = [...css.matchAll(/\.panel-content\s*\{([^}]*)\}/g)].map((match) => match[1])

    expect(blocks.length).toBeGreaterThan(0)
    expect(blocks.some((block) => block.includes('env(safe-area-inset-bottom)'))).toBe(true)
  })

  it('keeps every business panel footer on the shared PanelShell container', () => {
    for (const file of PANELS) {
      const source = read(file)
      expect(source, `${file} should render a border-t footer`).toContain('border-t')
      expect(source, `${file} should render inside PanelShell`).toContain('PanelShell')
    }
  })
})
