import { isEnglish, t } from './index'
import { networks, places } from './places'
const placePattern = new RegExp(
  Object.keys(places)
    .sort((a, b) => b.length - a.length)
    .join('|'),
  'g'
)
const englishPlace = (value) =>
  String(value || '')
    .replace(placePattern, (key) => ` ${places[key]} `)
    .replace(/\s+/g, ' ')
    .trim()

export function stationName(value, language = isEnglish.value ? 'en-US' : 'zh-CN') {
  if (!value || language !== 'en-US') return value || ''
  const showcases = {
    '上海·人民广场演示充电站': "Shanghai · People's Square (Demo)",
    '上海·陆家嘴演示超充站': 'Shanghai · Lujiazui Supercharger (Demo)',
    '上海·徐家汇演示充电站': 'Shanghai · Xujiahui (Demo)'
  }
  if (Object.hasOwn(showcases, value)) return showcases[value]
  const name = String(value).replace(/充电站$/, '')
  const branch = name.split('·')
  if (branch.length === 2 && Object.hasOwn(networks, branch[0]))
    return `${networks[branch[0]]} · ${englishPlace(branch[1])}`
  const numbered = name.match(/^(.+?(?:区|县))(.+?)(\d+)号$/)
  if (numbered) return `${numbered[3]} ${englishPlace(numbered[2])} · ${englishPlace(numbered[1])}`
  return englishPlace(name)
}

export function stationAddress(value, language = isEnglish.value ? 'en-US' : 'zh-CN') {
  if (!value || language !== 'en-US') return value || ''
  const match = String(value).match(
    /^(?:安徽省)?(合肥市|上海市)(.+?(?:区|县))(.+?)(\d+)号(?:（模拟站点）)?$/
  )
  if (match)
    return `${match[4]} ${englishPlace(match[3])}, ${englishPlace(match[2])}, ${places[match[1]]}`
  return englishPlace(value)
}

// Search is bilingual even when Chinese is selected. Do not depend on the
// current locale or mutate canonical station names/IDs used by orders.
export const stationSearchText = (station) =>
  `${station.stationName} ${station.address} ${stationName(station.stationName, 'en-US')} ${stationAddress(station.address, 'en-US')}`.toLowerCase()

// Legacy local records store Chinese display text. Adapt only known formats,
// leaving arbitrary user-entered names, reviews and vehicle models untouched.
export function dataText(value) {
  if (!isEnglish.value || !value) return value || ''
  const source = String(value)
  const translated = t(source)
  if (translated !== source) return translated
  let match = source.match(/^(快充|慢充|超充)(\d+)$/)
  if (match) return `${{ 快充: 'Fast', 慢充: 'AC', 超充: 'Ultra-fast' }[match[1]]} ${match[2]}`
  match = source.match(/^(?:(\d+)小时)?(?:(\d+)分钟)?$/)
  if (match && (match[1] || match[2]))
    return [match[1] && `${match[1]} hr`, match[2] && `${match[2]} min`].filter(Boolean).join(' ')
  match = source.match(/^(\d+)(分钟|天|周)前$/)
  if (match)
    return `${match[1]} ${{ 分钟: 'min', 天: 'day', 周: 'week' }[match[2]]}${match[2] !== '分钟' && Number(match[1]) !== 1 ? 's' : ''} ago`
  match = source.match(/^(.+)(充电|退款)$/)
  if (match && /充电站|超充站/.test(match[1]))
    return `${stationName(match[1])} · ${match[2] === '充电' ? 'Charging' : 'Refund'}`
  match = source.match(/^您在(.+)的充电已完成，充电([\d.]+)度，费用(.+)。$/)
  if (match)
    return `Charging at ${stationName(match[1])} is complete. ${match[2]} kWh delivered · ${match[3]} paid.`
  match = source.match(/^您预约的"(.+)"充电服务将在30分钟后开始，请做好准备。$/)
  if (match) return `Your booking at ${stationName(match[1])} starts in 30 minutes.`
  return source
}

export function siteGuide(value) {
  if (!isEnglish.value || !value) return value || t('暂无详细指引信息')
  let match = value.match(
    /^模拟站点位于(.+)停车场内，从(.+)入口进入，沿充电指示前往充电区域；仅用于展示，不代表真实运营站点。$/
  )
  if (match)
    return `Demo parking at ${stationAddress(match[1])}. Enter from ${englishPlace(match[2])} and follow the charging signs. This is a simulated site, not a real operating station.`
  match = value.match(/^位于(.+)内，从(.+)入口进入后(左转|右转|直行)(\d+)米即可看到充电区域。$/)
  if (match)
    return `At ${stationAddress(match[1])}. Enter from ${englishPlace(match[2])}, then ${{ 左转: 'turn left and continue', 右转: 'turn right and continue', 直行: 'go straight' }[match[3]]} for ${match[4]} m to the charging area.`
  return value
}
