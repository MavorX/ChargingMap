import { defineStore } from 'pinia'
import { demoReservations } from '../../mocks/userDemo'

const isDemoMode = import.meta.env.VITE_DEMO === 'true'

export const useReservationStore = defineStore('reservation', {
  state: () => ({
    reservations: isDemoMode ? demoReservations.map((reservation) => ({ ...reservation })) : [],
    currentReservation: null,
    isLoading: false,
    error: null
  }),

  actions: {
    async createReservation(reservationData) {
      this.isLoading = true
      this.error = null

      try {
        // 模拟API调用
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const newReservation = {
          id: Date.now().toString(),
          ...reservationData,
          status: 'upcoming'
        }

        this.reservations.push(newReservation)
        this.currentReservation = newReservation

        return newReservation
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async cancelReservation(reservationId) {
      this.isLoading = true
      this.error = null

      try {
        // 模拟API调用
        await new Promise((resolve) => setTimeout(resolve, 1000))

        this.reservations = this.reservations.filter((r) => r.id !== reservationId)
        if (this.currentReservation && this.currentReservation.id === reservationId) {
          this.currentReservation = null
        }
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.isLoading = false
      }
    },

    setCurrentReservation(reservation) {
      this.currentReservation = reservation
    }
  }
})
