export const SERVICE_FEE_RATE = 0.1

export const roundAmount = (amount) => Math.round((amount + Number.EPSILON) * 100) / 100

// Quotes, the live meter and checkout use the same cent rounding and fee rule.
export function energyAmounts(energy, price) {
  const chargeCost = roundAmount(Math.max(0, energy) * Math.max(0, price))
  const serviceFee = roundAmount(chargeCost * SERVICE_FEE_RATE)
  return { chargeCost, serviceFee, totalAmount: roundAmount(chargeCost + serviceFee) }
}
