<template>
  <PanelShell
    title="评价充电站"
    content-id="review-panel"
    :busy="isSubmitting"
    @close="requestClose"
  >
    <div class="glass-effect flex shrink-0 items-center justify-between p-4">
      <button
        id="back-from-review"
        class="icon-button"
        aria-label="返回"
        :disabled="isSubmitting"
        @click="requestClose"
      >
        <i class="fa fa-arrow-left" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold">评价充电站</h2>
      <span class="w-10"></span>
    </div>
    <div class="flex-1 space-y-5 overflow-y-auto p-5">
      <div class="text-center">
        <h3 id="review-station-name" class="mb-4 break-words font-semibold">
          {{ currentStation?.stationName }}
        </h3>
        <fieldset :disabled="isSubmitting">
          <StarRating
            v-model="rating"
            aria-label="充电站评分"
            class="rating-stars flex justify-center gap-1"
          />
        </fieldset>
        <p class="mt-2 text-sm text-surface-500">{{ ratingTexts[rating - 1] }}</p>
      </div>
      <fieldset class="min-w-0 space-y-5" :disabled="isSubmitting">
        <div>
          <label for="review-content" class="mb-2 block text-sm font-semibold">评价内容</label
          ><textarea
            id="review-content"
            v-model="reviewContent"
            rows="4"
            maxlength="200"
            placeholder="分享您的充电体验…"
            class="input-premium resize-y"
            aria-describedby="review-count"
          ></textarea>
          <p id="review-count" class="mt-2 text-right text-xs text-surface-500">
            {{ reviewContent.length }}/200
          </p>
        </div>
        <div>
          <h3 class="mb-3 text-sm font-semibold">设施评价</h3>
          <div class="grid grid-cols-2 gap-2">
            <label
              v-for="(label, key) in facilityOptions"
              :key="key"
              class="flex cursor-pointer items-center gap-2 rounded-xl border border-surface-200 p-3 text-xs dark:border-surface-700"
              ><input
                v-model="facilityRatings[key]"
                type="checkbox"
                class="h-4 w-4 shrink-0 accent-primary-600"
              />{{ label }}</label
            >
          </div>
        </div>
        <div>
          <h3 class="mb-3 text-sm font-semibold">现场图片（可选）</h3>
          <button
            class="w-full rounded-xl border border-dashed border-surface-300 p-4 text-sm text-surface-500 dark:border-surface-600"
            :disabled="selectedImages.length >= 3"
            @click="fileInput?.click()"
          >
            <i class="fa fa-camera mr-2" aria-hidden="true"></i>添加图片（最多 3 张）
          </button>
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif"
            aria-label="选择现场图片"
            @change="handleFileChange"
          />
          <p class="mt-2 text-xs leading-6 text-surface-500">
            每张不超过 5MB。仅作本地演示预览，不会上传到服务器。
          </p>
          <div v-if="selectedImages.length" class="mt-3 grid grid-cols-3 gap-2">
            <div
              v-for="(image, index) in selectedImages"
              :key="image.url"
              class="relative aspect-square min-w-0 overflow-hidden rounded-xl"
            >
              <img
                :src="image.url"
                :alt="image.file.name"
                class="h-full w-full object-cover"
              /><button
                class="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-lg bg-black/65 text-white"
                :aria-label="`移除图片 ${index + 1}`"
                @click="removeImage(index)"
              >
                <i class="fa fa-times" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
      </fieldset>
      <p v-if="chargingStore.reviewSubmitted" class="text-sm text-surface-500" role="status">
        本次充电已评价，积分已发放。
      </p>
    </div>
    <div class="glass-effect shrink-0 border-t p-4">
      <button
        id="submit-review-btn"
        class="action-primary"
        :disabled="!canSubmit || isSubmitting"
        @click="submitReview"
      >
        <i v-if="isSubmitting" class="fa fa-circle-o-notch fa-spin" aria-hidden="true"></i
        >{{ isSubmitting ? '正在提交…' : '提交评价 · 获得 5 积分' }}
      </button>
    </div>
    <DialogModal v-if="showDiscard" title="放弃本次评价？" @close="showDiscard = false"
      ><p class="mb-5 text-sm leading-6 text-surface-500">
        离开后，尚未提交的文字和图片选择将丢失。
      </p>
      <div class="flex gap-3">
        <button class="action-primary" @click="showDiscard = false">继续编辑</button
        ><button
          class="w-full rounded-xl border border-surface-200 text-sm dark:border-surface-700"
          @click="emit('close')"
        >
          放弃评价
        </button>
      </div></DialogModal
    >
  </PanelShell>
</template>

<script setup>
import PanelShell from '../common/PanelShell.vue'
import DialogModal from '../common/DialogModal.vue'
import StarRating from '../common/StarRating.vue'
import { ref, computed, inject, reactive, onBeforeUnmount } from 'vue'
import { useStationsStore } from '../../store/modules/stations'
import { useChargingStore } from '../../store/modules/charging'
import { useUserStore } from '../../store/modules/user'
import { submitReview as submitReviewApi } from '../../services/api'
const emit = defineEmits(['close'])
const stationsStore = useStationsStore()
const chargingStore = useChargingStore()
const userStore = useUserStore()
const showToast = inject('showToast')
const currentStation = computed(
  () =>
    chargingStore.lastReceipt?.station ||
    chargingStore.sessionStation ||
    stationsStore.currentStation
)
const fileInput = ref(null)
const rating = ref(5)
const reviewContent = ref('')
const selectedImages = ref([])
const isSubmitting = ref(false)
const showDiscard = ref(false)
const facilityRatings = reactive({ fast: false, reasonable: false, clean: false, parking: false })
const facilityOptions = {
  fast: '充电速度快',
  reasonable: '价格合理',
  clean: '环境整洁',
  parking: '停车方便'
}
const ratingTexts = ['非常差', '较差', '一般', '较好', '非常好']
const canSubmit = computed(
  () =>
    !!chargingStore.lastReceipt &&
    !chargingStore.reviewSubmitted &&
    rating.value >= 1 &&
    rating.value <= 5 &&
    reviewContent.value.trim().length > 0 &&
    reviewContent.value.length <= 200
)
const removeImage = (index) => {
  URL.revokeObjectURL(selectedImages.value[index].url)
  selectedImages.value.splice(index, 1)
}
const handleFileChange = (event) => {
  let rejected = 0
  for (const file of event.target.files || []) {
    if (
      !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type) ||
      file.size > 5 * 1024 * 1024 ||
      selectedImages.value.length >= 3
    ) {
      rejected++
      continue
    }
    selectedImages.value.push({ file, url: URL.createObjectURL(file) })
  }
  event.target.value = ''
  if (rejected) showToast('部分图片未添加：限 3 张 PNG/JPEG/WebP/GIF，每张不超过 5MB', 'warning')
}
onBeforeUnmount(() => selectedImages.value.forEach((image) => URL.revokeObjectURL(image.url)))
const requestClose = () => {
  if (isSubmitting.value) return
  if (
    reviewContent.value.trim() ||
    selectedImages.value.length ||
    Object.values(facilityRatings).some(Boolean) ||
    rating.value !== 5
  )
    showDiscard.value = true
  else emit('close')
}
const submitReview = async () => {
  if (isSubmitting.value || !canSubmit.value) return
  isSubmitting.value = true
  const stationId = currentStation.value.stationId
  const review = {
    rating: rating.value,
    content: reviewContent.value.trim(),
    facilities: Object.keys(facilityRatings).filter((key) => facilityRatings[key])
  }
  try {
    const result = await submitReviewApi({ stationId, ...review })
    if (!chargingStore.reviewSubmitted) {
      chargingStore.reviewSubmitted = true
      userStore.addReviewPoints(
        chargingStore.sessionId || chargingStore.lastReceipt?.paidAt || 'legacy-review'
      )
      chargingStore.persistSession()
      const station = stationsStore.stations.find((item) => item.stationId === stationId)
      if (station?.details) {
        const reviews = station.details.reviews || []
        station.details.reviewsCount = (station.details.reviewsCount || reviews.length) + 1
        station.details.reviews = [
          {
            ...review,
            id: result.reviewId,
            userName: userStore.userInfo.name,
            date: new Date().toLocaleDateString('zh-CN')
          },
          ...reviews
        ]
      }
    }
    showToast('评价已提交，获得 5 积分', 'success')
    emit('close')
  } catch (error) {
    showToast(error.message || '评价提交失败，请重试', 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>
