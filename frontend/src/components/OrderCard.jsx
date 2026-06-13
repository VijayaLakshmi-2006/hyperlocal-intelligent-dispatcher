import { Link } from 'react-router-dom'
import { STATUS_LABELS } from '../services/trackingApi'

export default function OrderCard({ order, role }) {
  
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'status-pending'
      case 'accepted': return 'status-accepted'
      case 'picked_up': return 'status-picked_up'
      case 'out_for_delivery': return 'status-out_for_delivery'
      case 'delivered': return 'status-delivered'
      case 'cancelled': return 'status-cancelled'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Which address to highlight based on role/status
  const isAgentActive = role === 'agent' && !['delivered','cancelled','pending'].includes(order.status)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-card transition-shadow overflow-hidden flex flex-col h-full relative">
      
      {/* Header */}
      <div className="p-5 border-b border-gray-50 flex justify-between items-start bg-gray-50/50">
        <div>
          <span className="text-xs font-mono text-gray-400">#{order._id.slice(-6).toUpperCase()}</span>
          <p className="font-semibold text-gray-900 mt-1 truncate max-w-[180px]" title={order.packageDetails}>
            {order.packageDetails}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      {/* Body */}
      <div className="p-5 flex-grow space-y-4">
        {/* Addresses */}
        <div className="space-y-3 relative">
          <div className="absolute top-3 left-2.5 bottom-3 w-px bg-gray-200 border-l border-dashed border-gray-300"></div>
          
          <div className="flex gap-3 relative z-10">
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 border-2 border-white shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500 mb-0.5">Pickup</p>
              <p className="text-sm text-gray-800 truncate" title={order.pickupAddress}>{order.pickupAddress}</p>
            </div>
          </div>
          
          <div className="flex gap-3 relative z-10">
            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5 border-2 border-white shadow-sm">
              <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500 mb-0.5">Delivery</p>
              <p className="text-sm text-gray-800 truncate" title={order.deliveryAddress}>{order.deliveryAddress}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
          <div>
            <p className="text-xs text-gray-500 mb-1">Date</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Price</p>
            <p className="text-sm font-medium text-gray-900">₹{order.price}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-5 pt-0 mt-auto">
        {order.status === 'pending' && role === 'agent' ? (
          <p className="text-center text-sm text-gray-500 py-2">Open via Pending tab to accept</p>
        ) : (
          <Link 
            to={`/orders/track/${order._id}`}
            className={`w-full block text-center py-2.5 rounded-xl font-semibold transition-colors ${
              isAgentActive 
                ? 'bg-primary-600 text-white hover:bg-primary-700' 
                : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200'
            }`}
          >
            {isAgentActive ? 'Update Delivery' : 'Track Order'}
          </Link>
        )}
      </div>

    </div>
  )
}
