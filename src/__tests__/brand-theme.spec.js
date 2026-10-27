import { describe, expect, it } from 'vitest'
import config from '../../tailwind.config.js'
import { brand, colors, stationColors } from '../theme/palette'
import mapManager from '../services/mapService'

const luminance = (hex) => {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    .map((channel) => parseInt(channel, 16) / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

const contrast = (foreground, background) => {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (values[0] + 0.05) / (values[1] + 0.05)
}

describe('VCTC brand theme', () => {
  it('preserves the template swatches and shares them with Tailwind', () => {
    expect(brand).toEqual({
      ink: '#002733',
      green: '#008C82',
      soft: '#99D1CD',
      neon: '#C2FE06'
    })
    expect(config.theme.extend.colors).toBe(colors)
    expect(colors.primary[500]).toBe(brand.green)
    expect(colors.primary[200]).toBe(brand.soft)
    expect(colors.surface[900]).toBe(brand.ink)
    expect(colors.accent[500]).toBe(brand.neon)
    expect(colors.secondary).toBe(colors.primary)
    expect(colors.info).toBe(colors.primary)
  })

  it.each(['primary', 'accent', 'surface'])('keeps the %s scale ordered light to dark', (name) => {
    const shades = Object.values(colors[name]).map(luminance)
    for (let i = 1; i < shades.length; i++) expect(shades[i]).toBeLessThan(shades[i - 1])
  })

  it.each([
    ['primary action', '#FFFFFF', colors.primary[600]],
    ['hovered action', '#FFFFFF', colors.primary[700]],
    ['pressed action', '#FFFFFF', colors.primary[800]],
    ['price on white', colors.primary[600], '#FFFFFF'],
    ['price on muted surface', colors.primary[600], colors.surface[50]],
    ['selected filter', colors.primary[700], colors.primary[50]],
    ['body text', colors.surface[900], '#FFFFFF'],
    ['muted text', colors.surface[500], colors.surface[50]],
    ['dark body text', colors.surface[100], colors.surface[900]],
    ['dark muted text', colors.surface[400], colors.surface[800]],
    ['dark primary text', colors.primary[400], colors.surface[800]],
    ['dark popup metrics', colors.primary[300], colors.surface[800]],
    ['header navigation', colors.surface[200], brand.ink],
    ['active navigation', brand.neon, brand.ink],
    ['active account', brand.ink, brand.neon],
    ['header brand', brand.soft, brand.ink]
  ])('%s meets the 4.5:1 small-text contrast threshold', (_name, foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5)
  })

  it('uses the original green as a swatch, not white-on-neon or low-contrast button text', () => {
    expect(contrast('#FFFFFF', brand.green)).toBeLessThan(4.5)
    expect(contrast('#FFFFFF', brand.neon)).toBeLessThan(3)
    expect(colors.primary[600]).not.toBe(brand.green)
  })

  it.each([
    [{ openStatus: 0 }, stationColors.maintenance],
    [{ quickAvailableNum: 0, slowAvailableNum: 0 }, stationColors.full],
    [{ quickAvailableNum: 1, slowAvailableNum: 0 }, stationColors.busy],
    [{ quickAvailableNum: 5, slowAvailableNum: 2 }, brand.green]
  ])('shares station status colors with map graphics: %j', (overrides, expected) => {
    expect(
      mapManager.getStationColor({
        openStatus: 1,
        quickChargeNum: 10,
        slowChargeNum: 5,
        quickAvailableNum: 5,
        slowAvailableNum: 2,
        ...overrides
      })
    ).toBe(expected)
  })

  it('keeps warning, full and maintenance distinguishable from the brand green', () => {
    expect(new Set(Object.values(stationColors)).size).toBe(4)
    expect(stationColors.busy).toBe(colors.warning[500])
    expect(stationColors.full).toBe(colors.danger[500])
    expect(stationColors.maintenance).toBe(colors.surface[500])
  })
})
