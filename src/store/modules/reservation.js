import { defineStore } from 'pinia'
import { demoReservations } from '../../mocks/userDemo'
import { reservationDateValue, reservationSlotsFor } from '../../utils/reservationSlots'
import { createRecordId } from '../../utils/id'
import { useStationsStore } from './stations'
import { useUserStore } from './user'
import { reservationSelectionError } from '../../utils/reservationValidation'

const isDemoMode = import.meta.env.VITE_DEMO === 'true'

export const useReservationStore = defineStore('reservation', {
  state: () => ({
    reservations: isDemoMode ? demoReservations.map((reservation) => ({ ...reservation })) : [],
    currentReservation: null,
    isLoading: false,
    error: null
  }),

  actions: {
    validateReservation(reservationData) {
      const station = useStationsStore().currentStation
      if (
        station?.dataSource === 'amap' ||
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
        !reservationData.vehicleId ||
        !Number.isFinite(reservationData.chargeAmount) ||
        reservationData.chargeAmount < 10 ||
        reservationData.chargeAmount > 100
      ) {
        throw new Error('请完善有效的预约信息')
      }
      if (station?.stationId !== reservationData.stationId)
        throw new Error('预约站点已变化，请返回重新选择')
      const connector = [
        ...(station.details?.fastConnectors || []),
        ...(station.details?.slowConnectors || [])
      ].find((item) => item.id === reservationData.connectorId)
      const vehicle = useUserStore().vehicles.find((item) => item.id === reservationData.vehicleId)
      const error = reservationSelectionError({
        station,
        connector,
        vehicle,
        chargeAmount: reservationData.chargeAmount
      })
      if (error) throw new Error(error)
      return { station, connector, vehicle }
    },

    async createReservation(reservationData) {
      if (this.isLoading) throw new Error('预约正在提交，请勿重复操作')
      const request = { ...reservationData }
      this.validateReservation(request)
      this.isLoading = true
      this.error = null

      try {
        // 模拟API调用
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // A slot can begin, a vehicle can disappear, or a gun can become busy
        // while the simulated response is pending. Never save an obsolete choice.
        const { station, connector, vehicle } = this.validateReservation(request)
        const newReservation = {
          id: createRecordId(),
          stationId: station.stationId,
          stationName: station.stationName,
          stationAddress: station.address,
          connectorId: connector.id,
          connectorName: connector.connectorName,
          vehicleId: vehicle.id,
          vehicleModel: vehicle.model,
          date: request.date,
          timeSlot: request.timeSlot,
          chargeAmount: request.chargeAmount,
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
