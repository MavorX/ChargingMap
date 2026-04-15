<template>
  <div class="panel-overlay">
    <div class="panel-backdrop" @click="$emit('close')"></div>
    <div id="review-panel" class="panel-content">
    <div class="glass-effect border-b border-surface-200/50 dark:border-surface-700/50 p-4 flex justify-between items-center flex-shrink-0 z-10">
      <button id="back-from-review" class="icon-button" @click="$emit('close')">
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">评价充电站</h2>
      <div class="w-10"></div>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div class="mb-6 text-center">
        <h3 class="font-bold text-surface-800 dark:text-surface-200 mb-4" id="review-station-name">{{ currentStation?.stationName }}</h3>
        <div class="rating-stars flex justify-center mb-2 space-x-3">
          <span v-for="i in 5" :key="i" class="star text-3xl cursor-pointer transition-transform hover:scale-125" :class="{ 'active': i <= rating }" @click="rating = i">
            <i class="fa fa-star" aria-hidden="true"></i>
          </span>
        </div>
        <p class="text-sm font-medium text-surface-500 dark:text-surface-400">{{ ratingTexts[rating - 1] }}</p>
      </div>

      <div class="mb-5">
        <label class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-2">评价内容</label>
        <textarea id="review-content" rows="4" placeholder="分享您的充电体验..." class="input-premium resize-none" v-model="reviewContent"></textarea>
        <p class="text-xs text-surface-400 mt-1.5 text-right">{{ reviewContent.length }}/200</p>
      </div>

      <div class="mb-5">
        <label class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-3">设施评价</label>
        <div class="grid grid-cols-2 gap-2.5">
          <label v-for="(item, key) in facilityOptions" :key="key" class="flex items-center p-3.5 border-2 rounded-xl cursor-pointer transition-all duration-300"
            :class="facilityRatings[key] ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-surface-200 dark:border-surface-700 hover:border-primary-300'">
            <input type="checkbox" class="sr-only" v-model="facilityRatings[key]">
            <div class="w-5 h-5 rounded border-2 flex items-center justify-center mr-2.5 transition-colors flex-shrink-0"
              :class="facilityRatings[key] ? 'border-primary-500 bg-primary-500' : 'border-surface-300 dark:border-surface-600'">
              <i v-if="facilityRatings[key]" class="fa fa-check text-white text-xs" aria-hidden="true"></i>
            </div>
            <span class="text-sm font-medium text-surface-700 dark:text-surface-300">{{ item }}</span>
          </label>
        </div>
      </div>

      <div class="mb-5">
        <label class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-3">上传图片 (可选)</label>
        <div class="border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-2xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all duration-300" @click="triggerFileInput">
          <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
            <i class="fa fa-camera text-2xl text-surface-400" aria-hidden="true"></i>
          </div>
          <p class="text-sm font-medium text-surface-500 dark:text-surface-400">点击上传图片</p>
          <input type="file" id="review-images" class="hidden" multiple accept="image/*" ref="fileInput" @change="handleFileChange">
        </div>
        <div v-if="selectedImages.length > 0" class="flex space-x-2 mt-3 overflow-x-auto">
          <div v-for="(img, index) in selectedImages" :key="index" class="flex-shrink-0 w-16 h-16 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
            <i class="fa fa-image text-surface-400" aria-hidden="true"></i>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-shrink-0 glass-effect border-t border-surface-200/50 dark:border-surface-700/50 p-4 lg:p-5">
      <button id="submit-review-btn"
        class="group w-full relative overflow-hidden bg-gradient-to-r from-primary-500 to-accent-500 text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary-500/25 hover:shadow-2xl hover:shadow-primary-500/35 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        @click="submitReview" :disabled="!canSubmit">
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        <span class="relative z-10 flex items-center justify-center space-x-2">
          <i class="fa fa-paper-plane" aria-hidden="true"></i>
          <span>提交评价 (获得5积分)</span>
        </span>
      </button>
    </div>
      </div>
</div>
</template>

<script setup>
import { ref, computed, inject, reactive } from 'vue';
import { useStationsStore } from '../../store/modules/stations';
import { submitReview as submitReviewApi } from '../../services/api';

const emit = defineEmits(['close']);

const stationsStore = useStationsStore();
const showToast = inject('showToast');
const setLoading = inject('setLoading');

const currentStation = computed(() => stationsStore.currentStation);
const fileInput = ref(null);

const rating = ref(5);
const reviewContent = ref('');
const selectedImages = ref([]);
const facilityRatings = reactive({
  fast: false,
  reasonable: false,
  clean: false,
  parking: false
});

const facilityOptions = {
  fast: '充电速度快',
  reasonable: '价格合理',
  clean: '环境整洁',
  parking: '停车方便'
};

const ratingTexts = ['非常差', '较差', '一般', '较好', '非常好'];

const canSubmit = computed(() => {
  return rating.value >= 1 && reviewContent.value.trim().length > 0
});

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = (event) => {
  const files = event.target.files;
  if (files.length > 0) {
    selectedImages.value = Array.from(files)
    showToast(`已选择 ${files.length} 张图片`, 'info');
  }
};

const submitReview = async () => {
  if (!currentStation.value) return;
  if (!reviewContent.value.trim()) {
    showToast('请填写评价内容', 'error');
    return;
  }

  setLoading(true);
  try {
    await submitReviewApi({
      stationId: currentStation.value.stationId,
      rating: rating.value,
      content: reviewContent.value,
      facilities: Object.entries(facilityRatings)
        .filter(([_, value]) => value)
        .map(([key, _]) => key)
    });
    showToast('评价提交成功，感谢您的反馈！', 'success');
    emit('close');
  } catch (err) {
    showToast('评价提交失败，请重试', 'error');
  } finally {
    setLoading(false);
  }
};
</script>
