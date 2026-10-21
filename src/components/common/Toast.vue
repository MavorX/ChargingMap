<template>
  <Transition name="toast-premium">
    <div
      v-if="show"
      :role="isError ? 'alert' : 'status'"
      :aria-live="isError ? undefined : 'polite'"
      :aria-atomic="isError ? undefined : 'true'"
      :class="[
        'fixed left-1/2 top-20 z-toast flex min-w-[300px] max-w-[90vw] -translate-x-1/2 transform items-center space-x-3.5 rounded-2xl border px-6 py-4 shadow-xl backdrop-blur-xl',
        toastContainerClass
      ]"
      @mouseenter="handlePause"
      @mouseleave="handleResume"
      @focusin="handlePause"
      @focusout="handleResume"
    >
      <div
        class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl shadow-md"
        :class="toastIconBgClass"
      >
        <i :class="toastIconClass" aria-hidden="true"></i>
      </div>
      <p class="flex-1 text-sm font-bold" :class="toastTextClass">{{ message }}</p>
      <button
        class="flex-shrink-0 opacity-60 transition-opacity duration-200 hover:opacity-100"
        aria-label="关闭提示"
        @click="$emit('update:show', false)"
      >
        <i class="fa fa-times text-xs" :class="toastTextClass" aria-hidden="true"></i>
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { computed, onUnmounted, watch } from 'vue'

const props = defineProps({
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

watch([() => props.message, () => props.type], () => {
  if (!props.show) return
  clearDismissTimer()
  remaining = props.duration
  if (pauseDepth === 0) scheduleDismiss()
})

onUnmounted(clearDismissTimer)

const toastConfigMap = {
  error: {
    container: 'bg-danger-500/95 text-white border-white/20 shadow-danger-500/30',
    iconBg: 'bg-white/20',
    icon: 'fa fa-times text-white text-sm',
    text: 'text-white'
  },
  warning: {
    container: 'bg-warning-500/95 text-white border-white/20 shadow-warning-500/30',
    iconBg: 'bg-white/20',
    icon: 'fa fa-exclamation text-white text-sm',
    text: 'text-white'
  },
  info: {
    container: 'bg-primary-500/95 text-white border-white/20 shadow-primary-500/30',
    iconBg: 'bg-white/20',
    icon: 'fa fa-info text-white text-sm',
    text: 'text-white'
  },
  success: {
    container: 'bg-secondary-500/95 text-white border-white/20 shadow-secondary-500/30',
    iconBg: 'bg-white/20',
    icon: 'fa fa-check text-white text-sm',
    text: 'text-white'
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
.toast-premium-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-premium-leave-active {
  transition: all 0.25s ease-in;
}
.toast-premium-enter-from {
  opacity: 0;
  transform: translate(-50%, -24px) scale(0.92);
}
.toast-premium-leave-to {
  opacity: 0;
  transform: translate(-50%, -12px) scale(0.98);
}
</style>
