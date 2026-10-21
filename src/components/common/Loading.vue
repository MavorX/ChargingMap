<template>
  <div
    id="loading"
    class="fixed inset-0 z-[60] flex items-center justify-center bg-surface-900/60 backdrop-blur-md"
  >
    <div class="relative animate-scale-in rounded-3xl bg-white p-8 shadow-2xl dark:bg-surface-800">
      <div
        class="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-500/5 to-accent-500/5"
      ></div>
      <div class="relative z-10 flex flex-col items-center">
        <div class="relative mb-6 h-16 w-16">
          <svg class="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="loadingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color: #3b82f6; stop-opacity: 1" />
                <stop offset="50%" style="stop-color: #8b5cf6; stop-opacity: 1" />
                <stop offset="100%" style="stop-color: #10b981; stop-opacity: 1" />
              </linearGradient>
            </defs>
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
              :stroke="'url(#loadingGradient)'"
              stroke-dasharray="251.2"
              stroke-dashoffset="62.8"
              class="origin-center animate-spin-slow"
            />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <div
              class="h-4 w-4 animate-pulse rounded-full bg-gradient-to-br from-primary-400 to-accent-500"
            ></div>
          </div>
        </div>

        <p class="text-sm font-bold tracking-wide text-surface-800 dark:text-surface-200">加载中</p>
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

<script setup></script>
