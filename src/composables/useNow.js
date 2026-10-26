import { onMounted, onUnmounted, ref } from 'vue'
export const useNow = () => {
  const now = ref(new Date())
  const refresh = () => {
    now.value = new Date()
  }
  let timer
  onMounted(() => {
    timer = setInterval(refresh, 30000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
  })
  onUnmounted(() => {
    clearInterval(timer)
    window.removeEventListener('focus', refresh)
    document.removeEventListener('visibilitychange', refresh)
  })
  return now
}
