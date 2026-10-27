import { defineStore } from 'pinia'
import { useStationsStore } from './stations'
import { useUserStore } from './user'
import { formatDuration, formatPrice } from '../../utils/format'
import { createRecordId } from '../../utils/id'
import { createSandboxCharger } from '../../services/chargerGateway'
import { validateChargingSetup, meterAt } from '../../utils/chargingModel'
import { couponState } from '../../utils/coupons'

export const SERVICE_FEE_RATE = 0.1

const toAmount = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

// Single source of truth for coupon availability: used, expired and below the
// minimum spend are all unusable. Invalid expiry dates stay permissive so legacy
// coupons without a trustworthy date do not silently disappear.
export const isCouponUsable = (coupon, totalAmount, now = new Date()) => {
  if (!coupon || couponState(coupon, now) !== 'available') return false

  return toAmount(totalAmount) >= toAmount(coupon.minSpend)
}

const couponDiscountFor = (coupon, totalAmount, now = new Date()) => {
  if (!isCouponUsable(coupon, totalAmount, now)) return 0
  if (coupon.type === 'percent') {
    return Math.min(
      Math.round(totalAmount * (1 - toAmount(coupon.percent) / 100) * 100) / 100,
      toAmount(coupon.value)
    )
  }
  if (coupon.type === 'discount' || coupon.type === 'free') {
    return toAmount(coupon.value)
  }
  return 0
}

export function calculatePaymentAmounts({ energy = 0, price = 0, coupon = null } = {}) {
  const roundAmount = (amount) => Math.round((amount + Number.EPSILON) * 100) / 100
  const chargeCost = roundAmount(Math.max(0, toAmount(energy)) * Math.max(0, toAmount(price)))
  const serviceFee = roundAmount(chargeCost * SERVICE_FEE_RATE)
  const totalAmount = roundAmount(chargeCost + serviceFee)
  const couponDiscount = Math.min(
    totalAmount,
    Math.max(0, roundAmount(couponDiscountFor(coupon, totalAmount)))
  )

  return {
    chargeCost,
    serviceFee,
    totalAmount,
    couponDiscount,
    finalAmount: roundAmount(Math.max(0, totalAmount - couponDiscount))
  }
}

const DEFAULT_SETTINGS = {
  targetBattery: 80,
  notifyFull: true,
  notifyCost: false,
  costThreshold: 50,
  smartCharge: false
}

const sanitizeSettings = (settings) => ({
  ...DEFAULT_SETTINGS,
  targetBattery:
    typeof settings.targetBattery === 'number' && Number.isFinite(settings.targetBattery)
      ? Math.max(50, Math.min(100, Math.round(settings.targetBattery / 5) * 5))
      : 80,
  notifyFull: typeof settings.notifyFull === 'boolean' ? settings.notifyFull : true,
  notifyCost: typeof settings.notifyCost === 'boolean' ? settings.notifyCost : false,
  costThreshold:
    typeof settings.costThreshold === 'number' && Number.isFinite(settings.costThreshold)
      ? Math.max(10, Math.min(500, settings.costThreshold))
      : 50,
  // No scheduling service exists yet: never promise deferred charging.
  smartCharge: false
})

// Each store owns its virtual device and clock, outside serializable state.
const runtimes = new WeakMap()
// Pinia devtools wraps every action in a fresh Proxy. Key by stable state,
// not action `this`, or a prepared device disappears at the next button click.
const devices = {
  get: (store) => runtimes.get(store.$state),
  set: (store, runtime) => runtimes.set(store.$state, runtime),
  delete: (store) => runtimes.delete(store.$state)
}

export const useChargingStore = defineStore('charging', {
  state: () => ({
    isCharging: false,
    phase: 'idle',
    failure: '',
    preparation: null,
    setupDraft: null,
    plugConnected: false,
    verifiedCode: false,
    sessionVehicle: null,
    sessionModel: null,
    sessionId: null,
    stopReason: null,
    autoStopRequested: false,
    sessionStation: null,
    sessionConnector: null,
    paymentPending: false,
    lastReceipt: null,
    preferredCouponId: null,
    reviewSubmitted: false,
    chargingData: {
      duration: 0,
      energy: 0,
      cost: 0,
      speed: 0,
      battery: null
    },
    settings: { ...DEFAULT_SETTINGS }
  }),

  actions: {
    prepareSession({
      connectorId,
      vehicleId,
      initialBattery,
      targetBattery,
      clockScale = 1,
      scenario = 'normal'
    }) {
      if (
        this.isCharging ||
        this.paymentPending ||
        ['checking', 'starting', 'stopping'].includes(this.phase)
      )
        throw new Error('请先处理当前测试会话')
      if (this.plugConnected) throw new Error('请先拔出原测试枪，再更换准备单')
      if (!['normal', 'offline', 'occupied', 'start_failure', 'stop_failure'].includes(scenario))
        throw new Error('未知测试工况')
      const station = useStationsStore().currentStation
      const connector = [
        ...(station?.details?.fastConnectors || []),
        ...(station?.details?.slowConnectors || [])
      ].find((item) => item.id === connectorId)
      const vehicle = useUserStore().vehicles.find((item) => item.id === vehicleId)
      const model = validateChargingSetup({
        station,
        connector,
        vehicle,
        initialBattery,
        targetBattery,
        clockScale
      })
      this.sessionId = createRecordId()
      this.preparation = {
        id: this.sessionId,
        station: {
          stationId: station.stationId,
          stationName: station.stationName,
          address: station.address,
          currentPrice: station.currentPrice,
          dataSource: 'sandbox'
        },
        connector: { ...connector },
        vehicle: { ...vehicle },
        model
      }
      devices.set(this, {
        device: createSandboxCharger({ connector, scenario }),
        sourceStation: station,
        interval: null,
        startedAt: 0
      })
      this.phase = 'awaiting_connection'
      this.failure = ''
      this.plugConnected = false
      this.verifiedCode = false
    },
    connectPlug() {
      if (!['awaiting_connection', 'plugged', 'fault'].includes(this.phase) || !this.preparation)
        throw new Error('请先准备一个测试会话')
      devices.get(this).device.connect()
      this.plugConnected = true
      this.phase = 'plugged'
      this.failure = ''
    },
    identifyConnector(code) {
      if (
        !this.preparation ||
        !['awaiting_connection', 'plugged', 'fault', 'ready'].includes(this.phase)
      )
        throw new Error('当前不能识别充电枪')
      this.verifiedCode = String(code || '').trim() === this.preparation.connector.id
      if (this.phase === 'ready') this.phase = 'plugged'
      if (!this.verifiedCode)
        throw new Error('枪码不匹配，请核对车位旁实际连接的那一把枪；不会自动切换到其他枪')
    },
    async checkReadiness() {
      if (
        !this.plugConnected ||
        !this.verifiedCode ||
        !['plugged', 'fault', 'ready'].includes(this.phase)
      )
        throw new Error('必须先连接测试枪，并核对对应枪码')
      const preparation = this.preparation
      const runtime = devices.get(this)
      this.phase = 'checking'
      this.failure = ''
      try {
        this.validatePreparation()
        await runtime.device.inspect()
        if (this.preparation !== preparation || devices.get(this) !== runtime)
          throw new Error('连接流程已取消，请重新连接')
        this.validatePreparation()
        this.phase = 'ready'
      } catch (error) {
        if (devices.get(this) === runtime) {
          this.phase = 'fault'
          this.failure = error.message
        }
        throw error
      }
    },
    validatePreparation() {
      const prepared = this.preparation
      const station = useStationsStore().currentStation
      if (!prepared || station?.stationId !== prepared.station.stationId)
        throw new Error('站点已变化，请返回重新生成测试准备单')
      const vehicle = useUserStore().vehicles.find((item) => item.id === prepared.vehicle.id)
      const connector = [
        ...(station.details?.fastConnectors || []),
        ...(station.details?.slowConnectors || [])
      ].find((item) => item.id === prepared.connector.id)
      const model = validateChargingSetup({ station, connector, vehicle, ...prepared.model })
      if (
        JSON.stringify(model) !== JSON.stringify(prepared.model) ||
        vehicle.connectorType !== prepared.vehicle.connectorType ||
        station.currentPrice !== prepared.station.currentPrice
      )
        throw new Error('车辆规格、测试枪或费率已变化，请重新准备')
    },
    async startCharging() {
      if (this.isCharging) return
      if (this.paymentPending) throw new Error('请先结算上一笔测试订单')
      if (this.phase !== 'ready' || !this.plugConnected || !this.verifiedCode)
        throw new Error('设备尚未就绪：选择站点或勾选接枪不能直接开始充电')
      const preparation = this.preparation
      const runtime = devices.get(this)
      this.validatePreparation()
      this.phase = 'starting'
      this.failure = ''
      try {
        const acknowledgement = await runtime.device.start()
        if (
          !acknowledgement.charging ||
          this.preparation !== preparation ||
          devices.get(this) !== runtime ||
          !this.verifiedCode ||
          !this.plugConnected
        )
          throw new Error('未收到有效的设备启动确认')
        this.validatePreparation()
        this.sessionStation = { ...preparation.station }
        this.sessionConnector = { ...preparation.connector }
        this.sessionVehicle = { ...preparation.vehicle }
        this.sessionModel = { ...preparation.model }
        const source = runtime.sourceStation
        const fast = source.details?.fastConnectors || []
        const slow = source.details?.slowConnectors || []
        const connected = [...fast, ...slow].find(
          (connector) => connector.id === preparation.connector.id
        )
        const countKey = fast.includes(connected) ? 'quickAvailableNum' : 'slowAvailableNum'
        if (connected) {
          connected.status = 3
          const counted = Number.isFinite(source[countKey]) && source[countKey] > 0
          if (counted) source[countKey]--
          runtime.releaseConnector = () => {
            if (connected.status === 3) {
              connected.status = 1
              if (counted) source[countKey]++
            }
            runtime.releaseConnector = null
          }
        }
        this.lastReceipt = null
        this.reviewSubmitted = false
        this.autoStopRequested = false
        this.stopReason = null
        runtime.startedAt = acknowledgement.acknowledgedAt
        this.isCharging = true
        this.phase = 'charging'
        this.chargingData = {
          duration: 0,
          energy: 0,
          cost: 0,
          speed: this.sessionModel.powerKw,
          battery: this.sessionModel.initialBattery,
          elapsedRealSeconds: 0
        }
        this.persistSession()
        runtime.interval = setInterval(() => {
          this.updateMeter()
          if (
            this.phase === 'charging' &&
            !this.autoStopRequested &&
            this.chargingData.battery >= this.sessionModel.targetBattery
          ) {
            this.autoStopRequested = true
            this.stopCharging('target').catch(() => {})
          }
        }, 1000)
      } catch (error) {
        runtime?.device.loseConnection()
        if (devices.get(this) === runtime) {
          this.phase = 'fault'
          this.failure = error.message
        }
        throw error
      }
    },
    updateMeter() {
      if (!this.isCharging || !this.sessionModel) return
      const data = meterAt(this.sessionModel, (Date.now() - devices.get(this).startedAt) / 1000)
      this.chargingData = {
        ...data,
        cost: calculatePaymentAmounts({
          energy: data.energy,
          price: this.sessionStation.currentPrice
        }).totalAmount
      }
      this.persistSession()
    },
    async stopCharging(reason = 'manual') {
      if (!this.isCharging || this.phase === 'stopping') return
      this.phase = 'stopping'
      this.failure = ''
      const runtime = devices.get(this)
      try {
        const acknowledgement = await runtime.device.stop()
        if (devices.get(this) !== runtime || !this.isCharging) return
        if (acknowledgement.charging !== false) throw new Error('设备未确认停止')
        this.updateMeter()
        this.finishMeter(reason)
        this.phase = 'awaiting_unplug'
        this.persistSession()
      } catch (error) {
        if (devices.get(this) === runtime && this.isCharging) {
          this.phase = 'stop_failed'
          this.failure = error.message
        }
        throw error
      }
    },
    finishMeter(reason) {
      const runtime = devices.get(this)
      if (runtime?.interval) clearInterval(runtime.interval)
      if (runtime) runtime.interval = null
      this.isCharging = false
      this.chargingData.speed = 0
      this.paymentPending = true
      this.stopReason = reason
    },
    disconnectPlug() {
      if (
        this.isCharging ||
        ['checking', 'starting', 'stopping', 'interrupted'].includes(this.phase)
      )
        throw new Error('尚未确认停止，禁止拔枪')
      devices.get(this)?.device.disconnect()
      devices.get(this)?.releaseConnector?.()
      this.plugConnected = false
      if (this.paymentPending) this.phase = 'finished'
      else this.phase = 'awaiting_connection'
      this.persistSession()
    },
    simulateConnectionLoss() {
      if (!this.isCharging) return
      this.updateMeter()
      devices.get(this).device.loseConnection()
      devices.get(this)?.releaseConnector?.()
      this.plugConnected = false
      this.finishMeter('connection_lost')
      this.phase = 'finished'
      this.failure = '连接已中断，本次演示已停止，可查看已记录的账单。'
      this.persistSession()
    },
    recoverDeviceResponse() {
      devices.get(this)?.device.setScenario('normal')
      this.failure = ''
    },
    cancelPreparation() {
      if (this.isCharging || ['checking', 'starting', 'stopping'].includes(this.phase))
        throw new Error('设备命令处理中，请等待应答')
      if (this.paymentPending) return
      devices.get(this)?.device.disconnect()
      devices.delete(this)
      this.preparation = null
      this.plugConnected = false
      this.verifiedCode = false
      this.phase = 'idle'
    },
    abortConnection() {
      if (this.isCharging || this.paymentPending) return
      devices.get(this)?.device.loseConnection()
      devices.delete(this)
      this.preparation = null
      this.plugConnected = false
      this.verifiedCode = false
      this.phase = 'idle'
      this.failure = ''
    },
    persistSession() {
      try {
        localStorage.setItem(
          'chargingSandboxSession',
          JSON.stringify({
            version: 1,
            phase: this.phase,
            sessionId: this.sessionId,
            station: this.sessionStation,
            connector: this.sessionConnector,
            vehicle: this.sessionVehicle,
            model: this.sessionModel,
            data: this.chargingData,
            paymentPending: this.paymentPending,
            lastReceipt: this.lastReceipt,
            reviewSubmitted: this.reviewSubmitted,
            stopReason: this.stopReason
          })
        )
      } catch {
        /* Live session remains in memory. */
      }
    },
    restoreSession() {
      if (this.isCharging || this.paymentPending) return
      try {
        const saved = JSON.parse(localStorage.getItem('chargingSandboxSession') || 'null')
        if (
          !saved ||
          saved.version !== 1 ||
          typeof saved.sessionId !== 'string' ||
          !saved.sessionId ||
          saved.station?.dataSource !== 'sandbox' ||
          !Number.isFinite(saved.station.currentPrice) ||
          saved.station.currentPrice < 0 ||
          ![
            'charging',
            'stopping',
            'stop_failed',
            'awaiting_unplug',
            'finished',
            'interrupted',
            'paid'
          ].includes(saved.phase) ||
          !Number.isFinite(saved.data?.energy) ||
          saved.data.energy < 0 ||
          !Number.isFinite(saved.data.duration) ||
          saved.data.duration < 0 ||
          !Number.isFinite(saved.data.battery) ||
          saved.data.battery < 0 ||
          saved.data.battery > 100 ||
          !Number.isFinite(saved.data.cost) ||
          saved.data.cost < 0
        )
          return
        if (
          saved.phase === 'paid' &&
          (!saved.lastReceipt ||
            saved.lastReceipt.station?.stationId !== saved.station.stationId ||
            !Number.isFinite(saved.lastReceipt.finalAmount) ||
            saved.lastReceipt.finalAmount < 0)
        )
          return
        this.sessionId = saved.sessionId
        this.sessionStation = saved.station
        this.sessionConnector = saved.connector
        this.sessionVehicle = saved.vehicle
        this.sessionModel = saved.model
        this.chargingData = { ...saved.data, speed: 0 }
        this.lastReceipt = saved.phase === 'paid' ? saved.lastReceipt : null
        this.reviewSubmitted = !!saved.reviewSubmitted
        this.paymentPending = saved.phase !== 'paid'
        this.phase = ['paid', 'finished', 'awaiting_unplug'].includes(saved.phase)
          ? saved.phase
          : 'interrupted'
        this.stopReason = this.phase === 'interrupted' ? 'browser_interrupted' : saved.stopReason
        this.failure =
          this.phase === 'interrupted'
            ? '页面曾关闭，演示已暂停。已恢复上次保存的进度，可结束本次演示并查看账单。'
            : ''
        this.plugConnected = this.phase === 'awaiting_unplug'
      } catch {
        /* Do not invent a recovered order for invalid stored data. */
      }
    },
    acknowledgeInterruption() {
      if (this.phase === 'interrupted') {
        this.phase = 'finished'
        this.persistSession()
      }
    },
    suspendSimulator() {
      if (this.isCharging) {
        this.updateMeter()
        this.isCharging = false
        this.chargingData.speed = 0
        this.paymentPending = true
        this.phase = 'interrupted'
        this.persistSession()
      }
      const runtime = devices.get(this)
      if (runtime?.interval) clearInterval(runtime.interval)
      runtime?.device.loseConnection()
      runtime?.releaseConnector?.()
      devices.delete(this)
    },

    updateSettings(settings) {
      this.settings = sanitizeSettings({ ...this.settings, ...settings })
      try {
        localStorage.setItem('chargingSettings', JSON.stringify(this.settings))
      } catch {
        // Storage can be unavailable (private mode/quota); settings still apply
        // for the current session.
      }
    },

    loadSettings() {
      try {
        const raw = localStorage.getItem('chargingSettings')
        if (!raw) return

        const parsed = JSON.parse(raw)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return

        // Merge with defaults so a partial/legacy payload cannot leave
        // `targetBattery` undefined (which would disable auto-stop forever).
        this.settings = sanitizeSettings(parsed)
      } catch {
        // Corrupted JSON: fall back to defaults rather than breaking app boot.
        this.settings = { ...DEFAULT_SETTINGS }
      }
    },

    quotePayment({ couponId = null } = {}) {
      const userStore = useUserStore()
      // The quote path never throws: a coupon consumed elsewhere previews as
      // no discount instead of breaking the payment panel render.
      const coupon = couponId
        ? (userStore.coupons.find((item) => item.id === couponId && !item.used) ?? null)
        : null

      return calculatePaymentAmounts({
        energy: this.chargingData.energy,
        price: this.sessionStation?.currentPrice ?? 0,
        coupon
      })
    },

    settlePayment({ couponId = null, method = 'wechat' } = {}) {
      if (this.isCharging) throw new Error('请先结束充电再结算')
      if (['awaiting_unplug', 'interrupted'].includes(this.phase))
        throw new Error('请先完成拔枪或处理中断的测试会话')
      if (this.lastReceipt) return this.lastReceipt
      if (
        !this.sessionId ||
        !this.sessionStation ||
        !this.paymentPending ||
        this.phase !== 'finished'
      )
        throw new Error('没有设备已结束并完成拔枪的测试订单，不能从选中站点直接生成支付')
      const userStore = useUserStore()
      const station = this.sessionStation
      if (
        !Number.isFinite(this.chargingData.energy) ||
        this.chargingData.energy < 0 ||
        !Number.isFinite(this.chargingData.duration) ||
        this.chargingData.duration < 0
      )
        throw new Error('测试计量数据无效，不能结算')

      if (
        !station ||
        station.dataSource !== 'sandbox' ||
        typeof station.currentPrice !== 'number' ||
        !Number.isFinite(station.currentPrice) ||
        station.currentPrice < 0
      ) {
        throw new Error('当前没有可结算的充电站点')
      }

      // Validate before any write: an unavailable coupon must leave balance,
      // wallet, history and notifications untouched.
      const coupon = couponId ? userStore.coupons.find((item) => item.id === couponId) : null
      if (couponId && (!coupon || coupon.used)) {
        throw new Error('优惠券不存在或已使用')
      }

      const { chargeCost, serviceFee, totalAmount, couponDiscount, finalAmount } =
        calculatePaymentAmounts({
          energy: this.chargingData.energy,
          price: station.currentPrice,
          coupon
        })

      if (coupon && !isCouponUsable(coupon, totalAmount)) {
        throw new Error('优惠券已过期或未满足使用条件')
      }
      if (!['wechat', 'alipay', 'wallet'].includes(method)) throw new Error('请选择有效的支付方式')
      if (method === 'wallet' && finalAmount > userStore.userInfo.balance)
        throw new Error('钱包余额不足，请选择其他支付方式')
      const paidAt = new Date()

      if (coupon) userStore.useCoupon(coupon.id)
      userStore.addWalletTransaction({
        type: 'payment',
        amount: -finalAmount,
        description: `${station.stationName}充电`,
        method
      })
      userStore.addChargingHistory({
        stationName: station.stationName,
        stationAddress: station.address,
        // Local records remain language-neutral/canonical when paid in English.
        duration: formatDuration(this.chargingData.duration, 'hm-verbose', 'zh-CN'),
        durationSeconds: this.chargingData.duration,
        energy: `${Number(this.chargingData.energy).toFixed(1)} kWh`,
        cost: finalAmount,
        vehicleModel: this.sessionVehicle?.model || '未登记车型',
        status: 'completed'
      })
      userStore.addNotification({
        title: '充电完成通知',
        content: `您在${station.stationName}的充电已完成，充电${Number(this.chargingData.energy).toFixed(1)}度，费用${formatPrice(finalAmount)}。`
      })

      this.paymentPending = false
      this.lastReceipt = {
        chargeCost,
        serviceFee,
        couponDiscount,
        finalAmount,
        paidAt,
        station: { ...station },
        energy: this.chargingData.energy,
        duration: this.chargingData.duration,
        method
      }
      this.phase = 'paid'
      this.preferredCouponId = null
      this.persistSession()
      return this.lastReceipt
    }
  }
})
