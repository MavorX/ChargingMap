<template>
  <div
    id="loading"
    role="status"
    aria-busy="true"
    class="fixed inset-0 z-modal flex items-center justify-center bg-surface-900/60 backdrop-blur-md"
  >
    <div class="relative animate-scale-in rounded-3xl bg-white p-8 shadow-2xl dark:bg-surface-800">
      <div class="relative z-10 flex flex-col items-center">
        <div class="relative mb-6 h-16 w-16">
          <svg class="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke-width="6"
              class="stroke-surface-200 dark:stroke-surface-700"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke-width="6"
              stroke-linecap="round"
              stroke="currentColor"
              stroke-dasharray="251.2"
              stroke-dashoffset="62.8"
              class="origin-center animate-spin-slow text-primary-600 dark:text-primary-300"
            />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="h-3 w-3 rounded-full bg-primary-500"></div>
          </div>
        </div>

        <p class="text-sm font-bold tracking-wide text-surface-800 dark:text-surface-200">
          {{ t('加载中') }}
        </p>
        <div class="mt-3 flex space-x-1">
          <div
            class="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-500"
            style="animation-delay: 0ms"
          ></div>
          <div
            class="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-500"
            style="animation-delay: 150ms"
          ></div>
          <div
            class="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary-500"
            style="animation-delay: 300ms"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { t } from '../../i18n'
</script>
