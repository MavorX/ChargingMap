import { computed, unref } from 'vue'

/**
 * Available (status === 1) fast + slow connectors for a station.
 *
 * Accepts the station itself or a ref/computed so panels can keep their own
 * `currentStation` source while sharing the filtering rule.
 *
 * @param {object | import('vue').Ref<object | null> | import('vue').ComputedRef<object | null>} station
 * @returns {import('vue').ComputedRef<Array<object>>}
 */
export function useAvailableConnectors(station) {
  return computed(() => {
    const current = unref(station)
    const fast = current?.details?.fastConnectors?.filter((connector) => connector.status === 1) || []
    const slow = current?.details?.slowConnectors?.filter((connector) => connector.status === 1) || []
    return [...fast, ...slow]
  })
}
