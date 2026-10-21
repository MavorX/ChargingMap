<template>
  <PanelShell :title="formTitle" content-id="vehicle-panel" @close="handleBack">
    <div
      class="glass-effect z-10 flex flex-shrink-0 items-center justify-between border-b border-surface-200/50 p-4 dark:border-surface-700/50"
    >
      <button
        id="back-from-vehicle-panel"
        class="icon-button"
        aria-label="返回"
        @click="handleBack"
      >
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">{{ formTitle }}</h2>
      <button
        v-if="!showForm && vehicles.length > 0"
        class="rounded-xl px-3 py-1.5 text-sm font-semibold text-primary-600 transition-all duration-200 hover:bg-primary-50 active:scale-95 dark:text-primary-400 dark:hover:bg-primary-900/20"
        @click="openAddForm"
      >
        <i class="fa fa-plus mr-1" aria-hidden="true"></i>添加
      </button>
      <div v-else-if="!showForm" class="w-8"></div>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div v-if="!showForm">
        <div
          v-if="vehicles.length > 0"
          class="mb-6 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 p-5 shadow-soft dark:from-surface-800 dark:to-surface-900"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-surface-500 dark:text-surface-400">已登记车辆</p>
              <p class="gradient-text mt-1 text-2xl font-black">
                {{ vehicles.length
                }}<span class="ml-1 text-sm font-normal text-surface-500">辆</span>
              </p>
            </div>
            <div
              class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 shadow-md"
            >
              <i class="fa fa-car text-2xl text-white" aria-hidden="true"></i>
            </div>
          </div>
          <div
            class="mt-3 flex items-center space-x-4 border-t border-primary-100 pt-3 dark:border-surface-700/50"
          >
            <div class="flex items-center">
              <i class="fa fa-plug mr-1.5 text-xs text-primary-500" aria-hidden="true"></i>
              <span class="text-xs text-surface-600 dark:text-surface-300">{{
                connectorSummary
              }}</span>
            </div>
            <div class="flex items-center">
              <i class="fa fa-bolt mr-1.5 text-xs text-secondary-500" aria-hidden="true"></i>
              <span class="text-xs text-surface-600 dark:text-surface-300"
                >最高{{ maxPower }}kW</span
              >
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <div
            v-for="vehicle in vehicles"
            :key="vehicle.id"
            class="rounded-2xl bg-gradient-to-br from-white to-surface-50 p-4 shadow-soft transition-all hover:shadow-soft-md dark:from-surface-800 dark:to-surface-900"
            :class="{ 'ring-2 ring-primary-500/30': vehicle.id === defaultVehicleId }"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center">
                <div
                  class="mr-3.5 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-cyan-500 shadow-md"
                >
                  <i class="fa fa-car text-lg text-white" aria-hidden="true"></i>
                </div>
                <div>
                  <div class="flex items-center">
                    <h3 class="text-sm font-bold text-surface-800 dark:text-surface-200">
                      {{ vehicle.model }}
                    </h3>
                    <span
                      v-if="vehicle.id === defaultVehicleId"
                      class="ml-2 rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                      >默认</span
                    >
                  </div>
                  <p class="mt-1 text-xs text-surface-500 dark:text-surface-400">
                    {{ vehicle.brand }}
                  </p>
                </div>
              </div>
              <div class="flex items-center space-x-0.5">
                <button
                  class="icon-button p-2"
                  :title="vehicle.id === defaultVehicleId ? '当前默认' : '设为默认'"
                  :aria-label="
                    vehicle.id === defaultVehicleId
                      ? `当前默认车辆 ${vehicle.model}`
                      : `设为默认车辆 ${vehicle.model}`
                  "
                  @click="setDefaultVehicle(vehicle.id)"
                >
                  <i
                    class="fa text-sm transition-colors"
                    :class="
                      vehicle.id === defaultVehicleId
                        ? 'fa-star text-warning-400'
                        : 'fa-star-o text-surface-400 hover:text-primary-500'
                    "
                    aria-hidden="true"
                  ></i>
                </button>
                <button
                  class="icon-button group p-2"
                  title="编辑"
                  :aria-label="`编辑车辆 ${vehicle.model}`"
                  @click="openEditForm(vehicle)"
                >
                  <i
                    class="fa fa-pencil text-sm text-surface-400 transition-colors group-hover:text-primary-500"
                    aria-hidden="true"
                  ></i>
                </button>
                <button
                  class="icon-button group p-2"
                  title="删除"
                  :aria-label="`删除车辆 ${vehicle.model}`"
                  @click="confirmRemove(vehicle.id)"
                >
                  <i
                    class="fa fa-trash-o text-sm text-surface-400 transition-colors group-hover:text-danger-500"
                    aria-hidden="true"
                  ></i>
                </button>
              </div>
            </div>
            <div
              class="mt-3 flex items-center space-x-4 border-t border-surface-100 pt-3 dark:border-surface-700/50"
            >
              <div class="flex items-center">
                <i class="fa fa-plug mr-1.5 text-xs text-primary-500" aria-hidden="true"></i>
                <span class="text-xs text-surface-600 dark:text-surface-300">{{
                  vehicle.connectorType
                }}</span>
              </div>
              <div class="flex items-center">
                <i class="fa fa-bolt mr-1.5 text-xs text-secondary-500" aria-hidden="true"></i>
                <span class="text-xs text-surface-600 dark:text-surface-300"
                  >{{ vehicle.maxPower }}kW</span
                >
              </div>
              <div class="flex items-center">
                <i
                  class="fa fa-battery-three-quarters mr-1.5 text-xs text-secondary-500"
                  aria-hidden="true"
                ></i>
                <span class="text-xs text-surface-600 dark:text-surface-300">{{
                  getChargeTime(vehicle.maxPower)
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="vehicles.length === 0" class="animate-in py-16 text-center">
          <div
            class="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800"
          >
            <i
              class="fa fa-car text-3xl text-surface-300 dark:text-surface-600"
              aria-hidden="true"
            ></i>
          </div>
          <p class="mb-2 font-bold text-surface-800 dark:text-surface-200">暂无车辆</p>
          <p class="mb-5 text-sm text-surface-500 dark:text-surface-400">
            添加您的车辆以获得更好的充电体验
          </p>
          <button class="btn-premium text-sm" @click="openAddForm">
            <i class="fa fa-plus mr-1.5" aria-hidden="true"></i>添加车辆
          </button>
        </div>
      </div>

      <div v-if="showForm" class="space-y-5">
        <div
          class="mb-2 rounded-2xl bg-gradient-to-br from-secondary-50 to-emerald-50 p-5 shadow-soft dark:from-surface-800 dark:to-surface-900"
        >
          <h3 class="text-sm font-bold text-surface-800 dark:text-surface-200">
            {{ isEditing ? '编辑车辆' : '添加新车辆' }}
          </h3>
          <p class="mt-1 text-xs text-surface-500 dark:text-surface-400">
            填写车辆信息以便匹配合适的充电桩
          </p>
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-surface-700 dark:text-surface-300"
            >车辆品牌</label
          >
          <input
            v-model="formData.brand"
            type="text"
            placeholder="例如：特斯拉、比亚迪、蔚来"
            class="input-premium"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-bold text-surface-700 dark:text-surface-300"
            >车辆型号</label
          >
          <input
            v-model="formData.model"
            type="text"
            placeholder="例如：Model 3、汉EV、ES6"
            class="input-premium"
          />
        </div>

        <div>
          <label class="mb-3 block text-sm font-bold text-surface-700 dark:text-surface-300"
            >充电接口类型</label
          >
          <div class="grid grid-cols-2 gap-2.5">
            <button
              v-for="connector in connectorTypes"
              :key="connector.value"
              class="rounded-xl border-2 py-2.5 text-sm font-bold transition-all duration-300 active:scale-95"
              :class="
                formData.connectorType === connector.value
                  ? 'border-primary-500 bg-primary-50 text-primary-600 shadow-glow-primary dark:bg-primary-900/20 dark:text-primary-400'
                  : 'border-surface-200 text-surface-600 hover:border-primary-300 dark:border-surface-700 dark:text-surface-300'
              "
              @click="formData.connectorType = connector.value"
            >
              {{ connector.label }}
            </button>
          </div>
        </div>

        <div>
          <label class="mb-3 block text-sm font-bold text-surface-700 dark:text-surface-300"
            >最大充电功率</label
          >
          <div
            class="rounded-2xl bg-gradient-to-br from-white to-surface-50 p-5 shadow-soft dark:from-surface-800 dark:to-surface-900"
          >
            <div class="mb-3 flex items-center justify-between">
              <span class="text-sm text-surface-500 dark:text-surface-400">最大功率</span>
              <span class="gradient-text text-lg font-black">{{ formData.maxPower }}kW</span>
            </div>
            <input
              v-model.number="formData.maxPower"
              type="range"
              min="50"
              max="350"
              step="10"
              class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-200 accent-primary-500 dark:bg-surface-700"
            />
            <div class="mt-2 flex justify-between text-xs text-surface-400">
              <span>50kW</span>
              <span>200kW</span>
              <span>350kW</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="glass-effect flex-shrink-0 border-t border-surface-200/50 p-4 dark:border-surface-700/50 lg:p-5"
    >
      <button
        v-if="!showForm && vehicles.length > 0"
        id="add-vehicle-btn"
        class="group relative w-full transform overflow-hidden rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500 py-3.5 font-bold text-white shadow-xl shadow-primary-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-primary-500/35 active:translate-y-0"
        @click="openAddForm"
      >
        <div
          class="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]"
        ></div>
        <span class="relative z-10 flex items-center justify-center space-x-2">
          <i class="fa fa-plus" aria-hidden="true"></i>
          <span>添加车辆</span>
        </span>
      </button>
      <div v-if="showForm" class="flex space-x-3">
        <button
          class="flex-1 rounded-2xl border-2 border-surface-200 py-3.5 font-bold text-surface-600 transition-all duration-200 hover:bg-surface-50 active:scale-[0.98] dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
          @click="cancelForm"
        >
          取消
        </button>
        <button
          id="confirm-vehicle-btn"
          class="group relative flex-1 overflow-hidden rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500 py-3.5 font-bold text-white shadow-lg shadow-primary-500/25 transition-all duration-300 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!isFormValid"
          @click="submitForm"
        >
          <span class="relative z-10 flex items-center justify-center space-x-2">
            <i class="fa fa-check" aria-hidden="true"></i>
            <span>{{ isEditing ? '保存修改' : '确认添加' }}</span>
          </span>
        </button>
      </div>
    </div>

    <Transition name="fade">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm"
        @click.self="showDeleteConfirm = false"
      >
        <div
          class="w-full max-w-sm animate-scale-in rounded-2xl bg-white p-6 shadow-2xl dark:bg-surface-800"
        >
          <div class="mb-5 text-center">
            <div
              class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-100 dark:bg-danger-900/30"
            >
              <i class="fa fa-exclamation-triangle text-xl text-danger-500" aria-hidden="true"></i>
            </div>
            <h3 class="text-lg font-bold text-surface-900 dark:text-surface-100">确认删除</h3>
            <p class="mt-2 text-sm text-surface-500 dark:text-surface-400">
              确定要删除这辆车吗？此操作无法撤销。
            </p>
          </div>
          <div class="flex space-x-3">
            <button
              class="flex-1 rounded-xl border-2 border-surface-200 py-3 font-bold text-surface-600 transition-all duration-200 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
              @click="showDeleteConfirm = false"
            >
              取消
            </button>
            <button
              class="flex-1 rounded-xl bg-danger-500 py-3 font-bold text-white transition-colors duration-200 hover:bg-danger-600 active:scale-95"
              @click="removeVehicle"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </PanelShell>
</template>

<script setup>
import PanelShell from '../common/PanelShell.vue'
import { ref, computed, reactive, inject } from 'vue'
import { useUserStore } from '../../store/modules/user'

const emit = defineEmits(['close'])

const userStore = useUserStore()
const showToast = inject('showToast')

const vehicles = computed(() => userStore.vehicles)

const defaultVehicleId = computed(() => {
  return vehicles.value.length > 0 ? vehicles.value[0].id : null
})

const connectorSummary = computed(() => {
  const types = [...new Set(vehicles.value.map((v) => v.connectorType))]
  return types.join(' / ')
})

const maxPower = computed(() => {
  if (vehicles.value.length === 0) return 0
  return Math.max(...vehicles.value.map((v) => v.maxPower))
})

const showForm = ref(false)
const isEditing = ref(false)
const editingVehicleId = ref(null)
const showDeleteConfirm = ref(false)
const removingVehicleId = ref(null)

const formTitle = computed(() => {
  if (!showForm.value) return '我的车辆'
  return isEditing.value ? '编辑车辆' : '添加车辆'
})

const connectorTypes = [
  { label: 'CCS Combo', value: 'CCS Combo' },
  { label: 'GB/T', value: 'GB/T' },
  { label: 'CHAdeMO', value: 'CHAdeMO' },
  { label: 'Type 2', value: 'Type 2' }
]

const formData = reactive({
  brand: '',
  model: '',
  connectorType: 'CCS Combo',
  maxPower: 120
})

const isFormValid = computed(() => {
  return formData.brand.trim() && formData.model.trim()
})

const resetForm = () => {
  formData.brand = ''
  formData.model = ''
  formData.connectorType = 'CCS Combo'
  formData.maxPower = 120
}

const openAddForm = () => {
  isEditing.value = false
  editingVehicleId.value = null
  resetForm()
  showForm.value = true
}

const openEditForm = (vehicle) => {
  isEditing.value = true
  editingVehicleId.value = vehicle.id
  formData.brand = vehicle.brand
  formData.model = vehicle.model
  formData.connectorType = vehicle.connectorType
  formData.maxPower = vehicle.maxPower
  showForm.value = true
}

const cancelForm = () => {
  showForm.value = false
  resetForm()
}

const handleBack = () => {
  if (showForm.value) {
    cancelForm()
  } else {
    emit('close')
  }
}

const submitForm = () => {
  if (!isFormValid.value) return
  const data = {
    brand: formData.brand.trim(),
    model: formData.model.trim(),
    connectorType: formData.connectorType,
    maxPower: formData.maxPower
  }
  if (isEditing.value) {
    userStore.updateVehicle(editingVehicleId.value, data)
    showToast('车辆信息已更新', 'success')
  } else {
    userStore.addVehicle(data)
    showToast('车辆添加成功', 'success')
  }
  showForm.value = false
  resetForm()
}

const setDefaultVehicle = (vehicleId) => {
  if (vehicleId === defaultVehicleId.value) return
  const vehicle = vehicles.value.find((v) => v.id === vehicleId)
  if (vehicle) {
    const idx = userStore.vehicles.indexOf(vehicle)
    userStore.vehicles.splice(idx, 1)
    userStore.vehicles.unshift(vehicle)
    showToast('已设为默认车辆', 'success')
  }
}

const confirmRemove = (vehicleId) => {
  removingVehicleId.value = vehicleId
  showDeleteConfirm.value = true
}

const removeVehicle = () => {
  if (removingVehicleId.value) {
    userStore.removeVehicle(removingVehicleId.value)
    showToast('车辆已删除', 'success')
  }
  showDeleteConfirm.value = false
  removingVehicleId.value = null
}

const getChargeTime = (maxPower) => {
  if (maxPower >= 200) return '快充约30min'
  if (maxPower >= 120) return '快充约45min'
  if (maxPower >= 80) return '约1小时'
  return '约1.5小时'
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
