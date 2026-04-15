<template>
  <Transition name="toast-premium">
    <div v-if="show"
         :class="[
           'fixed top-20 left-1/2 transform -translate-x-1/2 px-6 py-4 rounded-2xl shadow-xl z-[70] flex items-center space-x-3.5 max-w-[90vw] min-w-[300px] backdrop-blur-xl border',
           toastContainerClass
         ]">
      <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md" :class="toastIconBgClass">
        <i :class="toastIconClass" aria-hidden="true"></i>
      </div>
      <p class="text-sm font-bold flex-1" :class="toastTextClass">{{ message }}</p>
      <button @click="$emit('update:show', false)" class="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity duration-200">
        <i class="fa fa-times text-xs" :class="toastTextClass" aria-hidden="true"></i>
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue';

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
  }
});

const emit = defineEmits(['update:show']);

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
};

const currentConfig = computed(() => {
  return toastConfigMap[props.type] || toastConfigMap.success;
});

const toastContainerClass = computed(() => currentConfig.value.container);
const toastIconBgClass = computed(() => currentConfig.value.iconBg);
const toastIconClass = computed(() => currentConfig.value.icon);
const toastTextClass = computed(() => currentConfig.value.text);
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
