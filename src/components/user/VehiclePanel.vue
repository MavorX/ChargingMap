<template>
  <AccountPanel
    :title="formTitle"
    :subtitle="showForm ? '保存后用于接口匹配与充电估算' : '管理默认车辆与充电规格'"
    content-id="vehicle-panel"
    back-id="back-from-vehicle-panel"
    :navigation-locked="showForm"
    @close="handleBack"
  >
    <template v-if="!showForm">
      <section v-if="user.vehicles.length" class="account-card">
        <p class="account-caption">已登记车辆</p>
        <p class="mt-1 text-2xl font-bold">
          {{ user.vehicles.length
          }}<span class="ml-1 text-sm font-normal text-surface-500">辆</span>
        </p>
        <p class="account-caption mt-2">第一辆为默认车辆，进入充电设置时优先匹配兼容车辆。</p>
      </section>
      <article v-for="vehicle in user.vehicles" :key="vehicle.id" class="account-card">
        <div class="flex items-start gap-3">
          <span class="account-icon"><i class="fa fa-car" aria-hidden="true"></i></span>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="break-words text-sm font-bold">{{ vehicle.model }}</h3>
              <span
                v-if="vehicle.id === defaultVehicleId"
                class="rounded-md bg-primary-50 px-2 py-1 text-[10px] font-semibold text-primary-700 dark:bg-primary-900/25 dark:text-primary-300"
                >默认</span
              >
            </div>
            <p class="account-caption mt-1">{{ vehicle.brand }}</p>
          </div>
        </div>
        <dl
          class="mt-4 grid grid-cols-2 gap-3 border-t border-surface-100 pt-3 text-xs dark:border-surface-800"
        >
          <div>
            <dt class="account-caption">充电接口</dt>
            <dd class="mt-1 font-semibold">{{ vehicle.connectorType }}</dd>
          </div>
          <div>
            <dt class="account-caption">电池 / 功率</dt>
            <dd class="mt-1 font-semibold">
              {{ vehicle.batteryCapacityKwh ? `${vehicle.batteryCapacityKwh} kWh` : '容量未填' }} /
              {{ vehicle.maxPower ? `${vehicle.maxPower} kW` : '功率未填' }}
            </dd>
          </div>
        </dl>
        <p v-if="isInUse(vehicle.id)" class="account-caption mt-3">
          正在用于当前充电会话，结束并结算后可编辑或删除。
        </p>
        <div class="mt-4 flex flex-wrap items-center gap-2">
          <button
            class="action-secondary min-h-10 flex-1 px-3 py-2 text-xs"
            :disabled="vehicle.id === defaultVehicleId"
            :aria-label="
              vehicle.id === defaultVehicleId
                ? `当前默认车辆 ${vehicle.model}`
                : `设为默认车辆 ${vehicle.model}`
            "
            @click="setDefaultVehicle(vehicle.id)"
          >
            {{ vehicle.id === defaultVehicleId ? '默认车辆' : '设为默认' }}</button
          ><button
            class="action-secondary min-h-10 px-3 py-2 text-xs"
            :disabled="isInUse(vehicle.id)"
            :aria-label="`编辑车辆 ${vehicle.model}`"
            @click="openEditForm(vehicle)"
          >
            编辑</button
          ><button
            class="action-secondary min-h-10 px-3 py-2 text-xs text-danger-600 dark:text-danger-400"
            :disabled="isInUse(vehicle.id)"
            :aria-label="`删除车辆 ${vehicle.model}`"
            @click="confirmRemove(vehicle.id)"
          >
            删除
          </button>
        </div>
      </article>
      <div v-if="!user.vehicles.length" class="account-empty">
        <span class="account-icon"><i class="fa fa-car" aria-hidden="true"></i></span>
        <h3 class="text-sm font-semibold">暂无车辆</h3>
        <p class="account-caption">添加车辆接口与规格，便于选择兼容的充电桩。</p>
      </div>
    </template>
    <form v-else class="space-y-5" @submit.prevent="submitForm">
      <div>
        <label for="vehicle-brand" class="mb-2 block text-sm font-semibold">车辆品牌</label
        ><input
          id="vehicle-brand"
          ref="brandRef"
          v-model="formData.brand"
          maxlength="36"
          class="input-premium"
          placeholder="例如：大众、比亚迪"
          autocomplete="off"
        />
      </div>
      <div>
        <label for="vehicle-model" class="mb-2 block text-sm font-semibold">车辆型号</label
        ><input
          id="vehicle-model"
          v-model="formData.model"
          maxlength="50"
          class="input-premium"
          placeholder="例如：ID.3"
          autocomplete="off"
        />
      </div>
      <section>
        <h3 id="vehicle-connector-label" class="mb-2 text-sm font-semibold">充电接口类型</h3>
        <div class="grid grid-cols-2 gap-2" role="group" aria-labelledby="vehicle-connector-label">
          <button
            v-for="type in connectorTypes"
            :key="type"
            type="button"
            class="choice-card justify-center px-2 py-3 text-sm"
            :aria-pressed="formData.connectorType === type"
            @click="formData.connectorType = type"
          >
            {{ type }}
          </button>
        </div>
      </section>
      <div>
        <label for="vehicle-capacity" class="mb-2 block text-sm font-semibold"
          >电池容量（kWh，可选）</label
        ><input
          id="vehicle-capacity"
          v-model.number="formData.batteryCapacityKwh"
          type="number"
          min="1"
          max="200"
          step="any"
          class="input-premium"
          placeholder="1–200 kWh"
        />
      </div>
      <div>
        <label for="vehicle-power" class="mb-2 block text-sm font-semibold"
          >最大充电功率（kW，可选）</label
        ><input
          id="vehicle-power"
          v-model.number="formData.maxPower"
          aria-label="车辆最大充电功率 kW"
          type="number"
          min="1"
          max="350"
          step="any"
          class="input-premium"
          placeholder="1–350 kW"
        />
      </div>
      <p class="account-caption">容量或功率可留空保存，但需补全后才能用于充电演示。</p>
      <p v-if="formError" class="text-xs text-danger-600 dark:text-danger-400" role="status">
        {{ formError }}
      </p>
      <button type="submit" class="sr-only" tabindex="-1">保存车辆</button>
    </form>
    <template #footer
      ><button
        v-if="!showForm"
        id="add-vehicle-btn"
        ref="addVehicleRef"
        class="action-primary"
        @click="openAddForm"
      >
        <i class="fa fa-plus" aria-hidden="true"></i>添加车辆
      </button>
      <div v-else class="flex gap-3">
        <button class="action-secondary flex-1" @click="handleBack">取消</button
        ><button
          id="confirm-vehicle-btn"
          class="action-primary flex-1"
          :disabled="!!formError"
          @click="submitForm"
        >
          {{ isEditing ? '保存修改' : '确认添加' }}
        </button>
      </div></template
    >
    <template #dialogs
      ><DialogModal
        v-if="showDeleteConfirm"
        title="确认删除车辆"
        role="alertdialog"
        @close="showDeleteConfirm = false"
        ><p class="mb-5 text-sm leading-6">
          确定删除 {{ deletingVehicle?.model || '这辆车' }}？历史订单与账单不会被删除。
        </p>
        <div class="flex gap-3">
          <button class="action-secondary flex-1" @click="showDeleteConfirm = false">取消</button
          ><button
            class="action-primary flex-1 bg-danger-600 hover:bg-danger-700"
            :disabled="!deletingVehicle || isInUse(removingVehicleId)"
            @click="removeVehicle"
          >
            删除
          </button>
        </div></DialogModal
      ><DialogModal
        v-if="showDiscard"
        title="放弃未保存的修改？"
        role="alertdialog"
        @close="showDiscard = false"
        ><p class="mb-5 text-sm leading-6">当前车辆信息尚未保存，返回后这些修改将丢失。</p>
        <div class="flex gap-3">
          <button class="action-secondary flex-1" @click="showDiscard = false">继续编辑</button
          ><button class="action-primary flex-1" @click="discardForm">放弃修改</button>
        </div></DialogModal
      ></template
    >
  </AccountPanel>
</template>
<script setup>
import { computed, inject, nextTick, reactive, ref, watch } from 'vue'
import AccountPanel from './AccountPanel.vue'
import DialogModal from '../common/DialogModal.vue'
import { useUserStore } from '../../store/modules/user'
import { useChargingStore } from '../../store/modules/charging'
const emit = defineEmits(['close'])
const user = useUserStore(),
  charging = useChargingStore(),
  toast = inject('showToast')
const showForm = ref(false),
  isEditing = ref(false),
  editingVehicleId = ref(null),
  removingVehicleId = ref(null),
  showDeleteConfirm = ref(false),
  showDiscard = ref(false)
const connectorTypes = ['CCS Combo', 'GB/T', 'CHAdeMO', 'Type 2']
const blankForm = () => ({
  brand: '',
  model: '',
  connectorType: 'GB/T',
  maxPower: null,
  batteryCapacityKwh: null
})
const formData = reactive(blankForm()),
  baseline = ref('')
const brandRef = ref(null)
const addVehicleRef = ref(null)
const focusForm = () => nextTick(() => brandRef.value?.focus({ preventScroll: true }))
const formTitle = computed(() =>
  !showForm.value ? '我的车辆' : isEditing.value ? '编辑车辆' : '添加车辆'
)
const defaultVehicleId = computed(() => user.vehicles[0]?.id)
const deletingVehicle = computed(() =>
  user.vehicles.find((vehicle) => vehicle.id === removingVehicleId.value)
)
const isInUse = (id) =>
  ((charging.isCharging || charging.paymentPending) && charging.sessionVehicle?.id === id) ||
  (!!charging.preparation &&
    !['idle', 'paid', 'finished', 'interrupted'].includes(charging.phase) &&
    charging.preparation.vehicle.id === id)
const formError = computed(() => {
  if (isEditing.value && !user.vehicles.some((vehicle) => vehicle.id === editingVehicleId.value))
    return '这辆车已被移除，请返回车辆列表'
  if (isEditing.value && isInUse(editingVehicleId.value)) return '车辆正在用于充电，暂不能修改'
  if (!formData.brand.trim() || !formData.model.trim()) return '请填写车辆品牌与型号'
  if (formData.brand.trim().length > 36 || formData.model.trim().length > 50)
    return '品牌或型号过长'
  if (
    ![null, ''].includes(formData.maxPower) &&
    (!Number.isFinite(formData.maxPower) || formData.maxPower < 1 || formData.maxPower > 350)
  )
    return '最大功率应为 1–350 kW'
  if (
    ![null, ''].includes(formData.batteryCapacityKwh) &&
    (!Number.isFinite(formData.batteryCapacityKwh) ||
      formData.batteryCapacityKwh < 1 ||
      formData.batteryCapacityKwh > 200)
  )
    return '电池容量应为 1–200 kWh'
  return ''
})
const openAddForm = () => {
  isEditing.value = false
  editingVehicleId.value = null
  Object.assign(formData, blankForm())
  baseline.value = JSON.stringify(formData)
  showForm.value = true
  focusForm()
}
const openEditForm = (vehicle) => {
  if (isInUse(vehicle.id)) return
  isEditing.value = true
  editingVehicleId.value = vehicle.id
  Object.assign(formData, {
    brand: vehicle.brand,
    model: vehicle.model,
    connectorType: vehicle.connectorType,
    maxPower: vehicle.maxPower ?? null,
    batteryCapacityKwh: vehicle.batteryCapacityKwh ?? null
  })
  baseline.value = JSON.stringify(formData)
  showForm.value = true
  focusForm()
}
const discardForm = () => {
  showDiscard.value = false
  showForm.value = false
  Object.assign(formData, blankForm())
  nextTick(() => addVehicleRef.value?.focus({ preventScroll: true }))
}
const handleBack = () => {
  if (showForm.value) {
    if (JSON.stringify(formData) !== baseline.value) showDiscard.value = true
    else discardForm()
  } else emit('close')
}
const submitForm = () => {
  if (!showForm.value || formError.value) return
  const data = {
    ...formData,
    brand: formData.brand.trim(),
    model: formData.model.trim(),
    maxPower: formData.maxPower || null,
    batteryCapacityKwh: formData.batteryCapacityKwh || null
  }
  if (isEditing.value) {
    if (!user.updateVehicle(editingVehicleId.value, data)) {
      toast('车辆已不存在，请返回列表', 'warning')
      return
    }
  } else user.addVehicle(data)
  toast(isEditing.value ? '车辆信息已更新' : '车辆添加成功', 'success')
  discardForm()
}
const setDefaultVehicle = (id) => {
  if (id === defaultVehicleId.value) return
  const index = user.vehicles.findIndex((vehicle) => vehicle.id === id)
  if (index >= 0) {
    const [vehicle] = user.vehicles.splice(index, 1)
    user.vehicles.unshift(vehicle)
    user.persistVehicles()
    toast('已设为默认车辆', 'success')
  }
}
const confirmRemove = (id) => {
  if (isInUse(id)) return
  removingVehicleId.value = id
  showDeleteConfirm.value = true
}
const removeVehicle = () => {
  if (!showDeleteConfirm.value || !deletingVehicle.value || isInUse(removingVehicleId.value)) return
  user.removeVehicle(removingVehicleId.value)
  showDeleteConfirm.value = false
  removingVehicleId.value = null
  toast('车辆已删除', 'success')
}
watch(
  () => !deletingVehicle.value || isInUse(removingVehicleId.value),
  (unavailable) => {
    if (unavailable) showDeleteConfirm.value = false
  }
)
</script>
