import { defineStore } from 'pinia'

export const useChargingStore = defineStore('charging', {
  state: () => ({
    isCharging: false,
    chargingData: {
      duration: 0,
      energy: 5.2,
      cost: 12.50,
      speed: 65,
      battery: 35
    },
    settings: {
      targetBattery: 80,
      notifyFull: true,
      notifyCost: false,
      costThreshold: 50,
      smartCharge: false
    },
    chargingInterval: null
  }),
  
  actions: {
    startCharging() {
      this.isCharging = true
      this.chargingData = {
        duration: 0,
        energy: 0,
        cost: 0,
        speed: 65,
        battery: 35
      }
      
      // 模拟充电过程
      this.chargingInterval = setInterval(() => {
        this.chargingData.duration += 1
        this.chargingData.energy += 0.1
        this.chargingData.cost += 0.25
        this.chargingData.battery += 0.5
        
        // 充电完成
        if (this.chargingData.battery >= this.settings.targetBattery) {
          this.stopCharging()
        }
      }, 1000)
    },
    
    stopCharging() {
      this.isCharging = false
      if (this.chargingInterval) {
        clearInterval(this.chargingInterval)
        this.chargingInterval = null
      }
    },
    
    updateSettings(settings) {
      this.settings = { ...this.settings, ...settings }
      // 保存设置到本地存储
      localStorage.setItem('chargingSettings', JSON.stringify(this.settings))
    },
    
    loadSettings() {
      const savedSettings = localStorage.getItem('chargingSettings')
      if (savedSettings) {
        this.settings = JSON.parse(savedSettings)
      }
    }
  }
})