// src/services/trackingApi.js
import { orderAPI } from './api'

/**
 * Fetch full tracking data for an order.
 * Returns: { order, agent, socketRoom }
 */
export const fetchTrackingData = async (orderId) => {
  const res = await orderAPI.trackOrder(orderId)
  return res.data
}

/**
 * Calculate haversine distance in km between two {lat, lng} points
 */
export const haversineKm = (from, to) => {
  if (!from || !to) return null
  const R = 6371
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180
  const dLng = ((to.longitude - from.longitude) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.latitude * Math.PI) / 180) *
      Math.cos((to.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Estimate ETA in minutes from distance (km) assuming avg speed of 25 km/h
 */
export const estimateETA = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined) return null
  const speedKmH = 25
  return Math.ceil((distanceKm / speedKmH) * 60)
}

/**
 * Map backend order status to a display-friendly label
 */
export const STATUS_LABELS = {
  pending:          'Pending',
  accepted:         'Confirmed',
  picked_up:        'Picked Up',
  out_for_delivery: 'On The Way',
  delivered:        'Delivered',
  cancelled:        'Cancelled',
}

/**
 * Ordered steps for the timeline / progress bar
 */
export const ORDER_STEPS = [
  { key: 'pending',          label: 'Order Placed',  icon: '📋' },
  { key: 'accepted',         label: 'Confirmed',     icon: '✅' },
  { key: 'picked_up',        label: 'Picked Up',     icon: '📦' },
  { key: 'out_for_delivery', label: 'On The Way',    icon: '🚀' },
  { key: 'delivered',        label: 'Delivered',     icon: '🎉' },
]

export const getStepIndex = (status) =>
  ORDER_STEPS.findIndex(s => s.key === status)
