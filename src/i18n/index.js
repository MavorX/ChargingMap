import { computed, readonly, ref } from 'vue'
import { english } from './en'

export const LANGUAGE_STORAGE_KEY = 'chargingLanguage'
export const SUPPORTED_LOCALES = ['zh-CN', 'en-US']
const currentLocale = ref('zh-CN')
export const locale = readonly(currentLocale)
export const isEnglish = computed(() => currentLocale.value === 'en-US')

// Chinese source copy doubles as a readable, stable message key. Translate at
// render time, not when records are created, so switching never rewrites data.
export function t(message, params = {}) {
  if (message == null) return ''
  const source = String(message)
  let translated = isEnglish.value && Object.hasOwn(english, source) ? english[source] : source
  if (Array.isArray(translated)) translated = translated[Number(params.count) === 1 ? 0 : 1]
  return translated.replace(/\{(\w+)\}/g, (match, key) =>
    Object.hasOwn(params, key) ? String(params[key]) : match
  )
}

function updateDocument() {
  if (typeof document === 'undefined') return
  document.documentElement.lang = currentLocale.value
  document.title = t('VWer Charging · 探索充电站')
}

export function setLocale(value) {
  if (!SUPPORTED_LOCALES.includes(value)) return false
  currentLocale.value = value
  updateDocument()
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, value)
  } catch {
    // Storage may be blocked; switching must still work for this visit.
  }
  return true
}

export function initializeLocale() {
  let saved
  try {
    saved = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  } catch {
    /* Use Chinese by default, including when storage is unavailable. */
  }
  currentLocale.value = SUPPORTED_LOCALES.includes(saved) ? saved : 'zh-CN'
  updateDocument()
}
