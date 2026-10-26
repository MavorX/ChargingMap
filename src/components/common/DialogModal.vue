<template>
  <Teleport to="body">
    <div
      ref="rootRef"
      class="dialog-overlay"
      :role="role"
      aria-modal="true"
      :aria-busy="busy"
      :aria-labelledby="titleId"
      @click.self="close"
    >
      <section ref="contentRef" class="dialog-content" tabindex="-1">
        <div class="mb-4 flex items-center justify-between gap-3">
          <h3 :id="titleId" class="text-lg font-bold text-surface-900 dark:text-surface-100">
            {{ title }}
          </h3>
          <button
            class="icon-button shrink-0 text-surface-500"
            aria-label="关闭弹窗"
            :disabled="busy"
            @click="close"
          >
            <i class="fa fa-times" aria-hidden="true"></i>
          </button>
        </div>
        <slot />
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, useId } from 'vue'
import { useDialogFocus } from '../../composables/useDialogFocus'
const props = defineProps({
  title: { type: String, required: true },
  role: { type: String, default: 'dialog' },
  busy: { type: Boolean, default: false }
})
const emit = defineEmits(['close'])
const titleId = useId()
const rootRef = ref(null)
const contentRef = ref(null)
const close = () => {
  if (!props.busy) emit('close')
}
useDialogFocus(rootRef, contentRef, { close, isBusy: () => props.busy })
</script>
