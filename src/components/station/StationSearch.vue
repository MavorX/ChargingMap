<template>
  <div class="station-search group relative min-w-0">
    <i
      class="fa fa-search pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-surface-400 group-focus-within:text-primary-500"
      aria-hidden="true"
    ></i>
    <input
      :id="inputId || undefined"
      ref="inputRef"
      v-model="searchQuery"
      type="search"
      :placeholder="t('搜索站点名称或地址')"
      :aria-label="t('搜索充电站名称或地址')"
      class="input-premium h-12 pl-11 pr-11 text-sm"
    />
    <button
      v-if="searchQuery"
      class="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-700"
      :aria-label="t('清除搜索')"
      @click="clearSearch"
    >
      <i class="fa fa-times" aria-hidden="true"></i>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { t } from '../../i18n'
import { useStationList } from '../../composables/useStationList'

defineProps({ inputId: { type: String, default: '' } })
const { searchQuery } = useStationList()
const inputRef = ref(null)
const clearSearch = () => {
  searchQuery.value = ''
  inputRef.value?.focus()
}
</script>
