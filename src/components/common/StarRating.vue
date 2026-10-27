<template>
  <div role="radiogroup" :aria-label="t(ariaLabel)" :aria-labelledby="labelId || undefined">
    <button
      v-for="i in max"
      :key="i"
      :ref="(el) => setStarRef(i, el)"
      type="button"
      role="radio"
      :aria-checked="i === modelValue"
      :aria-label="t('{count} 星', { count: i })"
      :tabindex="i === (modelValue || 1) ? 0 : -1"
      class="star flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-2xl transition-colors hover:bg-warning-50 focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:bg-surface-800"
      :class="{ active: i <= modelValue }"
      @click="select(i)"
      @keydown="onKeydown"
    >
      <i class="fa fa-star" aria-hidden="true"></i>
    </button>
  </div>
</template>

<script setup>
import { nextTick, ref } from 'vue'
import { t } from '../../i18n'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0
  },
  max: {
    type: Number,
    default: 5
  },
  ariaLabel: {
    type: String,
    default: '评分'
  },
  labelId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const starRefs = ref([])

const setStarRef = (index, el) => {
  if (el) starRefs.value[index] = el
}

const clamp = (value) => Math.min(props.max, Math.max(1, value))

const select = (value) => {
  emit('update:modelValue', clamp(value))
}

const focusStar = async (value) => {
  await nextTick()
  starRefs.value[clamp(value)]?.focus()
}

const onKeydown = (event) => {
  const { key } = event
  const current = props.modelValue || 1
  let next = null

  if (key === 'ArrowRight' || key === 'ArrowUp') next = current >= props.max ? 1 : current + 1
  else if (key === 'ArrowLeft' || key === 'ArrowDown') next = current <= 1 ? props.max : current - 1
  else if (key === 'Home') next = 1
  else if (key === 'End') next = props.max

  if (next === null) return
  event.preventDefault()
  emit('update:modelValue', next)
  focusStar(next)
}
</script>
