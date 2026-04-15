<template>
  <div class="h-screen overflow-hidden transition-colors duration-300">
    <Header />
    <router-view />
    <Loading v-if="isLoading" />
    <Toast :message="toastMessage" :type="toastType" :show="showToast" />
  </div>
</template>

<script setup>
import { ref, provide, onMounted, watch } from 'vue';
import { useUserStore } from './store/modules/user';
import Header from './components/Header.vue';
import Loading from './components/common/Loading.vue';
import Toast from './components/common/Toast.vue';

const userStore = useUserStore();

watch(() => userStore.isDarkMode, (isDark) => {
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
  }
}, { immediate: true });

const isLoading = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
const showToast = ref(false);

const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

provide('showToast', showToastMessage);
provide('setLoading', (value) => {
  isLoading.value = value;
});

onMounted(() => {
  userStore.loadTheme();
});
</script>