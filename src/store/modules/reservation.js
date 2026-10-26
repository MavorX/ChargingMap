import { defineStore } from 'pinia'
import { demoReservations } from '../../mocks/userDemo'
import { reservationDateValue, reservationSlotsFor } from '../../utils/reservationSlots'
import { createRecordId } from '../../utils/id'
import { useStationsStore } from './stations'

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
      if (this.isLoading) throw new Error('预约正在提交，请勿重复操作')
      if (
        useStationsStore().currentStation?.dataSource === 'amap' ||
        String(reservationData?.stationId || '').startsWith('AMAP:')
      )
        throw new Error('真实地点未接入运营商预约，不能锁定真实枪位')
      const now = new Date()
      const lastDay = new Date(now)
      lastDay.setDate(lastDay.getDate() + 6)
      if (
        !reservationData ||
        reservationData.date < reservationDateValue(now) ||
        reservationData.date > reservationDateValue(lastDay) ||
        !reservationSlotsFor(reservationData.date, now).some(
          (slot) => slot.available && slot.value === reservationData.timeSlot
        )
      ) {
        throw new Error('预约时段已失效，请重新选择日期和时间')
      }
      if (
        !reservationData.stationId ||
        !reservationData.connectorId ||
        !reservationData.vehicleModel ||
        !Number.isFinite(reservationData.chargeAmount) ||
        reservationData.chargeAmount < 10 ||
        reservationData.chargeAmount > 100
      ) {
        throw new Error('请完善有效的预约信息')
      }
      this.isLoading = true
      this.error = null

      try {
        // 模拟API调用
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const newReservation = {
          id: createRecordId(),
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
