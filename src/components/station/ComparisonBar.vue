<template>
  <div
    v-if="advisor.comparison.length"
    class="shrink-0 border-t border-primary-200 bg-white px-5 py-2 dark:border-primary-800 dark:bg-surface-900"
  >
    <button
      class="flex min-h-11 w-full items-center justify-between gap-2 text-sm font-semibold text-primary-700 dark:text-primary-300"
      @click="emit('show')"
    >
      <span
        ><i class="fa fa-code-compare mr-2" aria-hidden="true"></i
        >{{ t('对比已选站点（{count}/2）', { count: advisor.comparison.length }) }}</span
      ><i class="fa fa-arrow-up shrink-0" aria-hidden="true"></i>
    </button>
  </div>
</template>

<script setup>
import { t } from '../../i18n'
import { useRecommendationsStore } from '../../store/modules/recommendations'
const advisor = useRecommendationsStore()
const emit = defineEmits(['show'])
</script>
