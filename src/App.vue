<template>
  <div class="h-screen overflow-hidden">
    <Header />
    <router-view />
    <Loading v-if="isLoading" />
    <Toast
      portal
      :message="t(toastMessage)"
      :type="toastType"
      :show="showToast"
      :revision="toastRevision"
      @update:show="showToast = $event"
    />
  </div>
</template>

<script setup>
import { ref, provide, onMounted, onUnmounted, watch } from 'vue'
import { useUserStore } from './store/modules/user'
import Header from './components/Header.vue'
import Loading from './components/common/Loading.vue'
import Toast from './components/common/Toast.vue'
import { t } from './i18n'

const userStore = useUserStore()
watch(
  () => userStore.isDarkMode,
  (isDark) => {
    document.documentElement.classList.toggle('dark', isDark)
    document.body.classList.toggle('dark', isDark)
  },
  { immediate: true }
)

const isLoading = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const showToast = ref(false)
const toastRevision = ref(0)
const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  toastRevision.value++
  showToast.value = true
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
  userStore.loadPreferences()
  userStore.loadLocalVehicles()
  userStore.loadSandboxLedger()
})
onUnmounted(() => window.removeEventListener('appToast', handleAppToast))
</script>
