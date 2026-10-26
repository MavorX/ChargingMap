<template>
  <PanelShell
    :title="title"
    :content-id="contentId"
    content-class="account-panel"
    :busy="busy"
    :allow-navigation="!navigationLocked"
    @close="$emit('close')"
  >
    <div class="account-header">
      <button
        :id="backId || undefined"
        class="icon-button shrink-0"
        :aria-label="backLabel"
        :disabled="busy"
        @click="$emit('close')"
      >
        <i class="fa fa-arrow-left" aria-hidden="true"></i>
      </button>
      <div class="min-w-0 flex-1">
        <h2 class="text-base font-bold">{{ title }}</h2>
        <p v-if="subtitle" class="account-caption mt-0.5">{{ subtitle }}</p>
      </div>
      <slot name="header-action" />
    </div>
    <div class="account-body flex-1 overflow-y-auto"><slot /></div>
    <div v-if="$slots.footer" class="account-footer"><slot name="footer" /></div>
    <slot name="dialogs" />
  </PanelShell>
</template>
<script setup>
import PanelShell from '../common/PanelShell.vue'
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  contentId: { type: String, default: '' },
  backId: { type: String, default: '' },
  backLabel: { type: String, default: '返回' },
  busy: Boolean,
  navigationLocked: Boolean
})
defineEmits(['close'])
</script>
