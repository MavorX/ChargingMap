<template>
  <svg
    viewBox="0 0 320 100"
    class="energy-flow mx-auto w-full max-w-xs"
    :class="{ 'energy-flow-active': active }"
    fill="none"
    aria-hidden="true"
  >
    <rect
      x="10"
      y="15"
      width="42"
      height="69"
      rx="8"
      stroke="currentColor"
      stroke-width="2"
      opacity="0.65"
    />
    <rect x="18" y="25" width="26" height="23" rx="4" fill="currentColor" opacity="0.12" />
    <path d="M32 28L25 38H31L29 45L37 35H31L32 28Z" fill="currentColor" />
    <path
      d="M23 62H39M23 68H34"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      opacity="0.5"
    />
    <path
      d="M52 58H68C78 58 78 82 90 82H120C132 82 132 58 144 58H162"
      stroke="currentColor"
      stroke-width="3"
      opacity="0.2"
    />
    <path
      v-if="connected"
      class="energy-flow-line"
      d="M52 58H68C78 58 78 82 90 82H120C132 82 132 58 144 58H162"
      stroke="currentColor"
      stroke-width="3"
      stroke-dasharray="5 8"
      stroke-linecap="round"
    />
    <path
      d="M161 63V53L177 47L190 27H256L276 47L302 54V73H161V63Z"
      stroke="currentColor"
      stroke-width="2"
      stroke-linejoin="round"
    />
    <path d="M183 47H268L253 33H195L183 47Z" fill="currentColor" opacity="0.12" />
    <circle
      cx="188"
      cy="74"
      r="10"
      fill="var(--energy-car-bg, #002733)"
      stroke="currentColor"
      stroke-width="2"
    />
    <circle
      cx="276"
      cy="74"
      r="10"
      fill="var(--energy-car-bg, #002733)"
      stroke="currentColor"
      stroke-width="2"
    />
    <rect x="211" y="56" width="40" height="10" rx="3" stroke="currentColor" opacity="0.5" />
    <rect
      x="213"
      y="58"
      :width="(36 * Math.max(0, Math.min(100, battery))) / 100"
      height="6"
      rx="1"
      fill="currentColor"
    />
    <path d="M160 54V63M155 56V61" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  </svg>
</template>

<script setup>
defineProps({
  active: { type: Boolean, default: false },
  connected: { type: Boolean, default: false },
  battery: { type: Number, default: 0 }
})
</script>

<style scoped>
.energy-flow-line {
  opacity: 0.4;
}
.energy-flow-active .energy-flow-line {
  opacity: 1;
  animation: energy-travel 1.6s linear infinite;
}
@keyframes energy-travel {
  to {
    stroke-dashoffset: -26;
  }
}
@media (prefers-reduced-motion: reduce) {
  .energy-flow-active .energy-flow-line {
    animation: none;
  }
}
</style>
