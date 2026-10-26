let sequence = 0

// Local record IDs also work on non-secure LAN previews without randomUUID.
export const createRecordId = () =>
  globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${++sequence}`
