export const advisorVehicle = {
  id: 'ev',
  model: 'Electric 60',
  brand: 'Demo',
  connectorType: 'GB/T',
  maxPower: 90,
  batteryCapacityKwh: 60
}
export const advisorGoal = {
  vehicleId: 'ev',
  initialBattery: 25,
  targetBattery: 80,
  preference: 'balanced'
}
export const advisorDetails = (power = 120, price = 1) => ({
  fastConnectors: [
    { id: `gun-${power}`, connectorName: 'Demo gun', connectorType: 'GB/T', power, status: 1 }
  ],
  slowConnectors: [],
  periodPrices: [{ startTime: '00:00', endTime: '24:00', totalFee: price }]
})
export const advisorStation = (stationId = 'HF000001', patch = {}) => ({
  stationId,
  stationName: `Station ${stationId}`,
  address: 'Demo address',
  dataSource: 'sandbox',
  currentPrice: 1,
  totalCostPrice: 1,
  maxPower: 120,
  connectorTypes: ['GB/T'],
  quickAvailableNum: 1,
  quickChargeNum: 1,
  slowAvailableNum: 0,
  slowChargeNum: 0,
  openStatus: 1,
  openTime: '00:00-24:00',
  lng: 117.28,
  lat: 31.86,
  distance: 1000,
  parkFee: 'Free during charging',
  detailsLoaded: true,
  details: advisorDetails(),
  ...patch
})
