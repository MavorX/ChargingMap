// Header emits CustomEvent types with these names; mapping lives here so the
// panel orchestrator only consumes panel keys and does not duplicate the
// header's string contract.
export const HEADER_PANEL_EVENTS = Object.freeze({
  showNotifications: 'notifications',
  showUserProfile: 'userProfile',
  showFavorites: 'favorites',
  showChargingHistory: 'chargingHistory'
})
