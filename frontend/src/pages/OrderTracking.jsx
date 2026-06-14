import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTracking } from '../hooks/useTracking'
import { useAuth } from '../context/AuthContext'
import { orderAPI } from '../services/api'
import toast from 'react-hot-toast'

import TrackingMap from '../components/TrackingMap'
import OrderTimeline from '../components/OrderTimeline'
import ETASection from '../components/ETASection'
import AgentCard from '../components/AgentCard'

export default function OrderTracking() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAgent } = useAuth()
  
  const {
    order,
    agentDetails,
    agentLocation,
    orderStatus,
    distanceKm,
    etaMinutes,
    connected,
    isLoading,
    isError,
    refetch
  } = useTracking(id)

  const handleStatusUpdate = async (newStatus) => {
    try {
      await orderAPI.updateStatus(id, newStatus)
      toast.success(`Order marked as ${newStatus.replace(/_/g, ' ')}`)
      refetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Loading live tracking data...</p>
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tracking Not Available</h2>
        <p className="text-gray-500 mb-8">We couldn't find the tracking information for this order. It might be invalid or you don't have permission to view it.</p>
        <button onClick={() => navigate('/orders')} className="btn-primary">Return to Orders</button>
      </div>
    )
  }

  // Construct locations for the map
  const pickupLocation = order.pickupLocation?.latitude ? order.pickupLocation : null
  const deliveryLocation = order.deliveryLocation?.latitude ? order.deliveryLocation : null
  const mapAgent = agentLocation

  return (
    <div className="max-w-[1600px] mx-auto px-0 lg:px-4 py-0 lg:py-6 h-[calc(100vh-80px)]">
      
      {/* Mobile/Desktop Layout Split */}
      <div className="flex flex-col lg:flex-row h-full gap-0 lg:gap-6">
        
        {/* LEFT: MAP (Top on Mobile, Left on Desktop) */}
        <div className="w-full lg:w-3/5 h-[45vh] lg:h-full relative z-0">
          
          {/* Status Overlay */}
          <div className="absolute top-4 left-4 z-[400] flex gap-2">
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm backdrop-blur-md flex items-center gap-2 ${
              connected ? 'bg-green-100/90 text-green-700 border border-green-200' : 'bg-orange-100/90 text-orange-700 border border-orange-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></span>
              {connected ? 'LIVE' : 'Reconnecting...'}
            </div>
            {isAgent && (
              <div className="px-3 py-1.5 rounded-full text-xs font-bold shadow-sm backdrop-blur-md bg-blue-100/90 text-blue-700 border border-blue-200">
                Agent View
              </div>
            )}
          </div>

          <TrackingMap 
            pickup={pickupLocation}
            delivery={deliveryLocation}
            agent={mapAgent}
          />
        </div>

        {/* RIGHT: DASHBOARD */}
        <div className="w-full lg:w-2/5 h-[55vh] lg:h-full overflow-y-auto bg-gray-50 lg:bg-transparent rounded-t-3xl lg:rounded-none -mt-6 lg:mt-0 relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:shadow-none p-4 lg:p-0 custom-scrollbar">
          
          {/* Mobile Drag Indicator */}
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 lg:hidden"></div>

          <div className="space-y-6 lg:pr-2 pb-20 lg:pb-0">
            
            {/* ETA Section */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-6 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-bold text-amber-900 text-lg flex items-center gap-2">
                  <span className="text-2xl">⚡</span> Guaranteed Fast Delivery
                </h3>
                <p className="text-amber-800 font-medium mt-1">Expected Arrival: <span className="font-black">5–7 Minutes</span></p>
              </div>
              <div className="text-amber-600 font-mono animate-pulse font-bold text-xl">
                06:42
              </div>
            </div>
            <ETASection distanceKm={distanceKm} etaMinutes={etaMinutes} status={orderStatus} />

            {/* Timeline */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-6">Delivery Status</h3>
              <OrderTimeline 
                currentStatus={orderStatus} 
                order={order} 
                agentDetails={agentDetails} 
                etaMinutes={etaMinutes} 
              />
            </div>

            {/* Agent Control Panel (Only for Agents) */}
            {isAgent && !['delivered', 'cancelled'].includes(orderStatus) && (
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-4 text-center">Update Delivery Status</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button 
                    onClick={() => handleStatusUpdate('picked_up')}
                    disabled={orderStatus !== 'accepted'}
                    className={`py-3 rounded-xl font-semibold transition-all ${orderStatus === 'accepted' ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' : 'bg-blue-100 text-blue-400 cursor-not-allowed'}`}
                  >
                    Picked Up
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate('out_for_delivery')}
                    disabled={orderStatus !== 'picked_up'}
                    className={`py-3 rounded-xl font-semibold transition-all ${orderStatus === 'picked_up' ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-md' : 'bg-orange-100 text-orange-300 cursor-not-allowed'}`}
                  >
                    On The Way
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate('delivered')}
                    disabled={orderStatus !== 'out_for_delivery'}
                    className={`py-3 rounded-xl font-semibold transition-all ${orderStatus === 'out_for_delivery' ? 'bg-green-500 text-white hover:bg-green-600 shadow-md' : 'bg-green-100 text-green-300 cursor-not-allowed'}`}
                  >
                    Delivered
                  </button>
                </div>
              </div>
            )}

            {/* Agent Info */}
            {agentDetails ? (
              <AgentCard agent={{ user: { name: agentDetails.name, phone: agentDetails.phone } }} />
            ) : orderStatus === 'PLACED' || orderStatus === 'CONFIRMED' ? (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <span className="text-2xl animate-pulse">🛵</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Finding Delivery Agent</h4>
                <p className="text-sm text-gray-500">We are currently assigning the best delivery partner for your order.</p>
              </div>
            ) : null}

            {/* Order Details Accordion/Panel */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-50 pb-4">Order Details</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Package Info</p>
                  <p className="text-gray-900">{order.packageDetails}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Order ID</p>
                    <p className="text-gray-900 font-mono text-sm">#{order._id.slice(-6).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Amount</p>
                    <p className="text-gray-900 font-semibold">₹{order.price}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Delivery Address</p>
                  <div className="flex gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="mt-0.5 text-red-500">📍</div>
                    <p className="text-sm text-gray-700 leading-relaxed">{order.deliveryAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancel Order Section */}
            {!isAgent && !['delivered', 'cancelled'].includes(orderStatus) && (
              <div className="mt-6">
                <button
                  onClick={() => {
                    const isAssigned = !!agentDetails;
                    const message = isAssigned 
                      ? 'Cancellation may incur charges. Are you sure you want to cancel this order?' 
                      : 'Are you sure you want to cancel this order?';
                    if (window.confirm(message)) {
                      handleStatusUpdate('cancelled');
                    }
                  }}
                  className="w-full py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                >
                  Cancel Entire Order
                </button>
                {!!agentDetails && (
                  <p className="text-center text-xs text-gray-500 mt-2">Cancellation may incur charges as a delivery partner is already assigned.</p>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
