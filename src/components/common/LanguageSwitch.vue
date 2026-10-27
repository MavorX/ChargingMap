<template>
  <button
    type="button"
    class="language-switch inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-surface-200 px-2.5 text-xs font-semibold text-surface-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-primary-300"
    :aria-label="isEnglish ? '切换为中文' : 'Switch to English'"
    :title="isEnglish ? '切换为中文' : 'Switch to English'"
    :lang="isEnglish ? 'zh-CN' : 'en'"
    @click="setLocale(isEnglish ? 'zh-CN' : 'en-US')"
  >
    <i class="fa fa-language text-base" aria-hidden="true"></i>
    <span class="min-w-4 text-center">{{ isEnglish ? '中' : 'EN' }}</span>
  </button>
</template>

<script setup>
import { isEnglish, setLocale } from '../../i18n'
</script>
