<template>
  <div class="panel-overlay">
    <div class="panel-backdrop" @click="$emit('close')"></div>
    <div id="review-panel" class="panel-content">
      <div
        class="glass-effect z-10 flex flex-shrink-0 items-center justify-between border-b border-surface-200/50 p-4 dark:border-surface-700/50"
      >
        <button id="back-from-review" class="icon-button" @click="$emit('close')">
          <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
        </button>
        <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">评价充电站</h2>
        <div class="w-10"></div>
      </div>

      <div class="flex-1 overflow-y-auto p-5">
        <div class="mb-6 text-center">
          <h3
            id="review-station-name"
            class="mb-4 font-bold text-surface-800 dark:text-surface-200"
          >
            {{ currentStation?.stationName }}
          </h3>
          <div class="rating-stars mb-2 flex justify-center space-x-3">
            <span
              v-for="i in 5"
              :key="i"
              class="star cursor-pointer text-3xl transition-transform hover:scale-125"
              :class="{ active: i <= rating }"
              @click="rating = i"
            >
              <i class="fa fa-star" aria-hidden="true"></i>
            </span>
          </div>
          <p class="text-sm font-medium text-surface-500 dark:text-surface-400">
            {{ ratingTexts[rating - 1] }}
          </p>
        </div>

        <div class="mb-5">
          <label class="mb-2 block text-sm font-bold text-surface-700 dark:text-surface-300"
            >评价内容</label
          >
          <textarea
            id="review-content"
            v-model="reviewContent"
            rows="4"
            placeholder="分享您的充电体验..."
            class="input-premium resize-none"
          ></textarea>
          <p class="mt-1.5 text-right text-xs text-surface-400">{{ reviewContent.length }}/200</p>
        </div>

        <div class="mb-5">
          <label class="mb-3 block text-sm font-bold text-surface-700 dark:text-surface-300"
            >设施评价</label
          >
          <div class="grid grid-cols-2 gap-2.5">
            <label
              v-for="(item, key) in facilityOptions"
              :key="key"
              class="flex cursor-pointer items-center rounded-xl border-2 p-3.5 transition-all duration-300"
              :class="
                facilityRatings[key]
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-surface-200 hover:border-primary-300 dark:border-surface-700'
              "
            >
              <input v-model="facilityRatings[key]" type="checkbox" class="sr-only" />
              <div
                class="mr-2.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors"
                :class="
                  facilityRatings[key]
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-surface-300 dark:border-surface-600'
                "
              >
                <i
                  v-if="facilityRatings[key]"
                  class="fa fa-check text-xs text-white"
                  aria-hidden="true"
                ></i>
              </div>
              <span class="text-sm font-medium text-surface-700 dark:text-surface-300">{{
                item
              }}</span>
            </label>
          </div>
        </div>

        <div class="mb-5">
          <label class="mb-3 block text-sm font-bold text-surface-700 dark:text-surface-300"
            >上传图片 (可选)</label
          >
          <div
            class="cursor-pointer rounded-2xl border-2 border-dashed border-surface-300 p-6 text-center transition-all duration-300 hover:border-primary-400 hover:bg-primary-50/50 dark:border-surface-600 dark:hover:bg-primary-900/10"
            @click="triggerFileInput"
          >
            <div
              class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800"
            >
              <i class="fa fa-camera text-2xl text-surface-400" aria-hidden="true"></i>
            </div>
            <p class="text-sm font-medium text-surface-500 dark:text-surface-400">点击上传图片</p>
            <input
              id="review-images"
              ref="fileInput"
              type="file"
              class="hidden"
              multiple
              accept="image/*"
              @change="handleFileChange"
            />
          </div>
          <div v-if="selectedImages.length > 0" class="mt-3 flex space-x-2 overflow-x-auto">
            <div
              v-for="(img, index) in selectedImages"
              :key="index"
              class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800"
            >
              <i class="fa fa-image text-surface-400" aria-hidden="true"></i>
            </div>
          </div>
        </div>
      </div>

      <div
        class="glass-effect flex-shrink-0 border-t border-surface-200/50 p-4 dark:border-surface-700/50 lg:p-5"
      >
        <button
          id="submit-review-btn"
          class="group relative w-full transform overflow-hidden rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500 py-4 font-bold text-white shadow-xl shadow-primary-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-primary-500/35 active:translate-y-0 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!canSubmit"
          @click="submitReview"
        >
          <div
            class="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]"
          ></div>
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
import { ref, computed, inject, reactive } from 'vue'
import { useStationsStore } from '../../store/modules/stations'
import { submitReview as submitReviewApi } from '../../services/api'

const emit = defineEmits(['close'])

const stationsStore = useStationsStore()
const showToast = inject('showToast')
const setLoading = inject('setLoading')

const currentStation = computed(() => stationsStore.currentStation)
const fileInput = ref(null)

const rating = ref(5)
const reviewContent = ref('')
const selectedImages = ref([])
const facilityRatings = reactive({
  fast: false,
  reasonable: false,
  clean: false,
  parking: false
})

const facilityOptions = {
  fast: '充电速度快',
  reasonable: '价格合理',
  clean: '环境整洁',
  parking: '停车方便'
}

const ratingTexts = ['非常差', '较差', '一般', '较好', '非常好']

const canSubmit = computed(() => {
  return rating.value >= 1 && reviewContent.value.trim().length > 0
})

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = (event) => {
  const files = event.target.files
  if (files.length > 0) {
    selectedImages.value = Array.from(files)
    showToast(`已选择 ${files.length} 张图片`, 'info')
  }
}

const submitReview = async () => {
  if (!currentStation.value) return
  if (!reviewContent.value.trim()) {
    showToast('请填写评价内容', 'error')
    return
  }

  setLoading(true)
  try {
    await submitReviewApi({
      stationId: currentStation.value.stationId,
      rating: rating.value,
      content: reviewContent.value,
      facilities: Object.entries(facilityRatings)
        .filter(([_, value]) => value)
        .map(([key, _]) => key)
    })
    showToast('评价提交成功，感谢您的反馈！', 'success')
    emit('close')
  } catch {
    showToast('评价提交失败，请重试', 'error')
  } finally {
    setLoading(false)
  }
}
</script>
