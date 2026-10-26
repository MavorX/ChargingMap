<template>
  <AccountPanel title="设置" subtitle="个人资料与本地偏好" @close="emit('close')">
    <section><h3 class="account-heading">个人资料</h3><div class="account-card flex items-center gap-3"><span class="account-icon"><i class="fa fa-user-o" aria-hidden="true"></i></span><div class="min-w-0 flex-1"><p class="break-words text-sm font-semibold">{{ user.userInfo.name }}</p><p class="account-caption">{{ user.userInfo.level }} · 仅保存在此浏览器</p></div><button class="action-secondary min-h-10 px-3 py-2 text-xs" @click="openName">编辑昵称</button></div></section>
    <section><h3 class="account-heading">外观与提醒</h3><div class="account-group"><div v-for="item in preferences" :key="item.key" class="flex items-center gap-4 p-4"><div class="min-w-0 flex-1"><label :id="`settings-${item.key}`" class="block text-sm font-semibold">{{ item.label }}</label><p class="account-caption mt-1">{{ item.description }}</p></div><ToggleSwitch :label-id="`settings-${item.key}`" :model-value="item.key === 'theme' ? user.isDarkMode : user.settings[item.key]" @update:model-value="value => changePreference(item.key, value)" /></div></div><p class="account-caption mt-2">仅提供页面内提醒，不申请系统推送权限。订单需要手动确认支付。</p></section>
    <section><h3 class="account-heading">本地数据与项目</h3><div class="account-group"><button class="account-row" @click="clearCache"><span class="account-icon"><i class="fa fa-refresh" aria-hidden="true"></i></span><span class="min-w-0 flex-1"><strong class="block text-sm">清除站点请求缓存</strong><span class="account-caption">不删除车辆、余额、订单或收藏</span></span><i class="fa fa-angle-right text-surface-400" aria-hidden="true"></i></button><button class="account-row" @click="showAbout = true"><span class="account-icon"><i class="fa fa-info-circle" aria-hidden="true"></i></span><span class="flex-1 text-sm font-semibold">关于项目</span><i class="fa fa-angle-right text-surface-400" aria-hidden="true"></i></button></div></section>
    <p class="account-caption text-center">本地演示账户，无需登录或退出。清理浏览器数据会丢失本地记录。</p>
    <template #dialogs><DialogModal v-if="showName" title="修改昵称" @close="showName = false"><label for="account-name" class="mb-2 block text-sm font-semibold">昵称</label><input id="account-name" v-model="editName" maxlength="24" type="text" aria-label="新昵称" class="input-premium" @keydown.enter.prevent="saveName" /><p class="account-caption mt-2">1–24 个字符，前后空格会自动去除。</p><div class="mt-5 flex gap-3"><button class="action-secondary flex-1" @click="showName = false">取消</button><button class="action-primary flex-1" :disabled="!canSaveName" @click="saveName">保存</button></div></DialogModal><DialogModal v-if="showAbout" title="关于项目" @close="showAbout = false"><span class="account-icon mb-4"><i class="fa fa-bolt" aria-hidden="true"></i></span><h3 class="text-lg font-bold">VWer Charging</h3><p class="account-caption mt-3">充电服务演示项目：使用假设站点，演示选桩、接枪、检测、充电、拔枪与结算，不连接真实设备或支付渠道。</p><button class="action-primary mt-5" @click="showAbout = false">知道了</button></DialogModal></template>
  </AccountPanel>
</template>
<script setup>
import { computed, inject, ref } from 'vue'
import AccountPanel from './AccountPanel.vue'
import DialogModal from '../common/DialogModal.vue'
import ToggleSwitch from '../common/ToggleSwitch.vue'
import { useUserStore } from '../../store/modules/user'
import { clearStationDetailCache } from '../../services/api'
const emit = defineEmits(['close'])
const user = useUserStore(), toast = inject('showToast')
const showName = ref(false), showAbout = ref(false), editName = ref('')
const canSaveName = computed(() => editName.value.trim().length > 0 && editName.value.trim().length <= 24 && editName.value.trim() !== user.userInfo.name)
const preferences = [ {key:'theme',label:'深色模式',description:'地图与页面同步切换，自动保存'}, {key:'notificationEnabled',label:'消息通知',description:'将新订单消息写入通知中心'}, {key:'chargingReminder',label:'充电结束提示',description:'充电停止时显示页面内提示'} ]
const changePreference = (key, value) => { if (key === 'theme') user.toggleTheme(); else user.updateSettings({[key]:value}) }
const openName = () => { editName.value = user.userInfo.name; showName.value = true }
const saveName = () => { if (!showName.value || !canSaveName.value) return; try { user.updateName(editName.value); showName.value = false; toast('昵称已保存','success') } catch(error) { toast(error.message,'warning') } }
const clearCache = () => { clearStationDetailCache(); toast('站点请求缓存已清除，个人数据不受影响','success') }
</script>
