<template>
  <div
    ref="rootRef"
    class="panel-overlay"
    :class="{ 'z-50': fullscreen }"
    role="dialog"
    aria-modal="true"
    :aria-label="title || undefined"
  >
    <div v-if="!fullscreen" class="panel-backdrop" @click="$emit('close')"></div>
    <div
      :id="contentId || undefined"
      ref="contentRef"
      :class="[
        fullscreen
          ? 'relative flex h-full w-full flex-col bg-white dark:bg-surface-900'
          : 'panel-content',
        contentClass
      ]"
      tabindex="-1"
    >
      <slot />
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

defineProps({
  title: {
    type: String,
    default: ''
  },
  contentClass: {
    type: String,
    default: ''
  },
  contentId: {
    type: String,
    default: ''
  },
  fullscreen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

const rootRef = ref(null)
const contentRef = ref(null)
const previouslyFocused = typeof document !== 'undefined' ? document.activeElement : null
let savedOverflow = null

const getFocusable = () => {
  if (!contentRef.value) return []
  return Array.from(contentRef.value.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1
  )
}

const focusInside = () => {
  const target = getFocusable()[0] || contentRef.value
  if (target) target.focus({ preventScroll: true })
}

const onKeydown = (event) => {
  if (event.key === 'Escape') {
    emit('close')
    return
  }

  if (event.key !== 'Tab') return

  const focusable = getFocusable()
  if (focusable.length === 0) {
    event.preventDefault()
    contentRef.value?.focus({ preventScroll: true })
    return
  }

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const active = document.activeElement

  if (event.shiftKey) {
    if (active === first || !contentRef.value?.contains(active)) {
      event.preventDefault()
      last.focus({ preventScroll: true })
    }
    return
  }

  if (active === last || !contentRef.value?.contains(active)) {
    event.preventDefault()
    first.focus({ preventScroll: true })
  }
}

onMounted(async () => {
  const otherOverlays = Array.from(document.querySelectorAll('.panel-overlay')).filter(
    (overlay) => overlay !== rootRef.value
  )
  if (otherOverlays.length === 0) {
    savedOverflow = document.body.style.overflow
  }
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', onKeydown)

  await nextTick()
  focusInside()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)

  const otherOverlays = Array.from(document.querySelectorAll('.panel-overlay')).filter(
    (overlay) => overlay !== rootRef.value
  )
  if (otherOverlays.length === 0) {
    document.body.style.overflow = savedOverflow ?? ''
    savedOverflow = null
  }

  const active = document.activeElement
  const focusWasInside = rootRef.value?.contains(active) ?? false
  const canRestoreFocus = focusWasInside || !active || active === document.body

  if (canRestoreFocus && previouslyFocused?.isConnected) {
    previouslyFocused.focus({ preventScroll: true })
  }
})
</script>
