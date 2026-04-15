import { defineStore } from 'pinia'

export const useReservationStore = defineStore('reservation', {
  state: () => ({
    reservations: [
      {
        id: '1',
        stationId: '1',
        stationName: '城东充电站',
        stationAddress: '合肥市瑶海区长江东路123号',
        date: '2025-12-31',
        timeSlot: '10:00-12:00',
        connectorId: '1-1',
        connectorName: '快充1号',
        vehicleModel: '特斯拉 Model 3',
        chargeAmount: 50,
        status: 'upcoming'
      }
    ],
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
        await new Promise(resolve => setTimeout(resolve, 1000))
        
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
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        this.reservations = this.reservations.filter(r => r.id !== reservationId)
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