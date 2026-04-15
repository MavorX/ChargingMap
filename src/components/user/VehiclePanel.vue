<template>
  <div class="panel-overlay">
    <div class="panel-backdrop" @click="handleBack"></div>
    <div id="vehicle-panel" class="panel-content">
    <div class="glass-effect border-b border-surface-200/50 dark:border-surface-700/50 p-4 flex justify-between items-center flex-shrink-0 z-10">
      <button id="back-from-vehicle-panel" class="icon-button" @click="handleBack">
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100">{{ formTitle }}</h2>
      <button v-if="!showForm && vehicles.length > 0" class="px-3 py-1.5 rounded-xl text-primary-600 dark:text-primary-400 font-semibold text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200 active:scale-95" @click="openAddForm">
        <i class="fa fa-plus mr-1" aria-hidden="true"></i>添加
      </button>
      <div v-else-if="!showForm" class="w-8"></div>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div v-if="!showForm">
        <div v-if="vehicles.length > 0" class="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-5 mb-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-surface-500 dark:text-surface-400">已登记车辆</p>
              <p class="text-2xl font-black gradient-text mt-1">{{ vehicles.length }}<span class="text-sm font-normal text-surface-500 ml-1">辆</span></p>
            </div>
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center shadow-md">
              <i class="fa fa-car text-white text-2xl" aria-hidden="true"></i>
            </div>
          </div>
          <div class="flex items-center mt-3 pt-3 border-t border-primary-100 dark:border-surface-700/50 space-x-4">
            <div class="flex items-center">
              <i class="fa fa-plug text-primary-500 text-xs mr-1.5" aria-hidden="true"></i>
              <span class="text-xs text-surface-600 dark:text-surface-300">{{ connectorSummary }}</span>
            </div>
            <div class="flex items-center">
              <i class="fa fa-bolt text-secondary-500 text-xs mr-1.5" aria-hidden="true"></i>
              <span class="text-xs text-surface-600 dark:text-surface-300">最高{{ maxPower }}kW</span>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <div v-for="vehicle in vehicles" :key="vehicle.id"
            class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-4 transition-all hover:shadow-soft-md"
            :class="{ 'ring-2 ring-primary-500/30': vehicle.id === defaultVehicleId }">
            <div class="flex items-start justify-between">
              <div class="flex items-center">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-cyan-500 flex items-center justify-center mr-3.5 shadow-md flex-shrink-0">
                  <i class="fa fa-car text-white text-lg" aria-hidden="true"></i>
                </div>
                <div>
                  <div class="flex items-center">
                    <h3 class="font-bold text-sm text-surface-800 dark:text-surface-200">{{ vehicle.model }}</h3>
                    <span v-if="vehicle.id === defaultVehicleId" class="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">默认</span>
                  </div>
                  <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">{{ vehicle.brand }}</p>
                </div>
              </div>
              <div class="flex items-center space-x-0.5">
                <button class="icon-button p-2" @click="setDefaultVehicle(vehicle.id)" :title="vehicle.id === defaultVehicleId ? '当前默认' : '设为默认'">
                  <i class="fa text-sm transition-colors" :class="vehicle.id === defaultVehicleId ? 'fa-star text-warning-400' : 'fa-star-o text-surface-400 hover:text-primary-500'" aria-hidden="true"></i>
                </button>
                <button class="icon-button p-2 group" @click="openEditForm(vehicle)" title="编辑">
                  <i class="fa fa-pencil text-surface-400 group-hover:text-primary-500 transition-colors text-sm" aria-hidden="true"></i>
                </button>
                <button class="icon-button p-2 group" @click="confirmRemove(vehicle.id)" title="删除">
                  <i class="fa fa-trash-o text-surface-400 group-hover:text-danger-500 transition-colors text-sm" aria-hidden="true"></i>
                </button>
              </div>
            </div>
            <div class="flex items-center mt-3 pt-3 border-t border-surface-100 dark:border-surface-700/50 space-x-4">
              <div class="flex items-center">
                <i class="fa fa-plug text-primary-500 text-xs mr-1.5" aria-hidden="true"></i>
                <span class="text-xs text-surface-600 dark:text-surface-300">{{ vehicle.connectorType }}</span>
              </div>
              <div class="flex items-center">
                <i class="fa fa-bolt text-secondary-500 text-xs mr-1.5" aria-hidden="true"></i>
                <span class="text-xs text-surface-600 dark:text-surface-300">{{ vehicle.maxPower }}kW</span>
              </div>
              <div class="flex items-center">
                <i class="fa fa-battery-three-quarters text-secondary-500 text-xs mr-1.5" aria-hidden="true"></i>
                <span class="text-xs text-surface-600 dark:text-surface-300">{{ getChargeTime(vehicle.maxPower) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="vehicles.length === 0" class="text-center py-16 animate-in">
          <div class="w-20 h-20 mx-auto mb-5 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
            <i class="fa fa-car text-surface-300 dark:text-surface-600 text-3xl" aria-hidden="true"></i>
          </div>
          <p class="font-bold text-surface-800 dark:text-surface-200 mb-2">暂无车辆</p>
          <p class="text-sm text-surface-500 dark:text-surface-400 mb-5">添加您的车辆以获得更好的充电体验</p>
          <button class="btn-premium text-sm" @click="openAddForm">
            <i class="fa fa-plus mr-1.5" aria-hidden="true"></i>添加车辆
          </button>
        </div>
      </div>

      <div v-if="showForm" class="space-y-5">
        <div class="bg-gradient-to-br from-secondary-50 to-emerald-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-5 mb-2">
          <h3 class="font-bold text-sm text-surface-800 dark:text-surface-200">{{ isEditing ? '编辑车辆' : '添加新车辆' }}</h3>
          <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">填写车辆信息以便匹配合适的充电桩</p>
        </div>

        <div>
          <label class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-2">车辆品牌</label>
          <input type="text" v-model="formData.brand" placeholder="例如：特斯拉、比亚迪、蔚来"
            class="input-premium">
        </div>

        <div>
          <label class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-2">车辆型号</label>
          <input type="text" v-model="formData.model" placeholder="例如：Model 3、汉EV、ES6"
            class="input-premium">
        </div>

        <div>
          <label class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-3">充电接口类型</label>
          <div class="grid grid-cols-2 gap-2.5">
            <button v-for="connector in connectorTypes" :key="connector.value"
              class="py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-300 active:scale-95"
              :class="formData.connectorType === connector.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-glow-primary' : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-primary-300'"
              @click="formData.connectorType = connector.value">
              {{ connector.label }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-3">最大充电功率</label>
          <div class="bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl shadow-soft p-5">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm text-surface-500 dark:text-surface-400">最大功率</span>
              <span class="text-lg font-black gradient-text">{{ formData.maxPower }}kW</span>
            </div>
            <input type="range" min="50" max="350" step="10" v-model.number="formData.maxPower"
              class="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-500">
            <div class="flex justify-between text-xs text-surface-400 mt-2">
              <span>50kW</span>
              <span>200kW</span>
              <span>350kW</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-shrink-0 glass-effect border-t border-surface-200/50 dark:border-surface-700/50 p-4 lg:p-5">
      <button v-if="!showForm && vehicles.length > 0" id="add-vehicle-btn"
        class="group w-full relative overflow-hidden bg-gradient-to-r from-primary-500 to-accent-500 text-white py-3.5 rounded-2xl font-bold shadow-xl shadow-primary-500/25 hover:shadow-2xl hover:shadow-primary-500/35 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
        @click="openAddForm">
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        <span class="relative z-10 flex items-center justify-center space-x-2">
          <i class="fa fa-plus" aria-hidden="true"></i>
          <span>添加车辆</span>
        </span>
      </button>
      <div v-if="showForm" class="flex space-x-3">
        <button class="flex-1 py-3.5 rounded-2xl font-bold border-2 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-all duration-200 active:scale-[0.98]" @click="cancelForm">
          取消
        </button>
        <button id="confirm-vehicle-btn"
          class="flex-1 group relative overflow-hidden bg-gradient-to-r from-primary-500 to-accent-500 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          @click="submitForm" :disabled="!isFormValid">
          <span class="relative z-10 flex items-center justify-center space-x-2">
            <i class="fa fa-check" aria-hidden="true"></i>
            <span>{{ isEditing ? '保存修改' : '确认添加' }}</span>
          </span>
        </button>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-6" @click.self="showDeleteConfirm = false">
        <div class="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
          <div class="text-center mb-5">
            <div class="w-14 h-14 rounded-2xl bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center mx-auto mb-3">
              <i class="fa fa-exclamation-triangle text-danger-500 text-xl" aria-hidden="true"></i>
            </div>
            <h3 class="font-bold text-lg text-surface-900 dark:text-surface-100">确认删除</h3>
            <p class="text-sm text-surface-500 dark:text-surface-400 mt-2">确定要删除这辆车吗？此操作无法撤销。</p>
          </div>
          <div class="flex space-x-3">
            <button class="flex-1 py-3 rounded-xl font-bold border-2 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-all duration-200" @click="showDeleteConfirm = false">
              取消
            </button>
            <button class="flex-1 py-3 rounded-xl font-bold bg-danger-500 text-white hover:bg-danger-600 transition-colors duration-200 active:scale-95" @click="removeVehicle">
              删除
            </button>
          </div>
        </div>
      </div>
    </Transition>
      </div>
</div>
</template>

<script setup>
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
  const types = [...new Set(vehicles.value.map(v => v.connectorType))]
  return types.join(' / ')
})

const maxPower = computed(() => {
  if (vehicles.value.length === 0) return 0
  return Math.max(...vehicles.value.map(v => v.maxPower))
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
  const vehicle = vehicles.value.find(v => v.id === vehicleId)
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
