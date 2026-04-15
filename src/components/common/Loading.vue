<template>
  <div id="loading" class="fixed inset-0 bg-surface-900/60 backdrop-blur-md z-[60] flex items-center justify-center">
    <div class="relative bg-white dark:bg-surface-800 p-8 rounded-3xl shadow-2xl animate-scale-in">
      <div class="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-accent-500/5 rounded-3xl"></div>
      <div class="relative z-10 flex flex-col items-center">
        <div class="relative w-16 h-16 mb-6">
          <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="loadingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
                <stop offset="50%" style="stop-color:#8B5CF6;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#10B981;stop-opacity:1" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="40" fill="none" stroke-width="6"
                    class="stroke-surface-200 dark:stroke-surface-700" />
            <circle cx="50" cy="50" r="40" fill="none" stroke-width="6"
                    stroke-linecap="round"
                    :stroke="'url(#loadingGradient)'"
                    stroke-dasharray="251.2"
                    stroke-dashoffset="62.8"
                    class="animate-spin-slow origin-center" />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-4 h-4 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 animate-pulse"></div>
          </div>
        </div>

        <p class="text-sm font-bold text-surface-800 dark:text-surface-200 tracking-wide">加载中</p>
        <div class="flex space-x-1 mt-3">
          <div class="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style="animation-delay: 0ms"></div>
          <div class="w-1.5 h-1.5 rounded-full bg-accent-500 animate-bounce" style="animation-delay: 150ms"></div>
          <div class="w-1.5 h-1.5 rounded-full bg-secondary-500 animate-bounce" style="animation-delay: 300ms"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>
