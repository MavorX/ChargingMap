export const couponState = (coupon, now = new Date()) => {
  if (coupon?.used) return 'used'
  if (coupon?.expiryDate) {
    const expires = new Date(`${coupon.expiryDate}T23:59:59`)
    if (!Number.isNaN(expires.getTime()) && expires < now) return 'expired'
  }
  return 'available'
}
