<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-labelledby="labelId || undefined"
    :disabled="disabled"
    :class="[
      'relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-900',
      size === 'sm'
        ? 'h-6 w-11 flex-shrink-0 transition-colors duration-200'
        : 'h-7 w-12 transition-all duration-300',
      modelValue ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'
    ]"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span
      :class="[
        'absolute top-0.5 rounded-full bg-white',
        size === 'sm'
          ? 'h-5 w-5 shadow-sm transition-all duration-200'
          : 'h-6 w-6 shadow-md transition-all duration-300',
        modelValue ? 'left-[22px]' : 'left-0.5'
      ]"
    ></span>
  </button>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  labelId: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['md', 'sm'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:modelValue'])
</script>
