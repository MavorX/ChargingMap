import { nextTick, onBeforeUnmount, onMounted } from 'vue'

const dialogs = []
const inertElements = new Map()
let previousOverflow = ''

// Reference-count background locks: a confirmation may sit above a drawer.
const lockElement = (element) => {
  const lock = inertElements.get(element)
  if (lock) lock.count++
  else {
    inertElements.set(element, { count: 1, wasInert: element.hasAttribute('inert') })
    element.setAttribute('inert', '')
  }
}

const unlockElement = (element) => {
  const lock = inertElements.get(element)
  if (!lock || --lock.count > 0) return
  if (!lock.wasInert) element.removeAttribute('inert')
  inertElements.delete(element)
}

export function useDialogFocus(rootRef, contentRef, { close, isBusy = () => false }) {
  let entry = null
  let trigger = null
  let locked = []

  const focusable = () => {
    if (!contentRef.value) return []
    const hasLayout = contentRef.value.getClientRects().length > 0
    return [
      ...contentRef.value.querySelectorAll('button, a[href], input, select, textarea, [tabindex]')
    ].filter(
      (element) =>
        element.tabIndex >= 0 &&
        !element.matches(':disabled') &&
        element.type !== 'hidden' &&
        !element.closest('[inert], [hidden], [aria-hidden="true"]') &&
        getComputedStyle(element).visibility !== 'hidden' &&
        (!hasLayout || element.getClientRects().length > 0)
    )
  }

  const focusInside = () => (focusable()[0] || contentRef.value)?.focus({ preventScroll: true })
  const isTop = () => dialogs.at(-1) === entry

  const onKeydown = (event) => {
    if (!isTop()) return
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopImmediatePropagation()
      if (!isBusy()) close()
      return
    }
    if (event.key !== 'Tab') return
    const elements = focusable()
    const first = elements[0] || contentRef.value
    const last = elements.at(-1) || contentRef.value
    if (
      !elements.length ||
      !contentRef.value?.contains(document.activeElement) ||
      (event.shiftKey ? document.activeElement === first : document.activeElement === last)
    ) {
      event.preventDefault()
      ;(event.shiftKey ? last : first)?.focus({ preventScroll: true })
    }
  }

  const onFocusin = (event) => {
    if (
      isTop() &&
      !contentRef.value?.contains(event.target) &&
      !event.target.closest('[data-dialog-exempt]')
    )
      focusInside()
  }

  onMounted(async () => {
    await nextTick()
    if (!rootRef.value?.isConnected) return
    trigger = document.activeElement
    if (!dialogs.length) {
      previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    // Inert siblings at each ancestor, never the dialog's own ancestors.
    let node = rootRef.value
    while (node && node !== document.body) {
      for (const sibling of node.parentElement?.children || []) {
        if (
          sibling !== node &&
          !sibling.matches('[data-dialog-exempt]') &&
          !['SCRIPT', 'STYLE'].includes(sibling.tagName)
        ) {
          lockElement(sibling)
          locked.push(sibling)
        }
      }
      node = node.parentElement
    }
    entry = { focusInside, contains: (element) => contentRef.value?.contains(element) }
    dialogs.push(entry)
    document.addEventListener('keydown', onKeydown)
    document.addEventListener('focusin', onFocusin)
    focusInside()
  })

  onBeforeUnmount(() => {
    if (!entry) return
    const wasTop = isTop()
    document.removeEventListener('keydown', onKeydown)
    document.removeEventListener('focusin', onFocusin)
    dialogs.splice(dialogs.indexOf(entry), 1)
    locked.forEach(unlockElement)
    locked = []
    if (!dialogs.length) document.body.style.overflow = previousOverflow
    if (!wasTop) return
    const parent = dialogs.at(-1)
    if (
      trigger?.isConnected &&
      !trigger.closest('[inert]') &&
      (!parent || parent.contains(trigger))
    ) {
      trigger.focus({ preventScroll: true })
    } else parent?.focusInside()
  })
}
