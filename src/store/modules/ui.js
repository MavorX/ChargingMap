import { defineStore } from 'pinia'

const isValidPanelName = (name) => typeof name === 'string' && name.trim().length > 0

// Single source of truth for which overlay panel is visible.
//
// Panels are mutually exclusive: opening one automatically hides the previous
// one (the audits found vehicle/payment panels could previously stack). The
// small history stack lets a sub-panel return to the panel that opened it
// (e.g. UserProfile -> Wallet -> close -> UserProfile) without reintroducing
// multiple simultaneously visible panels.
export const useUiStore = defineStore('ui', {
  state: () => ({
    activePanel: null,
    panelHistory: []
  }),

  actions: {
    open(name, { reset = false } = {}) {
      if (!isValidPanelName(name)) return
      if (this.activePanel === name) {
        if (reset) this.panelHistory = []
        return
      }
      if (reset) {
        this.panelHistory = []
      } else if (this.activePanel) {
        this.panelHistory.push(this.activePanel)
      }
      this.activePanel = name
    },

    // Flow transitions (settings -> charging -> payment -> success -> review)
    // replace the current panel without growing the back stack, so closing the
    // final panel returns to the map instead of reopening a stale flow step.
    replace(name) {
      if (!isValidPanelName(name)) return
      this.activePanel = name
    },

    close() {
      if (!this.activePanel) return
      this.activePanel = this.panelHistory.length ? this.panelHistory.pop() : null
    },

    dismiss() {
      this.activePanel = null
      this.panelHistory = []
    }
  }
})
