<template>
  <div class="h-screen overflow-hidden transition-colors duration-300">
    <Header />
    <router-view />
    <Loading v-if="isLoading" />
    <Toast
      :message="toastMessage"
      :type="toastType"
      :show="showToast"
      @pause="pauseToastTimer"
      @resume="resumeToastTimer"
      @update:show="handleToastVisibility"
    />
  </div>
</template>

<script>
// 模块级定时器状态：连续 toast 时必须先清除旧计时器（审计 C13）
let toastTimer = null
let toastRemaining = 3000
let toastStartedAt = 0
let toastPauseDepth = 0
</script>

<script setup>
import { ref, provide, onMounted, onUnmounted, watch } from 'vue'
import { useUserStore } from './store/modules/user'
import Header from './components/Header.vue'
import Loading from './components/common/Loading.vue'
import Toast from './components/common/Toast.vue'

const userStore = useUserStore()

watch(
  () => userStore.isDarkMode,
  (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      document.body.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark')
    }
  },
  { immediate: true }
)

const isLoading = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const showToast = ref(false)

const stopToastTimer = () => {
  if (toastTimer !== null) {
    clearTimeout(toastTimer)
    toastTimer = null
  }
}

const scheduleToastTimer = () => {
  stopToastTimer()
  toastStartedAt = Date.now()
  toastTimer = setTimeout(() => {
    showToast.value = false
    toastTimer = null
    toastPauseDepth = 0
  }, toastRemaining)
}

const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  stopToastTimer()
  toastRemaining = 3000
  toastStartedAt = Date.now()
  // 新 toast 到来时重新计时，旧的计时器已在 stopToastTimer 中清除（C13）
  if (toastPauseDepth === 0) scheduleToastTimer()
}

// 悬停/聚焦时暂停自动消失，离开后按剩余时长继续计时
const pauseToastTimer = () => {
  if (!showToast.value) return
  toastPauseDepth += 1
  if (toastPauseDepth > 1 || toastTimer === null) return
  const elapsed = Date.now() - toastStartedAt
  stopToastTimer()
  toastRemaining = Math.max(0, toastRemaining - elapsed)
}

const resumeToastTimer = () => {
  if (toastPauseDepth === 0) return
  toastPauseDepth -= 1
  if (toastPauseDepth > 0 || !showToast.value) return
  scheduleToastTimer()
}

const handleToastVisibility = (value) => {
  if (!value) {
    stopToastTimer()
    toastPauseDepth = 0
  }
  showToast.value = value
}

provide('showToast', showToastMessage)
provide('setLoading', (value) => {
  isLoading.value = value
})

const handleAppToast = (event) => {
  const { message, type } = event.detail || {}
  if (message) showToastMessage(message, type || 'error')
}

onMounted(() => {
  window.addEventListener('appToast', handleAppToast)
  userStore.loadTheme()
})

onUnmounted(() => {
  window.removeEventListener('appToast', handleAppToast)
  stopToastTimer()
})
</script>
