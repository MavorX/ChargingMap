<template>
  <div
    ref="rootRef"
    class="panel-overlay"
    :class="{ 'panel-fullscreen': fullscreen, 'panel-sheet': placement === 'sheet' }"
    role="dialog"
    :aria-modal="allowNavigation && !busy ? undefined : 'true'"
    :aria-label="t(title) || undefined"
    :aria-busy="busy || undefined"
  >
    <div v-if="!fullscreen" class="panel-backdrop" @click="requestClose"></div>
    <div
      :id="contentId || undefined"
      ref="contentRef"
      :class="['panel-content', contentClass]"
      tabindex="-1"
    >
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { t } from '../../i18n'
import { useDialogFocus } from '../../composables/useDialogFocus'

const props = defineProps({
  busy: { type: Boolean, default: false },
  allowNavigation: { type: Boolean, default: false },
  placement: { type: String, default: 'drawer' },
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

const rootRef = ref(null)
const contentRef = ref(null)
const requestClose = () => {
  if (!props.busy) emit('close')
}
useDialogFocus(rootRef, contentRef, {
  close: requestClose,
  isBusy: () => props.busy,
  allowNavigation: () => props.allowNavigation && !props.busy
})
</script>
