<template>
  <Teleport to="body" :disabled="!portal">
    <Transition name="toast-premium">
      <div
        v-if="show"
        data-dialog-exempt
        :role="isError ? 'alert' : 'status'"
        :aria-live="isError ? undefined : 'polite'"
        :aria-atomic="isError ? undefined : 'true'"
        :class="[
          'fixed left-1/2 top-[9.5rem] z-toast flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border px-3 py-2 shadow-soft-lg sm:w-auto lg:top-44',
          toastContainerClass
        ]"
        @mouseenter="handlePause"
        @mouseleave="handleResume"
        @focusin="handlePause"
        @focusout="handleResume"
      >
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          :class="toastIconBgClass"
        >
          <i :class="toastIconClass" aria-hidden="true"></i>
        </div>
        <p
          class="min-w-0 flex-1 break-words text-sm font-medium leading-6 [overflow-wrap:anywhere]"
          :class="toastTextClass"
        >
          {{ message }}
        </p>
        <button
          class="icon-button shrink-0 text-surface-500"
          :aria-label="t('关闭提示')"
          @click="$emit('update:show', false)"
        >
          <i class="fa fa-times text-xs" :class="toastTextClass" aria-hidden="true"></i>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onUnmounted, watch } from 'vue'
import { t } from '../../i18n'

const props = defineProps({
  portal: { type: Boolean, default: false },
  revision: { type: Number, default: 0 },
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'success'
  },
  show: {
    type: Boolean,
    default: false
  },
  duration: {
    type: Number,
    default: 3000
  }
})

const emit = defineEmits(['update:show', 'pause', 'resume'])

const isError = computed(() => props.type === 'error')

// 自动消失计时器：悬停/聚焦时暂停，离开后按剩余时长继续
let dismissTimer = null
let remaining = props.duration
let startedAt = 0
let pauseDepth = 0

const clearDismissTimer = () => {
  if (dismissTimer !== null) {
    clearTimeout(dismissTimer)
    dismissTimer = null
  }
}

const scheduleDismiss = () => {
  clearDismissTimer()
  startedAt = Date.now()
  dismissTimer = setTimeout(() => {
    dismissTimer = null
    remaining = 0
    emit('update:show', false)
  }, remaining)
}

const handlePause = () => {
  if (!props.show) return
  pauseDepth += 1
  if (pauseDepth > 1 || dismissTimer === null) return
  remaining = Math.max(0, remaining - (Date.now() - startedAt))
  clearDismissTimer()
  emit('pause')
}

const handleResume = () => {
  if (pauseDepth === 0) return
  pauseDepth -= 1
  if (pauseDepth > 0 || !props.show) return
  scheduleDismiss()
  emit('resume')
}

watch(
  () => props.show,
  (visible) => {
    pauseDepth = 0
    clearDismissTimer()
    if (!visible) return
    remaining = props.duration
    scheduleDismiss()
  },
  { immediate: true }
)

watch([() => props.message, () => props.type, () => props.revision], () => {
  if (!props.show) return
  clearDismissTimer()
  remaining = props.duration
  if (pauseDepth === 0) scheduleDismiss()
})

onUnmounted(clearDismissTimer)

const toastConfigMap = {
  error: {
    container: 'bg-white border-danger-200 dark:bg-surface-900 dark:border-danger-800',
    iconBg: 'bg-danger-50 dark:bg-danger-900/30',
    icon: 'fa fa-times text-danger-600 dark:text-danger-400 text-sm',
    text: 'text-surface-800 dark:text-surface-100'
  },
  warning: {
    container: 'bg-white border-warning-200 dark:bg-surface-900 dark:border-warning-800',
    iconBg: 'bg-warning-50 dark:bg-warning-900/30',
    icon: 'fa fa-exclamation text-warning-700 dark:text-warning-400 text-sm',
    text: 'text-surface-800 dark:text-surface-100'
  },
  info: {
    container: 'bg-white border-primary-200 dark:bg-surface-900 dark:border-primary-800',
    iconBg: 'bg-primary-50 dark:bg-primary-900/30',
    icon: 'fa fa-info text-primary-600 dark:text-primary-400 text-sm',
    text: 'text-surface-800 dark:text-surface-100'
  },
  success: {
    container: 'bg-white border-secondary-200 dark:bg-surface-900 dark:border-secondary-800',
    iconBg: 'bg-secondary-50 dark:bg-secondary-900/30',
    icon: 'fa fa-check text-secondary-600 dark:text-secondary-400 text-sm',
    text: 'text-surface-800 dark:text-surface-100'
  }
}

const currentConfig = computed(() => {
  return toastConfigMap[props.type] || toastConfigMap.success
})

const toastContainerClass = computed(() => currentConfig.value.container)
const toastIconBgClass = computed(() => currentConfig.value.iconBg)
const toastIconClass = computed(() => currentConfig.value.icon)
const toastTextClass = computed(() => currentConfig.value.text)
</script>

<style scoped>
.toast-premium-enter-active,
.toast-premium-leave-active {
  transition:
    opacity 160ms ease,
    translate 160ms ease;
}
.toast-premium-enter-from,
.toast-premium-leave-to {
  opacity: 0;
  translate: 0 6px;
}
</style>
