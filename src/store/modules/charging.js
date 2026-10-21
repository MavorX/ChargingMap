import { defineStore } from 'pinia'

const DEFAULT_SETTINGS = {
  targetBattery: 80,
  notifyFull: true,
  notifyCost: false,
  costThreshold: 50,
  smartCharge: false
}

// Timer handles live at module scope: they are not serializable app state and
// keeping them out of Pinia prevents stale handles from being persisted or
// accidentally duplicated by reactive unwrapping.
let chargingInterval = null
let speedUpdateInterval = null
let startedAt = 0

export const useChargingStore = defineStore('charging', {
  state: () => ({
    isCharging: false,
    chargingData: {
      duration: 0,
      energy: 5.2,
      cost: 12.5,
      speed: 0,
      battery: 35
    },
    settings: { ...DEFAULT_SETTINGS }
  }),

  actions: {
    startCharging() {
      // Idempotent: a second start while charging must not reset the session
      // or spawn a second (orphaned) interval.
      if (this.isCharging) return

      this.isCharging = true
      this.chargingData = {
        duration: 0,
        energy: 0,
        cost: 0,
        speed: 0,
        battery: 35
      }
      startedAt = Date.now()

      speedUpdateInterval = setInterval(() => {
        const baseSpeed = 65
        const wave = Math.sin(Date.now() / 8000) * 15
        const noise = (Math.random() - 0.5) * 6
        this.chargingData.speed = Math.max(30, Math.min(120, baseSpeed + wave + noise))
      }, 2000)

      chargingInterval = setInterval(() => {
        // Derive every value from the wall clock instead of incrementing per
        // tick: background throttling cannot make duration/energy drift apart.
        const elapsed = Math.max(0, Math.round((Date.now() - startedAt) / 1000))
        this.chargingData.duration = elapsed
        this.chargingData.energy = elapsed * 0.1
        this.chargingData.cost = elapsed * 0.25
        this.chargingData.battery = 35 + elapsed * 0.5

        if (this.chargingData.battery >= this.settings.targetBattery) {
          this.stopCharging()
        }
      }, 1000)
    },

    stopCharging() {
      this.isCharging = false
      if (chargingInterval) {
        clearInterval(chargingInterval)
        chargingInterval = null
      }
      if (speedUpdateInterval) {
        clearInterval(speedUpdateInterval)
        speedUpdateInterval = null
      }
      startedAt = 0
    },

    updateSettings(settings) {
      this.settings = { ...this.settings, ...settings }
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
        const merged = { ...DEFAULT_SETTINGS, ...parsed }
        if (typeof merged.targetBattery !== 'number' || !Number.isFinite(merged.targetBattery)) {
          merged.targetBattery = DEFAULT_SETTINGS.targetBattery
        }
        this.settings = merged
      } catch {
        // Corrupted JSON: fall back to defaults rather than breaking app boot.
        this.settings = { ...DEFAULT_SETTINGS }
      }
    }
  }
})
