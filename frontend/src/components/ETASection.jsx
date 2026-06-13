export default function ETASection({ distanceKm, etaMinutes, status }) {
  if (status === 'DELIVERED') {
    return (
      <div className="bg-green-50 rounded-2xl p-6 border border-green-100 text-center flex flex-col items-center justify-center">
        <span className="text-4xl mb-3">🎉</span>
        <h3 className="text-xl font-bold text-green-800 mb-1">Order Delivered Successfully</h3>
        <p className="text-green-600 font-medium">Thank you for shopping with us.</p>
      </div>
    )
  }

  if (status === 'CANCELLED') return null
  if (status === 'PLACED' || status === 'CONFIRMED') {
    return (
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
        <div className="flex gap-2 justify-center mb-3">
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
        </div>
        <p className="text-gray-600 font-medium text-sm mt-2">Agent will be assigned and deliver to you in a short period of time...</p>
      </div>
    )
  }

  const isTracking = status === 'PICKED_UP' || status === 'OUT_FOR_DELIVERY'

  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-card-hover relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-primary-100 text-sm font-medium mb-1">
            {isTracking ? 'Estimated Arrival' : 'Preparing Order'}
          </p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black tracking-tight">
              {etaMinutes ? `${etaMinutes}` : '--'}
            </span>
            <span className="text-xl font-semibold text-primary-200 mb-1">mins</span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-primary-100 text-sm font-medium mb-1">Distance</p>
          <p className="text-2xl font-bold">
            {distanceKm ? distanceKm.toFixed(1) : '--'} <span className="text-sm font-normal text-primary-200">km</span>
          </p>
        </div>
      </div>

      {isTracking && (
        <div className="mt-6 pt-4 border-t border-primary-500/30 flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm font-medium text-green-100">Live GPS tracking active</span>
        </div>
      )}
    </div>
  )
}
