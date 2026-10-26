import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import UserProfile from '../components/user/UserProfile.vue'
import WalletPanel from '../components/user/WalletPanel.vue'
import VehiclePanel from '../components/user/VehiclePanel.vue'
import SettingsPanel from '../components/user/SettingsPanel.vue'
import CouponsPanel from '../components/user/CouponsPanel.vue'
import FavoritesPanel from '../components/user/FavoritesPanel.vue'
import NotificationsPanel from '../components/user/NotificationsPanel.vue'
import ChargingHistoryPanel from '../components/user/ChargingHistoryPanel.vue'
import HelpCenterPanel from '../components/user/HelpCenterPanel.vue'
import { useUserStore } from '../store/modules/user'
import { useStationsStore } from '../store/modules/stations'
import { useChargingStore } from '../store/modules/charging'
let wrapper
const toast = vi.fn()
const open = (component) => {
  wrapper = mount(component, {
    attachTo: document.body,
    global: { provide: { showToast: toast }, stubs: { teleport: true } }
  })
  return wrapper
}
const button = (text) => wrapper.findAll('button').find((element) => element.text().includes(text))
beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-27T12:00:00'))
  useUserStore().pointsRecords = []
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  vi.useRealTimers()
  document.body.replaceChildren()
})

describe('account destinations and records', () => {
  it('opens point details instead of the wallet and routes all profile actions', async () => {
    open(UserProfile)
    await button('积分明细').trigger('click')
    expect(wrapper.get('.dialog-overlay').text()).toContain('每笔充电订单完成评价可获得 5 积分')
    expect(wrapper.emitted('show-wallet')).toBeUndefined()
    await button('知道了').trigger('click')
    for (const [label, event] of [
      ['钱包余额', 'show-wallet'],
      ['可用优惠券', 'show-coupons'],
      ['充电记录', 'show-charging-history'],
      ['我的车辆', 'show-vehicles'],
      ['我的收藏', 'show-favorites'],
      ['通知中心', 'show-notifications'],
      ['设置与个人资料', 'show-settings'],
      ['帮助中心', 'show-help']
    ]) {
      await button(label).trigger('click')
      expect(wrapper.emitted(event), label).toHaveLength(1)
    }
  })

  it('shows expired coupons separately and emits an actual use destination', async () => {
    useUserStore().coupons = [
      {
        id: 'valid',
        title: '有效券',
        value: 5,
        type: 'discount',
        expiryDate: '2026-10-27',
        minSpend: 50
      },
      { id: 'old', title: '过期券', value: 5, type: 'discount', expiryDate: '2020-01-01' },
      { id: 'used', title: '已用券', value: 5, type: 'discount', used: true }
    ]
    open(CouponsPanel)
    expect(wrapper.text()).toContain('有效券')
    expect(wrapper.text()).not.toContain('过期券')
    await button('去使用').trigger('click')
    expect(wrapper.emitted('use-coupon')).toEqual([['valid']])
    await button('已过期').trigger('click')
    expect(wrapper.text()).toContain('过期券')
    expect(button('去使用')).toBeUndefined()
    await button('可使用').trigger('click')
    vi.setSystemTime(new Date('2026-10-28T00:00:01'))
    document.dispatchEvent(new Event('visibilitychange'))
    await nextTick()
    expect(wrapper.text()).toContain('暂无可用优惠券')
  })

  it('persists points once per session and preferences without exposing dummy switches', async () => {
    const user = useUserStore(),
      before = user.userInfo.points
    user.addReviewPoints('same-order')
    user.addReviewPoints('same-order')
    expect(user.userInfo.points).toBe(before + 5)
    expect(user.pointsRecords).toHaveLength(1)
    open(SettingsPanel)
    expect(wrapper.text()).not.toContain('自动支付')
    expect(wrapper.text()).not.toContain('退出登录')
    await button('编辑昵称').trigger('click')
    await wrapper.get('[aria-label="新昵称"]').setValue('   ')
    expect(button('保存').attributes('disabled')).toBeDefined()
    await wrapper.get('[aria-label="新昵称"]').setValue('  新昵称  ')
    await button('保存').trigger('click')
    expect(user.userInfo.name).toBe('新昵称')
    const switches = wrapper.findAll('[role="switch"]')
    await switches[1].trigger('click')
    expect(user.settings.notificationEnabled).toBe(false)
    const count = user.notifications.length
    user.addNotification({ title: '不应写入' })
    expect(user.notifications).toHaveLength(count)
    const saved = JSON.parse(localStorage.getItem('chargingPreferences'))
    expect(saved.name).toBe('新昵称')
    expect(saved.settings.notificationEnabled).toBe(false)
    setActivePinia(createPinia())
    const restored = useUserStore()
    restored.loadPreferences()
    restored.loadSandboxLedger()
    expect(restored.userInfo.name).toBe('新昵称')
    expect(restored.pointsRecords).toHaveLength(1)
  })

  it('marks notifications read with a working unread filter and persistent count', async () => {
    const user = useUserStore()
    user.notifications = [
      { id: 'n', title: '新订单', content: '订单已结算', read: false, time: '刚刚' }
    ]
    open(NotificationsPanel)
    await button('未读消息').trigger('click')
    await wrapper.get('[aria-label="标为已读 新订单"]').trigger('click')
    expect(wrapper.text()).toContain('没有未读消息')
    expect(button('全部已读').attributes('disabled')).toBeDefined()
    expect(JSON.parse(localStorage.getItem('chargingSandboxLedger')).notifications[0].read).toBe(
      true
    )
  })

  it('does not re-add a favorite removed while confirmation is open', async () => {
    const stations = useStationsStore()
    stations.stations = [
      {
        stationId: 's',
        stationName: '常用站',
        address: '地址',
        isFavorite: true,
        quickAvailableNum: 1,
        quickChargeNum: 1,
        slowAvailableNum: 0,
        slowChargeNum: 0
      }
    ]
    open(FavoritesPanel)
    await wrapper.get('[aria-label="取消收藏 常用站"]').trigger('click')
    expect(wrapper.find('.dialog-overlay').exists()).toBe(true)
    stations.toggleFavorite('s')
    await nextTick()
    expect(wrapper.find('.dialog-overlay').exists()).toBe(false)
    expect(stations.stations[0].isFavorite).toBe(false)
    await button('去找充电站').trigger('click')
    expect(wrapper.emitted('explore')).toHaveLength(1)
  })

  it('filters history, opens details and excludes refunded records from completed totals', async () => {
    useUserStore().chargingHistory = [
      {
        id: 'ok',
        stationName: '完成站',
        stationAddress: '地址',
        energy: '10 kWh',
        cost: 12,
        status: 'completed',
        vehicleModel: 'ID.3',
        duration: '10分钟',
        date: '今天'
      },
      {
        id: 'refund',
        stationName: '退款站',
        energy: '99 kWh',
        cost: 99,
        status: 'refunded',
        vehicleModel: 'ID.3'
      }
    ]
    open(ChargingHistoryPanel)
    expect(wrapper.text()).toContain('10.0')
    expect(wrapper.text()).toContain('¥12.00')
    await button('完成站').trigger('click')
    expect(wrapper.get('.dialog-overlay').text()).toContain('充电明细')
    await button('关闭明细').trigger('click')
    await wrapper.get('[aria-label="搜索充电记录"]').setValue('找不到')
    expect(wrapper.text()).toContain('没有匹配的记录')
    await button('清除筛选').trigger('click')
    await button('已退款').trigger('click')
    expect(button('完成站')).toBeUndefined()
    expect(button('退款站')).toBeDefined()
  })

  it('has accessible help categories, expanding answers and a reset for no results', async () => {
    open(HelpCenterPanel)
    await button('如何开始充电').trigger('click')
    expect(button('如何开始充电').attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('#help-answer-start').exists()).toBe(true)
    await wrapper.get('[aria-label="搜索常见问题"]').setValue('完全找不到')
    expect(wrapper.text()).toContain('未找到相关问题')
    await button('查看全部问题').trigger('click')
    expect(wrapper.get('[aria-label="搜索常见问题"]').element.value).toBe('')
    expect(button('如何开始充电').attributes('aria-expanded')).toBe('false')
  })
})

describe('wallet and vehicle mutation boundaries', () => {
  it('keeps zero-cost charging payments in expenses instead of labeling them income', async () => {
    useUserStore().walletTransactions = [
      { id: 'free', type: 'payment', amount: 0, balance: 0, description: '优惠后零元充电' }
    ]
    open(WalletPanel)
    await button('收入').trigger('click')
    expect(wrapper.text()).toContain('此分类暂无交易')
    await button('支出').trigger('click')
    expect(wrapper.text()).toContain('优惠后零元充电')
    expect(wrapper.text()).toContain('−¥0.00')
  })
  it('focuses vehicle forms, validates specification limits and restores the list action', async () => {
    open(VehiclePanel)
    await button('添加车辆').trigger('click')
    await nextTick()
    expect(document.activeElement).toBe(wrapper.get('#vehicle-brand').element)
    await wrapper.get('#vehicle-brand').setValue('大众')
    await wrapper.get('#vehicle-model').setValue('ID.3')
    await wrapper.get('#vehicle-power').setValue(0.5)
    expect(button('确认添加').attributes('disabled')).toBeDefined()
    await wrapper.get('#vehicle-power').setValue(350)
    await wrapper.get('#vehicle-capacity').setValue(200)
    expect(button('确认添加').attributes('disabled')).toBeUndefined()
    await button('确认添加').trigger('click')
    await nextTick()
    expect(document.activeElement).toBe(wrapper.get('#add-vehicle-btn').element)
  })

  it('dismisses a vehicle deletion confirmation if that vehicle becomes in use', async () => {
    const user = useUserStore(),
      charging = useChargingStore()
    open(VehiclePanel)
    const vehicle = user.vehicles[0]
    await wrapper.get(`[aria-label="删除车辆 ${vehicle.model}"]`).trigger('click')
    expect(wrapper.find('.dialog-overlay').exists()).toBe(true)
    charging.sessionVehicle = { ...vehicle }
    charging.paymentPending = true
    await nextTick()
    expect(wrapper.find('.dialog-overlay').exists()).toBe(false)
    expect(user.vehicles.some((item) => item.id === vehicle.id)).toBe(true)
  })
  it('prevents double recharge/withdraw confirmation and rechecks changed balance', async () => {
    const user = useUserStore()
    user.userInfo.balance = 100
    user.walletTransactions = []
    open(WalletPanel)
    await button('充值').trigger('click')
    const recharge = button('确认充值')
    recharge.element.click()
    recharge.element.click()
    await nextTick()
    expect(user.userInfo.balance).toBe(150)
    expect(user.walletTransactions).toHaveLength(1)
    expect(user.walletTransactions[0].description).toBe('钱包充值')
    await button('提现').trigger('click')
    await wrapper.get('[aria-label="提现金额"]').setValue(80)
    user.userInfo.balance = 20
    await nextTick()
    expect(button('确认提现').attributes('disabled')).toBeDefined()
    await wrapper.get('[aria-label="提现金额"]').setValue(20)
    const withdraw = button('确认提现')
    withdraw.element.click()
    withdraw.element.click()
    await nextTick()
    expect(user.userInfo.balance).toBe(0)
    expect(user.walletTransactions).toHaveLength(2)
    expect(button('提现').attributes('disabled')).toBeDefined()
  })

  it('guards wallet operations at the store boundary as well as the form', () => {
    const user = useUserStore()
    user.userInfo.balance = 10
    user.walletTransactions = []
    expect(() => user.addWalletTransaction({ type: 'withdraw', amount: -11 })).toThrow('余额不足')
    expect(() => user.addWalletTransaction({ type: 'recharge', amount: NaN })).toThrow('无效')
    user.addWalletTransaction({ type: 'recharge', amount: 10, operationId: 'once' })
    user.addWalletTransaction({ type: 'recharge', amount: 10, operationId: 'once' })
    expect(user.userInfo.balance).toBe(20)
    expect(user.walletTransactions).toHaveLength(1)
  })

  it('protects dirty vehicle forms and saves once with correct persistence', async () => {
    const user = useUserStore()
    user.vehicles = []
    open(VehiclePanel)
    await button('添加车辆').trigger('click')
    expect(button('确认添加').attributes('disabled')).toBeDefined()
    await wrapper.get('#vehicle-brand').setValue(' 大众 ')
    await wrapper.get('#vehicle-model').setValue(' ID.3 ')
    await wrapper.get('#back-from-vehicle-panel').trigger('click')
    expect(wrapper.text()).toContain('放弃未保存的修改')
    await button('继续编辑').trigger('click')
    const save = button('确认添加')
    save.element.click()
    save.element.click()
    await nextTick()
    expect(user.vehicles).toHaveLength(1)
    expect(user.vehicles[0].model).toBe('ID.3')
    expect(JSON.parse(localStorage.getItem('chargingLocalVehicles'))).toHaveLength(1)
    expect(wrapper.get('[aria-label="当前默认车辆 ID.3"]').attributes('disabled')).toBeDefined()
  })

  it('disables editing/removal of a vehicle in an unsettled session and handles stale deletion', async () => {
    const user = useUserStore(),
      charging = useChargingStore()
    user.vehicles = [
      {
        id: 'v',
        brand: '大众',
        model: 'ID.3',
        connectorType: 'GB/T',
        maxPower: 60,
        batteryCapacityKwh: 60
      }
    ]
    charging.sessionVehicle = { ...user.vehicles[0] }
    charging.paymentPending = true
    charging.phase = 'finished'
    open(VehiclePanel)
    expect(wrapper.get('[aria-label="编辑车辆 ID.3"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[aria-label="删除车辆 ID.3"]').attributes('disabled')).toBeDefined()
    charging.paymentPending = false
    await nextTick()
    await wrapper.get('[aria-label="删除车辆 ID.3"]').trigger('click')
    user.removeVehicle('v')
    await nextTick()
    expect(wrapper.find('.dialog-overlay').exists()).toBe(false)
    expect(user.vehicles).toHaveLength(0)
  })
})
